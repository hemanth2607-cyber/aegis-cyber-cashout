"""
Comprehensive Integration Tests for AegisCashout Backend API
Validates complaints ingestion, transaction propagation, predictions, CAD dispatch,
bank friction, and WebSocket streaming.
"""
import unittest
from fastapi.testclient import TestClient
from backend.main import app


class TestBackendAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_health_and_root(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("AegisCashout", res.json()["service"])

        res_health = self.client.get("/api/v1/health")
        self.assertEqual(res_health.status_code, 200)
        self.assertEqual(res_health.json()["status"], "HEALTHY")

    def test_02_complaint_ingest_and_prediction(self):
        payload = {
            "complaint_id": "NCRP-TEST-2026-9901",
            "victim_account": "SBIN0009988112",
            "victim_bank": "State Bank of India",
            "initial_amount": 500000.0,
            "fraud_category": "DIGITAL_ARREST",
            "initial_utr": "UTR-TEST-INIT-01",
            "victim_lat": 28.6139,
            "victim_lon": 77.2090
        }
        res = self.client.post("/api/v1/complaints/ingest", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["status"], "INGESTED")
        self.assertIn("initial_prediction", data)
        self.assertGreater(data["initial_prediction"]["confidence_score"], 0.0)

    def test_03_transaction_hook_propagation(self):
        # First hop from victim
        hop1 = {
            "sender": "SBIN0009988112",
            "receiver": "PUNB00077665",
            "amount": 500000.0,
            "chan": "IMPS",
            "utr": "UTR-TEST-HOP-01"
        }
        res1 = self.client.post("/api/v1/transactions/hook", json=hop1)
        self.assertEqual(res1.status_code, 200)
        data1 = res1.json()
        self.assertEqual(data1["status"], "HOOK_PROCESSED")

        # Second hop to terminal mule
        hop2 = {
            "sender": "PUNB00077665",
            "receiver": "ICIC00033221",
            "amount": 200000.0,
            "chan": "UPI",
            "utr": "UTR-TEST-HOP-02"
        }
        res2 = self.client.post("/api/v1/transactions/hook", json=hop2)
        self.assertEqual(res2.status_code, 200)

    def test_04_query_prediction_by_id(self):
        res = self.client.get("/api/v1/predictions/NCRP-TEST-2026-9901")
        self.assertEqual(res.status_code, 200)
        pred = res.json()

        # Check required fields for part 3C compatibility
        self.assertIn("predicted_cashout_window_mins", pred)
        self.assertIn("confidence_score", pred)
        self.assertIn("primary_target_cell", pred)
        self.assertIn("h3_res8", pred["primary_target_cell"])
        self.assertIn("lat", pred["primary_target_cell"])
        self.assertIn("lon", pred["primary_target_cell"])
        self.assertGreater(len(pred["primary_target_cell"]["candidate_terminals"]), 0)
        self.assertIn("terminal_id", pred["primary_target_cell"]["candidate_terminals"][0])

        # Check TreeSHAP explainability
        self.assertIn("tactical_explanation", pred)
        self.assertIn("legal_brief", pred["tactical_explanation"])

    def test_05_active_predictions(self):
        res = self.client.get("/api/v1/predictions/active")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("active_hotspots_count", data)
        self.assertGreaterEqual(data["active_hotspots_count"], 1)

    def test_06_dispatch_dial112(self):
        payload = {
            "complaint_id": "NCRP-TEST-2026-9901",
            "target_h3_index": "883da11701fffff",
            "priority": "CRITICAL"
        }
        res = self.client.post("/api/v1/dispatch/dial112", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("CAD-112-", data["dispatch_id"])
        self.assertIn("patrol_car", data)
        self.assertGreater(data["eta_minutes"], 0)
        self.assertEqual(data["status"], "DISPATCHED")

    def test_07_bank_friction(self):
        payload = {
            "complaint_id": "NCRP-TEST-2026-9901",
            "target_mule_account": "ICIC00033221",
            "action": "STEP_UP_AUTH",
            "friction_mode": "CARD_SESSION_HOLD",
            "statutory_power": "SECTION_106_BNSS"
        }
        res = self.client.post("/api/v1/bank/friction", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["transaction_freeze_status"], "SUCCESS")
        self.assertEqual(data["action_taken"], "ATM_MICRO_DELAY_15MIN")
        self.assertTrue("BNSS106-BLOCK-" in data["risk_reference"] or "BLOCK-" in data["risk_reference"])
        self.assertEqual(data.get("kiosk_public_availability"), "ACTIVE_FOR_PUBLIC")
        self.assertEqual(data.get("statutory_power"), "SECTION_106_BNSS")
        self.assertIn("Section 318(4) BNS", data.get("penal_code_sections", []))

    def test_08_websocket_stream(self):
        with self.client.websocket_connect("/ws/alerts") as ws:
            handshake = ws.receive_json()
            self.assertEqual(handshake["event"], "CONNECTED")
            ws.send_text('{"type": "PING"}')
            pong = ws.receive_json()
            self.assertEqual(pong["event"], "PONG")


if __name__ == "__main__":
    unittest.main()
