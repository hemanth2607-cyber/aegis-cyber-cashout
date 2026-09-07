"""
Predictions and Tactical Intelligence Query Routes
Provides active hotspot countdowns, detailed graph traces, spatial clusters, and SHAP explainability.
"""
import logging
from typing import Dict, List, Any
from fastapi import APIRouter, HTTPException, status

from backend.schemas import PredictionResponse
from backend.services.ml_service import get_ml_service
from backend.services.graph_service import get_graph_service

logger = logging.getLogger("aegis.predictions")
router = APIRouter(tags=["Predictions & Intelligence"])


@router.get("/predictions/active")
async def get_active_predictions() -> Dict[str, Any]:
    """
    Returns all active predicted cash-out hotspots across Delhi-NCR
    with real-time countdown timers.
    """
    ml_svc = get_ml_service()
    hotspots = ml_svc.get_active_hotspots()
    return {
        "active_hotspots_count": len(hotspots),
        "hotspots": hotspots
    }


@router.get("/predictions/{complaint_id}")
async def get_prediction_for_complaint(complaint_id: str) -> Dict[str, Any]:
    """
    Retrieves full tactical forecast, hop progression, spatial clusters,
    and TreeSHAP legal brief for a specific complaint ID.
    Compatible with both standard UI frontend and Part 3C demonstration script.
    """
    ml_svc = get_ml_service()
    graph_svc = get_graph_service()

    pred = ml_svc.get_prediction(complaint_id)
    if not pred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction for complaint {complaint_id} not found. Ensure complaint was ingested."
        )

    # Attach rich graph trace for visual frontends
    graph_trace = graph_svc.get_graph_trace(complaint_id)
    response_dict = dict(pred)
    response_dict["graph_trace"] = graph_trace

    return response_dict
