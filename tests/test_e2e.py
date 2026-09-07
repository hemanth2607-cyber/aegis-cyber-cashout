"""
End-to-End Test Suite for AegisCashout Cybercrime Forecaster
Validates:
1. Feature engineering dimensions & null value immunity.
2. Stage 1 & Stage 2 dual-stage ML inference latency SLA (< 50ms).
3. FastAPI endpoints integrity: Ingestion, Multi-Hop Webhook, Dial 112 CAD Dispatch, and Bank Friction.
"""
import time
import pytest
import numpy as np
import polars as pl
from fastapi.testclient import TestClient

from features.pipeline import TacticalFeaturePipeline
from features.graph_engine import CybercrimeGraphEngine
from features.spatial_indexer import SpatialEnricher
from ml_models.inference import PredictiveInferencePipeline
from backend.main import app


@pytest.fixture(scope="module")
def api_client():
    return TestClient(app)


@pytest.fixture(scope="module")
def spatial_enricher():
    return SpatialEnricher()


@pytest.fixture(scope="module")
def inference_pipeline(spatial_enricher):
    return PredictiveInferencePipeline(
        stage1_model_path="ml_models/artifacts/stage1_regressor.joblib",
        stage2_ranker_path="ml_models/artifacts/stage2_ranker.joblib",
        spatial_index_service=spatial_enricher
    )


# ==============================================================================
# 1. Feature Engineering Output Dimensions & Null Value Immunity
# ==============================================================================
def test_feature_pipeline_dimensions_and_null_immunity():
    """Validates that the tactical feature matrix contains zero nulls and correct schema."""
    pipeline = TacticalFeaturePipeline()
    feature_matrix = pipeline.process_batch(
        complaints_path="data_generator/complaints.parquet",
        transactions_path="data_generator/transactions.parquet",
        mule_accounts_path="data_generator/mule_accounts.parquet"
    )

    assert isinstance(feature_matrix, pl.DataFrame), "Feature matrix must be a Polars DataFrame"
    assert feature_matrix.height > 0, "Feature matrix must contain rows"

    expected_cols = [
        "complaint_id",
        "initial_amount",
        "fraud_category_encoded",
        "current_depth",
        "fan_out_ratio",
        "peeling_ratio",
        "velocity_decay",
        "elapsed_time_sec",
        "leaf_branch_lat",
        "leaf_branch_lon",
        "candidate_h3_res8",
        "cell_atm_density",
        "cell_avg_liquidity",
        "cell_min_dist_police",
        "cell_min_dist_highway"
    ]

    for col in expected_cols:
        assert col in feature_matrix.columns, f"Missing required feature column: {col}"
        # Assert strict null value immunity
        null_count = feature_matrix[col].null_count()
        assert null_count == 0, f"Feature column '{col}' contains {null_count} nulls (null immunity violated)"

    # Verify mathematical value bounds
    assert (feature_matrix["current_depth"] >= 1).all(), "Hop count must be >= 1"
    assert (feature_matrix["velocity_decay"] >= 0.0).all(), "Velocity decay cannot be negative"


