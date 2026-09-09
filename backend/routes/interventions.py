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
from backend.services.hardware_bridge import get_hardware_beacon_manager
from backend.services.vision_emulator import get_vision_emulator
from backend.services.blockchain_engine import consortium_ledger
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

    # Immutably record Dial 112 Police CAD dispatch on Prahar Consortium Blockchain
    try:
        consortium_ledger.record_patrol_dispatch(
            incident_id=payload.complaint_id or dispatch_id,
            unit_callsign=assigned_unit,
            target_coords=[28.6139, 77.2090],
            eta_mins=eval_result.patrol_eta_mins,
            time_margin_mins=eval_result.time_margin_mins
        )
        cad_block = consortium_ledger.mine_block("STATE_POLICE_CAD_GATEWAY")
        result["blockchain_block_index"] = cad_block.block_index
        result["blockchain_merkle_root"] = cad_block.merkle_root
    except Exception as e:
        logger.warning(f"[!] Blockchain ledger dispatch recording error: {e}")

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
        f"Section 106 BNSS Statutory Order: Immediate targeted CARD-SESSION debit lien and rate limiting "
        f"deployed against terminating mule account [{payload.target_mule_account}]. "
        f"Mode: {payload.friction_mode} ({action_taken}). Note: Physical ATM terminal remains 100% active and available "
        f"for legitimate public transactions; only the suspect card session is rate-limited/locked pending Section 107 BNSS attachment."
    )

    result = {
        "transaction_freeze_status": "SUCCESS",
        "action_taken": action_taken,
        "risk_reference": risk_ref,
        "target_mule_account": payload.target_mule_account,
        "statutory_power": "SECTION_106_BNSS",
        "statutory_brief": statutory_brief,
        "kiosk_public_availability": "ACTIVE_FOR_PUBLIC",
        "penal_code_sections": [
            "Section 318(4) BNS",
            "Section 319 BNS",
            "Section 66D IT Act"
        ]
    }

    logger.info(
        f"[+] Section 106 BNSS Action Triggered: Account {payload.target_mule_account} | "
        f"Mode: {payload.friction_mode} | Action: {action_taken} | Kiosk: ACTIVE_FOR_PUBLIC | Ref: {risk_ref}"
    )

    # Broadcast to dashboard
    await broadcast_alert("BANK_FRICTION_DEPLOYED", {
        "complaint_id": payload.complaint_id,
        "target_mule_account": payload.target_mule_account,
        "action_taken": action_taken,
        "risk_reference": risk_ref,
        "statutory_power": "SECTION_106_BNSS",
        "statutory_brief": statutory_brief,
        "kiosk_public_availability": "ACTIVE_FOR_PUBLIC",
        "penal_code_sections": result["penal_code_sections"]
    })

    # Trigger Hardware-In-The-Loop (HITL) physical ATM Lock Beacon
    try:
        await get_hardware_beacon_manager().broadcast_lock_event(
            terminal_id="ATM-DL-9082",
            account=payload.target_mule_account,
            statutory_order="SECTION_106_BNSS",
            strobe_ms=15000,
            buzzer_freq=2400
        )
    except Exception as e:
        logger.warning(f"[!] Failed to push to physical hardware beacon: {e}")

    # Synchronize Edge CCTV Vision Emulator
    try:
        get_vision_emulator().set_card_frozen("ATM-DL-9082", True)
    except Exception as e:
        logger.warning(f"[!] Failed to synchronize vision emulator: {e}")

    # Immutably record Section 106 BNSS Card-Session Freeze on Prahar Consortium Blockchain
    try:
        consortium_ledger.record_interdiction_order(
            incident_id=payload.complaint_id or risk_ref,
            terminal_id="ATM-DL-9082",
            card_hash=payload.target_mule_account,
            statutory_code="SECTION_106_BNSS",
            friction_mode=payload.friction_mode or "ATM_MICRO_DELAY_15MIN"
        )
        npci_block = consortium_ledger.mine_block("NPCI_SWITCH_GATEWAY")
        result["blockchain_block_index"] = npci_block.block_index
        result["blockchain_merkle_root"] = npci_block.merkle_root
    except Exception as e:
        logger.warning(f"[!] Blockchain ledger bank friction recording error: {e}")

    return result


@router.get("/dispatch/mobile/patrol-feed", status_code=status.HTTP_200_OK)
async def get_mobile_patrol_feed() -> Dict[str, Any]:
    """
    Lightweight REST feed specifically formatted for Mobile Data Terminals (MDT)
    and field constable mobile apps (Flutter / Android / iOS).
    """
    return {
        "status": "ONLINE",
        "client_tier": "MOBILE_MDT_FIELD_RESPONSE",
        "active_dispatches": [
            {
                "dispatch_id": "CAD-112-8821",
                "target_terminal": "SBI-ATM-CAL-042",
                "location_name": "Calangute Market Road, North Goa",
                "latitude": 15.5432,
                "longitude": 73.7554,
                "assigned_unit": "BEAT-PCR-GOA-COASTAL-3",
                "distance_km": 4.2,
                "eta_minutes": 8.7,
                "action_priority": "CRITICAL_INTERDICTION",
                "runner_profile": "Multiple debit cards, face partially obscured",
                "statutory_authority": "Sec 106 BNSS (Field Detainment & Seizure)"
            }
        ],
        "system_sync_time": "2026-09-08T01:25:00Z"
    }


@router.get("/analytics/pilot-metrics", status_code=status.HTTP_200_OK)
async def get_pilot_metrics() -> Dict[str, Any]:
    """
    Returns the nationwide pilot coverage metrics and fund recovery rate benchmarks
    as validated in the SIH26184 pilot simulation.
    """
    return {
        "total_coverage": {
            "total_atms_monitored": 13000,
            "total_pilot_cities": 3,
            "total_cybercrime_cells": 12
        },
        "pilot_zones": [
            {"city": "Delhi NCR", "atms": 5000, "active_cells": 5, "status": "ACTIVE_PILOT"},
            {"city": "Mumbai", "atms": 4500, "active_cells": 4, "status": "ACTIVE_PILOT"},
            {"city": "Bengaluru", "atms": 3500, "active_cells": 3, "status": "ACTIVE_PILOT"}
        ],
        "fund_recovery_benchmark": {
            "legacy_baseline_rate_pct": 2.7,
            "with_aegis_ai_rate_pct": 8.5,
            "recovery_improvement_pct": 215.0,
            "improvement_multiplier": "3.15x",
            "simulation_period": "6-Month Pilot Simulation"
        },
        "sdg_alignment": [
            {"sdg": "SDG 16", "name": "Peace, Justice & Strong Institutions", "target": "16.4 Combat Illicit Financial Flows"},
            {"sdg": "SDG 9", "name": "Industry, Innovation & Infrastructure", "target": "9.5 Resilient Digital Public Infrastructure"}
        ]
    }


@router.post("/surveillance/cctv-check", status_code=status.HTTP_200_OK)
async def check_cctv_surveillance(terminal_id: str, is_suspicious: bool = True) -> Dict[str, Any]:
    """
    Computer Vision edge-camera simulation analyzing ATM kiosk surveillance feeds
    using YOLOv8 / OpenCV telemetry contract.
    """
    from ml_models.cv_surveillance import ATMSurveillanceAnalyzer
    telemetry = ATMSurveillanceAnalyzer.analyze_atm_feed(
        terminal_id=terminal_id,
        is_suspicious_heist=is_suspicious
    )
    return telemetry.to_dict()

