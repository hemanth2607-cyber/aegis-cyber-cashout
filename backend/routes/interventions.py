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
    Dispatches nearest mobile patrol vehicle to the geofenced H3 extraction cell.
    """
    dispatch_id = f"CAD-112-{random.randint(1000, 9999)}"
    assigned_unit = payload.assigned_patrol_unit_id or random.choice(PATROL_UNITS)
    eta = round(random.uniform(4.8, 7.5), 1)

    result = {
        "dispatch_id": dispatch_id,
        "patrol_car": assigned_unit,
        "eta_minutes": eta,
        "status": "DISPATCHED",
        "complaint_id": payload.complaint_id,
        "target_h3": payload.target_h3_index
    }

    logger.info(f"[+] ERSS Dial 112 CAD Dispatched: {dispatch_id} | Unit: {assigned_unit} | ETA: {eta}m")

    # Broadcast to dashboard
    await broadcast_alert("DIAL112_CAD_DISPATCHED", result)

    return result


@router.post("/bank/friction", response_model=BankFrictionResponse, status_code=status.HTTP_200_OK)
async def trigger_bank_friction(payload: BankFrictionRequest) -> Dict[str, Any]:
    """
    Simulates NPCI / Bank Core Switch API call to inject surgical friction
    (ATM Micro-Delay, Step-up Biometric Auth, or Pre-emptive Terminal Freeze).
    """
    action = payload.action
    action_labels = {
        "STEP_UP_AUTH": "ATM_MICRO_DELAY_15MIN",
        "TERMINAL_CASH_LIMIT": "DISPENSE_CAP_INR_5000",
        "CARD_FREEZE": "TEMPORARY_CARD_BLOCK"
    }
    action_taken = action_labels.get(action, "ATM_MICRO_DELAY_15MIN")
    risk_ref = f"I4C-BLOCK-{random.randint(1000, 9999)}"

    result = {
        "transaction_freeze_status": "SUCCESS",
        "action_taken": action_taken,
        "risk_reference": risk_ref,
        "target_mule_account": payload.target_mule_account
    }

    logger.info(f"[+] Bank Friction Triggered: Account {payload.target_mule_account} | Action: {action_taken} | Ref: {risk_ref}")

    # Broadcast to dashboard
    await broadcast_alert("BANK_FRICTION_DEPLOYED", {
        "complaint_id": payload.complaint_id,
        "target_mule_account": payload.target_mule_account,
        "action_taken": action_taken,
        "risk_reference": risk_ref
    })

    return result
