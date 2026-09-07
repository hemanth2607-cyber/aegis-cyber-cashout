"""
Database Exporter Utility: Cybercrime Tactical Database
Loads Parquet datasets into SQLite (cybercrime_tactical.db) with primary/foreign keys,
spatial H3 indices, coordinate indices, and timestamps.
"""

import os
import sqlite3
import pandas as pd

def export_parquet_to_sqlite(data_dir: str = None, db_name: str = "cybercrime_tactical.db"):
    if data_dir is None:
        data_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(data_dir, db_name)

    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"[*] Removed existing database: {db_path}")

    print(f"[*] Initializing SQLite Database at: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON;")

    # 1. Create Terminals Table
    cursor.execute("""
    CREATE TABLE terminals (
        terminal_id TEXT PRIMARY KEY,
        terminal_type TEXT NOT NULL,
        bank_name TEXT NOT NULL,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        h3_res8 TEXT NOT NULL,
        h3_res9 TEXT NOT NULL,
        cash_dispense_limit REAL NOT NULL,
        current_cash_liquidity REAL NOT NULL,
        cctv_active INTEGER NOT NULL,
        is_near_highway INTEGER NOT NULL
    );
    """)

    # 2. Create Mule Accounts Table
    cursor.execute("""
    CREATE TABLE mule_accounts (
        account_number TEXT PRIMARY KEY,
        ifsc_code TEXT NOT NULL,
        bank_name TEXT NOT NULL,
        account_layer INTEGER NOT NULL,
        holder_name TEXT NOT NULL,
        holder_phone TEXT NOT NULL,
        kyc_risk_level TEXT NOT NULL,
        branch_lat REAL NOT NULL,
        branch_lon REAL NOT NULL,
        is_dormant_reactivated INTEGER NOT NULL
    );
    """)

    # 3. Create Complaints Table
    cursor.execute("""
    CREATE TABLE complaints (
        complaint_id TEXT PRIMARY KEY,
        victim_id TEXT NOT NULL,
        victim_account_no TEXT NOT NULL,
        victim_bank TEXT NOT NULL,
        victim_lat REAL NOT NULL,
        victim_lon REAL NOT NULL,
        fraud_category TEXT NOT NULL,
        initial_amount REAL NOT NULL,
        complaint_timestamp TEXT NOT NULL,
        initial_utr TEXT NOT NULL
    );
    """)

    # 4. Create Transactions Table
    cursor.execute("""
    CREATE TABLE transactions (
        utr TEXT PRIMARY KEY,
        sender_account TEXT NOT NULL,
        receiver_account TEXT NOT NULL,
        amount REAL NOT NULL,
        timestamp TEXT NOT NULL,
        payment_mode TEXT NOT NULL,
        status TEXT NOT NULL
    );
    """)

    # 5. Create Ground Truth Cashouts Table
    cursor.execute("""
    CREATE TABLE ground_truth_cashouts (
        cashout_id TEXT PRIMARY KEY,
        complaint_id TEXT NOT NULL,
        terminal_id TEXT NOT NULL,
        mule_account TEXT NOT NULL,
        amount_withdrawn REAL NOT NULL,
        cashout_timestamp TEXT NOT NULL,
        ground_truth_h3_res8 TEXT NOT NULL,
        ground_truth_h3_res9 TEXT NOT NULL,
        FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id) ON DELETE CASCADE,
        FOREIGN KEY (terminal_id) REFERENCES terminals(terminal_id) ON DELETE RESTRICT,
        FOREIGN KEY (mule_account) REFERENCES mule_accounts(account_number) ON DELETE RESTRICT
    );
    """)

    # Read Parquet files and load
    print("[*] Reading Parquet files...")
    df_terminals = pd.read_parquet(os.path.join(data_dir, "terminals.parquet"))
    df_mules = pd.read_parquet(os.path.join(data_dir, "mule_accounts.parquet"))
    df_complaints = pd.read_parquet(os.path.join(data_dir, "complaints.parquet"))
    df_txs = pd.read_parquet(os.path.join(data_dir, "transactions.parquet"))
    df_cashouts = pd.read_parquet(os.path.join(data_dir, "ground_truth_cashouts.parquet"))

    # Convert timestamps to ISO string if datetime
    for df in [df_complaints, df_txs, df_cashouts]:
        for col in df.select_dtypes(include=['datetime', 'datetimetz']).columns:
            df[col] = df[col].astype(str)

    # Convert boolean to integer for SQLite compatibility
    df_terminals["cctv_active"] = df_terminals["cctv_active"].astype(int)
    df_terminals["is_near_highway"] = df_terminals["is_near_highway"].astype(int)
    df_mules["is_dormant_reactivated"] = df_mules["is_dormant_reactivated"].astype(int)

    print("[*] Inserting records into SQLite...")
    df_terminals.to_sql("terminals", conn, if_exists="append", index=False)
    df_mules.to_sql("mule_accounts", conn, if_exists="append", index=False)
    df_complaints.to_sql("complaints", conn, if_exists="append", index=False)
    df_txs.to_sql("transactions", conn, if_exists="append", index=False)
    df_cashouts.to_sql("ground_truth_cashouts", conn, if_exists="append", index=False)

    # Create Spatial & Relational Indices
    print("[*] Building spatial H3 and relational indices...")
    cursor.execute("CREATE INDEX idx_terminals_h3_res8 ON terminals(h3_res8);")
    cursor.execute("CREATE INDEX idx_terminals_h3_res9 ON terminals(h3_res9);")
    cursor.execute("CREATE INDEX idx_terminals_coords ON terminals(lat, lon);")
    cursor.execute("CREATE INDEX idx_terminals_highway ON terminals(is_near_highway);")
    cursor.execute("CREATE INDEX idx_mule_layer ON mule_accounts(account_layer);")
    cursor.execute("CREATE INDEX idx_transactions_sender ON transactions(sender_account);")
    cursor.execute("CREATE INDEX idx_transactions_receiver ON transactions(receiver_account);")
    cursor.execute("CREATE INDEX idx_transactions_time ON transactions(timestamp);")
    cursor.execute("CREATE INDEX idx_cashouts_terminal ON ground_truth_cashouts(terminal_id);")
    cursor.execute("CREATE INDEX idx_cashouts_time ON ground_truth_cashouts(cashout_timestamp);")
    cursor.execute("CREATE INDEX idx_complaints_time ON complaints(complaint_timestamp);")

    conn.commit()

    # Integrity Check
    cursor.execute("PRAGMA foreign_key_check;")
    fk_errors = cursor.fetchall()
    assert len(fk_errors) == 0, f"Foreign key integrity errors found: {fk_errors}"

    # Print summary counts
    counts = {}
    for table in ["terminals", "mule_accounts", "complaints", "transactions", "ground_truth_cashouts"]:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        counts[table] = cursor.fetchone()[0]

    conn.close()
    print("[SUCCESS] SQLite Database Export Completed Successfully!")
    for table, count in counts.items():
        print(f"    - {table}: {count:,} rows")
    print(f"[+] Output database file: {db_path}")
    return db_path

if __name__ == "__main__":
    export_parquet_to_sqlite()
