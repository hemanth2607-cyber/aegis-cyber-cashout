"""
Unit Tests for Zero-Day Sleeper Mule Dormancy Burst Detection & Horizon Compression.
Validates the mathematical Dormancy Burst formulation, threshold flagging,
and Stage 1 cashout horizon acceleration.
"""
import time
import pytest
import numpy as np

from features.graph_engine import CybercrimeGraphEngine, PathVelocityMetrics
from features.spatial_indexer import SpatialEnricher
from ml_models.inference import PredictiveInferencePipeline
from backend.services.graph_service import GraphService
from backend.services.ml_service import MLService


def test_normal_active_account_no_burst():
    """
    Verifies that a normal active account with regular transaction volume
    does NOT trigger the sleeper burst flag.
    """
    engine = CybercrimeGraphEngine()
    account_no = "NORMAL_ACC_1001"
    
    # Active account: dormant_days = 0, historical median daily volume = ₹15,000
    engine.register_account_profile(
        account_no=account_no,
        dormant_days=0,
        historical_median_volume=15000.0
    )
    
    t0 = 1700000000.0
    # Regular incoming transaction: ₹5,000
    engine.add_transaction(
        utr="UTR-NORM-001",
        sender="SRC_001",
        receiver=account_no,
        amount=5000.0,
        timestamp_sec=t0,
        channel="UPI"
    )
    
    burst_result = engine.calculate_dormancy_burst(
        account_no=account_no,
        incoming_amount=5000.0,
        current_ts=t0,
        inter_hop_delay_mins=10.0
    )
    
    assert burst_result["status"] == "NORMAL_ACCOUNT_FLOW"
    assert burst_result["sleeper_risk_boost"] == 0.0
    assert burst_result["is_flagged_sleeper"] is False
    assert burst_result["burst_score"] < 15.0
    assert burst_result["metadata"]["risk_override"] is False
    assert burst_result["metadata"]["dormancy_days"] == 0


def test_dormant_account_burst_activation():
    """
    Verifies that a dormant account (>180 days) receiving ₹2,50,000
    within 4 minutes triggers SLEEPER_MULE_ACTIVATED with burst score >= 15.0.
    """
    engine = CybercrimeGraphEngine()
    sleeper_acc = "SLEEPER_MULE_9999"
    
    # Account dormant for 210 days with low historical median volume (₹100)
    engine.register_account_profile(
        account_no=sleeper_acc,
        dormant_days=210,
        historical_median_volume=100.0
    )
    
    t0 = 1700000000.0
    # Predecessor hop at t0
    engine.add_transaction(
        utr="UTR-HOP1",
        sender="VICTIM_001",
        receiver="LAYER1_MULE",
        amount=250000.0,
        timestamp_sec=t0,
        channel="IMPS"
    )
    
    # Hop 2 to sleeper mule 4 minutes later (240 seconds)
    t1 = t0 + 240.0
    engine.add_transaction(
        utr="UTR-HOP2",
        sender="LAYER1_MULE",
        receiver=sleeper_acc,
        amount=250000.0,
        timestamp_sec=t1,
        channel="IMPS"
    )
    
    burst_result = engine.calculate_dormancy_burst(
        account_no=sleeper_acc,
        incoming_amount=250000.0,
        current_ts=t1
    )
    
    assert burst_result["status"] == "SLEEPER_MULE_ACTIVATED"
    assert burst_result["sleeper_risk_boost"] == 0.35
    assert burst_result["is_flagged_sleeper"] is True
    assert burst_result["burst_score"] >= 15.0
    # Expected Burst Score approx: (250000 / 100) * (1 / 4.0) = 625.0
    assert burst_result["burst_score"] > 500.0
    assert burst_result["metadata"]["risk_override"] is True
    assert burst_result["metadata"]["dormancy_days"] == 210
    assert engine.account_history[sleeper_acc]["is_flagged_sleeper"] is True


