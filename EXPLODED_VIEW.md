# AegisCashout — Exploded Architectural View & Component Blueprint

```
========================================================================================================
                                     AEGISCASHOUT SYSTEM EXPLODED VIEW
========================================================================================================

 [ LAYER 7: INTERDICTION ]           +-----------------------------+     +----------------------------+
                                     |  Dial 112 ERSS CAD Patrol   |     |  NPCI / Bank Cash-Lock     |
                                     |  (PCR Police Dispatch)      |     |  (15-Min Security Hold)    |
                                     +--------------^--------------+     +-------------^--------------+
                                                    |                                  |
 ---------------------------------------------------|----------------------------------|----------------
 [ LAYER 6: TACTICAL UI ]                           |                                  |
                                     +--------------+----------------------------------+--------------+
                                     |                    NEXT.JS 14 WEB DASHBOARD                    |
                                     |  - AlertFeed (Threat Queue)      - TacticalMap (Leaflet GIS)   |
                                     |  - ActionPanel (Countdown/SHAP)  - Live GPS Overlay HUD        |
                                     +------------------------------^---------------------------------+
                                                                    | WebSocket / REST API
 -------------------------------------------------------------------|-----------------------------------
 [ LAYER 5: BACKEND ENGINE ]         +------------------------------+---------------------------------+
                                     |                   FASTAPI ASYNC ENGINE                         |
                                     |  - /predictions/active           - /dispatch/dial112           |
                                     |  - /simulate/heist               - /friction/bank              |
                                     |  - WebSocket Broadcaster (/ws)   - SQLite Interdicted Ledger   |
                                     +------------------------------^---------------------------------+
                                                                    | Sub-50ms Inference Pipeline
 -------------------------------------------------------------------|-----------------------------------
 [ LAYER 4: AI & ML CORE ]           +------------------------------+---------------------------------+
                                     |        STAGE 1: LightGBM         |       STAGE 2: TreeSHAP     |
                                     |    Spatial Hotspot Classifier    |     Attribution Explainer   |
                                     |    & Cashout Velocity Regressor  |   & BNSS 102 Legal Compiler |
                                     +------------------------------^---------------------------------+
                                                                    |
 -------------------------------------------------------------------|-----------------------------------
 [ LAYER 3: SPATIAL GRID ]           +------------------------------+---------------------------------+
                                     |                 UBER H3 DISCRETE GLOBAL GRID                   |
                                     |  - Resolution 8 Tessellation     - Area: ~0.737 km² per cell   |
                                     |  - Delhi-NCR Hexagons (14,000+)  - Spatial cKDTree ATM Index   |
                                     +------------------------------^---------------------------------+
                                                                    |
 -------------------------------------------------------------------|-----------------------------------
 [ LAYER 2: GRAPH ENGINE ]           +------------------------------+---------------------------------+
                                     |               NETWORKX MONEY PEELING GRAPH                     |
                                     |  - Directed Acyclic Graph        - Mule Hop Depth (Layer 1-3)  |
                                     |  - In-degree / Out-degree Ratios - Flow Velocity (₹ / second)  |
                                     +------------------------------^---------------------------------+
                                                                    |
 -------------------------------------------------------------------|-----------------------------------
 [ LAYER 1: DATA INGESTION ]         +----------------------------------------------------------------+
                                     |              NATIONAL CYBERCRIME DATA STREAMS                  |
                                     |  - Helpline 1930 / NCRP Portal   - IMPS / UPI Switching Feeds  |
                                     |  - Bank Freeze Tickets (I4C)     - ATM Telemetry & Vault State |
                                     +----------------------------------------------------------------+
========================================================================================================
```

---

## 1. Deep Layer-by-Layer Exploded Breakdown

### Layer 1: Ingestion & Signal Synthesis (`data_generator/`)
* **`data_generator/generate_dataset.py`**:
  * Simulates the Indian cybercrime ecosystem across Delhi-NCR.
  * Synthesizes **10,000+ realistic cyber fraud complaints** with ground-truth money mule networks.
  * Ingests victim reports (scam type, lost amount, timestamp, reporting latency).
  * Tracks 5,200+ actual off-site ATM locations across Delhi, Noida, Gurugram, Faridabad, and Ghaziabad.

