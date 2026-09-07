"""
Graph Service: Singleton managing real-time multigraph state, spatial enrichment,
and mule velocity feature extraction.
"""
import os
import time
from typing import Dict, List, Tuple, Any, Optional, Set
import pandas as pd

from features.graph_engine import CybercrimeGraphEngine, PathVelocityMetrics
from features.spatial_indexer import SpatialEnricher


class GraphService:
    """
    Singleton service maintaining in-memory transaction graphs updated in real-time
    as complaints and CFCFRMS transaction webhooks arrive.
    """
    _instance: Optional["GraphService"] = None

    def __init__(self):
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        terminals_path = os.path.join(base_dir, "data_generator", "terminals.parquet")
        mules_path = os.path.join(base_dir, "data_generator", "mule_accounts.parquet")

        self.graph_engine = CybercrimeGraphEngine(half_life_decay=0.05, dispersion_gamma=0.5)
        self.spatial_enricher = SpatialEnricher(terminals_path=terminals_path)

        # In-memory storage of complaints and account associations
        self.complaints: Dict[str, Dict[str, Any]] = {}
        self.account_to_complaints: Dict[str, Set[str]] = {}
        self.mule_locations: Dict[str, Tuple[float, float]] = {}

        # Preload known mule coordinates if available
        self.known_mule_accounts: Dict[str, Dict[str, Any]] = {}
        if os.path.exists(mules_path):
            try:
                mules_df = pd.read_parquet(mules_path)
                for _, row in mules_df.iterrows():
                    acc = str(row["account_number"])
                    self.known_mule_accounts[acc] = {
                        "lat": float(row["branch_lat"]),
                        "lon": float(row["branch_lon"]),
                        "bank": str(row["bank_name"]),
                        "layer": str(row["account_layer"])
                    }
                    self.mule_locations[acc] = (float(row["branch_lat"]), float(row["branch_lon"]))
            except Exception as e:
                print(f"[!] Warning loading mule accounts: {e}")

    @classmethod
    def get_instance(cls) -> "GraphService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def register_complaint(self, complaint_data: Dict[str, Any]) -> Dict[str, Any]:
        """Registers a new complaint in the tracking system and initializes the root node."""
        cid = complaint_data["complaint_id"]
        v_acc = complaint_data["victim_account"]
        v_lat = float(complaint_data["victim_lat"])
        v_lon = float(complaint_data["victim_lon"])

        self.complaints[cid] = complaint_data
        if v_acc not in self.account_to_complaints:
            self.account_to_complaints[v_acc] = set()
        self.account_to_complaints[v_acc].add(cid)
        self.mule_locations[v_acc] = (v_lat, v_lon)

        # Add initial victim node
        self.graph_engine.graph.add_node(v_acc, node_type="VICTIM", lat=v_lat, lon=v_lon)

        # Ingest initial transaction if available
        initial_utr = complaint_data.get("initial_utr")
        if initial_utr:
            ts = complaint_data.get("timestamp", time.time())
            ts_sec = float(ts) if isinstance(ts, (int, float)) else time.time()
            # If initial receiver is not specified yet, we log the initial node
            # The receiver will be linked when hop 1 transaction hook arrives
            pass

        return complaint_data

    def ingest_transaction(
        self,
        utr: str,
        sender: str,
        receiver: str,
        amount: float,
        timestamp: Any,
        channel: str = "IMPS",
        complaint_id: Optional[str] = None
    ) -> List[str]:
        """
        Appends transaction to graph, updates account-complaint mapping,
        and records mule coordinate estimation. Returns affected complaint IDs.
        """
        ts_sec = float(timestamp) if isinstance(timestamp, (int, float)) else time.time()
        self.graph_engine.add_transaction(utr, sender, receiver, amount, ts_sec, channel)

        # Identify linked complaints
        affected_complaints: Set[str] = set()
        if complaint_id and complaint_id in self.complaints:
            affected_complaints.add(complaint_id)

        # Propagate from sender's linked complaints
        if sender in self.account_to_complaints:
            for cid in self.account_to_complaints[sender]:
                affected_complaints.add(cid)

        # If no complaint mapped, find any active complaint as fallback
        if not affected_complaints and self.complaints:
            # Map to most recent complaint
            latest_cid = list(self.complaints.keys())[-1]
            affected_complaints.add(latest_cid)

        # Associate receiver with all affected complaints
        if receiver not in self.account_to_complaints:
            self.account_to_complaints[receiver] = set()

        for cid in affected_complaints:
            self.account_to_complaints[receiver].add(cid)

        # Estimate receiver coordinates
        if receiver in self.known_mule_accounts:
            self.mule_locations[receiver] = (
                self.known_mule_accounts[receiver]["lat"],
                self.known_mule_accounts[receiver]["lon"]
            )
        elif sender in self.mule_locations:
            # Shift slightly within Delhi-NCR grid (~0.015 deg, ~1.6km)
            s_lat, s_lon = self.mule_locations[sender]
            self.mule_locations[receiver] = (
                round(s_lat + 0.012, 6),
                round(s_lon - 0.008, 6)
            )
        elif affected_complaints:
            first_cid = list(affected_complaints)[0]
            c_data = self.complaints[first_cid]
            self.mule_locations[receiver] = (
                float(c_data.get("victim_lat", 28.6139)),
                float(c_data.get("victim_lon", 77.2090))
            )

        return list(affected_complaints)

    def get_complaint_features(self, complaint_id: str) -> Dict[str, Any]:
        """Calculates dynamic graph velocity metrics for a given complaint."""
        c_data = self.complaints.get(complaint_id, {})
        v_acc = c_data.get("victim_account", "")
        init_amt = float(c_data.get("initial_amount", 100000.0))

        if not v_acc or v_acc not in self.graph_engine.graph:
            return {
                "initial_amount": init_amt,
                "hop_count": 1,
                "fan_out_ratio": 1.0,
                "peeling_ratio": 0.25,
                "velocity_decay": 0.70,
                "cumulative_latency_sec": 120.0,
                "terminating_mules": [v_acc] if v_acc else []
            }

        trajectory: PathVelocityMetrics = self.graph_engine.extract_mule_trajectory(v_acc, max_depth=5)

        return {
            "initial_amount": init_amt,
            "hop_count": max(1, trajectory.hop_count),
            "fan_out_ratio": round(trajectory.fan_out_ratio, 3),
            "peeling_ratio": round(trajectory.peeling_ratio, 3),
            "velocity_decay": round(trajectory.velocity_decay, 4),
            "cumulative_latency_sec": round(trajectory.cumulative_latency_sec, 1),
            "terminating_mules": trajectory.terminating_mules
        }

    def get_last_mule_location(self, complaint_id: str) -> Tuple[float, float]:
        """Returns the geographic coordinates of the terminating mule in the trajectory."""
        feats = self.get_complaint_features(complaint_id)
        term_mules = feats.get("terminating_mules", [])
        if term_mules:
            leaf = term_mules[-1]
            if leaf in self.mule_locations:
                return self.mule_locations[leaf]

        # Fallback to victim location
        c_data = self.complaints.get(complaint_id, {})
        return (
            float(c_data.get("victim_lat", 28.6139)),
            float(c_data.get("victim_lon", 77.2090))
        )

    def get_remaining_amount(self, complaint_id: str) -> float:
        """Estimates remaining unextracted fund amount along the downstream chain."""
        c_data = self.complaints.get(complaint_id, {})
        init_amt = float(c_data.get("initial_amount", 100000.0))
        v_acc = c_data.get("victim_account", "")

        if not v_acc or v_acc not in self.graph_engine.graph:
            return init_amt

        # Get last edge amounts
        feats = self.get_complaint_features(complaint_id)
        term_mules = feats.get("terminating_mules", [])
        last_amounts = []
        for mule in term_mules:
            in_edges = list(self.graph_engine.graph.in_edges(mule, data=True))
            for _, _, data in in_edges:
                last_amounts.append(data.get("amount", 0.0))

        if last_amounts:
            return float(sum(last_amounts))
        return init_amt

    def get_graph_trace(self, complaint_id: str) -> Dict[str, Any]:
        """Extracts complete visual graph representation for inspection."""
        c_data = self.complaints.get(complaint_id, {})
        v_acc = c_data.get("victim_account", "")
        if not v_acc or v_acc not in self.graph_engine.graph:
            return {"nodes": [], "edges": []}

        subgraph_nodes = set()
        subgraph_edges = []

        # BFS from victim
        queue = [v_acc]
        subgraph_nodes.add(v_acc)

        while queue:
            curr = queue.pop(0)
            for _, nxt, data in self.graph_engine.graph.out_edges(curr, data=True):
                subgraph_edges.append({
                    "from": curr,
                    "to": nxt,
                    "amount": data.get("amount", 0.0),
                    "channel": data.get("channel", "IMPS"),
                    "utr": data.get("key", ""),
                    "timestamp": data.get("timestamp", 0.0)
                })
                if nxt not in subgraph_nodes:
                    subgraph_nodes.add(nxt)
                    queue.append(nxt)

        node_list = []
        for n in subgraph_nodes:
            lat, lon = self.mule_locations.get(n, (28.6139, 77.2090))
            is_victim = (n == v_acc)
            node_list.append({
                "account": n,
                "type": "VICTIM" if is_victim else "MULE",
                "lat": lat,
                "lon": lon
            })

        return {
            "complaint_id": complaint_id,
            "nodes": node_list,
            "edges": subgraph_edges
        }


def get_graph_service() -> GraphService:
    return GraphService.get_instance()
