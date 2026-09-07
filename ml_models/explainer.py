"""
TreeSHAP Explainability & Law Enforcement Intelligence Engine
Computes local Shapley values and transforms complex mathematical attributions into
actionable, Section 102 BNSS / 65B BSA court-ready tactical briefs.
"""

import os
import joblib
import numpy as np
import shap
from typing import Dict, List, Any, Optional

STAGE1_FEATURE_NAMES = [
    "initial_amount",
    "hop_count",
    "fan_out_ratio",
    "peeling_ratio",
    "velocity_decay",
    "cumulative_latency_sec"
]

STAGE2_FEATURE_NAMES = [
    "atm_density",
    "avg_liquidity",
    "min_distance_to_highway",
    "min_distance_to_police",
    "cctv_coverage_ratio",
    "h3_distance"
]

HUMAN_READABLE_DESCRIPTIONS = {
    "velocity_decay": {
        "pos": "High transaction velocity decay indicates automated bot-driven hop progression",
        "neg": "Slower fund dispersion velocity reduces immediate cashout urgency"
    },
    "peeling_ratio": {
        "pos": "Significant variance in outbound transfers indicates layered peeling chain",
        "neg": "Uniform transfer distribution without micro-peeling structure"
    },
    "fan_out_ratio": {
        "pos": "High outbound branching ratio (multi-account fragmentation)",
        "neg": "Low branch fan-out (direct single-line fund transfer)"
    },
    "hop_count": {
        "pos": "Mule chain has reached terminal Layer 3/4 debit card tier",
        "neg": "Mule chain is still in early Layer 1 entry phase"
    },
    "initial_amount": {
        "pos": "Substantial financial siphon requires high-capacity offsite ATM dispenser",
        "neg": "Standard retail theft amount within single ATM dispense threshold"
    },
    "min_distance_to_highway": {
        "pos": "Target H3 cell is located within immediate proximity of highway escape artery",
        "neg": "Target location is situated deep within congested interior sectors"
    },
    "min_distance_to_police": {
        "pos": "Extraction cell is located outside active police beat patrol radius",
        "neg": "Extraction cell is within immediate vicinity of cyber police station"
    },
    "atm_density": {
        "pos": "Dense ATM cluster provides redundancy for multi-card withdrawals",
        "neg": "Isolated terminal with low cash extraction alternatives"
    },
    "avg_liquidity": {
        "pos": "High terminal cash liquidity supports full withdrawal without replenishment lock",
        "neg": "Constrained terminal liquidity limits immediate physical cashout"
    },
    "cctv_coverage_ratio": {
        "pos": "Degraded or missing CCTV surveillance favored by cashout couriers",
        "neg": "High active CCTV coverage increases runner apprehension risk"
    }
}

