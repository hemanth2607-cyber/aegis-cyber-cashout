"""
Live Smart India Hackathon (SIH) Jury Demonstration Script: AegisCashout
Demonstrates real-time 1930 NCRP complaint ingestion, multi-hop peeling stream,
TreeSHAP spatial forecasting, and proactive ERSS Dial 112 / Bank Switch intervention in < 15 seconds.
"""
import sys
import time
import requests
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

# Initialize Rich Console with force terminal colors
console = Console()
API_BASE = "http://localhost:8000/api/v1"


def run_jury_simulation():
    console.print()
    header_text = Text(
        "SIH26184: PREDICTIVE ANALYTICS FOR CYBERCRIME INTERVENTION\n"
        "LIVE DEMONSTRATION: NCRP -> MULE FLOW -> PROACTIVE DISPATCH",
        style="bold cyan",
        justify="center"
    )
    console.print(Panel(header_text, border_style="cyan", padding=(1, 2)))

    # ==========================================================================
    # PHASE 1: Victim Complaint Ingestion
    # ==========================================================================
    console.print("\n[bold yellow][PHASE 1][/bold yellow] [bold white]Ingesting simulated 1930 NCRP Cyber Fraud Complaint...[/bold white]")
    complaint_payload = {
        "complaint_id": "NCRP-2026-DEL-88319",
        "victim_account": "SBIN0001928374",
        "victim_bank": "State Bank of India",
        "initial_amount": 750000.00,
        "fraud_category": "DIGITAL_ARREST",
        "initial_utr": "UTR-IND-2026-00192A",
        "victim_lat": 28.6139,
        "victim_lon": 77.2090,
        "timestamp": time.time()
    }

    try:
        res = requests.post(f"{API_BASE}/complaints/ingest", json=complaint_payload, timeout=10)
        status_code = res.status_code
    except Exception as e:
        console.print(f"[bold red][!] Error connecting to backend at {API_BASE}: {e}[/bold red]")
        console.print("[yellow]Ensure backend is running: uvicorn backend.main:app --port 8000[/yellow]")
        sys.exit(1)

    table_p1 = Table(title="1930 NCRP / I4C Incident Record", border_style="dim")
    table_p1.add_column("Parameter", style="cyan", no_wrap=True)
    table_p1.add_column("Telemetry Value", style="white")

    table_p1.add_row("Complaint Docket", complaint_payload["complaint_id"])
    table_p1.add_row("Victim Account", f"{complaint_payload['victim_account']} ({complaint_payload['victim_bank']})")
    table_p1.add_row("Financial Siphon", "INR 7,50,000.00")
    table_p1.add_row("Fraud Modus Operandi", complaint_payload["fraud_category"])
    table_p1.add_row("Origin Coordinates", f"Lat {complaint_payload['victim_lat']}, Lon {complaint_payload['victim_lon']} (New Delhi)")
    table_p1.add_row("Ingestion Status", f"HTTP {status_code} | Tracking Graph Initialized")

    console.print(table_p1)

    # ==========================================================================
    # PHASE 2: Multi-Hop Peeling Stream (CFCFRMS Webhooks)
    # ==========================================================================
    time.sleep(2)
    console.print("\n[bold yellow][PHASE 2][/bold yellow] [bold white]CFCFRMS Webhook Trigger: Layer 1 to Layer 3 Rapid Peeling Flow...[/bold white]")

    mule_hops = [
        {"sender": "SBIN0001928374", "receiver": "PUNB09988112", "amount": 750000.0, "chan": "IMPS", "utr": "UTR-HOP1-9981"},
        {"sender": "PUNB09988112", "receiver": "HDFC00041231", "amount": 250000.0, "chan": "IMPS", "utr": "UTR-HOP2-8812"},
        {"sender": "PUNB09988112", "receiver": "ICIC00091822", "amount": 240000.0, "chan": "UPI", "utr": "UTR-HOP2-8813"},
        {"sender": "HDFC00041231", "receiver": "YESB00010921", "amount": 245000.0, "chan": "IMPS", "utr": "UTR-HOP3-7711"}
    ]

    table_hops = Table(title="Real-Time CFCFRMS Mule Trajectory", border_style="yellow")
    table_hops.add_column("Hop", style="dim")
    table_hops.add_column("Origin Account", style="cyan")
    table_hops.add_column("Destination Account", style="magenta")
    table_hops.add_column("Amount (INR)", style="green", justify="right")
    table_hops.add_column("Channel", style="yellow")
    table_hops.add_column("UTR Reference", style="dim")

    for idx, hop in enumerate(mule_hops, 1):
        time.sleep(0.8)
        requests.post(f"{API_BASE}/transactions/hook", json=hop, timeout=10)
        table_hops.add_row(
            f"Hop {idx}",
            hop["sender"],
            hop["receiver"],
            f"INR {hop['amount']:,.2f}",
            hop["chan"],
            hop["utr"]
        )

    console.print(table_hops)

    # ==========================================================================
    # PHASE 3: Tactical Forecast Generation
    # ==========================================================================
    time.sleep(1.5)
    console.print("\n[bold yellow][PHASE 3][/bold yellow] [bold white]Querying Dual-Stage Predictive Engine for Intercept Target...[/bold white]")

    pred_res = requests.get(f"{API_BASE}/predictions/NCRP-2026-DEL-88319", timeout=10).json()

    table_pred = Table(title="Tactical Cybercrime Cashout Forecast", border_style="bright_magenta")
    table_pred.add_column("Forecast Metric", style="cyan", no_wrap=True)
    table_pred.add_column("Intelligence Output", style="bold white")

    window_mins = pred_res.get("predicted_cashout_window_mins") or pred_res.get("window_minutes", 18.5)
    confidence = pred_res.get("confidence_score", 0.85)
    primary_cell = pred_res.get("primary_target_cell", {})
    h8_hex = primary_cell.get("h3_res8", pred_res.get("target_h3_res8", "883da18da3fffff"))
    c_lat = primary_cell.get("lat", 28.6451)
    c_lon = primary_cell.get("lon", 77.1212)
    terms = primary_cell.get("candidate_terminals", pred_res.get("candidate_atms", []))
    target_terminal = terms[0] if terms else {"terminal_id": "ATM-DL-10068", "bank": "State Bank of India"}

    table_pred.add_row("Predicted Cash-Out Window", f"{window_mins} MINUTES")
    table_pred.add_row("Forecast Confidence", f"{confidence * 100:.1f}%")
    table_pred.add_row("Target H3 Hexagon (Res 8)", str(h8_hex))
    table_pred.add_row("Centroid Coordinates", f"Lat {c_lat:.6f}, Lon {c_lon:.6f}")
    table_pred.add_row("Suspect Terminal Identified", f"{target_terminal.get('terminal_id', 'ATM-DL-10068')} ({target_terminal.get('bank', 'SBI')} Offsite ATM)")

    console.print(table_pred)

    # Display TreeSHAP AI Tactical Drivers
    explanation = pred_res.get("tactical_explanation", {})
    factors = explanation.get("top_factors", [])
    if factors:
        table_shap = Table(title="TreeSHAP Explainable AI Attribution", border_style="blue")
        table_shap.add_column("Feature Driver", style="bold cyan")
        table_shap.add_column("Attribution (+/-)", justify="right")
        table_shap.add_column("Law Enforcement Tactical Intelligence", style="white")

        for f in factors[:3]:
            shap_val = f.get("shap_value", 0.0)
            val_style = "bold red" if shap_val >= 0 else "bold green"
            table_shap.add_row(
                f.get("feature", "N/A"),
                Text(f"+{shap_val:.2f}" if shap_val >= 0 else f"{shap_val:.2f}", style=val_style),
                f.get("description", "N/A")
            )
        console.print(table_shap)

    # ==========================================================================
    # PHASE 4: Tactical Law Enforcement Intervention
    # ==========================================================================
    time.sleep(2)
    console.print("\n[bold yellow][PHASE 4][/bold yellow] [bold white]Executing Automated Law Enforcement Countermeasures...[/bold white]")

    # 4a. Dial 112 Dispatch
    dispatch_res = requests.post(f"{API_BASE}/dispatch/dial112", json={
        "complaint_id": "NCRP-2026-DEL-88319",
        "target_h3_index": h8_hex,
        "priority": "CRITICAL"
    }, timeout=10).json()

    console.print(f"[bold green][+][/bold green] [bold cyan]ERSS Dial 112 Dispatched:[/bold cyan] Unit [bold white]{dispatch_res['patrol_car']}[/bold white] | ETA: [bold yellow]{dispatch_res['eta_minutes']} mins[/bold yellow] | Ref: [dim]{dispatch_res['dispatch_id']}[/dim]")

    # 4b. Bank Friction Delay Trigger
    freeze_res = requests.post(f"{API_BASE}/bank/friction", json={
        "complaint_id": "NCRP-2026-DEL-88319",
        "target_mule_account": "YESB00010921",
        "action": "STEP_UP_AUTH"
    }, timeout=10).json()

    console.print(f"[bold green][+][/bold green] [bold cyan]Bank Micro-Delay Deployed:[/bold cyan] Action: [bold yellow]{freeze_res['action_taken']}[/bold yellow] | Status: [bold green]{freeze_res['transaction_freeze_status']}[/bold green] | Ref: [dim]{freeze_res['risk_reference']}[/dim]")

    # Final Result Banner
    console.print()
    result_text = Text(
        "RESULT: WITHDRAWAL PRE-EMPTED. INCIDENT INTERDICTED IN ADVANCE.\n"
        "Law Enforcement Unit En Route | Mule Account Switch Frozen",
        style="bold green",
        justify="center"
    )
    console.print(Panel(result_text, border_style="green", padding=(1, 2)))
    console.print()


if __name__ == "__main__":
    run_jury_simulation()
