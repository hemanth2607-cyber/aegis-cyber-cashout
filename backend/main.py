"""
AegisCashout: Predictive Cybercrime Analytics & Tactical Intervention Backend
FastAPI production application with lifecycle pre-loading, CORS, and WebSocket push streaming.
"""
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from backend.services.graph_service import get_graph_service
from backend.services.ml_service import get_ml_service
from backend.routes.complaints import router as complaints_router
from backend.routes.predictions import router as predictions_router
from backend.routes.interventions import router as interventions_router
from backend.routes.docket import router as docket_router
from backend.routes.surveillance import router as surveillance_router
from backend.routes.blockchain_routes import router as blockchain_router
from backend.services.hardware_bridge import hardware_router
from backend.websocket import ws_router

# Configure Structured Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("aegis.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle management.
    Pre-loads graph indexes, spatial cKDTree, and LightGBM / TreeSHAP models
    into memory on startup to enforce sub-50ms SLA on all live requests.
    """
    logger.info("[+] Starting AegisCashout Backend...")
    logger.info("[+] Pre-loading Graph Topology and Spatial cKDTree Indexes...")
    graph_svc = get_graph_service()

    logger.info("[+] Pre-loading LightGBM Regressors, Spatial Rankers, and TreeSHAP Explainers...")
    ml_svc = get_ml_service()

    # Warm-up inference
    logger.info("[+] Performing pipeline warm-up inference...")
    try:
        sample_cid = "WARMUP-INIT"
        graph_svc.register_complaint({
            "complaint_id": sample_cid,
            "victim_account": "SBIN0000000000",
            "victim_bank": "State Bank of India",
            "initial_amount": 250000.0,
            "fraud_category": "INVESTMENT_SCAM",
            "initial_utr": "UTR-WARMUP-001",
            "victim_lat": 28.6139,
            "victim_lon": 77.2090
        })
        _ = ml_svc.run_prediction_for_complaint(sample_cid)
        logger.info("[+] Warm-up inference complete. Model latency ready.")
    except Exception as e:
        logger.warning(f"[!] Warmup inference notice: {e}")

    yield

    logger.info("[-] Shutting down AegisCashout Backend...")


app = FastAPI(
    title="AegisCashout Tactical Intervention Engine",
    description="Dual-stage Predictive Analytics Framework for Cybercrime Cashout Forecasting and ERSS CAD Dispatch",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 Routers
app.include_router(complaints_router, prefix="/api/v1")
app.include_router(predictions_router, prefix="/api/v1")
app.include_router(interventions_router, prefix="/api/v1")
app.include_router(docket_router, prefix="/api/v1")
app.include_router(surveillance_router, prefix="/api/v1")
app.include_router(blockchain_router, prefix="/api/v1")
app.include_router(hardware_router)
app.include_router(ws_router)


@app.get("/")
async def root() -> Dict[str, Any]:
    return {
        "service": "AegisCashout Predictive Analytics & Tactical Intervention Engine",
        "version": "1.0.0",
        "jurisdiction": "Delhi-NCR",
        "docs_url": "/docs",
        "status": "OPERATIONAL"
    }


@app.get("/health")
@app.get("/api/v1/health")
async def health_check() -> Dict[str, Any]:
    return {
        "status": "HEALTHY",
        "graph_engine": "READY",
        "spatial_kdtree": "READY",
        "ml_inference": "READY",
        "explainer_shap": "READY"
    }


if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=False)
