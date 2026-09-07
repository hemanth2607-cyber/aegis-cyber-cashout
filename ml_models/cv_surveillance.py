"""
ATM CCTV Computer Vision & Edge Telemetry Ingestion Module
Simulates edge-camera surveillance intelligence (YOLOv8 / OpenCV contract)
for ATM kiosk pinhole and overhead cameras without impacting core sub-50ms graph inference.
"""
from dataclasses import dataclass, asdict
from typing import Dict, Any, List, Optional
import time


@dataclass
class ATMCCTVTelemetry:
    terminal_id: str
    camera_active: bool
    cctv_risk_score: float                # 0.0 to 1.0
    person_detected: bool
    face_obscured: bool                   # Helmet, mask, cloth concealment
    loitering_duration_sec: float
    multi_card_attempts: int
    anomalous_behavior_flag: bool
    frame_timestamp_iso: str
    edge_device_model: str = "Edge-YOLOv8-Nano-CCTV"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class ATMSurveillanceAnalyzer:
    """
    Lightweight edge CV telemetry analyzer mapping ATM kiosk camera feeds
    into tactical threat indicators for cybercrime interdiction.
    """

    @staticmethod
    def analyze_atm_feed(
        terminal_id: str,
        is_suspicious_heist: bool = True,
        card_attempts: int = 1
    ) -> ATMCCTVTelemetry:
        """
        Simulates real-time edge processing (YOLOv8 / OpenCV) of ATM camera feed.
        """
        if is_suspicious_heist:
            face_obscured = True
            loitering = 185.0  # seconds near terminal
            cctv_risk = 0.88
            anomalous = True
        else:
            face_obscured = False
            loitering = 25.0
            cctv_risk = 0.12
            anomalous = False

        return ATMCCTVTelemetry(
            terminal_id=terminal_id,
            camera_active=True,
            cctv_risk_score=cctv_risk,
            person_detected=True,
            face_obscured=face_obscured,
            loitering_duration_sec=loitering,
            multi_card_attempts=card_attempts,
            anomalous_behavior_flag=anomalous,
            frame_timestamp_iso=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            edge_device_model="Edge-YOLOv8-Nano-CCTV"
        )
