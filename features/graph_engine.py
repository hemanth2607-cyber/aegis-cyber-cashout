"""
Core Graph Analytics & Mule Velocity Engine
Aligned with Indian Cybercrime Ecosystem (NCRP / CFCFRMS)
"""
from dataclasses import dataclass, asdict
from typing import Dict, List, Any, Optional, Union
import math
import numpy as np
import networkx as nx
import polars as pl
import pandas as pd


@dataclass
class PathVelocityMetrics:
    hop_count: int
    fan_out_ratio: float
    peeling_ratio: float
    cumulative_latency_sec: float
    velocity_decay: float
    terminating_mules: List[str]


class CybercrimeGraphEngine:
    def __init__(self, half_life_decay: float = 0.05, dispersion_gamma: float = 0.5):
        self.half_life_decay = half_life_decay
        self.dispersion_gamma = dispersion_gamma
        self.graph = nx.MultiDiGraph()

    def add_transaction(
        self,
        utr: str,
        sender: str,
        receiver: str,
        amount: float,
        timestamp_sec: float,
        channel: str
    ) -> None:
        """Appends an immutable financial transaction edge into the temporal graph."""
        self.graph.add_node(sender, node_type="ACCOUNT")
        self.graph.add_node(receiver, node_type="ACCOUNT")
        self.graph.add_edge(
            sender,
            receiver,
            key=utr,
            amount=float(amount),
            timestamp=float(timestamp_sec),
            channel=channel
        )

    def build_graph_from_transactions(
        self,
        transactions_df: Union[pl.DataFrame, pd.DataFrame]
    ) -> nx.MultiDiGraph:
        """
        Constructs a directed multigraph from a Polars (or Pandas) DataFrame.
        Each row is ingested as an edge with amount, timestamp, channel, and utr.
        """
        if isinstance(transactions_df, pl.DataFrame):
            # Fast iteration over Polars DataFrame
            for row in transactions_df.iter_rows(named=True):
                utr = str(row.get("utr", ""))
                sender = str(row.get("sender_account", ""))
                receiver = str(row.get("receiver_account", ""))
                amount = float(row.get("amount", 0.0))
                
                # Parse timestamp to unix seconds if string/datetime
                ts_val = row.get("timestamp")
                if isinstance(ts_val, (int, float)):
                    ts_sec = float(ts_val)
                elif hasattr(ts_val, "timestamp"):
                    ts_sec = float(ts_val.timestamp())
                else:
                    try:
                        ts_sec = float(pd.to_datetime(ts_val).timestamp())
                    except Exception:
                        ts_sec = 0.0

                channel = str(row.get("payment_mode", "UPI"))
                self.add_transaction(utr, sender, receiver, amount, ts_sec, channel)
        else:
            for _, row in transactions_df.iterrows():
                utr = str(row["utr"])
                sender = str(row["sender_account"])
                receiver = str(row["receiver_account"])
                amount = float(row["amount"])
                ts_val = row["timestamp"]
                ts_sec = float(ts_val.timestamp()) if hasattr(ts_val, "timestamp") else float(pd.to_datetime(ts_val).timestamp())
                channel = str(row.get("payment_mode", "UPI"))
                self.add_transaction(utr, sender, receiver, amount, ts_sec, channel)

        return self.graph

    def extract_mule_trajectory(
        self,
        root_account: str,
        max_depth: int = 4
    ) -> PathVelocityMetrics:
        """
        Traverses downstream cash transfers from root complaint account.
        Computes formal velocity decay V_k and peeling dispersion.
        """
        if root_account not in self.graph:
            return PathVelocityMetrics(
                hop_count=0,
                fan_out_ratio=0.0,
                peeling_ratio=0.0,
                cumulative_latency_sec=0.0,
                velocity_decay=0.0,
                terminating_mules=[]
            )

        # BFS Traversal to track downstream layers
        visited = {root_account: 0}
        queue = [(root_account, 0, 0.0)]  # (node, current_depth, entry_timestamp)
        terminating_nodes = []
        path_amounts = []
        path_latencies = []
        total_out_edges = 0
        total_in_edges = 0

        while queue:
            curr_node, depth, last_time = queue.pop(0)

            out_edges = list(self.graph.out_edges(curr_node, data=True))
            in_edges = list(self.graph.in_edges(curr_node, data=True))
            
            total_out_edges += len(out_edges)
            total_in_edges += len(in_edges)

            if not out_edges and depth > 0:
                terminating_nodes.append(curr_node)

            if depth < max_depth:
                for _, nxt_node, data in out_edges:
                    edge_time = data.get("timestamp", last_time)
                    edge_amt = data.get("amount", 0.0)
                    
                    path_amounts.append(edge_amt)
                    if last_time > 0:
                        path_latencies.append(max(0.0, edge_time - last_time))

                    if nxt_node not in visited:
                        visited[nxt_node] = depth + 1
                        queue.append((nxt_node, depth + 1, edge_time))

        # Calculate mathematical formulation components
        hop_count = max(visited.values()) if visited else 0
        fan_out = total_out_edges / max(1, total_in_edges)

        # Peeling ratio (variance of amounts along the chain)
        peeling_ratio = float(np.std(path_amounts) / (np.mean(path_amounts) + 1e-5)) if path_amounts else 0.0
        cumulative_latency = float(sum(path_latencies))

        # Formal Velocity Decay:
        # V_k = Prod(A_i / A_{i-1}) * exp(- sum(lambda * delta_t)) * [1 - tanh(gamma * (Out / In))]
        decay_exp = math.exp(-self.half_life_decay * (cumulative_latency / 3600.0))  # Latency in hours
        retention_ratio = min(1.0, (path_amounts[-1] / (path_amounts[0] + 1e-5))) if len(path_amounts) >= 2 else 1.0
        dispersion_penalty = 1.0 - math.tanh(self.dispersion_gamma * fan_out)
        
        velocity_decay = float(retention_ratio * decay_exp * dispersion_penalty)

        return PathVelocityMetrics(
            hop_count=hop_count,
            fan_out_ratio=float(fan_out),
            peeling_ratio=peeling_ratio,
            cumulative_latency_sec=cumulative_latency,
            velocity_decay=max(0.0, velocity_decay),
            terminating_mules=terminating_nodes if terminating_nodes else [root_account]
        )

    def extract_mule_subgraph(
        self,
        complaint_id: str,
        entry_account: str,
        max_hops: int = 4
    ) -> dict:
        """
        Convenience wrapper returning dictionary structure aligned with pipeline specs:
        hop_count, fan_out_ratio, peeling_ratio, cumulative_latency_sec,
        transaction_velocity_decay, and leaf_nodes.
        """
        metrics = self.extract_mule_trajectory(entry_account, max_depth=max_hops)
        return {
            "complaint_id": complaint_id,
            "entry_account": entry_account,
            "hop_count": metrics.hop_count,
            "fan_out_ratio": metrics.fan_out_ratio,
            "peeling_ratio": metrics.peeling_ratio,
            "cumulative_latency_sec": metrics.cumulative_latency_sec,
            "transaction_velocity_decay": metrics.velocity_decay,
            "leaf_nodes": metrics.terminating_mules
        }


