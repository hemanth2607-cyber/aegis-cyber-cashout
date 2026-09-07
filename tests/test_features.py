"""
Unit Tests for Graph Topology & Feature Extraction Pipeline
Validates single-hop, multi-hop, and edge case resilience against division-by-zero errors.
"""

import unittest
import os
import math
import polars as pl
import pandas as pd
from features.graph_engine import CybercrimeGraphEngine, compute_mule_runner_utility
from features.spatial_indexer import SpatialEnricher
from features.pipeline import TacticalFeaturePipeline


class TestCybercrimeFeatures(unittest.TestCase):
    def setUp(self):
        self.graph_engine = CybercrimeGraphEngine()

    def test_empty_graph_resilience(self):
        """Validates that querying a non-existent account returns zeroed metrics without division by zero"""
        metrics = self.graph_engine.extract_mule_trajectory("NON_EXISTENT_ACC", max_depth=4)
        self.assertEqual(metrics.hop_count, 0)
        self.assertEqual(metrics.fan_out_ratio, 0.0)
        self.assertEqual(metrics.peeling_ratio, 0.0)
        self.assertEqual(metrics.cumulative_latency_sec, 0.0)
        self.assertEqual(metrics.velocity_decay, 0.0)
        self.assertEqual(metrics.terminating_mules, [])

    def test_single_hop_flow(self):
        """Validates a single transaction from Victim to Layer 1 Mule"""
        self.graph_engine.add_transaction(
            utr="UTR-TEST-001",
            sender="VIC_100",
            receiver="MULE_L1_01",
            amount=150000.0,
            timestamp_sec=1700000000.0,
            channel="UPI"
        )
        metrics = self.graph_engine.extract_mule_trajectory("VIC_100", max_depth=4)
        self.assertEqual(metrics.hop_count, 1)
        self.assertEqual(metrics.terminating_mules, ["MULE_L1_01"])
        self.assertGreaterEqual(metrics.velocity_decay, 0.0)
        self.assertLessEqual(metrics.velocity_decay, 1.0)

    def test_multi_hop_peeling_chain(self):
        """Validates a branching multi-hop money laundering chain (Victim -> L1 -> L2A, L2B -> L3)"""
        ge = CybercrimeGraphEngine()
        # Hop 1: Vic -> L1
        ge.add_transaction("UTR-01", "VIC_200", "L1_ACC", 500000.0, 1000.0, "IMPS")
        # Hop 2: L1 splits into L2A and L2B
        ge.add_transaction("UTR-02", "L1_ACC", "L2_ACC_A", 250000.0, 1600.0, "IMPS")
        ge.add_transaction("UTR-03", "L1_ACC", "L2_ACC_B", 200000.0, 1700.0, "UPI")
        # Hop 3: L2A -> L3
        ge.add_transaction("UTR-04", "L2_ACC_A", "L3_CASHIER", 240000.0, 2200.0, "IMPS")

        metrics = ge.extract_mule_trajectory("VIC_200", max_depth=4)
        self.assertEqual(metrics.hop_count, 3)
        self.assertIn("L3_CASHIER", metrics.terminating_mules)
        self.assertIn("L2_ACC_B", metrics.terminating_mules)
        self.assertGreater(metrics.fan_out_ratio, 0.0)
        self.assertGreaterEqual(metrics.peeling_ratio, 0.0)
        self.assertGreater(metrics.cumulative_latency_sec, 0.0)

    def test_convenience_subgraph_wrapper(self):
        """Validates extract_mule_subgraph dictionary structure"""
        ge = CybercrimeGraphEngine()
        ge.add_transaction("UTR-99", "VIC_300", "L1_MULE", 75000.0, 5000.0, "UPI")
        subgraph = ge.extract_mule_subgraph("NCRP-999", "VIC_300", max_hops=3)

        self.assertEqual(subgraph["complaint_id"], "NCRP-999")
        self.assertEqual(subgraph["entry_account"], "VIC_300")
        self.assertEqual(subgraph["hop_count"], 1)
        self.assertEqual(subgraph["leaf_nodes"], ["L1_MULE"])
        self.assertIn("transaction_velocity_decay", subgraph)

    def test_spatial_enricher_h3_and_kdtree(self):
        """Validates spatial hexagon computation and cKDTree lookups"""
        enricher = SpatialEnricher()
        indices = enricher.latlng_to_h3_indices(28.6139, 77.2090)
        self.assertIn("h3_res7", indices)
        self.assertIn("h3_res8", indices)
        self.assertIn("h3_res9", indices)

        # Test cell metrics
        features = enricher.get_h3_spatial_features(indices["h3_res8"])
        self.assertIn("atm_density", features)
        self.assertIn("avg_liquidity", features)
        self.assertIn("min_distance_to_police", features)
        self.assertIn("min_distance_to_highway", features)
        self.assertGreater(features["min_distance_to_police"], 0.0)
        self.assertGreater(features["min_distance_to_highway"], 0.0)

    def test_mule_runner_utility(self):
        """Validates extraction utility computation for cashout runners"""
        utility = compute_mule_runner_utility(
            runner_coord=(28.6139, 77.2090),
            atm_coord=(28.6180, 77.2130),
            atm_liquidity=500000.0,
            withdrawal_target=100000.0,
            dist_highway_meters=350.0,
            dist_police_meters=1800.0,
            has_cctv=True,
            is_onsite=False,
            nearby_atm_count=4
        )
        self.assertIsInstance(utility, float)
        self.assertFalse(math.isnan(utility))

    def test_tactical_feature_pipeline_realtime(self):
        """Validates full end-to-end tactical pipeline vector extraction"""
        pipeline = TacticalFeaturePipeline()
        sample_complaint = {
            "complaint_id": "NCRP-TEST-001",
            "victim_account_no": "VIC_ACC_999",
            "initial_amount": 250000.0,
            "fraud_category": "DIGITAL_ARREST",
            "victim_lat": 28.6200,
            "victim_lon": 77.2100
        }
        sample_txs = [
            {
                "utr": "UTR-RT-01",
                "sender_account": "VIC_ACC_999",
                "receiver_account": "L1_MULE_999",
                "amount": 250000.0,
                "timestamp": 1700001000.0,
                "payment_mode": "IMPS"
            }
        ]
        vector = pipeline.extract_realtime_feature_vector(sample_complaint, sample_txs)
        self.assertEqual(vector["complaint_id"], "NCRP-TEST-001")
        self.assertEqual(vector["current_depth"], 1)
        self.assertIn("candidate_h3_res8", vector)
        self.assertIn("cell_min_dist_police", vector)
        self.assertIn("velocity_decay", vector)


if __name__ == "__main__":
    unittest.main()
