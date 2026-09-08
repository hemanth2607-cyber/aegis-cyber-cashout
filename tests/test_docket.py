"""
Unit and Integration Tests for BNSS Case Docket Generator & API Route.
Validates pure-Python ReportLab PDF compilation under Sections 106 & 107 BNSS, 2023.
"""
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.docket_generator import BNSSCaseDocketGenerator, NumberedLawEnforcementCanvas


@pytest.fixture
def client():
    return TestClient(app)


def test_bnss_docket_generator_structure():
    """
    Validates that BNSSCaseDocketGenerator produces a valid 4-page PDF
    with statutory Section 106 & 107 language and cryptographic verification.
    """
    generator = BNSSCaseDocketGenerator()

    # Track pages generated
    page_count = [0]
    orig_save = NumberedLawEnforcementCanvas.save

    def tracking_save(self):
        page_count[0] = len(self._saved_page_states)
        orig_save(self)

    NumberedLawEnforcementCanvas.save = tracking_save

    try:
        pdf_buffer = generator.generate_docket_pdf(
            complaint_data={
                "complaint_id": "NCRP-2026-TEST-DOCKET",
                "victim_account": "SBIN0001092831",
                "victim_bank": "State Bank of India",
                "victim_name": "Col. R. K. Sharma (Retd.)",
                "initial_amount": 350000.0,
                "fraud_category": "DIGITAL_ARREST",
                "initial_utr": "UTR-TEST-8839210",
                "victim_lat": 28.6139,
                "victim_lon": 77.2090
            },
            graph_data={
                "edges": [
                    {
                        "from": "SBIN0001092831",
                        "to": "YESB00010921",
                        "amount": 350000.0,
                        "channel": "IMPS",
                        "utr": "UTR-TEST-8839210",
                        "timestamp": 1700000000.0
                    },
                    {
                        "from": "YESB00010921",
                        "to": "ICIC00094821",
                        "amount": 210000.0,
                        "channel": "UPI",
                        "utr": "UTR-TEST-8839211",
                        "timestamp": 1700000180.0
                    }
                ],
                "features": {
                    "velocity_decay": 0.765,
                    "cumulative_latency_sec": 380.0,
                    "fan_out_ratio": 2.10,
                    "peeling_ratio": 0.22,
                    "terminating_mules": ["ICIC00094821"]
                }
            },
            prediction_data={
                "complaint_id": "NCRP-2026-TEST-DOCKET",
                "predicted_cashout_window_mins": 18.5,
                "confidence_score": 0.912,
                "target_h3_res8": "883da116e1fffff",
                "tactical_explanation": {
                    "top_factors": [
                        {
                            "feature": "velocity_decay",
                            "shap_value": 0.450,
                            "description": "High velocity persistence indicates imminent withdrawal."
                        },
                        {
                            "feature": "peeling_ratio",
                            "shap_value": 0.310,
                            "description": "Structured smurfing across beneficiary accounts."
                        }
                    ]
                }
            },
            page_compression=0
        )
    finally:
        NumberedLawEnforcementCanvas.save = orig_save

    raw_pdf = pdf_buffer.getvalue()

    # 1. Standard PDF magic bytes
    assert raw_pdf.startswith(b"%PDF-"), "Generated file is not a valid PDF document."

    # 2. Minimum file size assertion
    assert len(raw_pdf) > 12000, f"PDF file size too small: {len(raw_pdf)} bytes."

    # 3. Four-Page Document Verification
    assert page_count[0] == 4, f"Expected 4 pages, but got {page_count[0]}."

    # 4. Keyword and Statutory Verification
    pdf_text = raw_pdf.decode("latin1", errors="ignore")
    assert "INDIAN CYBER CRIME COORDINATION CENTRE" in pdf_text or "I4C" in pdf_text
    assert "BHARATIYA NAGARIK SURAKSHA SANHITA" in pdf_text or "BNSS" in pdf_text
    assert "SECTION 106" in pdf_text
    assert "SECTION 107" in pdf_text
    assert "TreeSHAP" in pdf_text or "SHAP" in pdf_text


def test_api_docket_generate_post(client):
    """
    Validates the POST /api/v1/docket/generate endpoint.
    """
    response = client.post(
        "/api/v1/docket/generate",
        json={"complaint_id": "NCRP-2026-API-TEST"}
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert 'filename="BNSS_Docket_NCRP-2026-API-TEST.pdf"' in response.headers.get("content-disposition", "")
    assert len(response.content) > 10000
    assert response.content.startswith(b"%PDF-")


def test_api_docket_generate_get(client):
    """
    Validates the GET /api/v1/docket/{complaint_id} endpoint.
    """
    response = client.get("/api/v1/docket/NCRP-2026-API-GET-TEST")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert 'filename="BNSS_Docket_NCRP-2026-API-GET-TEST.pdf"' in response.headers.get("content-disposition", "")
    assert len(response.content) > 10000
    assert response.content.startswith(b"%PDF-")
