"""
End-to-End Pipeline Verification Test for AegisCashout
Mocks a full 1930 NCRP complaint, executes NetworkX multi-hop graph traversal,
runs dual-stage ML inference (Stage 1 Time-to-Cashout + Stage 2 Spatial Ranker),
generates TreeSHAP local attributions and BNS/BNSS statutory briefs,
and asserts that end-to-end inference latency is strictly under 100ms.
"""
import time
import pytest
import h3
from datetime import datetime, timedelta

from backend.services.graph_service import GraphService
from backend.services.ml_service import MLService
from backend.services.interdiction_service import evaluate_interdiction_feasibility, InterdictionOutcome


def test_full_pipeline_traversal_inference_and_latency():
    """
    Validates:
    1. Graph ingestion & multi-hop traversal (Victim -> L1 -> L2 -> L3 mule).
    2. Topological feature extraction (hop_count, fan_out, peeling_ratio, velocity_decay).
    3. Dual-stage machine learning inference (LightGBM + LambdaMART).
    4. TreeSHAP attribution & BNS 318(4)/319 + BNSS 106/107 legal brief generation.
    5. Strict latency SLA (< 100ms).
    6. Sequential interdiction evaluation.
    """
    graph_service = GraphService.get_instance()
    ml_service = MLService.get_instance()

    test_cid = f"NCRP-TEST-E2E-{int(time.time())}"
    victim_acc = "VIC-SBIN-9901"
    l1_acc = "MULE-PUNB-1011"
    l2_acc = "MULE-HDFC-2022"
    l3_acc = "MULE-YESB-3033"

    now = datetime.now()

    # 1. Ingest Complaint
    graph_service.register_complaint({
        "complaint_id": test_cid,
        "victim_id": "VIC-88001",
        "victim_account": victim_acc,
        "victim_bank": "State Bank of India",
        "victim_lat": 28.6139,
        "victim_lon": 77.2090,
        "fraud_category": "DIGITAL_ARREST",
        "initial_amount": 650000.0,
        "timestamp": now.timestamp(),
        "initial_utr": "UTR-INIT-001"
    })

    # 2. Ingest 3-Hop Rapid Peeling Trail
    # Hop 1: Victim -> L1
    graph_service.ingest_transaction(
        utr=f"UTR-HOP1-{test_cid}",
        sender=victim_acc,
        receiver=l1_acc,
        amount=650000.0,
        timestamp=now.timestamp() + 120,
        channel="IMPS",
        complaint_id=test_cid
    )

    # Hop 2: L1 -> L2
    graph_service.ingest_transaction(
        utr=f"UTR-HOP2-{test_cid}",
        sender=l1_acc,
        receiver=l2_acc,
        amount=320000.0,
        timestamp=now.timestamp() + 240,
        channel="IMPS",
        complaint_id=test_cid
    )

    # Hop 3: L2 -> L3 (Terminating Mule in Rohini, Delhi)
    graph_service.ingest_transaction(
        utr=f"UTR-HOP3-{test_cid}",
        sender=l2_acc,
        receiver=l3_acc,
        amount=315000.0,
        timestamp=now.timestamp() + 360,
        channel="IMPS",
        complaint_id=test_cid
    )

    # 3. Test Graph Feature Extraction
    graph_feats = graph_service.get_complaint_features(test_cid)
    assert graph_feats["hop_count"] >= 2, f"Hop count should be at least 2, got {graph_feats['hop_count']}"
    assert graph_feats["initial_amount"] == 650000.0
    assert "velocity_decay" in graph_feats
    assert "fan_out_ratio" in graph_feats
    assert "peeling_ratio" in graph_feats

    # 4. Benchmark Dual-Stage ML Inference Latency
    # Warmup
    _ = ml_service.run_prediction_for_complaint(test_cid)

    # Timed evaluation
    runs = 10
    latencies = []
    pred_result = None

    for _ in range(runs):
        start_t = time.perf_counter()
        pred_result = ml_service.run_prediction_for_complaint(test_cid)
        duration_ms = (time.perf_counter() - start_t) * 1000.0
        latencies.append(duration_ms)

    avg_latency = sum(latencies) / len(latencies)
    min_latency = min(latencies)
    max_latency = max(latencies)

    print(f"\n[LATENCY BENCHMARK] Min: {min_latency:.2f}ms | Avg: {avg_latency:.2f}ms | Max: {max_latency:.2f}ms")

    # Strict SLA Assertion (< 100ms)
    assert avg_latency < 100.0, f"Average inference latency {avg_latency:.2f}ms exceeded 100ms SLA threshold!"
    assert min_latency < 100.0, f"Minimum inference latency {min_latency:.2f}ms exceeded 100ms SLA threshold!"

    # 5. Validate Prediction Output Contract
    assert pred_result["complaint_id"] == test_cid
    assert pred_result["window_minutes"] > 0, "Window minutes must be positive"
    assert 0.0 <= pred_result["confidence_score"] <= 1.0, "Confidence score must be in [0, 1]"
    assert h3.is_valid_cell(pred_result["target_h3_res8"]), "target_h3_res8 must be a valid H3 cell"
    assert len(pred_result["candidate_atms"]) > 0, "Should identify candidate extraction terminals"

    # 6. Validate Explainability & Statutory Accuracy
    explanation = pred_result["tactical_explanation"]
    assert "top_factors" in explanation, "Explanation must contain TreeSHAP top factors"
    assert len(explanation["top_factors"]) > 0, "Must have at least one top feature factor"

    statutory = explanation.get("statutory_compliance", {})
    assert "bnss_section_106_warrant" in statutory, "Must include Section 106 BNSS warrant"
    assert "bnss_section_107_attachment" in statutory, "Must include Section 107 BNSS attachment"

    sec106_text = statutory["bnss_section_106_warrant"]
    sec107_text = statutory["bnss_section_107_attachment"]

    # Verify procedural vs substantive citations
    assert "Section 106 BNSS" in sec106_text, "Section 106 warrant must cite Section 106 BNSS"
    assert "Section 107 BNSS" in sec107_text, "Section 107 attachment must cite Section 107 BNSS"
    assert "Section 318(4)" in sec107_text, "Section 107 brief must cite substantive Section 318(4) BNS"
    assert "Section 319" in sec107_text, "Section 107 brief must cite Section 319 BNS"
    assert "66D" in sec107_text, "Section 107 brief must cite Section 66D IT Act"

    # 7. Validate Sequential Interdiction Feasibility Evaluation
    interdict_eval = evaluate_interdiction_feasibility(
        delta_t_hat_mins=pred_result["window_minutes"],
        cad_route_delay_mins=1.5,
        pcr_distance_km=2.2,
        pcr_speed_kmh=35.0,
        api_freeze_latency_sec=1.4,
        friction_delay_mins=15.0,
        api_available=True
    )

    assert isinstance(interdict_eval.outcome, InterdictionOutcome)
    assert interdict_eval.digital_freeze_success is True
    assert interdict_eval.effective_window_mins > pred_result["window_minutes"]
    assert interdict_eval.time_margin_mins > 0
    assert interdict_eval.outcome == InterdictionOutcome.OPTIMAL_INTERDICTION
