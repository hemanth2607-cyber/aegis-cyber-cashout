"""
Law Enforcement Dispatch & Banking Friction Countermeasure Routes
Simulates Emergency Response Support System (ERSS Dial 112 CAD) and Bank Core Switch Interventions.
"""
import random
import logging
from typing import Dict, Any
from fastapi import APIRouter, status

from backend.schemas import (
    DispatchCADRequest,
    DispatchCADResponse,
    BankFrictionRequest,
    BankFrictionResponse
)
from backend.services.interdiction_service import evaluate_interdiction_feasibility
from backend.websocket import broadcast_alert

logger = logging.getLogger("aegis.interventions")
router = APIRouter(tags=["Interventions & CAD"])

# Simulated NCR Police Beat Patrol Units
PATROL_UNITS = [
    "BEAT-PCR-ROHINI-4",
    "BEAT-PCR-DWARKA-2",
    "BEAT-PCR-CENTRAL-7",
    "BEAT-PCR-GURUGRAM-9",
    "BEAT-PCR-NOIDA-5",
    "BEAT-PCR-SOUTH-11"
]


@router.post("/dispatch/dial112", response_model=DispatchCADResponse, status_code=status.HTTP_200_OK)
async def dispatch_dial112(payload: DispatchCADRequest) -> Dict[str, Any]:
    """
    Simulates live CAD integration with Police Emergency Response Support System (ERSS Dial 112).
    Evaluates sequential interdiction feasibility (Condition 1 Digital Hold + Condition 2 Patrol ETA).
    """
    dispatch_id = f"CAD-112-{random.randint(1000, 9999)}"
    assigned_unit = payload.assigned_patrol_unit_id or random.choice(PATROL_UNITS)

    # Evaluate formal sequential interdiction feasibility model
    eval_result = evaluate_interdiction_feasibility(
        delta_t_hat_mins=float(payload.delta_t_hat_mins or 18.5),
        cad_route_delay_mins=round(random.uniform(0.8, 1.5), 1),
        pcr_distance_km=float(payload.pcr_distance_km or round(random.uniform(2.2, 3.8), 1)),
        pcr_speed_kmh=float(payload.pcr_speed_kmh or 35.0),
        api_freeze_latency_sec=1.5,
        friction_delay_mins=15.0,
        api_available=True
    )

    result = {
        "dispatch_id": dispatch_id,
        "patrol_car": assigned_unit,
        "eta_minutes": eval_result.patrol_eta_mins,
        "status": "DISPATCHED",
        "complaint_id": payload.complaint_id,
        "target_h3": payload.target_h3_index,
        "interdiction_outcome": eval_result.outcome.value,
        "effective_window_mins": eval_result.effective_window_mins,
        "patrol_eta_mins": eval_result.patrol_eta_mins,
        "time_margin_mins": eval_result.time_margin_mins,
        "operational_brief": eval_result.operational_brief,
        "statutory_power": "SECTION_106_BNSS"
    }

    logger.info(
        f"[+] ERSS Dial 112 CAD Dispatched: {dispatch_id} | Unit: {assigned_unit} | "
        f"ETA: {eval_result.patrol_eta_mins}m | Outcome: {eval_result.outcome.value} (Margin: {eval_result.time_margin_mins:+.1f}m)"
    )

    # Broadcast to dashboard
    await broadcast_alert("DIAL112_CAD_DISPATCHED", result)

    return result


@router.post("/bank/friction", response_model=BankFrictionResponse, status_code=status.HTTP_200_OK)
async def trigger_bank_friction(payload: BankFrictionRequest) -> Dict[str, Any]:
    """
    Invokes Section 106 BNSS Statutory Order to execute immediate account lien,
    UPI/IMPS debit freeze, and ATM dispenser rate limiting.
    """
    action = payload.action
    action_labels = {
        "STEP_UP_AUTH": "ATM_MICRO_DELAY_15MIN",
        "TERMINAL_CASH_LIMIT": "DISPENSE_CAP_INR_5000",
        "CARD_FREEZE": "TEMPORARY_CARD_BLOCK"
    }
    action_taken = action_labels.get(action, "ATM_MICRO_DELAY_15MIN")
    risk_ref = f"BNSS106-BLOCK-{random.randint(1000, 9999)}"

    statutory_brief = (
        f"Section 106 BNSS Statutory Order: Immediate police account lien and ATM dispenser rate limiting "
        f"applied against terminating mule [{payload.target_mule_account}]. "
        f"Action: {action_taken}. Asset dissipation prevented pending Section 107 BNSS attachment."
    )

    result = {
        "transaction_freeze_status": "SUCCESS",
        "action_taken": action_taken,
        "risk_reference": risk_ref,
        "target_mule_account": payload.target_mule_account,
        "statutory_power": "SECTION_106_BNSS",
        "statutory_brief": statutory_brief
    }

    logger.info(
        f"[+] Section 106 BNSS Action Triggered: Account {payload.target_mule_account} | "
        f"Action: {action_taken} | Ref: {risk_ref}"
    )

    # Broadcast to dashboard
    await broadcast_alert("BANK_FRICTION_DEPLOYED", {
        "complaint_id": payload.complaint_id,
        "target_mule_account": payload.target_mule_account,
        "action_taken": action_taken,
        "risk_reference": risk_ref,
        "statutory_power": "SECTION_106_BNSS",
        "statutory_brief": statutory_brief
    })

    return result
