"""
Comprehensive Test Suite for Prahar-Ledger Consortium Blockchain (PoA)
Validates:
1. Genesis block initialization & node signature verification
2. Multi-stakeholder transaction ingestion (I4C, NPCI, State Police CAD)
3. Sub-10ms Proof-of-Authority block mining & Merkle root formation
4. Chain integrity verification (SHA-256 header link, Merkle root, ECDSA/HMAC sigs)
5. Instant tamper detection (deliberate mutation causing immediate failure)
6. Section 63 Bharatiya Sakshya Adhiniyam (BSA), 2023 Digital Evidence Certification
7. FastAPI REST API endpoints
"""

import time
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.blockchain_engine import (
    PraharConsortiumChain,
    CONSORTIUM_NODES,
    build_merkle_root,
    compute_transaction_hash,
    sign_payload,
    verify_signature,
    consortium_ledger,
)


@pytest.fixture
def fresh_ledger():
    """Provides a pristine, isolated PraharConsortiumChain instance for testing."""
    return PraharConsortiumChain()


@pytest.fixture
def client():
    """FastAPI TestClient instance."""
    return TestClient(app)


# ==============================================================================
# 1. CORE CONSORTIUM & CRYPTOGRAPHIC TESTS
# ==============================================================================

def test_consortium_nodes_and_asymmetric_signatures():
    """Validates that all consortium nodes have distinct cryptographic keypairs and can sign/verify."""
    assert "I4C_CENTRAL_ORACLE" in CONSORTIUM_NODES
    assert "NPCI_SWITCH_GATEWAY" in CONSORTIUM_NODES
    assert "STATE_POLICE_CAD_GATEWAY" in CONSORTIUM_NODES

    for node_id, node_data in CONSORTIUM_NODES.items():
        assert "private_key" in node_data
        assert "public_key" in node_data
        assert "role" in node_data

        test_payload = f"CHALLENGE_TELEMETRY_{node_id}".encode("utf-8")
        sig = sign_payload(test_payload, node_data["private_key"])
        assert isinstance(sig, str) and len(sig) == 64

        # Signature must verify with node's public key
        assert verify_signature(test_payload, sig, node_data["public_key"]) is True

        # Signature must reject tampered payload
        tampered = f"TAMPERED_TELEMETRY_{node_id}".encode("utf-8")
        assert verify_signature(tampered, sig, node_data["public_key"]) is False


def test_merkle_tree_construction():
    """Validates binary Merkle Tree computation with deterministic SHA-256 leaves."""
    empty_root = build_merkle_root([])
    assert empty_root == "0" * 64

    single_tx = [{"event": "ATM_FREEZE", "id": "1"}]
    single_root = build_merkle_root(single_tx)
    assert len(single_root) == 64
    assert single_root == compute_transaction_hash(single_tx[0])

    multi_tx = [
        {"event": "ML_PRED", "h3": "882681e033fffff"},
        {"event": "BANK_LIEN", "acct": "990182819"},
        {"event": "CAD_DISPATCH", "unit": "PCR-ROHINI-4"},
    ]
    merkle_root = build_merkle_root(multi_tx)
    assert len(merkle_root) == 64

    # Any modification in a transaction changes the Merkle root
    multi_tx_tampered = [
        {"event": "ML_PRED", "h3": "882681e033fffff"},
        {"event": "BANK_LIEN", "acct": "990182819_TAMPERED"},
        {"event": "CAD_DISPATCH", "unit": "PCR-ROHINI-4"},
    ]
    assert build_merkle_root(multi_tx_tampered) != merkle_root


def test_genesis_block_creation(fresh_ledger):
    """Verifies Genesis block properties and court-admissibility compliance."""
    assert len(fresh_ledger.chain) == 1
    genesis = fresh_ledger.chain[0]

    assert genesis.block_index == 0
    assert genesis.previous_block_hash == "0" * 64
    assert genesis.validator_node_id == "I4C_CENTRAL_ORACLE"
    assert len(genesis.block_hash) == 64
    assert len(genesis.merkle_root) == 64
    assert len(genesis.validator_signature) == 64

    # Genesis block contains initial framework metadata
    assert genesis.transactions[0]["framework"] == "Section 63 Bharatiya Sakshya Adhiniyam, 2023"


# ==============================================================================
# 2. MULTI-STAKEHOLDER WORKFLOW & POA CONSENSUS
# ==============================================================================

