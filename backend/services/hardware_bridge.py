"""
Hardware-In-The-Loop (HITL) ATM Beacon Bridge Service
Manages WebSocket streaming to physical embedded microcontrollers (ESP32, Arduino, Pi)
and mock hardware terminal emulators for physical lock/strobe reactions.
"""
import time
import json
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

logger = logging.getLogger("aegis.hardware_bridge")


class HardwareBeaconManager:
    """
    Manages physical and simulated embedded IoT beacon connections.
    Distributes low-latency binary/JSON lock triggers to physical demo devices.
    """
    _instance: Optional["HardwareBeaconManager"] = None

    def __init__(self):
        self.active_beacons: List[WebSocket] = []
        self.last_event: Optional[Dict[str, Any]] = None
        self.total_events_dispatched: int = 0

    @classmethod
    def get_instance(cls) -> "HardwareBeaconManager":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    async def register_beacon(self, websocket: WebSocket, client_info: str = "GENERIC_ESP32"):
        await websocket.accept()
        self.active_beacons.append(websocket)
        logger.info(
            f"[+] HITL Beacon connected [{client_info}]. Active microcontrollers: {len(self.active_beacons)}"
        )
        # Send initial handshake config
        await websocket.send_json({
            "event": "BEACON_REGISTERED",
            "status": "ONLINE",
            "server_time": int(time.time()),
            "message": "Aegis HITL Physical Beacon Protocol v1.0",
            "gpio_config": {
                "strobe_led_pin": 22,
                "buzzer_pwm_pin": 23,
                "operational_led_pin": 19,
                "solenoid_relay_pin": 21
            }
        })

    def unregister_beacon(self, websocket: WebSocket):
        if websocket in self.active_beacons:
            self.active_beacons.remove(websocket)
            logger.info(
                f"[-] HITL Beacon disconnected. Active microcontrollers: {len(self.active_beacons)}"
            )

    async def broadcast_lock_event(
        self,
        terminal_id: str = "ATM-DL-9082",
        account: str = "YESB00010921",
        statutory_order: str = "SECTION_106_BNSS",
        strobe_ms: int = 15000,
        buzzer_freq: int = 2400
    ) -> Dict[str, Any]:
        """
        Pushes a compact real-time hardware trigger payload to all connected
        ESP32/Arduino/RPi microcontrollers on the demo table.
        """
        payload = {
            "event": "ATM_SESSION_LOCKED",
            "terminal_id": terminal_id,
            "statutory_power": statutory_order,
            "target_account": account,
            "timestamp": int(time.time()),
            "strobe_ms": strobe_ms,
            "buzzer_freq": buzzer_freq
        }

        self.last_event = payload
        self.total_events_dispatched += 1

        dead_connections = []
        for ws in self.active_beacons:
            try:
                await ws.send_json(payload)
            except Exception as e:
                logger.warning(f"[!] Failed to push to hardware beacon: {e}")
                dead_connections.append(ws)

        for dead in dead_connections:
            self.unregister_beacon(dead)

        logger.info(
            f"[⚡] HITL ATM Lock Beacon Event Broadcast: Terminal {terminal_id} | "
            f"Account: {account} | Strobe: {strobe_ms}ms | Targets: {len(self.active_beacons)} units"
        )
        return payload

    def get_status(self) -> Dict[str, Any]:
        return {
            "status": "ONLINE",
            "active_hardware_units": len(self.active_beacons),
            "total_events_dispatched": self.total_events_dispatched,
            "last_event": self.last_event
        }


def get_hardware_beacon_manager() -> HardwareBeaconManager:
    return HardwareBeaconManager.get_instance()


# FastAPI Router for Hardware Beacons
hardware_router = APIRouter(tags=["Hardware-In-The-Loop (HITL)"])


@hardware_router.websocket("/ws/hardware/beacon")
async def websocket_hardware_beacon_endpoint(websocket: WebSocket):
    """
    Dedicated low-overhead WebSocket stream for physical ESP32 / Arduino / RPi beacons.
    Receives device telemetry/heartbeats and pushes instantaneous ATM friction triggers.
    """
    manager = get_hardware_beacon_manager()
    client_host = websocket.client.host if websocket.client else "unknown"
    await manager.register_beacon(websocket, client_info=client_host)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                # Handle device heartbeats or manual test pings from microcontroller
                if msg.get("type") in ("PING", "HEARTBEAT"):
                    await websocket.send_json({
                        "event": "HEARTBEAT_ACK",
                        "server_time": int(time.time()),
                        "rssi": msg.get("rssi", -50)
                    })
                elif msg.get("type") == "TRIGGER_TEST":
                    await manager.broadcast_lock_event(
                        terminal_id=msg.get("terminal_id", "ATM-DL-9082"),
                        account=msg.get("target_account", "YESB00010921"),
                        statutory_order="SECTION_106_BNSS"
                    )
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.unregister_beacon(websocket)
    except Exception as e:
        logger.error(f"[!] Hardware WebSocket error: {e}")
        manager.unregister_beacon(websocket)


@hardware_router.get("/api/v1/hardware/beacon/status", status_code=status.HTTP_200_OK)
async def get_beacon_status() -> Dict[str, Any]:
    """Returns current connected physical microcontroller count and last trigger event."""
    return get_hardware_beacon_manager().get_status()


@hardware_router.post("/api/v1/hardware/beacon/trigger", status_code=status.HTTP_200_OK)
async def manual_beacon_trigger(
    terminal_id: str = "ATM-DL-9082",
    target_account: str = "YESB00010921"
) -> Dict[str, Any]:
    """Manually test-broadcasts an ATM session lock trigger to all connected hardware units."""
    manager = get_hardware_beacon_manager()
    payload = await manager.broadcast_lock_event(
        terminal_id=terminal_id,
        account=target_account,
        statutory_order="SECTION_106_BNSS"
    )
    return {
        "status": "DISPATCHED",
        "broadcast_payload": payload,
        "active_units": len(manager.active_beacons)
    }
