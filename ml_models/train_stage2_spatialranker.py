"""
Stage 2 Spatial Engine Training: H3 Resolution 8 Candidate Cell Ranker
Uses LightGBM Ranker (LambdaMART) with 1:9 negative sampling per cashout event.
"""

import os
import random
import joblib
import numpy as np
import pandas as pd
import h3
from lightgbm import LGBMRanker
from sklearn.metrics import ndcg_score

from features.spatial_indexer import SpatialEnricher

def train_stage2_ranker():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data_generator")
    artifacts_dir = os.path.join(base_dir, "ml_models", "artifacts")
    os.makedirs(artifacts_dir, exist_ok=True)

    print("=" * 70)
    print("  STAGE 2 TRAINING: H3 RES-8 SPATIAL RANKER (LAMBDAMART)")
    print("=" * 70)

    # 1. Load Ground Truth Cashouts and Terminals
    df_cashouts = pd.read_parquet(os.path.join(data_dir, "ground_truth_cashouts.parquet"))
    df_mules = pd.read_parquet(os.path.join(data_dir, "mule_accounts.parquet"))
    spatial_enricher = SpatialEnricher(terminals_path=os.path.join(data_dir, "terminals.parquet"))

    mule_coords = {
        row["account_number"]: (float(row["branch_lat"]), float(row["branch_lon"]))
        for _, row in df_mules.iterrows()
    }

    # Distinct active H3 resolution 8 cells in Delhi-NCR
    all_term_h3 = set(spatial_enricher.terminals_df["h3_res8"].unique())

    ranking_rows = []
    groups = []

    print(f"[*] Building candidate ranking groups with 1:9 negative sampling for {len(df_cashouts)} cashout events...")

    for _, co in df_cashouts.iterrows():
        gt_cell = co["ground_truth_h3_res8"]
        mule_acc = co["mule_account"]

        if mule_acc in mule_coords:
            m_lat, m_lon = mule_coords[mule_acc]
        else:
            m_lat, m_lon = h3.cell_to_latlng(gt_cell)

        center_h3 = h3.latlng_to_cell(m_lat, m_lon, 8)

        # Generate reachable neighbors (k-ring 1 to 5)
        local_neighbors = list(h3.grid_disk(center_h3, 5))
        negative_pool = [c for c in local_neighbors if c != gt_cell and c in all_term_h3]

        if len(negative_pool) < 9:
            # Fallback to random terminal cells if local neighborhood is sparse
            extra = [c for c in all_term_h3 if c != gt_cell and c not in negative_pool]
            negative_pool.extend(random.sample(extra, min(9 - len(negative_pool), len(extra))))

        if len(negative_pool) < 9:
            continue

        selected_negatives = random.sample(negative_pool, 9)

        # 1 Positive Target (Rank label 1)
        candidates = [(gt_cell, 1)] + [(neg, 0) for neg in selected_negatives]
        # Shuffle candidates so ranker does not memorize position
        random.shuffle(candidates)

        group_size = 0
        for cell, label in candidates:
            stats = spatial_enricher.get_h3_spatial_features(cell)
            try:
                h3_dist = h3.grid_distance(center_h3, cell)
            except Exception:
                h3_dist = 5

            # Features aligned with part 3B inference row 65-72:
            # [atm_density, avg_liquidity, min_distance_to_highway, min_distance_to_police, cctv_coverage_ratio, h3_distance]
            ranking_rows.append({
                "complaint_id": co["complaint_id"],
                "cell_h3": cell,
                "label": label,
                "atm_density": stats["atm_density"],
                "avg_liquidity": stats["avg_liquidity"],
                "min_distance_to_highway": stats["min_distance_to_highway"],
                "min_distance_to_police": stats["min_distance_to_police"],
                "cctv_coverage_ratio": stats["cctv_coverage_ratio"],
                "h3_distance": h3_dist
            })
            group_size += 1

        groups.append(group_size)

    df_rank = pd.DataFrame(ranking_rows)
    feature_cols = [
        "atm_density",
        "avg_liquidity",
        "min_distance_to_highway",
        "min_distance_to_police",
        "cctv_coverage_ratio",
        "h3_distance"
    ]

    X = df_rank[feature_cols].values
    y = df_rank["label"].values

    # Train/Validation Group Split (80% queries for train, 20% queries for validation)
    n_queries = len(groups)
    n_train_queries = int(n_queries * 0.8)

    train_groups = groups[:n_train_queries]
    val_groups = groups[n_train_queries:]

    n_train_samples = sum(train_groups)
    X_train, y_train = X[:n_train_samples], y[:n_train_samples]
    X_val, y_val = X[n_train_samples:], y[n_train_samples:]

    print(f"[*] Training LGBMRanker on {len(train_groups)} query groups ({X_train.shape[0]} candidate instances)...")
    ranker = LGBMRanker(
        objective="lambdarank",
        n_estimators=160,
        learning_rate=0.05,
        num_leaves=31,
        subsample=0.85,
        random_state=42,
        verbosity=-1
    )
    ranker.fit(
        X_train,
        y_train,
        group=train_groups,
        eval_set=[(X_val, y_val)],
        eval_group=[val_groups]
    )

    # Evaluation Metrics: NDCG@3, Top-1 Accuracy, Top-3 Spatial Recall
    val_scores = ranker.predict(X_val)

    ndcg_list = []
    top1_hits = 0
    top3_hits = 0
    total_val_queries = len(val_groups)

    ptr = 0
    for g_len in val_groups:
        q_scores = val_scores[ptr:ptr + g_len]
        q_labels = y_val[ptr:ptr + g_len]
        ptr += g_len

        # NDCG@3
        if np.sum(q_labels) > 0:
            ndcg = ndcg_score([q_labels], [q_scores], k=3)
            ndcg_list.append(ndcg)

            # Top-1 Accuracy
            ranked_indices = np.argsort(q_scores)[::-1]
            if q_labels[ranked_indices[0]] == 1:
                top1_hits += 1
            # Top-3 Spatial Recall
            if any(q_labels[idx] == 1 for idx in ranked_indices[:3]):
                top3_hits += 1

    mean_ndcg3 = np.mean(ndcg_list) if ndcg_list else 0.0
    top1_acc = (top1_hits / total_val_queries) * 100.0 if total_val_queries else 0.0
    top3_recall = (top3_hits / total_val_queries) * 100.0 if total_val_queries else 0.0

    print(f"\n[+] Validation Metrics:")
    print(f"    - NDCG@3 Score      : {mean_ndcg3:.4f}")
    print(f"    - Top-1 Accuracy    : {top1_acc:.2f}%")
    print(f"    - Top-3 Spatial Recall: {top3_recall:.2f}%")

    # Save Model Artifact
    ranker_path = os.path.join(artifacts_dir, "stage2_ranker.joblib")
    joblib.dump(ranker, ranker_path)
    print(f"\n[SUCCESS] Stage 2 Ranker saved to: {ranker_path}")

    return ranker

if __name__ == "__main__":
    train_stage2_ranker()