### Layer 2: Network Topology & Money Peeling Graph (`backend/services/graph_service.py`)
* **`GraphService` Class**:
  * Maintained in-memory using `networkx.DiGraph`.
  * **Nodes:** Victim accounts, intermediary mule accounts (Layer 1, Layer 2, Layer 3), and terminating cashout accounts.
  * **Edges:** Financial transactions with timestamp, amount (₹), payment rail (IMPS/UPI), and UTR number.
  * **Dynamic Velocity Calculation:** Computes how fast money moves between hops ($\Delta t$). If ₹5 Lakhs traverses 3 accounts in 6 minutes, velocity is flagged as an anomaly.

### Layer 3: Discrete Spatial Indexing & H3 Grid Engine
* **`h3-py` / `h3-js` (Resolution 8)**:
  * Divides geographic coordinates (latitude, longitude) into uniform hexagonal cells.
  * Resolution 8 average edge length: ~461 meters; area: **0.737 km²**.
  * **`scipy.spatial.cKDTree`**: Indexes all physical ATMs into their enclosing and neighboring H3 hexagons, providing instant $O(\log N)$ nearest-neighbor spatial queries.

### Layer 4: Dual-Stage Machine Learning Core (`backend/services/ml_service.py`)
* **Stage 1 — Spatial Hotspot Classifier (LightGBM)**:
  * Features ingested: Mule hop count, transaction velocity, hour-of-day, reporting delay, ATM dispenser density, historical syndicate extraction frequency.
  * Output: Probability distribution $P(\text{Cashout} \mid \text{Hex}_i)$ across candidate cells.
* **Stage 2 — Explainability & Legal Defense Engine (TreeSHAP)**:
  * Calculates exact Shapley feature attribution values for every prediction.
  * Identifies the primary drivers (e.g., `+0.42` due to terminating mule node velocity; `+0.28` due to off-site ATM clustering).
  * Auto-generates **Section 102 BNSS court-ready briefs** to legally justify emergency freezing orders.

### Layer 5: Asynchronous Microservice Backend (`backend/`)
* **`backend/main.py`**:
  * FastAPI application configured with lifespan pre-loading.
  * Boots in-memory graph, cKDTree, and ML models at startup to maintain **$< 50\text{ms}$ latency**.
* **Routes**:
  * `backend/routes/complaints.py`: Complaint intake and status querying.
  * `backend/routes/predictions.py`: Serves active predicted hotspots and specific complaint graph traces.
  * `backend/routes/interventions.py`: Handles CAD Dial 112 dispatches and bank friction holds.
* **`backend/websocket.py`**:
  * Push-based event broadcaster broadcasting high-confidence cashout alerts to connected tactical dashboards.

### Layer 6: Tactical GIS Frontend (`frontend/`)
* **Technology**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Leaflet GIS.
* **`frontend/components/TacticalMap.tsx`**:
  * Renders CartoDB dark matter tiles (no API token required).
  * Draws H3 hexagons, ATM radar beacons, money flow polylines, and police beat patrol radii.
  * Stabilized camera controller with GPS HUD and `[RECENTER]` functionality.
* **`frontend/components/AlertFeed.tsx`**:
  * Real-time priority queue sorted by countdown urgency.
* **`frontend/components/ActionPanel.tsx`**:
  * Dedicated docked sidebar displaying countdown timer, terminating mule accounts, TreeSHAP explainability bars, and interdiction buttons.

### Layer 7: Operational Interdiction Loop
* **Physical Interdiction (Dial 112 ERSS)**:
  * Computes Euclidean distance to active PCR beat vans.
  * Assigns the closest unit (`BEAT-PCR-ROHINI-4`) and outputs an official CAD dispatch reference ID.
* **Financial Interdiction (NPCI / Bank Switch Hold)**:
  * Simulates a 15-minute emergency security friction hold on the terminating mule account.
  * Increments total **Interdicted Value (₹)** in the central command dashboard.

---

## 2. Complete File & Directory Map