# ==============================================================================
# 2. Dual-Stage Model Inference Latency Benchmark (< 50ms SLA)
# ==============================================================================
def test_model_inference_latency_benchmark(inference_pipeline):
    """Asserts that the full dual-stage inference pipeline executes well below the 50ms SLA."""
    sample_graph_feats = {
        "initial_amount": 750000.0,
        "hop_count": 3,
        "fan_out_ratio": 1.33,
        "peeling_ratio": 0.28,
        "velocity_decay": 0.52,
        "cumulative_latency_sec": 480.0
    }

    # Warmup pass
    _ = inference_pipeline.predict_cashout(
        complaint_id="WARMUP-E2E",
        graph_features=sample_graph_feats,
        mule_last_lat=28.6139,
        mule_last_lon=77.2090,
        remaining_amount=245000.0
    )

    # Benchmark over 10 consecutive inference runs
    latencies_ms = []
    for i in range(10):
        t0 = time.perf_counter()
        result = inference_pipeline.predict_cashout(
            complaint_id=f"E2E-BENCH-{i}",
            graph_features=sample_graph_feats,
            mule_last_lat=28.6139,
            mule_last_lon=77.2090,
            remaining_amount=245000.0
        )
        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        latencies_ms.append(elapsed_ms)

        # Validate prediction output structure
        assert result["predicted_cashout_window_mins"] > 0, "Predicted window must be positive"
        assert result["confidence_score"] > 0.0, "Confidence score must be positive"
        assert "h3_res8" in result["primary_target_cell"], "Primary cell must have h3_res8"
        assert len(result["primary_target_cell"]["candidate_terminals"]) > 0, "Must have candidate terminals"

    mean_latency = np.mean(latencies_ms)
    p95_latency = np.percentile(latencies_ms, 95)

    print(f"\n[E2E BENCHMARK] Mean: {mean_latency:.2f} ms | P95: {p95_latency:.2f} ms (Target: < 50 ms)")
    assert mean_latency < 50.0, f"Mean latency {mean_latency:.2f}ms violated the 50ms SLA"
    assert p95_latency < 50.0, f"P95 latency {p95_latency:.2f}ms violated the 50ms SLA"


# ==============================================================================
# 3. FastAPI Endpoints Integrity
# ==============================================================================
def test_complaints_ingest_endpoint(api_client):
    """Validates /api/v1/complaints/ingest endpoint."""
    payload = {
        "complaint_id": "NCRP-E2E-TEST-001",
        "victim_account": "SBIN0008889991",
        "victim_bank": "State Bank of India",
        "initial_amount": 850000.0,
        "fraud_category": "DIGITAL_ARREST",
        "initial_utr": "UTR-E2E-INIT-001",
        "victim_lat": 28.6139,
        "victim_lon": 77.2090
    }
    response = api_client.post("/api/v1/complaints/ingest", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "INGESTED"
    assert data["complaint_id"] == "NCRP-E2E-TEST-001"
    assert "initial_prediction" in data
    assert data["initial_prediction"]["confidence_score"] > 0.0


def test_transactions_hook_and_propagation(api_client):
    """Validates /api/v1/transactions/hook multi-hop webhook processing."""
    hop_payload = {
        "sender": "SBIN0008889991",
        "receiver": "PUNB00012345",
        "amount": 850000.0,
        "chan": "IMPS",
        "utr": "UTR-E2E-HOP-001"
    }
    response = api_client.post("/api/v1/transactions/hook", json=hop_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HOOK_PROCESSED"
    assert data["utr"] == "UTR-E2E-HOP-001"


def test_predictions_query_endpoint(api_client):
    """Validates /api/v1/predictions/{id} tactical intelligence query."""
    response = api_client.get("/api/v1/predictions/NCRP-E2E-TEST-001")
    assert response.status_code == 200
    data = response.json()
    assert data["complaint_id"] == "NCRP-E2E-TEST-001"
    assert "predicted_cashout_window_mins" in data
    assert "confidence_score" in data
    assert "primary_target_cell" in data
    assert "tactical_explanation" in data
    assert "legal_brief" in data["tactical_explanation"]


def test_dispatch_dial112_endpoint(api_client):
    """Validates /api/v1/dispatch/dial112 CAD dispatch endpoint."""
    payload = {
        "complaint_id": "NCRP-E2E-TEST-001",
        "target_h3_index": "883da18da3fffff",
        "priority": "CRITICAL"
    }
    response = api_client.post("/api/v1/dispatch/dial112", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["dispatch_id"].startswith("CAD-112-")
    assert "patrol_car" in data
    assert data["eta_minutes"] > 0.0
    assert data["status"] == "DISPATCHED"


def test_bank_friction_endpoint(api_client):
    """Validates /api/v1/bank/friction core switch trigger endpoint."""
    payload = {
        "complaint_id": "NCRP-E2E-TEST-001",
        "target_mule_account": "PUNB00012345",
        "action": "STEP_UP_AUTH"
    }
    response = api_client.post("/api/v1/bank/friction", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["transaction_freeze_status"] == "SUCCESS"
    assert data["action_taken"] == "ATM_MICRO_DELAY_15MIN"
    assert data["risk_reference"].startswith("I4C-BLOCK-")