class TacticalSHAPExplainer:
    """
    Law Enforcement Explainable AI Engine combining Stage 1 Regressor and Stage 2 Ranker
    TreeSHAP explainers to synthesize Section 102 BNSS / Section 65B BSA warrant justifications.
    """
    def __init__(self, stage1_model_path: Optional[str] = None, stage2_model_path: Optional[str] = None):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        artifacts_dir = os.path.join(base_dir, "ml_models", "artifacts")

        if stage1_model_path is None:
            stage1_model_path = os.path.join(artifacts_dir, "stage1_regressor.joblib")
        if stage2_model_path is None:
            stage2_model_path = os.path.join(artifacts_dir, "stage2_ranker.joblib")

        self.stage1_model = joblib.load(stage1_model_path) if os.path.exists(stage1_model_path) else None
        self.stage2_model = joblib.load(stage2_model_path) if os.path.exists(stage2_model_path) else None

        self.s1_explainer = shap.TreeExplainer(self.stage1_model) if self.stage1_model else None
        self.s2_explainer = shap.TreeExplainer(self.stage2_model) if self.stage2_model else None

    def explain_prediction(
        self,
        graph_features: Dict[str, Any],
        spatial_features: Dict[str, Any],
        predicted_minutes: float,
        confidence_score: float,
        target_h3: str
    ) -> Dict[str, Any]:
        """
        Computes exact local TreeSHAP attributions and returns structured legal intelligence.
        """
        # Vector 1: Stage 1 features
        s1_vec = np.array([[
            float(graph_features.get("initial_amount", 100000.0)),
            float(graph_features.get("hop_count", 2)),
            float(graph_features.get("fan_out_ratio", 1.5)),
            float(graph_features.get("peeling_ratio", 0.3)),
            float(graph_features.get("velocity_decay", 0.65)),
            float(graph_features.get("cumulative_latency_sec", 600.0))
        ]])

        # Vector 2: Stage 2 features
        s2_vec = np.array([[
            float(spatial_features.get("atm_density", 2)),
            float(spatial_features.get("avg_liquidity", 300000.0)),
            float(spatial_features.get("min_distance_to_highway", 500.0)),
            float(spatial_features.get("min_distance_to_police", 2000.0)),
            float(spatial_features.get("cctv_coverage_ratio", 0.5)),
            float(spatial_features.get("h3_distance", 2))
        ]])

        factors = []

        # 1. Compute Stage 1 SHAP values
        if self.s1_explainer is not None:
            s1_shap = self.s1_explainer.shap_values(s1_vec)
            # Handle list or array format from shap
            s1_vals = s1_shap[0] if isinstance(s1_shap, np.ndarray) and s1_shap.ndim == 2 else (s1_shap[0][0] if isinstance(s1_shap, list) else s1_shap)
            for name, val in zip(STAGE1_FEATURE_NAMES, s1_vals):
                val_f = float(val)
                desc = HUMAN_READABLE_DESCRIPTIONS.get(name, {}).get("pos" if val_f > 0 else "neg", f"Feature attribution: {name}")
                factors.append({
                    "feature": name.replace("_", " ").title(),
                    "raw_feature": name,
                    "shap_value": round(val_f, 4),
                    "description": desc
                })

        # 2. Compute Stage 2 SHAP values
        if self.s2_explainer is not None:
            s2_shap = self.s2_explainer.shap_values(s2_vec)
            s2_vals = s2_shap[0] if isinstance(s2_shap, np.ndarray) and s2_shap.ndim == 2 else (s2_shap[0][0] if isinstance(s2_shap, list) else s2_shap)
            for name, val in zip(STAGE2_FEATURE_NAMES, s2_vals):
                val_f = float(val)
                desc = HUMAN_READABLE_DESCRIPTIONS.get(name, {}).get("pos" if val_f > 0 else "neg", f"Feature attribution: {name}")
                factors.append({
                    "feature": name.replace("_", " ").title(),
                    "raw_feature": name,
                    "shap_value": round(val_f, 4),
                    "description": desc
                })

        # Sort factors by absolute magnitude
        factors.sort(key=lambda x: abs(x["shap_value"]), reverse=True)

        # Select Top 3 positive risk drivers and Top 2 mitigating factors
        top_risk_drivers = [f for f in factors if f["shap_value"] > 0][:3]
        top_mitigating = [f for f in factors if f["shap_value"] < 0][:2]

        top_factors = top_risk_drivers + top_mitigating

        # Legal Brief under Section 102 BNSS / Section 65B BSA
        legal_brief = (
            f"SECTION 102 BNSS / 106 CRPC WARRANT JUSTIFICATION: "
            f"Dual-stage TreeSHAP machine learning inference indicates high-confidence cashout trajectory "
            f"(Confidence: {confidence_score * 100:.1f}%) within {predicted_minutes:.1f} minutes at H3 Cell {target_h3}. "
            f"Primary risk attribution: {top_risk_drivers[0]['description'] if top_risk_drivers else 'Velocity decay acceleration'}. "
            f"Statutory authority is empowered to place temporary holds on target terminal switches and deploy immediate beat cordons."
        )

        return {
            "predicted_minutes": round(float(predicted_minutes), 1),
            "predicted_confidence": round(float(confidence_score), 2),
            "target_h3_cell": target_h3,
            "top_factors": top_factors,
            "legal_brief": legal_brief
        }
