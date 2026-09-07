"""
Enterprise-Grade Synthetic Data Generation Engine: Cybercrime Ecosystem
Simulates I4C, 1930 NCRP, CFCFRMS, and Bank CBS/ATM switches mapped to Delhi-NCR.
"""

import os
import math
import random
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from faker import Faker
import h3

from data_generator.config import (
    LAT_MIN, LAT_MAX, LON_MIN, LON_MAX,
    BANKS, BANK_IFSC_MAP, FRAUD_CATEGORIES,
    TERMINAL_TYPES, PAYMENT_MODES, KYC_RISK_LEVELS,
    HIGHWAY_CORRIDORS
)

class CybercrimeDataSimulator:
    """
    Deterministic, reproducible synthetic data generator simulating the Indian
    Cybercrime Ecosystem, banking topologies, and physical cashout points.
    """
    def __init__(self, seed: int = 42, output_dir: str = None):
        self.seed = seed
        random.seed(seed)
        np.random.seed(seed)
        self.fake = Faker("en_IN")
        self.fake.seed_instance(seed)

        if output_dir is None:
            output_dir = os.path.dirname(os.path.abspath(__file__))
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

        self.complaints = []
        self.mule_accounts = []
        self.transactions = []
        self.terminals = []
        self.ground_truth_cashouts = []

    def _random_coords(self) -> tuple:
        lat = round(float(np.random.uniform(LAT_MIN, LAT_MAX)), 6)
        lon = round(float(np.random.uniform(LON_MIN, LON_MAX)), 6)
        return lat, lon

    def _dist_point_to_segment_km(self, p_lat, p_lon, a_lat, a_lon, b_lat, b_lon) -> float:
        """Haversine distance approximation from point P to line segment AB"""
        # Projected distance in km
        dx = (b_lon - a_lon) * 111.0 * math.cos(math.radians((a_lat + b_lat) / 2))
        dy = (b_lat - a_lat) * 111.0
        seg_len_sq = dx * dx + dy * dy
        if seg_len_sq == 0:
            return math.sqrt(((p_lat - a_lat) * 111.0)**2 + ((p_lon - a_lon) * 111.0 * math.cos(math.radians(p_lat)))**2)

        px = (p_lon - a_lon) * 111.0 * math.cos(math.radians(p_lat))
        py = (p_lat - a_lat) * 111.0

        t = max(0.0, min(1.0, (px * dx + py * dy) / seg_len_sq))
        proj_x = a_lon + t * (b_lon - a_lon)
        proj_y = a_lat + t * (b_lat - a_lat)

        dist_km = math.sqrt(((p_lat - proj_y) * 111.0)**2 + ((p_lon - proj_x) * 111.0 * math.cos(math.radians(p_lat)))**2)
        return dist_km

    def _is_near_highway(self, lat: float, lon: float, threshold_km: float = 0.5) -> bool:
        """Determines if coordinate is within 500m of designated major Delhi-NCR highway corridors"""
        for corridor in HIGHWAY_CORRIDORS:
            dist = self._dist_point_to_segment_km(
                lat, lon,
                corridor["lat_start"], corridor["lon_start"],
                corridor["lat_end"], corridor["lon_end"]
            )
            if dist <= threshold_km:
                return True
        return False

    def _generate_utr(self, dt: datetime) -> str:
        """Generates realistic Indian banking UTR (12-16 alphanumeric chars)"""
        prefix = dt.strftime("%y%j")
        suffix = "".join(random.choices("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", k=8))
        return f"UTR{prefix}{suffix}"

    # -------------------------------------------------------------
    # 1. Terminals Generation
    # -------------------------------------------------------------
    def generate_terminals(self, count: int = 1500) -> pd.DataFrame:
        print(f"[*] Generating {count} ATM & CSP terminals across Delhi-NCR...")
        terminals = []

        for i in range(1, count + 1):
            terminal_id = f"ATM-DL-{10000 + i}"
            bank = random.choice(BANKS)
            t_type = random.choices(
                TERMINAL_TYPES,
                weights=[45, 30, 15, 10]
            )[0]

            # Bias 25% of terminals near highway corridors for escape routing simulation
            if random.random() < 0.25:
                corr = random.choice(HIGHWAY_CORRIDORS)
                t = random.random()
                base_lat = corr["lat_start"] + t * (corr["lat_end"] - corr["lat_start"])
                base_lon = corr["lon_start"] + t * (corr["lon_end"] - corr["lon_start"])
                # Jitter within 300m
                lat = round(base_lat + float(np.random.uniform(-0.0025, 0.0025)), 6)
                lon = round(base_lon + float(np.random.uniform(-0.0025, 0.0025)), 6)
            else:
                lat, lon = self._random_coords()

            # Ensure coordinates are within bounds
            lat = max(LAT_MIN, min(LAT_MAX, lat))
            lon = max(LON_MIN, min(LON_MAX, lon))

            is_highway = self._is_near_highway(lat, lon, threshold_km=0.5)

            # Edge Case: Evasive Escape Routing (near highway with disabled CCTV/no guard)
            if is_highway and random.random() < 0.40:
                cctv_active = False
            else:
                cctv_active = random.choices([True, False], weights=[85, 15])[0]

            dispense_limit = random.choice([200000.0, 500000.0, 1000000.0, 1500000.0])
            current_liquidity = round(float(np.random.uniform(50000.0, dispense_limit)), 2)

            h3_res8 = h3.latlng_to_cell(lat, lon, 8)
            h3_res9 = h3.latlng_to_cell(lat, lon, 9)

            terminals.append({
                "terminal_id": terminal_id,
                "terminal_type": t_type,
                "bank_name": bank,
                "lat": lat,
                "lon": lon,
                "h3_res8": h3_res8,
                "h3_res9": h3_res9,
                "cash_dispense_limit": dispense_limit,
                "current_cash_liquidity": current_liquidity,
                "cctv_active": cctv_active,
                "is_near_highway": is_highway
            })

        self.terminals = terminals
        df = pd.DataFrame(terminals)
        df.to_parquet(os.path.join(self.output_dir, "terminals.parquet"), index=False)
        print(f"[+] Saved terminals.parquet: {len(df)} records.")
        return df

    # -------------------------------------------------------------
    # 2. Mule Accounts Generation
    # -------------------------------------------------------------
    def generate_mule_accounts(self, target_count: int = 2600) -> pd.DataFrame:
        print(f"[*] Generating {target_count} multi-layer mule accounts...")
        accounts = []
        account_seq = 1000000000

        # Distribution: L1 (25%), L2 (42%), L3 (23%), L4 (10%)
        layer_weights = [0.25, 0.42, 0.23, 0.10]
        layer_counts = [int(target_count * w) for w in layer_weights]
        # Adjust remainder
        layer_counts[1] += target_count - sum(layer_counts)

        account_idx = 1
        for layer_num, count in enumerate(layer_counts, start=1):
            for _ in range(count):
                account_seq += 1
                bank = random.choice(BANKS)
                ifsc_prefix = BANK_IFSC_MAP[bank]
                ifsc_code = f"{ifsc_prefix}0{random.randint(100000, 999999)}"
                acc_no = f"{random.randint(1000, 9999)}{account_seq}"
                
                holder_name = self.fake.name()
                phone = f"9{random.randint(100000000, 999999999)}"

                # Higher layers tend to have higher KYC risk
                if layer_num in [3, 4]:
                    kyc_risk = random.choices(KYC_RISK_LEVELS, weights=[10, 30, 60])[0]
                    is_dormant = random.choices([True, False], weights=[65, 35])[0]
                elif layer_num == 2:
                    kyc_risk = random.choices(KYC_RISK_LEVELS, weights=[20, 50, 30])[0]
                    is_dormant = random.choices([True, False], weights=[40, 60])[0]
                else:
                    kyc_risk = random.choices(KYC_RISK_LEVELS, weights=[40, 40, 20])[0]
                    is_dormant = random.choices([True, False], weights=[25, 75])[0]

                lat, lon = self._random_coords()

                accounts.append({
                    "account_number": acc_no,
                    "ifsc_code": ifsc_code,
                    "bank_name": bank,
                    "account_layer": layer_num,
                    "holder_name": holder_name,
                    "holder_phone": phone,
                    "kyc_risk_level": kyc_risk,
                    "branch_lat": lat,
                    "branch_lon": lon,
                    "is_dormant_reactivated": is_dormant
                })
                account_idx += 1

        self.mule_accounts = accounts
        df = pd.DataFrame(accounts)
        df.to_parquet(os.path.join(self.output_dir, "mule_accounts.parquet"), index=False)
        print(f"[+] Saved mule_accounts.parquet: {len(df)} records.")
        return df

    # -------------------------------------------------------------
    # 3. Complaints, Transactions & Ground Truth Cashouts
    # -------------------------------------------------------------
    def generate_complaints_and_flows(self, complaint_count: int = 550):
        print(f"[*] Generating {complaint_count} complaints with multi-hop laundering topologies...")

        # Organize mules by layer for fast topological lookups
        mules_by_layer = {1: [], 2: [], 3: [], 4: []}
        for m in self.mule_accounts:
            mules_by_layer[m["account_layer"]].append(m)

        complaints = []
        transactions = []
        cashouts = []

        now = datetime.now()
        base_time = now - timedelta(days=28)
        cashout_seq = 50000

        for c_idx in range(1, complaint_count + 1):
            complaint_id = f"NCRP-2026-{10000 + c_idx}"
            victim_id = f"VIC-{c_idx:05d}"
            victim_bank = random.choice(BANKS)
            victim_acc = f"VICACC{random.randint(1000000000, 9999999999)}"
            vic_lat, vic_lon = self._random_coords()
            fraud_cat = random.choice(FRAUD_CATEGORIES)

            # Amount: 50,000 to 5,000,000 INR
            initial_amount = round(float(np.random.uniform(50000.0, 5000000.0)), 2)
            c_timestamp = base_time + timedelta(
                days=random.uniform(0, 27),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            initial_utr = self._generate_utr(c_timestamp)

            complaints.append({
                "complaint_id": complaint_id,
                "victim_id": victim_id,
                "victim_account_no": victim_acc,
                "victim_bank": victim_bank,
                "victim_lat": vic_lat,
                "victim_lon": vic_lon,
                "fraud_category": fraud_cat,
                "initial_amount": initial_amount,
                "complaint_timestamp": c_timestamp,
                "initial_utr": initial_utr
            })

            # Edge Case Flags:
            # 1. "Fast Track Bot": < 8 minutes total hop progression
            is_fast_track = (c_idx % 7 == 0)
            # 2. "Rapid Peeling": under-reporting threshold transfers (9,000 to 49,500 INR)
            is_rapid_peel = (c_idx % 5 == 0)
            # 3. "Evasive Escape Routing": near highway corridor
            is_evasive = (c_idx % 6 == 0)

            # --- Layer 1 Hop (100% of complaints hit 1-2 accounts within 5-15 mins, or <3 mins if fast-track) ---
            l1_targets = random.sample(mules_by_layer[1], k=random.choice([1, 2]))
            l1_delay = random.uniform(1.0, 3.0) if is_fast_track else random.uniform(5.0, 15.0)
            l1_time = c_timestamp + timedelta(minutes=l1_delay)

            split_ratios = [1.0] if len(l1_targets) == 1 else [0.6, 0.4]
            current_layer_balances = []

            for target_mule, ratio in zip(l1_targets, split_ratios):
                amt = round(initial_amount * ratio, 2)
                utr = self._generate_utr(l1_time)
                transactions.append({
                    "utr": utr,
                    "sender_account": victim_acc,
                    "receiver_account": target_mule["account_number"],
                    "amount": amt,
                    "timestamp": l1_time,
                    "payment_mode": random.choice(["UPI", "IMPS"]),
                    "status": "SUCCESS"
                })
                current_layer_balances.append((target_mule, amt, l1_time))

            # --- Layer 2 Peeling Chains (80% of funds split into 2-5 accounts within 10-30 mins) ---
            l2_balances = []
            for l1_mule, l1_amt, l1_tx_time in current_layer_balances:
                l2_count = random.randint(3, 5)
                l2_targets = random.sample(mules_by_layer[2], k=l2_count)

                l2_delay = random.uniform(1.5, 3.5) if is_fast_track else random.uniform(10.0, 30.0)
                l2_time = l1_tx_time + timedelta(minutes=l2_delay)

                raw_shares = np.random.dirichlet(np.ones(l2_count))
                peel_pool = l1_amt * 0.85 # 85% peeled to L2, remainder parked/fee

                for target_mule, share in zip(l2_targets, raw_shares):
                    amt = round(peel_pool * share, 2)

                    # Edge Case: Rapid Peeling (structured between 9,000 and 49,500 INR)
                    if is_rapid_peel and amt > 50000.0:
                        amt = round(float(np.random.uniform(9000.0, 49500.0)), 2)

                    utr = self._generate_utr(l2_time)
                    transactions.append({
                        "utr": utr,
                        "sender_account": l1_mule["account_number"],
                        "receiver_account": target_mule["account_number"],
                        "amount": amt,
                        "timestamp": l2_time,
                        "payment_mode": random.choice(["IMPS", "UPI", "NEFT"]),
                        "status": "SUCCESS"
                    })
                    l2_balances.append((target_mule, amt, l2_time))

            # --- Layer 3 Re-Aggregation (Debit Card / ATM Ready Mules) ---
            l3_balances = []
            # Aggregate L2 balances into 2-3 Layer 3 accounts
            l3_count = min(len(l2_balances), random.choice([2, 3]))
            l3_targets = random.sample(mules_by_layer[3], k=l3_count)

            l3_delay = random.uniform(1.0, 2.5) if is_fast_track else random.uniform(8.0, 25.0)

            # Group L2 funds towards L3 targets
            for idx, (l2_mule, l2_amt, l2_tx_time) in enumerate(l2_balances):
                chosen_l3 = l3_targets[idx % len(l3_targets)]
                l3_time = l2_tx_time + timedelta(minutes=l3_delay)

                amt = round(l2_amt * 0.95, 2)
                utr = self._generate_utr(l3_time)
                transactions.append({
                    "utr": utr,
                    "sender_account": l2_mule["account_number"],
                    "receiver_account": chosen_l3["account_number"],
                    "amount": amt,
                    "timestamp": l3_time,
                    "payment_mode": random.choice(["IMPS", "RTGS", "UPI"]),
                    "status": "SUCCESS"
                })
                l3_balances.append((chosen_l3, amt, l3_time))

            # Layer 4 Hop for 60% of incidents
            cashout_source_mules = []
            if random.random() < 0.60 and mules_by_layer[4]:
                l4_targets = random.sample(mules_by_layer[4], k=min(len(l3_balances), 3))
                l4_delay = random.uniform(1.0, 2.0) if is_fast_track else random.uniform(5.0, 15.0)

                for idx, (l3_mule, l3_amt, l3_tx_time) in enumerate(l3_balances):
                    chosen_l4 = l4_targets[idx % len(l4_targets)]
                    l4_time = l3_tx_time + timedelta(minutes=l4_delay)

                    amt = round(l3_amt * 0.96, 2)
                    utr = self._generate_utr(l4_time)
                    transactions.append({
                        "utr": utr,
                        "sender_account": l3_mule["account_number"],
                        "receiver_account": chosen_l4["account_number"],
                        "amount": amt,
                        "timestamp": l4_time,
                        "payment_mode": "IMPS",
                        "status": "SUCCESS"
                    })
                    cashout_source_mules.append((chosen_l4, amt, l4_time))
            else:
                cashout_source_mules = l3_balances

            # --- Physical Cashout Extraction at Terminal (within 15 to 90 mins) ---
            # Group cashout by unique terminating mule account
            unique_cashouts = {}
            for mule, amt, tx_time in cashout_source_mules:
                acc = mule["account_number"]
                if acc not in unique_cashouts:
                    unique_cashouts[acc] = {"mule": mule, "amount": 0.0, "time": tx_time}
                unique_cashouts[acc]["amount"] += amt
                unique_cashouts[acc]["time"] = max(unique_cashouts[acc]["time"], tx_time)

            for acc, c_info in unique_cashouts.items():
                cashout_seq += 1
                cashout_id = f"CSH-DL-{cashout_seq}"
                mule_obj = c_info["mule"]

                # Cashout delay: 15 to 90 mins (or 6 to 12 mins if fast track)
                co_delay = random.uniform(6.0, 12.0) if is_fast_track else random.uniform(15.0, 90.0)
                cashout_timestamp = c_info["time"] + timedelta(minutes=co_delay)

                # Terminal selection:
                # If evasive edge case, choose a terminal near highway without CCTV
                candidate_terminals = self.terminals
                if is_evasive:
                    evasive_candidates = [t for t in self.terminals if t["is_near_highway"] and not t["cctv_active"]]
                    if evasive_candidates:
                        candidate_terminals = evasive_candidates

                # Choose terminal close to mule branch location or geographic cluster
                m_lat, m_lon = mule_obj["branch_lat"], mule_obj["branch_lon"]
                def dist_to_mule(t):
                    return (t["lat"] - m_lat)**2 + (t["lon"] - m_lon)**2

                top_k = sorted(candidate_terminals, key=dist_to_mule)[:8]
                chosen_terminal = random.choice(top_k)

                withdrawn_amt = round(min(c_info["amount"], chosen_terminal["cash_dispense_limit"]), 2)

                cashouts.append({
                    "cashout_id": cashout_id,
                    "complaint_id": complaint_id,
                    "terminal_id": chosen_terminal["terminal_id"],
                    "mule_account": acc,
                    "amount_withdrawn": withdrawn_amt,
                    "cashout_timestamp": cashout_timestamp,
                    "ground_truth_h3_res8": chosen_terminal["h3_res8"],
                    "ground_truth_h3_res9": chosen_terminal["h3_res9"]
                })

        # Convert to DataFrames and save to parquet
        df_complaints = pd.DataFrame(complaints)
        df_transactions = pd.DataFrame(transactions)
        df_cashouts = pd.DataFrame(cashouts)

        df_complaints.to_parquet(os.path.join(self.output_dir, "complaints.parquet"), index=False)
        df_transactions.to_parquet(os.path.join(self.output_dir, "transactions.parquet"), index=False)
        df_cashouts.to_parquet(os.path.join(self.output_dir, "ground_truth_cashouts.parquet"), index=False)

        self.complaints = complaints
        self.transactions = transactions
        self.ground_truth_cashouts = cashouts

        print(f"[+] Saved complaints.parquet: {len(df_complaints)} records.")
        print(f"[+] Saved transactions.parquet: {len(df_transactions)} records.")
        print(f"[+] Saved ground_truth_cashouts.parquet: {len(df_cashouts)} records.")

        return df_complaints, df_transactions, df_cashouts

    def generate_all(self, complaint_count: int = 550, mule_count: int = 2600, terminal_count: int = 1500):
        """Execute full synthetic generation pipeline with verification"""
        print("=" * 70)
        print("  CYBERCRIME SYNTHETIC DATA GENERATOR (DELHI-NCR TOPOLOGY)")
        print("=" * 70)
        
        df_terminals = self.generate_terminals(count=terminal_count)
        df_mules = self.generate_mule_accounts(target_count=mule_count)
        df_complaints, df_transactions, df_cashouts = self.generate_complaints_and_flows(complaint_count=complaint_count)

        # -------------------------------------------------------------
        # Referential Integrity & Boundary Verification Assertions
        # -------------------------------------------------------------
        print("\n[*] Running Referential Integrity & Boundary Verification Assertions...")
        
        # 1. Coordinate ranges
        for df, name in [(df_terminals, "terminals"), (df_mules, "mule_accounts"), (df_complaints, "complaints")]:
            lat_col = "lat" if "lat" in df.columns else ("branch_lat" if "branch_lat" in df.columns else "victim_lat")
            lon_col = "lon" if "lon" in df.columns else ("branch_lon" if "branch_lon" in df.columns else "victim_lon")
            assert (df[lat_col] >= LAT_MIN).all() and (df[lat_col] <= LAT_MAX).all(), f"Latitude out of bounds in {name}"
            assert (df[lon_col] >= LON_MIN).all() and (df[lon_col] <= LON_MAX).all(), f"Longitude out of bounds in {name}"

        # 2. Referential integrity: Terminal IDs in cashouts
        terminal_ids = set(df_terminals["terminal_id"])
        cashout_terminals = set(df_cashouts["terminal_id"])
        assert cashout_terminals.issubset(terminal_ids), "Invalid terminal_id found in ground_truth_cashouts!"

        # 3. Referential integrity: Complaints in cashouts
        complaint_ids = set(df_complaints["complaint_id"])
        cashout_complaints = set(df_cashouts["complaint_id"])
        assert cashout_complaints.issubset(complaint_ids), "Invalid complaint_id found in ground_truth_cashouts!"

        # 4. Referential integrity: Mule accounts in cashouts
        mule_accounts = set(df_mules["account_number"])
        cashout_mules = set(df_cashouts["mule_account"])
        assert cashout_mules.issubset(mule_accounts), "Invalid mule_account found in ground_truth_cashouts!"

        # 5. Volume assertions
        assert len(df_complaints) >= 500, f"Expected >=500 complaints, got {len(df_complaints)}"
        assert len(df_mules) >= 2500, f"Expected >=2500 mule accounts, got {len(df_mules)}"
        assert len(df_transactions) >= 8000, f"Expected >=8000 transactions, got {len(df_transactions)}"
        assert len(df_terminals) >= 1500, f"Expected >=1500 terminals, got {len(df_terminals)}"

        print("[SUCCESS] ALL 5 VERIFICATION ASSERTIONS PASSED WITH 100% INTEGRITY!")
        print("=" * 70)


def main():
    simulator = CybercrimeDataSimulator(seed=42)
    simulator.generate_all(
        complaint_count=600,
        mule_count=2600,
        terminal_count=1500
    )

if __name__ == "__main__":
    main()
