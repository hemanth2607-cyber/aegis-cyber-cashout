"""
Real-time WebSocket Streaming Manager for Tactical Alerts
Pushes proactive intervention alerts, CAD dispatches, and bank friction notifications.
"""
import time
import json
import logging
from typing import List, Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger("aegis.websocket")


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"[+] WebSocket client connected. Active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"[-] WebSocket client disconnected. Active: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"[!] Failed to send message to client: {e}")
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)


manager = ConnectionManager()
ws_router = APIRouter(tags=["WebSocket"])


@ws_router.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial handshake ack
        await websocket.send_json({
            "event": "CONNECTED",
            "message": "Aegis Tactical Live Alerts Channel Connected",
            "timestamp": time.time()
        })
        while True:
            # Keep connection open and receive optional heartbeats
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                if payload.get("type") == "PING":
                    await websocket.send_json({"event": "PONG", "timestamp": time.time()})
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"[!] WebSocket error: {e}")
        manager.disconnect(websocket)


async def broadcast_alert(event_type: str, data: Dict[str, Any]):
    """Broadcasts a structured tactical alert to all connected operators."""
    msg = {
        "event_type": event_type,
        "timestamp": time.time(),
        "data": data
    }
    await manager.broadcast(msg)