```
pervekkala/
├── backend/                             # Python FastAPI Core
│   ├── main.py                          # Application entry & model preloading
│   ├── websocket.py                     # Real-time WebSocket broadcaster
│   ├── routes/
│   │   ├── complaints.py                # Complaint ingestion endpoints
│   │   ├── predictions.py               # ML inference & H3 hotspot endpoints
│   │   └── interventions.py             # Dial 112 CAD & Bank Friction APIs
│   ├── services/
│   │   ├── graph_service.py             # NetworkX money peeling graph engine
│   │   └── ml_service.py                # LightGBM + TreeSHAP pipeline
│   └── models/
│       └── schemas.py                   # Pydantic data models & contracts
│
├── frontend/                            # Next.js 14 Tactical Web Application
│   ├── app/
│   │   ├── layout.tsx                   # Root HTML shell & dark theme metadata
│   │   ├── page.tsx                     # Main tactical workspace layout
│   │   └── globals.css                  # Cyber-tactical styles & radar animations
│   ├── components/
│   │   ├── TopNav.tsx                   # Mission KPIs, status, and simulation trigger
│   │   ├── AlertFeed.tsx                # Urgency-ranked threat queue
│   │   ├── TacticalMap.tsx              # Leaflet GIS canvas with H3 hexagons & HUD
│   │   └── ActionPanel.tsx              # Docked command & explainability sidebar
│   ├── hooks/
│   │   └── useRealtimeAlerts.ts         # WebSocket client & 1-second countdown timer
│   └── types/
│       └── index.ts                     # TypeScript interfaces
│
├── data_generator/                      # Simulation & Preprocessing Pipeline
│   ├── generate_dataset.py              # NCR synthetic data generation
│   └── artifacts/                       # Pre-computed spatial and model weights
│
├── deploy/                              # Production Containerization
│   ├── Dockerfile.backend               # Python 3.11 multi-stage container
│   ├── Dockerfile.frontend              # Node 20 multi-stage container
│   └── docker-compose.yml               # Unified orchestration stack
│
├── tests/
│   └── test_e2e.py                      # Pytest end-to-end integration suite
│
├── README.md                            # Competition GitHub documentation
├── USER_GUIDE.md                        # Operator user manual & feature guide
└── EXPLODED_VIEW.md                     # This architectural blueprint
```

---

## 3. End-to-End Data Lifecycle (Step-by-Step)

```
[Citizen Call 1930] 
       │ (₹4,80,000 fraud reported)
       ▼
[NCRP Data Ingestion]
       │
       ▼
[Graph Service: DiGraph Node Created]
       │
       ├── Hop 1: Axis Bank (L1 Mule) ── 2 mins ──► Hop 2: Canara Bank (L2 Mule)
       │                                                      │
       │                                                      ▼
       │                                            Hop 3: SBI (L3 Terminating Mule)
       ▼
[Feature Extraction Engine]
       │  - Graph Velocity: 4.8L in 8.2 mins
       │  - Mule In-degree/Out-degree anomaly
       │  - Reporting Latency: 14 mins
       ▼
[Stage 1: LightGBM Spatial Classifier]
       │
       ▼
[Predicted H3 Cell: 886196a603fffff (Rohini Sec 16)]
       │  - Confidence: 84.5%
       │  - Window: 18.4 Minutes Remaining
       ▼
[Stage 2: TreeSHAP Attribution]
       │  - Cashout Velocity: +0.42
       │  - Offsite ATM Density: +0.28
       ▼
[WebSocket Broadcast: HIGH_CONFIDENCE_ALERT]
       │
       ├─────────────────────────────────────────┐
       ▼                                         ▼
[Frontend: Tactical GIS Map]              [Frontend: Action Panel]
 - Crimson H3 Hexagon highlighted         - Countdown timer starts ticking
 - Suspect ATM dispenser radar ping       - TreeSHAP factor cards displayed
 - Money flow arc drawn                   - Operator clicks:
                                             [DISPATCH DIAL 112] ──► PCR En-route (5m ETA)
                                             [BANK CASH-LOCK]    ──► ₹4,80,000 Saved
```
