"""
Stage 1 Predictive Engine Training: Cashout Horizon & Terminating Hop
Uses LightGBM (L1 / Huber loss) for continuous ETA regression and binary hop classification.
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, f1_score
from lightgbm import LGBMRegressor, LGBMClassifier

from features.pipeline import TacticalFeaturePipeline

def train_stage1_models():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data_generator")
    artifacts_dir = os.path.join(base_dir, "ml_models", "artifacts")
    os.makedirs(artifacts_dir, exist_ok=True)

    print("=" * 70)
    print("  STAGE 1 TRAINING: TIMETO-CASHOUT REGRESSION & HOP CLASSIFICATION")
    print("=" * 70)

    # 1. Load Ground Truth Datasets
    print("[*] Loading synthetic complaints, transactions, and ground truth cashouts...")
    df_complaints = pd.read_parquet(os.path.join(data_dir, "complaints.parquet"))
    df_cashouts = pd.read_parquet(os.path.join(data_dir, "ground_truth_cashouts.parquet"))
    df_txs = pd.read_parquet(os.path.join(data_dir, "transactions.parquet"))
    df_mules = pd.read_parquet(os.path.join(data_dir, "mule_accounts.parquet"))

    # Compute ground truth cashout delay in minutes from leaf hop to cashout extraction
    df_txs["tx_time"] = pd.to_datetime(df_txs["timestamp"])
    last_tx_per_mule = df_txs.groupby("receiver_account")["tx_time"].max().reset_index()
    last_tx_per_mule.columns = ["mule_account", "last_hop_time"]

    df_comp_co = pd.merge(
        df_complaints,
        df_cashouts[["complaint_id", "cashout_timestamp", "terminal_id", "mule_account"]],
        on="complaint_id"
    )
    df_comp_co = pd.merge(df_comp_co, last_tx_per_mule, on="mule_account", how="left")

    df_comp_co["c_time"] = pd.to_datetime(df_comp_co["complaint_timestamp"])
    df_comp_co["co_time"] = pd.to_datetime(df_comp_co["cashout_timestamp"])
    
    # Fallback to complaint timestamp if last_hop_time is missing
    df_comp_co["last_hop_time"] = df_comp_co["last_hop_time"].fillna(df_comp_co["c_time"])
    
    # Time to cashout from last observed hop in minutes (extraction window Delta t)
    df_comp_co["actual_delay_minutes"] = (df_comp_co["co_time"] - df_comp_co["last_hop_time"]).dt.total_seconds() / 60.0
    # Bound to realistic 5 to 90 min window
    df_comp_co["actual_delay_minutes"] = df_comp_co["actual_delay_minutes"].clip(lower=6.0, upper=90.0)

    # Extract graph features using TacticalFeaturePipeline
    pipeline = TacticalFeaturePipeline(terminals_path=os.path.join(data_dir, "terminals.parquet"))
    pl_matrix = pipeline.process_batch(
        os.path.join(data_dir, "complaints.parquet"),
        os.path.join(data_dir, "transactions.parquet"),
        os.path.join(data_dir, "mule_accounts.parquet")
    )
    df_features = pl_matrix.to_pandas()

    # Merge features with targets
    df_merged = pd.merge(df_features, df_comp_co[["complaint_id", "actual_delay_minutes", "c_time"]], on="complaint_id")

    # Add temporal features
    df_merged["hour_of_day"] = df_merged["c_time"].dt.hour
    df_merged["day_of_week"] = df_merged["c_time"].dt.dayofweek

    # Feature columns aligned with part 3B inference expectations:
    # [initial_amount, hop_count, fan_out_ratio, peeling_ratio, velocity_decay, cumulative_latency_sec]
    feature_cols = [
        "initial_amount",
        "current_depth",
        "fan_out_ratio",
        "peeling_ratio",
        "velocity_decay",
        "elapsed_time_sec"
    ]

    X = df_merged[feature_cols].values
    y_reg = df_merged["actual_delay_minutes"].values
    # Binary classification target: whether hop >= 3 (terminating cashout tier)
    y_cls = (df_merged["current_depth"] >= 3).astype(int).values

    X_train, X_val, y_reg_train, y_reg_val, y_cls_train, y_cls_val = train_test_split(
        X, y_reg, y_cls, test_size=0.2, random_state=42
    )

    # 2. Train Stage 1 LightGBM Regressor (Huber/L1 Loss)
    print("\n[*] Training Stage 1 LightGBM Regressor (MAE Objective)...")
    regressor = LGBMRegressor(
        objective="regression_l1",
        n_estimators=180,
        learning_rate=0.04,
        max_depth=5,
        num_leaves=31,
        subsample=0.85,
        random_state=42,
        verbosity=-1
    )
    regressor.fit(X_train, y_reg_train)

    y_reg_pred = regressor.predict(X_val)
    mae = mean_absolute_error(y_reg_val, y_reg_pred)
    rmse = np.sqrt(mean_squared_error(y_reg_val, y_reg_pred))

    print(f"[+] Stage 1 Regressor Validation MAE : {mae:.2f} minutes")
    print(f"[+] Stage 1 Regressor Validation RMSE: {rmse:.2f} minutes")
    assert mae < 15.0, f"MAE threshold failure! Expected < 15.0 mins, got {mae:.2f}"

    # 3. Train Stage 1 LightGBM Binary Hop Classifier
    print("\n[*] Training Stage 1 LightGBM Classifier (Terminating Hop)...")
    classifier = LGBMClassifier(
        objective="binary",
        n_estimators=120,
        learning_rate=0.05,
        max_depth=4,
        random_state=42,
        verbosity=-1
    )
    classifier.fit(X_train, y_cls_train)

    y_cls_pred = classifier.predict(X_val)
    f1 = f1_score(y_cls_val, y_cls_pred, zero_division=0)
    print(f"[+] Stage 1 Classifier Validation F1-Score: {f1:.4f}")

    # 4. Save Model Artifacts
    reg_path = os.path.join(artifacts_dir, "stage1_regressor.joblib")
    cls_path = os.path.join(artifacts_dir, "stage1_classifier.joblib")
    joblib.dump(regressor, reg_path)
    joblib.dump(classifier, cls_path)

    print(f"\n[SUCCESS] Artifacts saved:")
    print(f"    - {reg_path}")
    print(f"    - {cls_path}")

    return regressor, classifier

if __name__ == "__main__":
    train_stage1_models()
