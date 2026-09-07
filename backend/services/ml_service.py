"""
ML Service: Singleton wrapping PredictiveInferencePipeline and TacticalSHAPExplainer.
Maintains active predictions in memory and formats tactical intelligence outputs.
"""
import os
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import h3

from ml_models.inference import PredictiveInferencePipeline
from ml_models.explainer import TacticalSHAPExplainer
from backend.services.graph_service import GraphService, get_graph_service
from backend.schemas import TerminalInfo


class MLService:
    """
    Singleton service managing model inference, TreeSHAP explainability,
    and active hotspot predictions.
    """
    _instance: Optional["MLService"] = None

    def __init__(self, graph_service: Optional[GraphService] = None):
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        artifacts_dir = os.path.join(base_dir, "ml_models", "artifacts")
        s1_path = os.path.join(artifacts_dir, "stage1_regressor.joblib")
        s2_path = os.path.join(artifacts_dir, "stage2_ranker.joblib")

        self.graph_service = graph_service or get_graph_service()
        self.inference_pipeline = PredictiveInferencePipeline(
            stage1_model_path=s1_path,
            stage2_ranker_path=s2_path,
            spatial_index_service=self.graph_service.spatial_enricher
        )
        self.explainer = TacticalSHAPExplainer(
            stage1_model_path=s1_path,
            stage2_model_path=s2_path
        )

        # Active predictions cache: complaint_id -> prediction_dict
        self.active_predictions: Dict[str, Dict[str, Any]] = {}
        self.prediction_timestamps: Dict[str, float] = {}

    @classmethod
    def get_instance(cls) -> "MLService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def run_prediction_for_complaint(self, complaint_id: str) -> Dict[str, Any]:
        """
        Executes end-to-end dual-stage inference and TreeSHAP attribution
        for an active cyber fraud complaint.
        """
        graph_feats = self.graph_service.get_complaint_features(complaint_id)
        last_lat, last_lon = self.graph_service.get_last_mule_location(complaint_id)
        rem_amount = self.graph_service.get_remaining_amount(complaint_id)

        # 1. Dual-Stage Model Inference (<10ms)
        raw_pred = self.inference_pipeline.predict_cashout(
            complaint_id=complaint_id,
            graph_features=graph_feats,
            mule_last_lat=last_lat,
            mule_last_lon=last_lon,
            remaining_amount=rem_amount
        )

        pred_window = float(raw_pred["predicted_cashout_window_mins"])
        confidence = float(raw_pred["confidence_score"])
        primary_cell = raw_pred["primary_target_cell"]
        target_h8 = primary_cell["h3_res8"]
        target_lat = float(primary_cell["lat"])
        target_lon = float(primary_cell["lon"])
        target_h9 = h3.latlng_to_cell(target_lat, target_lon, 9)

        # 2. Extract spatial features for SHAP explainability
        spatial_feats = self.graph_service.spatial_enricher.get_h3_spatial_features(target_h8)

        # 3. TreeSHAP Attribution & Section 102 BNSS Brief
        explanation = self.explainer.explain_prediction(
            graph_features=graph_feats,
            spatial_features=spatial_feats,
            predicted_minutes=pred_window,
            confidence_score=confidence,
            target_h3=target_h8
        )

        # 4. Build Candidate ATMs list
        raw_terminals = primary_cell.get("candidate_terminals", [])
        if not raw_terminals:
            raw_terminals = self.graph_service.spatial_enricher.query_nearest_terminals(target_lat, target_lon, k=3)
            primary_cell["candidate_terminals"] = raw_terminals

        candidate_atms: List[Dict[str, Any]] = []
        for t in raw_terminals:
            candidate_atms.append({
                "terminal_id": t.get("terminal_id", "ATM-DL-10001"),
                "bank": t.get("bank_name", "State Bank of India"),
                "lat": float(t.get("lat", target_lat)),
                "lon": float(t.get("lon", target_lon)),
                "address": f"Near Outer Ring Road, Sector {target_h8[-4:]}, Delhi-NCR",
                "current_cash": float(t.get("current_cash_liquidity", 285000.0))
            })

        # Calculate absolute forecast time
        cashout_datetime = datetime.now() + timedelta(minutes=pred_window)
        cashout_time_iso = cashout_datetime.strftime("%Y-%m-%d %H:%M:%S IST")

        # 5. Assemble unified prediction structure
        prediction_result = {
            "complaint_id": complaint_id,
            "predicted_cashout_time": cashout_time_iso,
            "window_minutes": pred_window,
            "predicted_cashout_window_mins": pred_window,
            "confidence_score": confidence,
            "target_h3_res8": target_h8,
            "target_h3_res9": target_h9,
            "candidate_atms": candidate_atms,
            "tactical_explanation": explanation,
            "primary_target_cell": primary_cell,
            "top_3_spatial_clusters": raw_pred.get("top_3_spatial_clusters", []),
            "tactical_advisory": raw_pred.get("tactical_advisory", ""),
            "inference_latency_ms": raw_pred.get("inference_latency_ms", 5.0)
        }

        # Cache in memory
        self.active_predictions[complaint_id] = prediction_result
        self.prediction_timestamps[complaint_id] = time.time()

        return prediction_result

    def get_prediction(self, complaint_id: str) -> Optional[Dict[str, Any]]:
        """Returns cached prediction or runs inference if not yet generated."""
        if complaint_id in self.active_predictions:
            return self.active_predictions[complaint_id]
        if complaint_id in self.graph_service.complaints:
            return self.run_prediction_for_complaint(complaint_id)
        return None

    def get_active_hotspots(self) -> List[Dict[str, Any]]:
        """Returns all active predictions with dynamic countdown timers."""
        now = time.time()
        hotspots = []

        for cid, pred in self.active_predictions.items():
            ts = self.prediction_timestamps.get(cid, now)
            elapsed_mins = (now - ts) / 60.0
            initial_window = pred.get("predicted_cashout_window_mins", 30.0)
            remaining_mins = max(0.0, round(initial_window - elapsed_mins, 1))

            item = dict(pred)
            item["countdown_seconds"] = int(remaining_mins * 60)
            item["remaining_window_minutes"] = remaining_mins
            hotspots.append(item)

        # Sort by urgency (lowest remaining time first)
        hotspots.sort(key=lambda x: x["remaining_window_minutes"])
        return hotspots


def get_ml_service() -> MLService:
    return MLService.get_instance()
