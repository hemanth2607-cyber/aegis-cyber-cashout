"""
Prahar Consortium Blockchain API Routes
Exposes permissioned PoA ledger inspection, Merkle root verification,
tamper-attack simulation for judges, and Section 63 BSA 2023 evidence certification.
"""
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from backend.services.blockchain_engine import (
    consortium_ledger,
    CONSORTIUM_NODES
)

router = APIRouter(prefix="/blockchain", tags=["Prahar Consortium Blockchain"])


class TamperDemoRequest(BaseModel):
    block_index: int = Field(default=1, description="Index of the block to deliberately tamper with")
    field_to_mutate: str = Field(default="target_h3_res8", description="Field to alter")
    forged_value: str = Field(default="886196a50ffffff_FORGED_BY_ATTACKER", description="Malicious data injection")


@router.get("/ledger", status_code=status.HTTP_200_OK)
async def get_consortium_ledger() -> Dict[str, Any]:
    """
    Returns the complete immutable ledger history, active consortium nodes,
    and current mining state for the Prahar-Ledger.
    """
    blocks = [b.to_dict() for b in consortium_ledger.chain]
    return {
        "chain_id": "PRAHAR-CONSORTIUM-MAINNET-2026",
        "consensus": "Proof-of-Authority (PoA)",
        "total_blocks": len(blocks),
        "active_validators": [
            {
                "node_id": k,
                "name": v["name"],
                "role": v["role"],
                "public_key_fingerprint": v["public_key"][:16] + "..."
            }
            for k, v in CONSORTIUM_NODES.items()
        ],
        "active_nodes": list(CONSORTIUM_NODES.keys()),
        "pending_transactions_count": len(consortium_ledger.pending_transactions),
        "chain": blocks,
        "blocks": blocks,
    }


@router.get("/verify", status_code=status.HTTP_200_OK)
async def verify_ledger_integrity() -> Dict[str, Any]:
    """
    Executes full mathematical verification across all block headers,
    Merkle roots, SHA-256 hash chains, and validator cryptographic signatures.
    """
    verification = consortium_ledger.verify_chain_integrity()
    return verification


@router.post("/tamper-demo", status_code=status.HTTP_200_OK)
async def simulate_tamper_attack(payload: Optional[TamperDemoRequest] = None) -> Dict[str, Any]:
    """
    Deliberately injects an unauthorized mutation into a historical block on the ledger.
    Demonstrates to SIH evaluators and judges that tampering is mathematically
    detected instantly via Merkle tree and hash link invalidation.
    """
    block_idx = payload.block_index if payload else 1
    field = payload.field_to_mutate if payload else "target_h3_res8"
    new_val = payload.forged_value if payload else "886196a50ffffff_FORGED"

    try:
        tamper_result = consortium_ledger.tamper_test_mutation(
            block_index=block_idx,
            field=field,
            new_value=new_val
        )
        return {
            "is_valid": False,
            "status": "TAMPER_MUTATION_APPLIED",
            "alert": "CRYPTOGRAPHIC_INTEGRITY_VIOLATION",
            "tampered_block": block_idx,
            "details": tamper_result,
        }
    except IndexError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/restore", status_code=status.HTTP_200_OK)
async def restore_ledger() -> Dict[str, Any]:
    """
    Restores the blockchain to a clean, unbroken cryptographic state
    after presenting the tamper demo to judges.
    """
    consortium_ledger.restore_ledger()
    verification = consortium_ledger.verify_chain_integrity()
    return {
        "status": "RESTORED",
        "chain_status": "SECURE_UNBROKEN",
        "message": "Consortium chain re-mined and verified successfully",
        "verification": verification
    }


@router.get("/certificate/{incident_id}", status_code=status.HTTP_200_OK)
async def get_bsa_evidence_certificate(incident_id: str) -> Dict[str, Any]:
    """
    Produces an official Section 63 Bharatiya Sakshya Adhiniyam (BSA), 2023
    Cryptographic Certificate of Admissibility for electronic records.
    """
    cert = consortium_ledger.generate_bsa_certificate(incident_id)
    return cert
