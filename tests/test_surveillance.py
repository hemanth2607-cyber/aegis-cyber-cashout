"""
Unit & Integration tests for Edge ATM Kiosk Surveillance Emulator & Telemetry API
"""
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.vision_emulator import get_vision_emulator, KioskSurveillanceEmulator


def test_vision_emulator_rendering():
    """Verify in-memory OpenCV rendering produces valid JPEG bytes."""
    emulator = KioskSurveillanceEmulator()
    frame_bytes = emulator.render_frame("ATM-DL-9082")
    
    assert isinstance(frame_bytes, bytes)
    assert len(frame_bytes) > 1000
    # JPEG magic bytes: 0xFF, 0xD8
    assert frame_bytes[0] == 0xFF
    assert frame_bytes[1] == 0xD8


def test_vision_emulator_telemetry():
    """Verify edge telemetry schema and values."""
    emulator = KioskSurveillanceEmulator()
    emulator.reset_terminal("ATM-TEST-001")
    telem = emulator.get_telemetry("ATM-TEST-001")
    
    assert telem["terminal_id"] == "ATM-TEST-001"
    assert telem["camera_status"] == "ONLINE_ACTIVE"
    assert telem["facial_concealment_score"] == 0.942
    assert telem["cards_detected_count"] == 4
    assert telem["is_card_frozen"] is False
    assert telem["dispenser_locked"] is False
    assert telem["threat_level"] == "CRITICAL_EXTRACTION_IN_PROGRESS"


def test_vision_emulator_state_triggers():
    """Verify Section 106 card freeze and dispenser lockdown state changes."""
    emulator = KioskSurveillanceEmulator()
    terminal_id = "ATM-DL-9082"
    
    # Freeze card
    emulator.set_card_frozen(terminal_id, True)
    telem = emulator.get_telemetry(terminal_id)
    assert telem["is_card_frozen"] is True
    assert telem["threat_level"] == "SECTION_106_INTERCEPTED"
    
    # Frame rendering with freeze banner active
    frozen_frame = emulator.render_frame(terminal_id)
    assert len(frozen_frame) > 1000
    
    # Trigger lockdown
    lockdown_telem = emulator.trigger_lockdown(terminal_id)
    assert lockdown_telem["dispenser_locked"] is True
    assert lockdown_telem["alarm_active"] is True
    assert lockdown_telem["threat_level"] == "DISPENSER_LOCKDOWN_ALARM_ENGAGED"


def test_surveillance_telemetry_endpoint():
    """Verify GET /api/v1/terminals/{terminal_id}/telemetry endpoint."""
    client = TestClient(app)
    response = client.get("/api/v1/terminals/ATM-DL-9082/telemetry")
    assert response.status_code == 200
    data = response.json()
    assert data["terminal_id"] == "ATM-DL-9082"
    assert "facial_concealment_score" in data
    assert "cards_detected_count" in data
    assert "dwell_time_seconds" in data
    assert "threat_level" in data


def test_surveillance_lockdown_endpoint():
    """Verify POST /api/v1/terminals/{terminal_id}/lockdown endpoint."""
    client = TestClient(app)
    response = client.post("/api/v1/terminals/ATM-DL-9082/lockdown")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "LOCKDOWN_ENGAGED"
    assert data["shutter_state"] == "SOLENOID_LOCKED"
    assert data["audible_alarm"] == "ACTIVE_110DB"
    assert data["telemetry"]["dispenser_locked"] is True


def test_surveillance_live_feed_generator():
    """Verify stream_terminal_frames yields multipart MJPEG chunks."""
    import asyncio

    async def _test():
        emulator = KioskSurveillanceEmulator()
        gen = emulator.stream_terminal_frames("ATM-DL-9082")
        chunk = await anext(gen)
        assert isinstance(chunk, bytes)
        assert b"--frame\r\n" in chunk
        assert b"Content-Type: image/jpeg\r\n" in chunk
        assert b"\xff\xd8" in chunk  # JPEG SOI marker

    asyncio.run(_test())