def test_graph_trajectory_detects_sleeper():
    """
    Verifies that extract_mule_trajectory detects sleeper mules
    and returns sleeper_mules_detected and max_burst_score.
    """
    engine = CybercrimeGraphEngine()
    root_acc = "VIC_ALERT_101"
    sleeper_mule = "SLEEPER_TERMINAL_77"
    
    engine.register_account_profile(
        account_no=sleeper_mule,
        dormant_days=195,
        historical_median_volume=50.0
    )
    
    t0 = 1700000000.0
    engine.add_transaction("UTR-A", root_acc, "INTERMEDIATE_1", 300000.0, t0, "IMPS")
    engine.add_transaction("UTR-B", "INTERMEDIATE_1", sleeper_mule, 300000.0, t0 + 180.0, "IMPS")
    
    trajectory: PathVelocityMetrics = engine.extract_mule_trajectory(root_acc, max_depth=4)
    
    assert sleeper_mule in trajectory.terminating_mules
    assert sleeper_mule in trajectory.sleeper_mules_detected
    assert trajectory.max_burst_score >= 15.0


def test_stage1_horizon_compression_and_alert():
    """
    Verifies that Stage 1 predicted cashout horizon compresses proportionally (35%)
    when a sleeper mule is activated, with bounded minimum >= 5.0 mins,
    and tactical alert string is injected.
    """
    spatial_enricher = SpatialEnricher()
    pipeline = PredictiveInferencePipeline(
        stage1_model_path="ml_models/artifacts/stage1_regressor.joblib",
        stage2_ranker_path="ml_models/artifacts/stage2_ranker.joblib",
        spatial_index_service=spatial_enricher
    )
    
    mule_lat = 28.6139
    mule_lon = 77.2090
    rem_amount = 250000.0
    
    base_features = {
        "initial_amount": 250000.0,
        "hop_count": 2,
        "fan_out_ratio": 1.0,
        "peeling_ratio": 0.15,
        "velocity_decay": 0.85,
        "cumulative_latency_sec": 240.0,
        "terminating_mules": ["ACC_MULE_STANDARD"],
        "is_flagged_sleeper": False
    }
    
    # Baseline prediction without sleeper activation
    base_pred = pipeline.predict_cashout(
        complaint_id="NCRP-BASE-001",
        graph_features=base_features,
        mule_last_lat=mule_lat,
        mule_last_lon=mule_lon,
        remaining_amount=rem_amount
    )
    base_window = base_pred["predicted_cashout_window_mins"]
    assert base_pred["sleeper_mule_alert"] is False
    assert "[CRITICAL] ZERO-DAY SLEEPER ACTIVATION" not in base_pred["tactical_advisory"]
    
    # Sleeper activated prediction
    sleeper_features = dict(base_features)
    sleeper_features["is_flagged_sleeper"] = True
    sleeper_features["sleeper_mules_detected"] = ["SLEEPER_ACC_888"]
    sleeper_features["max_burst_score"] = 62.5
    sleeper_features["sleeper_details"] = {
        "account_no": "SLEEPER_ACC_888",
        "dormancy_days": 210,
        "burst_score": 62.5,
        "sleeper_risk_boost": 0.35
    }
    
    sleeper_pred = pipeline.predict_cashout(
        complaint_id="NCRP-SLEEPER-001",
        graph_features=sleeper_features,
        mule_last_lat=mule_lat,
        mule_last_lon=mule_lon,
        remaining_amount=rem_amount
    )
    sleeper_window = sleeper_pred["predicted_cashout_window_mins"]
    
    # Assertions
    assert sleeper_pred["sleeper_mule_alert"] is True
    assert sleeper_pred["sleeper_details"] is not None
    assert sleeper_pred["sleeper_details"]["account_no"] == "SLEEPER_ACC_888"
    assert sleeper_pred["sleeper_details"]["dormancy_days"] == 210
    
    # Tactical alert string verification
    expected_alert_prefix = "[CRITICAL] ZERO-DAY SLEEPER ACTIVATION DETECTED on Account SLEEPER_ACC_888"
    assert expected_alert_prefix in sleeper_pred["tactical_advisory"]
    assert "Cashout horizon compressed by 35%" in sleeper_pred["tactical_advisory"]
    
    # Proportional compression verification
    # Window should be compressed by (1.0 - 0.35) = 0.65, bounded >= 5.0 mins
    expected_window = max(5.0, round(base_window * 0.65, 1))
    assert abs(sleeper_window - expected_window) <= 0.5
    assert sleeper_window >= 5.0
    assert sleeper_window < base_window
