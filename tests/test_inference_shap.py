"""
Verification & Performance Benchmark for Dual-Stage Inference & TreeSHAP Explainer
Enforces the sub-50ms execution SLA and validates local Shapley attributions.
"""

import time
import unittest
from features.spatial_indexer import SpatialEnricher
from ml_models.inference import PredictiveInferencePipeline
from ml_models.explainer import TacticalSHAPExplainer

class TestInferenceAndSHAP(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.enricher = SpatialEnricher()
        cls.pipeline = PredictiveInferencePipeline(
            stage1_model_path="ml_models/artifacts/stage1_regressor.joblib",
            stage2_ranker_path="ml_models/artifacts/stage2_ranker.joblib",
            spatial_index_service=cls.enricher
        )
        cls.explainer = TacticalSHAPExplainer()

    def test_sub_50ms_inference_sla(self):
        graph_feats = {
            "initial_amount": 750000.0,
            "hop_count": 3,
            "fan_out_ratio": 2.2,
            "peeling_ratio": 0.42,
            "velocity_decay": 0.78,
            "cumulative_latency_sec": 840.0
        }

        # Warmup
        _ = self.pipeline.predict_cashout(
            complaint_id="NCRP-WARMUP",
            graph_features=graph_feats,
            mule_last_lat=28.6139,
            mule_last_lon=77.2090,
            remaining_amount=245000.0
        )

        # Timed execution
        start = time.perf_counter()
        res = self.pipeline.predict_cashout(
            complaint_id="NCRP-BENCHMARK-001",
            graph_features=graph_feats,
            mule_last_lat=28.6139,
            mule_last_lon=77.2090,
            remaining_amount=245000.0
        )
        elapsed_ms = (time.perf_counter() - start) * 1000.0

        print(f"\n[BENCHMARK] Total Pipeline Latency: {elapsed_ms:.2f} ms (Internal: {res['inference_latency_ms']} ms)")
        print(f"[BENCHMARK] Predicted Horizon: {res['predicted_cashout_window_mins']} mins")
        print(f"[BENCHMARK] Primary Target H3: {res['primary_target_cell']['h3_res8']}")
        print(f"[BENCHMARK] Candidate Terminals: {len(res['primary_target_cell']['candidate_terminals'])}")

        self.assertLess(res["inference_latency_ms"], 50.0, f"SLA violated: {res['inference_latency_ms']} >= 50ms")
        self.assertIn("top_3_spatial_clusters", res)
        self.assertEqual(len(res["top_3_spatial_clusters"]), 3)
        self.assertGreater(res["confidence_score"], 0.0)

    def test_treeshap_tactical_explainer(self):
        graph_feats = {
            "initial_amount": 500000.0,
            "hop_count": 3,
            "fan_out_ratio": 2.0,
            "peeling_ratio": 0.38,
            "velocity_decay": 0.85,
            "cumulative_latency_sec": 700.0
        }
        spatial_stats = self.enricher.get_h3_spatial_features("883da11463fffff")

        explanation = self.explainer.explain_prediction(
            graph_features=graph_feats,
            spatial_features=spatial_stats,
            predicted_minutes=24.5,
            confidence_score=0.88,
            target_h3="883da11463fffff"
        )

        self.assertEqual(explanation["predicted_minutes"], 24.5)
        self.assertEqual(explanation["predicted_confidence"], 0.88)
        self.assertIn("top_factors", explanation)
        self.assertGreater(len(explanation["top_factors"]), 0)
        self.assertIn("SECTION 102 BNSS", explanation["legal_brief"])

        print("\n[EXPLAINER] Top 3 Drivers:")
        for factor in explanation["top_factors"][:3]:
            print(f"  * {factor['feature']} (SHAP: {factor['shap_value']:+.4f}): {factor['description']}")
        print(f"[EXPLAINER] Legal Brief: {explanation['legal_brief'][:120]}...")

if __name__ == "__main__":
    unittest.main()