def test_multi_stakeholder_block_lifecycle(fresh_ledger):
    """
    Simulates complete incident lifecycle across 3 institutional nodes:
    1. I4C records ML spatial cell forecast
    2. NPCI issues Section 106 BNSS 15-min debit lien
    3. State Police CAD dispatches PCR vehicle
    """
    # 1. I4C node records prediction
    pred_tx = fresh_ledger.record_prediction_event(
        complaint_id="NCRP-2026-TEST-9901",
        target_hex="882681e033fffff",
        predicted_window_mins=18.5,
        shap_hash="c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2",
        terminal_candidate="ATM-DL-TEST-01",
    )
    assert pred_tx["event_type"] == "AI_PREDICTION_HORIZON_LOCK"
    assert len(fresh_ledger.pending_transactions) == 1

    block_1 = fresh_ledger.mine_block("I4C_CENTRAL_ORACLE")
    assert block_1.block_index == 1
    assert block_1.validator_node_id == "I4C_CENTRAL_ORACLE"
    assert block_1.previous_block_hash == fresh_ledger.chain[0].block_hash
    assert len(fresh_ledger.chain) == 2
    assert len(fresh_ledger.pending_transactions) == 0

    # 2. NPCI node records bank friction
    interdict_tx = fresh_ledger.record_interdiction_order(
        incident_id="INC-2026-TEST-9901",
        terminal_id="ATM-DL-TEST-01",
        card_hash="4591-XXXX-XXXX-9901",
        statutory_code="SECTION_106_BNSS",
        friction_mode="ATM_MICRO_DELAY_15MIN",
    )
    assert interdict_tx["event_type"] == "STATUTORY_INTERDICTION_ORDER"

    block_2 = fresh_ledger.mine_block("NPCI_SWITCH_GATEWAY")
    assert block_2.block_index == 2
    assert block_2.validator_node_id == "NPCI_SWITCH_GATEWAY"
    assert block_2.previous_block_hash == block_1.block_hash
    assert len(fresh_ledger.chain) == 3

    # 3. Police CAD records patrol dispatch
    cad_tx = fresh_ledger.record_patrol_dispatch(
        incident_id="INC-2026-TEST-9901",
        unit_callsign="BEAT-PCR-TEST-9",
        target_coords=[28.6139, 77.2090],
        eta_mins=6.2,
        time_margin_mins=12.3,
    )
    assert cad_tx["event_type"] == "ERSS_DIAL112_PATROL_DISPATCH"

    block_3 = fresh_ledger.mine_block("STATE_POLICE_CAD_GATEWAY")
    assert block_3.block_index == 3
    assert block_3.validator_node_id == "STATE_POLICE_CAD_GATEWAY"
    assert block_3.previous_block_hash == block_2.block_hash
    assert len(fresh_ledger.chain) == 4

    # Complete chain integrity must be unbroken
    audit = fresh_ledger.verify_chain_integrity()
    assert audit["is_valid"] is True
    assert audit["block_count"] == 4
    assert audit["chain_status"] == "SECURE_UNBROKEN"
    assert audit["bsa_sec_63_compliance"] == "VALID"
    assert len(audit["broken_links"]) == 0


def test_mining_latency_benchmark(fresh_ledger):
    """Confirms sub-10ms Proof-of-Authority block generation and verification latency."""
    for i in range(10):
        fresh_ledger.record_prediction_event(
            complaint_id=f"PERF-TEST-{i}",
            target_hex="882681e033fffff",
            predicted_window_mins=15.0,
            shap_hash="0000000000000000000000000000000000000000000000000000000000000000",
        )
        start_time = time.perf_counter()
        fresh_ledger.mine_block("I4C_CENTRAL_ORACLE")
        elapsed_ms = (time.perf_counter() - start_time) * 1000
        # PoA consensus without proof-of-work waste must be strictly < 10ms
        assert elapsed_ms < 10.0, f"Block mining latency {elapsed_ms:.2f}ms exceeded 10ms limit"

    # Whole chain verification must also be blazing fast (< 20ms for entire ledger)
    start_v = time.perf_counter()
    audit = fresh_ledger.verify_chain_integrity()
    verify_ms = (time.perf_counter() - start_v) * 1000
    assert audit["is_valid"] is True
    assert verify_ms < 20.0, f"Chain verification latency {verify_ms:.2f}ms exceeded 20ms limit"


# ==============================================================================
# 3. TAMPER DETECTION & RESTORATION
# ==============================================================================

