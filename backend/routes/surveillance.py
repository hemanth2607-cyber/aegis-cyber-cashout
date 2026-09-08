"""
Surveillance Route: Edge ATM Kiosk CCTV Telemetry & Video Stream
Provides live MJPEG video streaming and edge AI bounding box telemetry.
"""
import logging
from typing import Dict, Any
from fastapi import APIRouter, status, HTTPException
from fastapi.responses import StreamingResponse

from backend.services.vision_emulator import get_vision_emulator

logger = logging.getLogger("aegis.surveillance")
router = APIRouter(prefix="/terminals", tags=["Edge Kiosk Surveillance"])


@router.get("/{terminal_id}/live_feed")
async def get_live_kiosk_feed(terminal_id: str):
    """
    Returns a continuous MJPEG video stream (multipart/x-mixed-replace) simulating
    overhead CCTV camera telemetry with live computer vision bounding box overlays.
    """
    emulator = get_vision_emulator()
    return StreamingResponse(
        emulator.stream_terminal_frames(terminal_id),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@router.get("/{terminal_id}/telemetry")
async def get_kiosk_telemetry(terminal_id: str) -> Dict[str, Any]:
    """
    Returns edge computer vision detection metrics including face concealment score,
    multi-card cluster count, dwell time, and Section 106 BNSS switch lock status.
    """
    emulator = get_vision_emulator()
    return emulator.get_telemetry(terminal_id)


@router.post("/{terminal_id}/lockdown")
async def trigger_kiosk_lockdown(terminal_id: str) -> Dict[str, Any]:
    """
    Triggers emergency edge dispenser shutter lockdown and 110dB audible deterrent siren
    at the targeted ATM kiosk.
    """
    emulator = get_vision_emulator()
    telemetry = emulator.trigger_lockdown(terminal_id)
    logger.warning(f"[!] EMERGENCY KIOSK LOCKDOWN & SIREN ACTIVATED: Terminal {terminal_id}")
    return {
        "status": "LOCKDOWN_ENGAGED",
        "terminal_id": terminal_id,
        "shutter_state": "SOLENOID_LOCKED",
        "audible_alarm": "ACTIVE_110DB",
        "telemetry": telemetry
    }


@router.post("/{terminal_id}/freeze")
async def trigger_sec106_freeze(terminal_id: str) -> Dict[str, Any]:
    """
    Simulates Section 106 BNSS bank core switch hold signal to terminate the ATM card session.
    """
    emulator = get_vision_emulator()
    emulator.set_card_frozen(terminal_id, True)
    logger.info(f"[+] Section 106 BNSS Switch Lock applied to Terminal {terminal_id}")
    return {
        "status": "SEC_106_FROZEN",
        "terminal_id": terminal_id,
        "telemetry": emulator.get_telemetry(terminal_id)
    }


@router.post("/{terminal_id}/reset")
async def reset_kiosk_state(terminal_id: str) -> Dict[str, Any]:
    """
    Resets terminal simulation state.
    """
    emulator = get_vision_emulator()
    telemetry = emulator.reset_terminal(terminal_id)
    return {
        "status": "RESET_COMPLETED",
        "terminal_id": terminal_id,
        "telemetry": telemetry
    }
