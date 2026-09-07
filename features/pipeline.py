"""
Tactical Feature Pipeline for Real-Time & Batch Cybercrime Investigation
Merges Multi-Hop Graph Topology with Geospatial H3 Spatial Enrichment.
"""

import os
from typing import Dict, List, Any, Optional, Union
import numpy as np
import pandas as pd
import polars as pl
import h3

from features.graph_engine import CybercrimeGraphEngine
from features.spatial_indexer import SpatialEnricher
from data_generator.config import FRAUD_CATEGORIES

class TacticalFeaturePipeline:
    """
    Constructs enriched ML training and inference feature matrices combining:
    1. Downstream money mule trajectory metrics (hop count, fan out, peeling variance, velocity decay).
    2. Spatial hexagon metrics (ATM density, CSP density, liquidity reserves, distance to police & highways).
    """
    def __init__(
        self,
        terminals_path: Optional[str] = None,
        fraud_categories: Optional[List[str]] = None
    ):
        self.fraud_categories = fraud_categories or FRAUD_CATEGORIES
        self.cat2idx = {cat: idx for idx, cat in enumerate(self.fraud_categories)}
        self.spatial_enricher = SpatialEnricher(terminals_path=terminals_path)
        self.graph_engine = CybercrimeGraphEngine()

    def encode_fraud_category(self, category: str) -> int:
        return self.cat2idx.get(category, 0)

    def extract_realtime_feature_vector(
        self,
        complaint: Dict[str, Any],
        transactions: List[Dict[str, Any]],
        mule_accounts_lookup: Optional[Dict[str, Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Extracts single-case real-time enriched vector for an active complaint and transaction stream.
        """
        # 1. Ingest transactions into graph engine
        graph = CybercrimeGraphEngine()
        for tx in transactions:
            utr = str(tx.get("utr", ""))
            s = str(tx.get("sender_account", ""))
            r = str(tx.get("receiver_account", ""))
            amt = float(tx.get("amount", 0.0))
            ts = tx.get("timestamp", 0.0)
            ts_sec = float(ts.timestamp()) if hasattr(ts, "timestamp") else float(pd.to_datetime(ts).timestamp())
            mode = str(tx.get("payment_mode", "UPI"))
            graph.add_transaction(utr, s, r, amt, ts_sec, mode)

        # 2. Extract trajectory from victim account
        vic_acc = str(complaint.get("victim_account_no", ""))
        traj = graph.extract_mule_trajectory(vic_acc, max_depth=4)

        # 3. Identify terminating leaf branch coordinates
        leaf_nodes = traj.terminating_mules
        leaf_acc = leaf_nodes[0] if leaf_nodes else vic_acc

        leaf_lat = float(complaint.get("victim_lat", 28.6139))
        leaf_lon = float(complaint.get("victim_lon", 77.2090))

        if mule_accounts_lookup and leaf_acc in mule_accounts_lookup:
            m_info = mule_accounts_lookup[leaf_acc]
            leaf_lat = float(m_info.get("branch_lat", leaf_lat))
            leaf_lon = float(m_info.get("branch_lon", leaf_lon))

        # 4. Spatial Enrichment at Candidate H3 Hexagon
        candidate_h3 = h3.latlng_to_cell(leaf_lat, leaf_lon, 8)
        spatial_metrics = self.spatial_enricher.get_h3_spatial_features(candidate_h3)

        initial_amt = float(complaint.get("initial_amount", 100000.0))
        cat_encoded = self.encode_fraud_category(complaint.get("fraud_category", "INVESTMENT_SCAM"))

        return {
            "complaint_id": complaint.get("complaint_id"),
            "initial_amount": initial_amt,
            "fraud_category_encoded": cat_encoded,
            "current_depth": int(traj.hop_count),
            "fan_out_ratio": round(float(traj.fan_out_ratio), 4),
            "peeling_ratio": round(float(traj.peeling_ratio), 4),
            "velocity_decay": round(float(traj.velocity_decay), 6),
            "elapsed_time_sec": round(float(traj.cumulative_latency_sec), 1),
            "leaf_branch_lat": round(leaf_lat, 6),
            "leaf_branch_lon": round(leaf_lon, 6),
            "candidate_h3_res8": candidate_h3,
            "cell_atm_density": int(spatial_metrics["atm_density"]),
            "cell_avg_liquidity": float(spatial_metrics["avg_liquidity"]),
            "cell_min_dist_police": float(spatial_metrics["min_distance_to_police"]),
            "cell_min_dist_highway": float(spatial_metrics["min_distance_to_highway"])
        }

    def process_batch(
        self,
        complaints_path: str,
        transactions_path: str,
        mule_accounts_path: str
    ) -> pl.DataFrame:
        """
        Ultra-performant batch feature matrix generation utilizing Polars.
        """
        print("[*] TacticalFeaturePipeline: Loading parquet tables with Polars...")
        df_complaints = pl.read_parquet(complaints_path)
        df_txs = pl.read_parquet(transactions_path)
        df_mules = pl.read_parquet(mule_accounts_path)

        # Build global transaction multigraph
        print(f"[*] Ingesting {len(df_txs):,} transactions into in-memory multigraph...")
        self.graph_engine = CybercrimeGraphEngine()
        self.graph_engine.build_graph_from_transactions(df_txs)

        # Mule lookup dictionary for instant coordinate retrieval
        mule_dict = {
            row["account_number"]: row
            for row in df_mules.iter_rows(named=True)
        }

        feature_records = []
        print(f"[*] Extracting graph trajectories & spatial enrichment for {len(df_complaints):,} complaints...")

        for comp in df_complaints.iter_rows(named=True):
            vic_acc = comp["victim_account_no"]
            traj = self.graph_engine.extract_mule_trajectory(vic_acc, max_depth=4)

            # Terminating mule account
            leaf_acc = traj.terminating_mules[0] if traj.terminating_mules else vic_acc
            if leaf_acc in mule_dict:
                leaf_lat = float(mule_dict[leaf_acc]["branch_lat"])
                leaf_lon = float(mule_dict[leaf_acc]["branch_lon"])
            else:
                leaf_lat = float(comp["victim_lat"])
                leaf_lon = float(comp["victim_lon"])

            # Spatial Hexagon
            candidate_h3 = h3.latlng_to_cell(leaf_lat, leaf_lon, 8)
            spatial_feats = self.spatial_enricher.get_h3_spatial_features(candidate_h3)

            cat_enc = self.encode_fraud_category(comp["fraud_category"])

            feature_records.append({
                "complaint_id": comp["complaint_id"],
                "initial_amount": float(comp["initial_amount"]),
                "fraud_category_encoded": cat_enc,
                "current_depth": int(traj.hop_count),
                "fan_out_ratio": float(traj.fan_out_ratio),
                "peeling_ratio": float(traj.peeling_ratio),
                "velocity_decay": float(traj.velocity_decay),
                "elapsed_time_sec": float(traj.cumulative_latency_sec),
                "leaf_branch_lat": leaf_lat,
                "leaf_branch_lon": leaf_lon,
                "candidate_h3_res8": candidate_h3,
                "cell_atm_density": int(spatial_feats["atm_density"]),
                "cell_avg_liquidity": float(spatial_feats["avg_liquidity"]),
                "cell_min_dist_police": float(spatial_feats["min_distance_to_police"]),
                "cell_min_dist_highway": float(spatial_feats["min_distance_to_highway"])
            })

        pl_feature_matrix = pl.DataFrame(feature_records)
        print(f"[+] Successfully constructed feature matrix: {pl_feature_matrix.shape[0]} rows x {pl_feature_matrix.shape[1]} columns.")
        return pl_feature_matrix