def test_tamper_detection_mathematical_guarantee(fresh_ledger):
    """
    Demonstrates to judges that any deliberate unauthorized alteration
    of historical ledger state breaks the cryptographic chain instantly.
    """
    # Create 3 blocks
    fresh_ledger.record_prediction_event("C1", "882681e033fffff", 12.0, "abc")
    fresh_ledger.mine_block("I4C_CENTRAL_ORACLE")

    fresh_ledger.record_interdiction_order("C1", "ATM-1", "ACCT-123")
    fresh_ledger.mine_block("NPCI_SWITCH_GATEWAY")

    # Confirm valid initially
    assert fresh_ledger.verify_chain_integrity()["is_valid"] is True

    # Mutate Block 1's transaction data
    mutation_result = fresh_ledger.tamper_test_mutation(
        block_index=1,
        field="transactions",
        new_value=[{"event": "MALICIOUS_ALTERATION_BY_HACKER", "amount": 9999999}],
    )
    assert mutation_result["is_tampered"] is True

    # Audit must catch this immediately
    tampered_audit = fresh_ledger.verify_chain_integrity()
    assert tampered_audit["is_valid"] is False
    assert tampered_audit["chain_status"] == "CRYPTOGRAPHIC_INTEGRITY_VIOLATION"
    assert tampered_audit["tampered_block"] == 1
    assert "Merkle root mismatch" in tampered_audit["reason"]

    # Restore ledger
    restored = fresh_ledger.restore_ledger()
    assert restored["status"] == "RESTORED"
    assert fresh_ledger.verify_chain_integrity()["is_valid"] is True


# ==============================================================================
# 4. SECTION 63 BSA DIGITAL EVIDENCE CERTIFICATE
# ==============================================================================

def test_bsa_digital_certificate_generation(fresh_ledger):
    """Verifies statutory certificate generation under Section 63 BSA 2023."""
    fresh_ledger.record_prediction_event(
        complaint_id="INC-BSA-9988",
        target_hex="882681e033fffff",
        predicted_window_mins=18.0,
        shap_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    )
    fresh_ledger.mine_block("I4C_CENTRAL_ORACLE")

    cert = fresh_ledger.generate_bsa_certificate("INC-BSA-9988")
    assert cert["admissibility_status"] == "VERIFIED_COURT_ADMISSIBLE"
    assert cert["statutory_framework"] == "Section 63 Bharatiya Sakshya Adhiniyam (BSA), 2023"
    assert cert["certificate_hash"] is not None
    assert cert["total_blocks_audited"] >= 2
    assert len(cert["evidence_trail"]) >= 1


# ==============================================================================
# 5. FASTAPI REST API INTEGRATION
# ==============================================================================

def test_blockchain_api_ledger_endpoint(client):
    """GET /api/v1/blockchain/ledger returns full chain and nodes."""
    res = client.get("/api/v1/blockchain/ledger")
    assert res.status_code == 200
    data = res.json()
    assert "chain" in data
    assert "total_blocks" in data
    assert "active_nodes" in data
    assert data["total_blocks"] >= 1


def test_blockchain_api_verify_endpoint(client):
    """GET /api/v1/blockchain/verify returns chain verification state."""
    # Ensure ledger is restored first
    client.post("/api/v1/blockchain/restore")

    res = client.get("/api/v1/blockchain/verify")
    assert res.status_code == 200
    data = res.json()
    assert data["is_valid"] is True
    assert data["chain_status"] == "SECURE_UNBROKEN"
    assert data["bsa_sec_63_compliance"] == "VALID"


def test_blockchain_api_tamper_demo_and_restore(client):
    """POST /api/v1/blockchain/tamper-demo and POST /api/v1/blockchain/restore."""
    # Run tamper demo on block 1
    res_tamper = client.post("/api/v1/blockchain/tamper-demo", json={"block_index": 1})
    assert res_tamper.status_code == 200
    tamper_data = res_tamper.json()
    assert tamper_data["is_valid"] is False
    assert tamper_data["alert"] == "CRYPTOGRAPHIC_INTEGRITY_VIOLATION"

    # Verify endpoint also reports violation
    res_v = client.get("/api/v1/blockchain/verify")
    assert res_v.json()["is_valid"] is False

    # Restore chain
    res_restore = client.post("/api/v1/blockchain/restore")
    assert res_restore.status_code == 200
    assert res_restore.json()["chain_status"] == "SECURE_UNBROKEN"

    # Verify endpoint reports clean state again
    res_clean = client.get("/api/v1/blockchain/verify")
    assert res_clean.json()["is_valid"] is True


def test_blockchain_api_certificate_endpoint(client):
    """GET /api/v1/blockchain/certificate/{incident_id} produces Section 63 BSA certificate."""
    res = client.get("/api/v1/blockchain/certificate/NCRP-2026-DEL-88319")
    assert res.status_code == 200
    cert = res.json()
    assert cert["admissibility_status"] == "VERIFIED_COURT_ADMISSIBLE"
    assert "certificate_hash" in cert