def compute_mule_runner_utility(
    runner_coord: tuple[float, float],
    atm_coord: tuple[float, float],
    atm_liquidity: float,
    withdrawal_target: float,
    dist_highway_meters: float,
    dist_police_meters: float,
    has_cctv: bool,
    is_onsite: bool,
    nearby_atm_count: int,
    weights: Optional[Dict[str, float]] = None
) -> float:
    """
    Evaluates candidate cashout terminal attractiveness for an extraction runner:
    U_m(a) = w1*Psi_dist + w2*Psi_liq + w3*Psi_corridor - w4*Psi_police - w5*Psi_surv + w6*Psi_dens
    """
    if weights is None:
        weights = {
            "w_dist": 0.25,
            "w_liq": 0.20,
            "w_corridor": 0.15,
            "w_police": 0.20,
            "w_surv": 0.10,
            "w_dens": 0.10
        }

    # 1. Distance Attenuation (Haversine approx in km)
    d_lat = math.radians(atm_coord[0] - runner_coord[0])
    d_lon = math.radians(atm_coord[1] - runner_coord[1])
    a_hav = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(runner_coord[0]))
        * math.cos(math.radians(atm_coord[0]))
        * math.sin(d_lon / 2) ** 2
    )
    dist_km = 6371.0 * 2 * math.atan2(math.sqrt(a_hav), math.sqrt(1 - a_hav))
    sigma_d = 5.0  # 5 km standard runner operational range
    psi_dist = math.exp(-(dist_km ** 2) / (2 * (sigma_d ** 2)))

    # 2. Liquidity Attractiveness (Logistic curve centered on target amount)
    kappa = 2.0
    liquidity_ratio = atm_liquidity / (withdrawal_target + 1e-5)
    psi_liq = 1.0 / (1.0 + math.exp(-kappa * (liquidity_ratio - 1.0)))

    # 3. Transit Escape Corridor Proximity
    delta_h = 1000.0  # 1 km critical highway access threshold
    psi_corridor = math.exp(-dist_highway_meters / delta_h)

    # 4. Police Buffer Penalty
    r_patrol = 2000.0  # 2 km beat patrol buffer
    psi_police = 1.0 / (1.0 + (dist_police_meters / r_patrol) ** 2)

    # 5. Surveillance Friction
    cctv_val = 1.0 if has_cctv else 0.2
    onsite_val = 1.0 if is_onsite else 0.3
    psi_surv = cctv_val * onsite_val

    # 6. ATM Density Clustering
    psi_dens = math.log1p(nearby_atm_count) / math.log1p(15)  # Normalized to max 15 nearby

    # Weighted Utility
    utility = (
        weights["w_dist"] * psi_dist
        + weights["w_liq"] * psi_liq
        + weights["w_corridor"] * psi_corridor
        - weights["w_police"] * psi_police
        - weights["w_surv"] * psi_surv
        + weights["w_dens"] * psi_dens
    )
    return float(utility)
