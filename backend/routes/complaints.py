"""
Complaints and Transaction Webhook Ingestion Routes
Handles 1930 NCRP complaint registration and real-time CFCFRMS multi-hop transaction webhooks.
"""
import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status

from backend.schemas import ComplaintIngestRequest, TransactionHookRequest
from backend.services.graph_service import get_graph_service
from backend.services.ml_service import get_ml_service
from backend.websocket import broadcast_alert

logger = logging.getLogger("aegis.complaints")
router = APIRouter(tags=["Complaints & Transactions"])


@router.post("/complaints/ingest", status_code=status.HTTP_201_CREATED)
async def ingest_complaint(payload: ComplaintIngestRequest) -> Dict[str, Any]:
    """
    Receives incoming cyber fraud complaint from NCRP 1930 / I4C portal.
    Initializes the graph tracking topology, triggers baseline ML forecasting,
    and broadcasts a critical alert if probability/confidence > 0.70.
    """
    graph_svc = get_graph_service()
    ml_svc = get_ml_service()

    # 1. Register complaint in Graph Service
    complaint_dict = payload.model_dump()
    graph_svc.register_complaint(complaint_dict)
    logger.info(f"[+] Ingested Complaint: {payload.complaint_id} | Victim: {payload.victim_account} | Amount: ₹{payload.initial_amount}")

    # 2. Run initial dual-stage prediction
    prediction = ml_svc.run_prediction_for_complaint(payload.complaint_id)

    # 3. Proactive Alert Broadcast
    confidence = prediction.get("confidence_score", 0.0)
    if confidence > 0.70 or payload.initial_amount >= 500000.0:
        await broadcast_alert("HIGH_CONFIDENCE_CASHOUT_ALERT", {
            "complaint_id": payload.complaint_id,
            "victim_bank": payload.victim_bank,
            "initial_amount": payload.initial_amount,
            "window_minutes": prediction.get("window_minutes"),
            "confidence_score": confidence,
            "target_h3_res8": prediction.get("target_h3_res8"),
            "advisory": prediction.get("tactical_advisory")
        })

    return {
        "status": "INGESTED",
        "complaint_id": payload.complaint_id,
        "message": "Complaint logged and tracking graph initialized",
        "initial_prediction": prediction
    }


@router.post("/transactions/hook", status_code=status.HTTP_200_OK)
async def transaction_webhook(payload: TransactionHookRequest) -> Dict[str, Any]:
    """
    CFCFRMS / NPCI Core Switch Transaction Webhook.
    Appends intermediate mule transfer edge to graph, recalculates velocity decay V_k,
    and updates active cashout window and spatial hotspot predictions.
    """
    graph_svc = get_graph_service()
    ml_svc = get_ml_service()

    sender = payload.sender_account
    receiver = payload.receiver_account
    amount = payload.amount
    utr = payload.utr
    channel = payload.payment_channel
    ts = payload.timestamp

    # 1. Ingest transaction into multigraph
    affected_complaints = graph_svc.ingest_transaction(
        utr=utr,
        sender=sender,
        receiver=receiver,
        amount=amount,
        timestamp=ts,
        channel=channel,
        complaint_id=payload.complaint_id,
        sender_dormant_days=payload.sender_dormant_days,
        receiver_dormant_days=payload.receiver_dormant_days,
        receiver_historical_median_vol=payload.receiver_historical_median_vol
    )

    logger.info(f"[+] Ingested Hop: {sender} -> {receiver} | ₹{amount} ({channel}) | UTR: {utr}")

    # 2. Recalculate predictions for affected complaints
    updated_predictions = []
    for cid in affected_complaints:
        pred = ml_svc.run_prediction_for_complaint(cid)
        updated_predictions.append(pred)

        # Check if sleeper mule anomaly was triggered and broadcast
        if pred.get("sleeper_mule_alert"):
            await broadcast_alert("ZERO_DAY_SLEEPER_ALERT", {
                "complaint_id": cid,
                "utr": utr,
                "receiver": receiver,
                "sleeper_details": pred.get("sleeper_details"),
                "advisory": pred.get("tactical_advisory")
            })

        # Broadcast update to tactical dashboard
        await broadcast_alert("GRAPH_VELOCITY_UPDATE", {
            "complaint_id": cid,
            "utr": utr,
            "sender": sender,
            "receiver": receiver,
            "amount": amount,
            "window_minutes": pred.get("window_minutes"),
            "target_h3_res8": pred.get("target_h3_res8"),
            "confidence_score": pred.get("confidence_score")
        })

    return {
        "status": "HOOK_PROCESSED",
        "utr": utr,
        "affected_complaints": affected_complaints,
        "active_prediction": updated_predictions[0] if updated_predictions else None
    }
