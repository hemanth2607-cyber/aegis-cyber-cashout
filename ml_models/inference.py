"""
Dual-Stage Real-Time Inference Pipeline with Sub-50ms Execution SLA
"""
import time
from typing import Dict, List, Any
import numpy as np
import h3
import joblib

# H3 v4 Compatibility Helpers (Supporting both v4 and legacy v3)
def _latlng_to_cell(lat: float, lng: float, res: int = 8) -> str:
    if hasattr(h3, 'latlng_to_cell'):
        return h3.latlng_to_cell(lat, lng, res)
    return h3.geo_to_h3(lat, lng, res)

def _grid_disk(cell: str, k: int) -> List[str]:
    if hasattr(h3, 'grid_disk'):
        return list(h3.grid_disk(cell, k))
    return list(h3.k_ring(cell, k))

def _cell_to_latlng(cell: str):
    if hasattr(h3, 'cell_to_latlng'):
        return h3.cell_to_latlng(cell)
    return h3.h3_to_geo(cell)

def _grid_distance(h1: str, h2: str) -> int:
    if hasattr(h3, 'grid_distance'):
        return h3.grid_distance(h1, h2)
    return h3.h3_distance(h1, h2)


class PredictiveInferencePipeline:
    def __init__(
        self,
        stage1_model_path: str,
        stage2_ranker_path: str,
        spatial_index_service: Any
    ):
        self.stage1_regressor = joblib.load(stage1_model_path)
        self.stage2_ranker = joblib.load(stage2_ranker_path)
        self.spatial_index = spatial_index_service

    def predict_cashout(
        self,
        complaint_id: str,
        graph_features: Dict[str, Any],
        mule_last_lat: float,
        mule_last_lon: float,
        remaining_amount: float
    ) -> Dict[str, Any]:
        start_time = time.perf_counter()

        # -------------------------------------------------------------
        # STAGE 1: Time-to-Cashout Horizon Estimation
        # -------------------------------------------------------------
        s1_vector = np.array([[
            graph_features.get("initial_amount", 100000.0),
            graph_features.get("hop_count", 2),
            graph_features.get("fan_out_ratio", 1.5),
            graph_features.get("peeling_ratio", 0.3),
            graph_features.get("velocity_decay", 0.65),
            graph_features.get("cumulative_latency_sec", 600.0)
        ]])

        predicted_minutes = float(self.stage1_regressor.predict(s1_vector)[0])
        predicted_minutes = max(5.0, min(180.0, predicted_minutes))  # Realistic bounds

        # Zero-Day Sleeper Mule Acceleration Check
        is_sleeper_active = False
        sleeper_details = graph_features.get("sleeper_details")
        sleeper_mules = graph_features.get("sleeper_mules_detected", [])

        if graph_features.get("is_flagged_sleeper"):
            is_sleeper_active = True
        elif sleeper_mules and len(sleeper_mules) > 0:
            is_sleeper_active = True
        elif isinstance(sleeper_details, dict) and sleeper_details.get("account_no"):
            is_sleeper_active = True
        elif any(isinstance(m, dict) and m.get("is_flagged_sleeper") for m in graph_features.get("terminating_mules", [])):
            is_sleeper_active = True

        tactical_alert_str = ""
        sleeper_details_payload = None

        if is_sleeper_active:
            sleeper_risk_boost = float(sleeper_details.get("sleeper_risk_boost", 0.35)) if isinstance(sleeper_details, dict) else 0.35
            # Compress cashout horizon by sleeper_risk_boost; bounded to >= 5.0 mins
            predicted_minutes = max(5.0, predicted_minutes * (1.0 - sleeper_risk_boost))

            if isinstance(sleeper_details, dict):
                account_x = sleeper_details.get("account_no", sleeper_mules[0] if sleeper_mules else "UNKNOWN")
                dormancy_days = sleeper_details.get("dormancy_days", sleeper_details.get("dormant_days", 180))
                burst_score = sleeper_details.get("burst_score", graph_features.get("max_burst_score", 15.0))
            else:
                account_x = sleeper_mules[0] if sleeper_mules else (graph_features.get("terminating_mules", ["UNKNOWN"])[0] if graph_features.get("terminating_mules") else "UNKNOWN")
                dormancy_days = graph_features.get("dormancy_days", graph_features.get("dormant_days", 180))
                burst_score = graph_features.get("max_burst_score", 15.0)

            tactical_alert_str = (
                f"[CRITICAL] ZERO-DAY SLEEPER ACTIVATION DETECTED on Account {account_x} "
                f"(Dormancy: {dormancy_days} days, Burst Index: {burst_score}x). "
                f"Cashout horizon compressed by 35%."
            )
            sleeper_details_payload = {
                "account_no": account_x,
                "dormancy_days": dormancy_days,
                "burst_score": burst_score,
                "sleeper_risk_boost": sleeper_risk_boost,
                "alert_message": tactical_alert_str
            }

        # -------------------------------------------------------------
        # STAGE 2: Spatial Reachability Isochrone & Cell Ranking
        # -------------------------------------------------------------
        # Kinematic radius: Average urban vehicle speed 35 km/h
        search_radius_km = min(15.0, (35.0 * (predicted_minutes / 60.0)) + 2.0)
        
        # Identify candidate H3 cells at resolution 8 around last mule location (H3 v4 native)
        center_h3 = _latlng_to_cell(mule_last_lat, mule_last_lon, 8)
        # Approximate k-ring distance for H3 resolution 8 (edge length ~0.46km)
        k_ring_dist = max(1, int(search_radius_km / 0.8))
        candidate_cells = _grid_disk(center_h3, min(k_ring_dist, 6))

        # Score candidates with Stage 2 Spatial Ranker
        ranking_features = []
        for cell in candidate_cells:
            cell_lat, cell_lon = _cell_to_latlng(cell)
            cell_stats = self.spatial_index.get_h3_spatial_features(cell)
            
            feat_row = [
                cell_stats["atm_density"],
                cell_stats["avg_liquidity"],
                cell_stats["min_distance_to_highway"],
                cell_stats["min_distance_to_police"],
                cell_stats["cctv_coverage_ratio"],
                _grid_distance(center_h3, cell)
            ]
            ranking_features.append(feat_row)

        X_spatial = np.array(ranking_features)
        cell_scores = self.stage2_ranker.predict(X_spatial)

        # Softmax normalization over candidate cell scores
        exp_scores = np.exp(cell_scores - np.max(cell_scores))
        probabilities = exp_scores / np.sum(exp_scores)

        # Top 3 cells
        top_indices = np.argsort(probabilities)[::-1][:3]
        top_h3_cells = []
        for idx in top_indices:
            cell_id = candidate_cells[idx]
            c_lat, c_lon = _cell_to_latlng(cell_id)
            cell_terms = self.spatial_index.get_terminals_in_cell(cell_id)
            if not cell_terms and hasattr(self.spatial_index, "query_nearest_terminals"):
                cell_terms = self.spatial_index.query_nearest_terminals(c_lat, c_lon, k=3)
            top_h3_cells.append({
                "h3_res8": cell_id,
                "probability": float(probabilities[idx]),
                "lat": c_lat,
                "lon": c_lon,
                "candidate_terminals": cell_terms
            })

        total_latency_ms = (time.perf_counter() - start_time) * 1000.0

        base_advisory = (
            f"INTERCEPT ALERT: High probability cash extraction in {round(predicted_minutes, 0)} mins "
            f"at H3 cell {top_h3_cells[0]['h3_res8']}. Recommended Action: Geofence beat dispatch."
        )
        tactical_advisory = f"{tactical_alert_str} {base_advisory}" if is_sleeper_active else base_advisory

        return {
            "complaint_id": complaint_id,
            "inference_latency_ms": round(total_latency_ms, 2),
            "predicted_cashout_window_mins": round(predicted_minutes, 1),
            "confidence_score": round(float(probabilities[top_indices[0]]), 3),
            "primary_target_cell": top_h3_cells[0],
            "top_3_spatial_clusters": top_h3_cells,
            "tactical_advisory": tactical_advisory,
            "sleeper_mule_alert": is_sleeper_active,
            "sleeper_details": sleeper_details_payload if is_sleeper_active else None
        }
