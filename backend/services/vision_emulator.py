"""
Edge ATM Kiosk Surveillance Emulator
Generates simulated real-time low-light CCTV video stream (MJPEG)
with high-contrast computer vision bounding boxes and edge anomaly telemetry.
"""
import asyncio
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, AsyncGenerator
import numpy as np
import cv2


class KioskSurveillanceEmulator:
    """
    Simulates an edge-connected overhead/angled ATM vestibule CCTV camera.
    Produces real-time low-light / infrared frames with computer vision bounding box
    overlays for face concealment, multi-card clustering, and Section 106 BNSS switch holds.
    """
    _instance: Optional["KioskSurveillanceEmulator"] = None

    def __init__(self):
        self.width = 640
        self.height = 480
        self.fps = 12.0
        self.frame_interval = 1.0 / self.fps

        # Per-terminal edge states
        self.terminal_states: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def get_instance(cls) -> "KioskSurveillanceEmulator":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _get_or_create_state(self, terminal_id: str) -> Dict[str, Any]:
        if terminal_id not in self.terminal_states:
            self.terminal_states[terminal_id] = {
                "terminal_id": terminal_id,
                "is_card_frozen": False,
                "dispenser_locked": False,
                "alarm_active": False,
                "start_time": time.time() - 284.0,  # 284s dwell time baseline
                "facial_concealment_score": 0.942,
                "cards_detected_count": 4,
                "threat_level": "CRITICAL_EXTRACTION_IN_PROGRESS",
                "frame_count": 0
            }
        return self.terminal_states[terminal_id]

    def set_card_frozen(self, terminal_id: str, is_frozen: bool = True) -> None:
        state = self._get_or_create_state(terminal_id)
        state["is_card_frozen"] = is_frozen
        if is_frozen:
            state["threat_level"] = "SECTION_106_INTERCEPTED"

    def trigger_lockdown(self, terminal_id: str) -> Dict[str, Any]:
        state = self._get_or_create_state(terminal_id)
        state["dispenser_locked"] = True
        state["alarm_active"] = True
        state["is_card_frozen"] = True
        state["threat_level"] = "DISPENSER_LOCKDOWN_ALARM_ENGAGED"
        return self.get_telemetry(terminal_id)

    def reset_terminal(self, terminal_id: str) -> Dict[str, Any]:
        state = self._get_or_create_state(terminal_id)
        state["is_card_frozen"] = False
        state["dispenser_locked"] = False
        state["alarm_active"] = False
        state["threat_level"] = "CRITICAL_EXTRACTION_IN_PROGRESS"
        state["start_time"] = time.time() - 120.0
        return self.get_telemetry(terminal_id)

    def get_telemetry(self, terminal_id: str) -> Dict[str, Any]:
        state = self._get_or_create_state(terminal_id)
        dwell_time = int(time.time() - state["start_time"])
        return {
            "terminal_id": terminal_id,
            "camera_status": "ONLINE_ACTIVE",
            "facial_concealment_score": state["facial_concealment_score"],
            "cards_detected_count": state["cards_detected_count"],
            "dwell_time_seconds": dwell_time,
            "threat_level": state["threat_level"],
            "is_card_frozen": state["is_card_frozen"],
            "dispenser_locked": state["dispenser_locked"],
            "alarm_active": state["alarm_active"],
            "surveillance_fps": self.fps,
            "resolution": f"{self.width}x{self.height}"
        }

    def render_frame(self, terminal_id: str) -> bytes:
        """
        Renders a single 640x480 low-light infrared CCTV frame with
        dynamic silhouettes, animated hands, and neon CV bounding boxes.
        """
        state = self._get_or_create_state(terminal_id)
        state["frame_count"] += 1
        f_idx = state["frame_count"]

        w, h = self.width, self.height

        # 1. Base Night-Vision Atmosphere (Low-light greenish tint)
        frame = np.zeros((h, w, 3), dtype=np.uint8)
        # Deep greenish-slate palette: BGR (18, 38, 24)
        frame[:, :] = (20, 42, 28)

        # Subtle noise/grain injection for analog security camera feed
        noise = np.random.randint(-12, 12, (h, w, 3), dtype=np.int16)
        frame = np.clip(frame.astype(np.int16) + noise, 0, 255).astype(np.uint8)

        # Scanlines (darken every 3rd row slightly)
        frame[::3, :] = (frame[::3, :].astype(np.float32) * 0.82).astype(np.uint8)

        # 2. Architectural ATM Kiosk Vestibule Layout
        # Background wall divider
        cv2.line(frame, (0, 360), (w, 360), (25, 55, 35), 1)
        # Floor grid lines
        for x_floor in range(0, w, 80):
            cv2.line(frame, (x_floor, 360), (int(x_floor * 1.3) - 60, h), (18, 48, 28), 1)

        # ATM Machine Chassis (Right-Center perspective)
        # Main enclosure
        cv2.rectangle(frame, (390, 80), (610, 460), (32, 68, 45), -1)
        cv2.rectangle(frame, (390, 80), (610, 460), (55, 120, 75), 2)

        # ATM Screen
        screen_color = (25, 45, 120) if state["is_card_frozen"] else (90, 160, 110)
        cv2.rectangle(frame, (420, 110), (580, 230), screen_color, -1)
        cv2.rectangle(frame, (420, 110), (580, 230), (80, 200, 130), 1)

        # ATM Screen Text
        if state["is_card_frozen"]:
            cv2.putText(frame, "CARD SESSION", (435, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)
            cv2.putText(frame, "TERMINATED", (445, 175), cv2.FONT_HERSHEY_SIMPLEX, 0.50, (0, 0, 255), 1)
            cv2.putText(frame, "SEC 106 BNSS", (440, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (200, 200, 255), 1)
        else:
            cv2.putText(frame, "STATE BANK OF INDIA", (430, 140), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (15, 40, 20), 1)
            cv2.putText(frame, "INSERT CARD / PIN", (435, 170), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (10, 30, 15), 1)
            cv2.putText(frame, "WAITING ON SWITCH...", (430, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (30, 80, 40), 1)

        # ATM Card Slot Bezel & Keypad
        cv2.rectangle(frame, (430, 250), (490, 275), (20, 40, 30), -1)
        # Pulsating Green/Amber LED for Card slot
        slot_led_color = (0, 0, 255) if state["is_card_frozen"] else (0, 255, 150)
        cv2.circle(frame, (440, 262), 4, slot_led_color, -1)
        cv2.putText(frame, "CARD", (450, 266), cv2.FONT_HERSHEY_SIMPLEX, 0.30, (80, 180, 110), 1)

        # Keypad area
        cv2.rectangle(frame, (510, 250), (570, 300), (40, 75, 50), -1)
        cv2.rectangle(frame, (510, 250), (570, 300), (60, 130, 80), 1)

        # Cash Dispenser Shutter
        dispenser_color = (0, 0, 180) if state["dispenser_locked"] else (25, 50, 35)
        cv2.rectangle(frame, (430, 320), (570, 360), dispenser_color, -1)
        cv2.rectangle(frame, (430, 320), (570, 360), (70, 140, 90), 1)
        disp_txt = "SHUTTER LOCKED" if state["dispenser_locked"] else "CASH DISPENSER"
        cv2.putText(frame, disp_txt, (445, 345), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (180, 240, 200), 1)

        # 3. Dynamic Suspicious Runner Silhouette
        # Subtle kinematic motion based on frame index
        sway_x = int(3.0 * np.sin(f_idx * 0.15))
        arm_reach = int(4.0 * np.cos(f_idx * 0.20))

        runner_cx = 250 + sway_x
        head_cy = 150

        # Silhouette Body (Torso & Shoulders)
        cv2.ellipse(frame, (runner_cx, 340), (85, 140), 0, 0, 360, (12, 26, 18), -1)
        cv2.ellipse(frame, (runner_cx, 340), (85, 140), 0, 0, 360, (25, 55, 35), 1)

        # Head / Motorcycle Helmet with Dark Visor
        cv2.circle(frame, (runner_cx, head_cy), 48, (10, 22, 15), -1)
        cv2.circle(frame, (runner_cx, head_cy), 48, (45, 95, 60), 1)
        # Tinted Visor Oval
        cv2.ellipse(frame, (runner_cx + 12, head_cy + 4), (28, 16), 15, 0, 360, (5, 10, 8), -1)
        cv2.ellipse(frame, (runner_cx + 12, head_cy + 4), (28, 16), 15, 0, 360, (60, 140, 90), 1)

        # Suspect Right Arm extending toward ATM card slot
        hand_x = 425 + arm_reach
        hand_y = 265
        cv2.line(frame, (runner_cx + 50, 240), (hand_x, hand_y), (14, 28, 20), 22)
        cv2.line(frame, (runner_cx + 50, 240), (hand_x, hand_y), (35, 75, 45), 2)
        cv2.circle(frame, (hand_x, hand_y), 14, (12, 24, 18), -1)

        # Suspect Left Hand holding stack of multiple ATM cards
        stack_x = runner_cx + 60
        stack_y = 285
        cv2.circle(frame, (stack_x, stack_y), 16, (14, 30, 22), -1)
        # Render multiple plastic card edges
        card_colors = [(180, 210, 50), (60, 180, 240), (220, 80, 80), (140, 240, 140)]
        for i, c_color in enumerate(card_colors):
            offset_y = i * 4 - 6
            cv2.rectangle(frame, (stack_x - 14, stack_y + offset_y), (stack_x + 18, stack_y + offset_y + 3), c_color, -1)

        # 4. Computer Vision Edge Detection Bounding Boxes
        # DETECTION 1: Face Concealment (Full Visor / Motorcycle Helmet)
        face_x1, face_y1 = runner_cx - 55, head_cy - 55
        face_x2, face_y2 = runner_cx + 55, head_cy + 55
        # High-contrast Amber / Red neon box (BGR: 0, 140, 255)
        neon_amber = (0, 145, 255)
        cv2.rectangle(frame, (face_x1, face_y1), (face_x2, face_y2), neon_amber, 2)
        # Corner highlight brackets
        self._draw_corner_brackets(frame, face_x1, face_y1, face_x2, face_y2, neon_amber, length=12)

        # Label Pill Tag
        lbl1 = "FACE_CONCEALMENT_DETECTED: 94.2% [HELMET + FULL VISOR]"
        cv2.rectangle(frame, (face_x1 - 20, face_y1 - 22), (face_x1 + 335, face_y1 - 2), (0, 80, 160), -1)
        cv2.putText(frame, lbl1, (face_x1 - 15, face_y1 - 7), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 255, 255), 1)

        # DETECTION 2: Multi-Card Cluster Anomaly
        card_x1, card_y1 = stack_x - 30, hand_y - 25
        card_x2, card_y2 = hand_x + 25, stack_y + 35
        # Neon Cyan box (BGR: 255, 220, 0)
        neon_cyan = (255, 220, 0)
        cv2.rectangle(frame, (card_x1, card_y1), (card_x2, card_y2), neon_cyan, 2)
        self._draw_corner_brackets(frame, card_x1, card_y1, card_x2, card_y2, neon_cyan, length=10)

        lbl2 = "ANOMALY_MULTI_CARD_CLUSTER: 88.6% [3+ DEBIT CARDS DETECTED]"
        cv2.rectangle(frame, (card_x1 - 10, card_y2 + 4), (card_x1 + 340, card_y2 + 22), (120, 100, 0), -1)
        cv2.putText(frame, lbl2, (card_x1 - 5, card_y2 + 18), cv2.FONT_HERSHEY_SIMPLEX, 0.34, (255, 255, 255), 1)

        # 5. On-Screen Display (OSD) Telemetry Header
        # Top dark telemetry strip
        cv2.rectangle(frame, (0, 0), (w, 36), (8, 16, 12), -1)
        cv2.line(frame, (0, 36), (w, 36), (40, 90, 60), 1)

        # Blinking REC dot
        rec_color = (0, 0, 240) if (f_idx % 16 < 8) else (40, 40, 40)
        cv2.circle(frame, (18, 18), 6, rec_color, -1)
        cv2.putText(frame, "REC", (30, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (220, 220, 220), 1)

        now_ist = datetime.now(timezone(timedelta(hours=5, minutes=30))).strftime("%Y-%m-%d %H:%M:%S IST")
        osd_title = f"[LIVE CCTV] TERMINAL #{terminal_id} | CALANGUTE NORTH | {now_ist}"
        cv2.putText(frame, osd_title, (75, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (160, 255, 190), 1)

        # FPS & Bitrate
        cv2.putText(frame, "12.0 FPS | 1.8 Mbps", (w - 145, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.36, (120, 200, 140), 1)

        # Top Right: DWELL TIME BADGE
        dwell_s = int(time.time() - state["start_time"])
        dwell_lbl = f"DWELL_TIME_THRESHOLD_EXCEEDED: {dwell_s} SECONDS"
        cv2.rectangle(frame, (w - 335, 45), (w - 15, 68), (0, 60, 160), -1)
        cv2.rectangle(frame, (w - 335, 45), (w - 15, 68), (0, 160, 255), 1)
        cv2.putText(frame, f"! {dwell_lbl}", (w - 325, 61), cv2.FONT_HERSHEY_SIMPLEX, 0.34, (255, 255, 255), 1)

        # Bottom Reticle & Scale Line
        cv2.line(frame, (20, h - 20), (120, h - 20), (60, 140, 90), 1)
        cv2.putText(frame, "FOV: 84° // IR ILLUM: ON", (20, h - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.32, (100, 180, 130), 1)

        # 6. DYNAMIC STATE BANNERS
        # Banner A: Section 106 BNSS Card Lock Activated
        if state["is_card_frozen"]:
            # Pulsate red banner across middle
            pulse = (f_idx % 8 < 5)
            bg_pulse = (0, 0, 210) if pulse else (0, 0, 130)
            cv2.rectangle(frame, (30, 205), (w - 30, 245), bg_pulse, -1)
            cv2.rectangle(frame, (30, 205), (w - 30, 245), (255, 255, 255), 2)
            banner_text = "[ATM SWITCH LOCK ACTIVATED: CARD SESSION TERMINATED UNDER SEC 106 BNSS]"
            cv2.putText(frame, banner_text, (45, 230), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (255, 255, 255), 1)

        # Banner B: Alarm & Dispenser Lockdown Engaged
        if state["dispenser_locked"] or state["alarm_active"]:
            cv2.rectangle(frame, (30, 250), (w - 30, 285), (0, 140, 255), -1)
            cv2.rectangle(frame, (30, 250), (w - 30, 285), (255, 255, 255), 1)
            alert_text = "! DISPENSER LOCKDOWN CONFIRMED // AUDIBLE ALARM (110 dB) ACTIVE !"
            cv2.putText(frame, alert_text, (65, 272), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (0, 0, 0), 1)

        # Encode to JPEG
        ret, jpeg_buf = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
        return jpeg_buf.tobytes()

    def _draw_corner_brackets(self, img, x1, y1, x2, y2, color, length=10, thickness=2):
        """Draws tactical high-tech HUD corner brackets."""
        # Top-Left
        cv2.line(img, (x1, y1), (x1 + length, y1), color, thickness)
        cv2.line(img, (x1, y1), (x1, y1 + length), color, thickness)
        # Top-Right
        cv2.line(img, (x2, y1), (x2 - length, y1), color, thickness)
        cv2.line(img, (x2, y1), (x2, y1 + length), color, thickness)
        # Bottom-Left
        cv2.line(img, (x1, y2), (x1 + length, y2), color, thickness)
        cv2.line(img, (x1, y2), (x1, y2 - length), color, thickness)
        # Bottom-Right
        cv2.line(img, (x2, y2), (x2 - length, y2), color, thickness)
        cv2.line(img, (x2, y2), (x2, y2 - length), color, thickness)

    async def stream_terminal_frames(self, terminal_id: str) -> AsyncGenerator[bytes, None]:
        """
        Asynchronous generator continuously yielding multipart/x-mixed-replace MJPEG chunks.
        """
        while True:
            frame_bytes = self.render_frame(terminal_id)
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n"
                b"Content-Length: " + str(len(frame_bytes)).encode("utf-8") + b"\r\n\r\n"
                + frame_bytes + b"\r\n"
            )
            await asyncio.sleep(self.frame_interval)


def get_vision_emulator() -> KioskSurveillanceEmulator:
    return KioskSurveillanceEmulator.get_instance()
