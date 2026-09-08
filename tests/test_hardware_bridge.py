"""
Unit & Integration Tests for Hardware-In-The-Loop (HITL) ATM Lock Beacon Bridge
"""
import pytest
import asyncio
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.hardware_bridge import get_hardware_beacon_manager, HardwareBeaconManager


def test_hardware_beacon_manager_singleton():
    """Verify singleton accessor and initial state."""
    mgr1 = get_hardware_beacon_manager()
    mgr2 = get_hardware_beacon_manager()
    assert mgr1 is mgr2
    assert isinstance(mgr1, HardwareBeaconManager)


def test_hardware_beacon_status_endpoint():
    """Verify GET /api/v1/hardware/beacon/status returns telemetry status."""
    client = TestClient(app)
    response = client.get("/api/v1/hardware/beacon/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"
    assert "active_hardware_units" in data
    assert "total_events_dispatched" in data


def test_hardware_beacon_manual_trigger_endpoint():
    """Verify POST /api/v1/hardware/beacon/trigger dispatches lock event."""
    client = TestClient(app)
    response = client.post("/api/v1/hardware/beacon/trigger?terminal_id=ATM-DL-9082&target_account=YESB00010921")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "DISPATCHED"
    payload = data["broadcast_payload"]
    assert payload["event"] == "ATM_SESSION_LOCKED"
    assert payload["terminal_id"] == "ATM-DL-9082"
    assert payload["target_account"] == "YESB00010921"
    assert payload["statutory_power"] == "SECTION_106_BNSS"
    assert payload["strobe_ms"] == 15000
    assert payload["buzzer_freq"] == 2400


def test_bank_friction_triggers_hardware_beacon():
    """Verify that calling POST /api/v1/bank/friction updates hardware beacon state."""
    client = TestClient(app)
    mgr = get_hardware_beacon_manager()
    initial_dispatched = mgr.total_events_dispatched

    response = client.post("/api/v1/bank/friction", json={
        "complaint_id": "TEST-HW-001",
        "target_mule_account": "YESB00099881",
        "action": "STEP_UP_AUTH",
        "friction_mode": "ATM_MICRO_DELAY_15MIN",
        "statutory_power": "SECTION_106_BNSS"
    })
    assert response.status_code == 200
    assert mgr.total_events_dispatched >= initial_dispatched + 1
    assert mgr.last_event["event"] == "ATM_SESSION_LOCKED"
    assert mgr.last_event["target_account"] == "YESB00099881"


def test_hardware_beacon_websocket_handshake():
    """Verify WebSocket /ws/hardware/beacon handshake and initial configuration push."""
    client = TestClient(app)
    with client.websocket_connect("/ws/hardware/beacon") as websocket:
        init_msg = websocket.receive_json()
        assert init_msg["event"] == "BEACON_REGISTERED"
        assert init_msg["status"] == "ONLINE"
        assert "gpio_config" in init_msg
        assert init_msg["gpio_config"]["strobe_led_pin"] == 22

        # Send heartbeat ping
        websocket.send_json({"type": "HEARTBEAT", "rssi": -42})
        ack = websocket.receive_json()
        assert ack["event"] == "HEARTBEAT_ACK"
        assert ack["rssi"] == -42
