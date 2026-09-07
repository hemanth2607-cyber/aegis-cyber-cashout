# AEGIS-CYBER // SIH26184

<!-- ============================================================================== -->
<!-- 1. HERO HEADER & MISSION BADGE GRID (INLINE SVG)                               -->
<!-- ============================================================================== -->

<div align="center">
<svg width="100%" height="auto" viewBox="0 0 900 200" xmlns="http://www.w3.org/2000/svg" style="max-width: 900px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <linearGradient id="heroBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070B14" />
      <stop offset="50%" stop-color="#0B132B" />
      <stop offset="100%" stop-color="#070B14" />
    </linearGradient>
    <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00F0FF" />
      <stop offset="100%" stop-color="#3B82F6" />
    </linearGradient>
    <linearGradient id="emeraldGlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#00F0FF" />
    </linearGradient>
    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1E293B" stroke-width="0.7" opacity="0.4" />
    </pattern>
    <filter id="neonBlur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Background Layer with Grid -->
  <rect width="900" height="200" rx="12" fill="url(#heroBg)" stroke="#1E293B" stroke-width="1.5" />
  <rect width="900" height="200" rx="12" fill="url(#grid)" />

  <!-- Corner Tactical Crosshairs -->
  <path d="M 16 28 L 28 28 M 28 16 L 28 28" stroke="#00F0FF" stroke-width="2" opacity="0.8" />
  <path d="M 884 28 L 872 28 M 872 16 L 872 28" stroke="#00F0FF" stroke-width="2" opacity="0.8" />
  <path d="M 16 172 L 28 172 M 28 184 L 28 172" stroke="#00F0FF" stroke-width="2" opacity="0.8" />
  <path d="M 884 172 L 872 172 M 872 184 L 872 172" stroke="#00F0FF" stroke-width="2" opacity="0.8" />

  <!-- Tactical Radar Icon Ring -->
  <circle cx="75" cy="85" r="32" fill="#0E172A" stroke="#00F0FF" stroke-width="1.5" opacity="0.9" />
  <circle cx="75" cy="85" r="22" fill="none" stroke="#3B82F6" stroke-width="1" stroke-dasharray="3,3" opacity="0.7" />
  <circle cx="75" cy="85" r="6" fill="#10B981" filter="url(#neonBlur)" />
  <line x1="75" y1="53" x2="75" y2="117" stroke="#00F0FF" stroke-width="1" opacity="0.3" />
  <line x1="43" y1="85" x2="107" y2="85" stroke="#00F0FF" stroke-width="1" opacity="0.3" />

  <!-- Main Titles -->
  <text x="125" y="68" fill="#FFFFFF" font-size="28" font-weight="900" letter-spacing="2.5">
    AEGIS-CYBER <tspan fill="url(#cyanGlow)">// SIH26184</tspan>
  </text>
  <text x="125" y="94" fill="#94A3B8" font-size="13" font-weight="500" letter-spacing="0.5">
    Predictive Analytics Framework to Forecast Cybercrime Cash-Out Extraction Locations in Advance
  </text>
  <text x="125" y="112" fill="#64748B" font-size="11" font-weight="400" letter-spacing="0.3">
    National Cybercrime Reporting Portal (1930 NCRP) • I4C • Ministry of Home Affairs (MHA)
  </text>

  <!-- Mission Badge Pill Grid -->
  <!-- Badge 1: MHA / I4C Aligned -->
  <rect x="125" y="136" width="158" height="28" rx="6" fill="#064E3B" fill-opacity="0.4" stroke="#10B981" stroke-width="1" />
  <circle cx="138" cy="150" r="4" fill="#10B981" />
  <text x="148" y="154" fill="#6EE7B7" font-size="10.5" font-weight="700" letter-spacing="0.4">MHA / I4C ALIGNED</text>

  <!-- Badge 2: Spatio-Temporal ML -->
  <rect x="293" y="136" width="168" height="28" rx="6" fill="#1E3A8A" fill-opacity="0.4" stroke="#3B82F6" stroke-width="1" />
  <circle cx="306" cy="150" r="4" fill="#3B82F6" />
  <text x="316" y="154" fill="#93C5FD" font-size="10.5" font-weight="700" letter-spacing="0.4">SPATIO-TEMPORAL ML</text>

  <!-- Badge 3: Uber H3 Hexagonal Indexing -->
  <rect x="471" y="136" width="186" height="28" rx="6" fill="#78350F" fill-opacity="0.4" stroke="#F59E0B" stroke-width="1" />
  <circle cx="484" cy="150" r="4" fill="#F59E0B" />
  <text x="494" y="154" fill="#FCD34D" font-size="10.5" font-weight="700" letter-spacing="0.4">UBER H3 RESOLUTION 8/9</text>

  <!-- Badge 4: Sub-50ms Inference -->
  <rect x="667" y="136" width="170" height="28" rx="6" fill="#4C1D95" fill-opacity="0.4" stroke="#A855F7" stroke-width="1" />
  <circle cx="680" cy="150" r="4" fill="#A855F7" />
  <text x="690" y="154" fill="#D8B4FE" font-size="10.5" font-weight="700" letter-spacing="0.4">SUB-50MS DUAL STAGE</text>
</svg>
</div>

<br/>

> **Smart India Hackathon (SIH 2024)**  
> **Problem Statement ID**: `SIH26184`  
> **Organization**: Indian Cyber Crime Coordination Centre (I4C), Ministry of Home Affairs (MHA)  
> **Category**: Software | **Domain**: Cyber Security / Predictive Law Enforcement Analytics

---

## 2. The Problem: "The Golden Hour Breakdown"

In contemporary financial cyber fraud (Digital Arrest scams, APK-based Trojan sweeps, fake investment advisories, and task-based extortion), money mules do not sit on stolen funds. Within seconds of siphoning capital from a victim, **automated Layer 1 to Layer 3 rapid peeling chains** disperse the funds into micro-tranches before couriers physically pull banknotes from off-site ATM dispensers or Bank Mitra (AEPS/CSP) kiosks.

The critical vulnerability of the current cyber defense posture is **latency**:
- **The Physical Cash-Out Window**: Mules complete physical cash extraction within **15 to 45 minutes** of the initial fraud execution.
- **The Reactive Enforcement Lag**: Traditional manual investigations take **4 to 6 hours** for jurisdictional verification, bank nodal officer emails, and manual account freezes—long after the cash has evaporated into the shadow economy.

### Legacy Reactive Flow vs. Aegis Proactive Interception

<!-- ============================================================================== -->
<!-- 2. THE GOLDEN HOUR TIMELINE (INLINE SVG)                                       -->
<!-- ============================================================================== -->

<div align="center">
<svg width="100%" height="auto" viewBox="0 0 900 260" xmlns="http://www.w3.org/2000/svg" style="max-width: 900px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <linearGradient id="timelineBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090D1A" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>
    <filter id="redGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="greenGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Container Box -->
  <rect width="900" height="260" rx="12" fill="url(#timelineBg)" stroke="#1E293B" stroke-width="1.5" />

  <!-- Header Title -->
  <text x="32" y="36" fill="#F8FAFC" font-size="14" font-weight="800" letter-spacing="1">
    OPERATIONAL INTERVENTION TIMELINE: THE CRITICAL 45-MINUTE WINDOW
  </text>
  <text x="730" y="36" fill="#94A3B8" font-size="11" font-weight="600" font-family="monospace">
    DELHI-NCR SECTOR
  </text>

  <!-- ==================== TOP TRACK: AEGIS PROACTIVE (EMERALD) ==================== -->
  <rect x="32" y="58" width="836" height="82" rx="8" fill="#064E3B" fill-opacity="0.18" stroke="#10B981" stroke-width="1" />
  
  <text x="48" y="78" fill="#10B981" font-size="11" font-weight="800" letter-spacing="0.5">
    AEGIS PROACTIVE INTERVENTION PIPELINE [PREDICTIVE DISPATCH]
  </text>

  <!-- Path Line -->
  <line x1="70" y1="108" x2="810" y2="108" stroke="#10B981" stroke-width="2.5" opacity="0.8" />

  <!-- Node 1: T=0m -->
  <circle cx="70" cy="108" r="7" fill="#10B981" filter="url(#greenGlow)" />
  <text x="70" y="128" fill="#E2E8F0" font-size="10" font-weight="700" text-anchor="middle">T + 0m</text>
  <text x="70" y="140" fill="#94A3B8" font-size="9" text-anchor="middle">1930 Ingest</text>

  <!-- Node 2: T=5m -->
  <circle cx="250" cy="108" r="6" fill="#10B981" />
  <text x="250" y="128" fill="#E2E8F0" font-size="10" font-weight="700" text-anchor="middle">T + 5m</text>
  <text x="250" y="140" fill="#94A3B8" font-size="9" text-anchor="middle">Graph Traversal</text>

  <!-- Node 3: T=12m -->
  <circle cx="440" cy="108" r="6" fill="#00F0FF" filter="url(#greenGlow)" />
  <text x="440" y="128" fill="#E2E8F0" font-size="10" font-weight="700" text-anchor="middle">T + 12m</text>
  <text x="440" y="140" fill="#00F0FF" font-size="9" font-weight="700" text-anchor="middle">H3 Hex Ranked</text>

  <!-- Node 4: T=20m -->
  <circle cx="630" cy="108" r="6" fill="#10B981" />
  <text x="630" y="128" fill="#E2E8F0" font-size="10" font-weight="700" text-anchor="middle">T + 20m</text>
  <text x="630" y="140" fill="#94A3B8" font-size="9" text-anchor="middle">Dial 112 CAD</text>

  <!-- Node 5: T=35m SUCCESS -->
  <circle cx="810" cy="108" r="9" fill="#10B981" filter="url(#greenGlow)" />
  <text x="810" y="128" fill="#6EE7B7" font-size="10.5" font-weight="900" text-anchor="middle">T + 35m</text>
  <text x="810" y="140" fill="#10B981" font-size="9.5" font-weight="800" text-anchor="middle">FUNDS INTERCEPTED</text>


  <!-- ==================== BOTTOM TRACK: LEGACY REACTIVE (RED) ==================== -->
  <rect x="32" y="154" width="836" height="82" rx="8" fill="#7F1D1D" fill-opacity="0.18" stroke="#EF4444" stroke-width="1" />
  
  <text x="48" y="174" fill="#EF4444" font-size="11" font-weight="800" letter-spacing="0.5">
    CURRENT LEGACY SYSTEM [MANUAL INVESTIGATION ESCALATION]
  </text>

  <!-- Path Line -->
  <line x1="70" y1="204" x2="810" y2="204" stroke="#EF4444" stroke-width="2.5" opacity="0.6" stroke-dasharray="5,5" />

  <!-- Node 1: T=0m -->
  <circle cx="70" cy="204" r="6" fill="#EF4444" />
  <text x="70" y="224" fill="#E2E8F0" font-size="10" font-weight="700" text-anchor="middle">T + 0m</text>
  <text x="70" y="236" fill="#94A3B8" font-size="9" text-anchor="middle">Fraud Siphoned</text>

  <!-- Node 2: T=35m -->
  <circle cx="280" cy="204" r="7" fill="#EF4444" filter="url(#redGlow)" />
  <text x="280" y="224" fill="#FCA5A5" font-size="10" font-weight="800" text-anchor="middle">T + 35m</text>
  <text x="280" y="236" fill="#EF4444" font-size="9" font-weight="700" text-anchor="middle">ATM Cash Out Complete</text>

  <!-- Node 3: T=90m -->
  <circle cx="480" cy="204" r="6" fill="#EF4444" opacity="0.8" />
  <text x="480" y="224" fill="#E2E8F0" font-size="10" font-weight="700" text-anchor="middle">T + 90m</text>
  <text x="480" y="236" fill="#94A3B8" font-size="9" text-anchor="middle">Victim Files Report</text>

  <!-- Node 4: T=240m -->
  <circle cx="660" cy="204" r="6" fill="#EF4444" opacity="0.8" />
  <text x="660" y="224" fill="#E2E8F0" font-size="10" font-weight="700" text-anchor="middle">T + 4-6 hrs</text>
  <text x="660" y="236" fill="#94A3B8" font-size="9" text-anchor="middle">Nodal Bank Email</text>

  <!-- Node 5: T=360m+ -->
  <circle cx="810" cy="204" r="7" fill="#EF4444" />
  <text x="810" y="224" fill="#FCA5A5" font-size="10" font-weight="800" text-anchor="middle">T + 6 hrs+</text>
  <text x="810" y="236" fill="#EF4444" font-size="9" font-weight="800" text-anchor="middle">EMPTY ACCOUNT FROZEN</text>
</svg>
</div>

---

## SECTION 1: EXTRACTED INTELLIGENCE DOCTRINE & OPERATIONAL ANSWERS

### 1. The Core Misconception: Why Victim Location ≠ Cash-Out Location
* **The Root Cause:** Organized cybercrime syndicates decouple the victim acquisition layer from the physical cash liquidation layer. A victim losing money in Chennai while a cash runner extracts notes from an ATM in Goa is standard operational tradecraft.
* **The Algorithmic Failure:** Any model that queries for ATMs in proximity to the victim’s location in Chennai will fail 100% of the time.
* **The Paradigm Shift:** The victim's geographic location is exclusively treated as the incident root node ($v_0$). The predictive framework tracks the terminating mule entity ($v_k$) where physical cashout occurs.

### 2. The Three Telemetric Bridges Connecting Chennai to Goa
The predictive framework shifts its spatial search centroid from Chennai to Goa using three digital and financial telemetry vectors:
1. **Device & App Telemetry (Real-Time Sensor Anchor):** Layer-3 and Layer-4 mules access mobile banking or UPI applications to verify fund arrival before traveling to an ATM. That app login emits network telemetry (IP subnet, ISP operating circle, BTS cell-tower ping) originating from a telecom circle in Goa, instantly resetting the spatial search anchor to that territory.
2. **Mule KYC & Debit Node (Structural Spatial Anchor):** Terminating accounts receiving split funds typically have branch records, registered residential addresses, or debit card delivery PIN codes mapped to specific geographic clusters (e.g., Margao, Panaji).
3. **Syndicate Behavioral Footprint (Graph ML Spatial Anchor):** Syndicates operate across repeatable laundering corridors. Graph embeddings (Node2Vec / GraphSAGE) link entry nodes in Chennai to historical complaint subgraphs that consistently liquidate in high-turnover tourist and commercial corridors.

### 3. Adversary Rationale: Why Syndicates Cash Out in Destinations Like Goa
Adversary behavioral modeling shows syndicates favor tourist corridors due to three operational advantages:
* **High ATM Liquidity:** Tourist and entertainment corridors feature heavily stocked ATMs with frequent cash replenishment schedules.
* **Transient Crowd Anonymity:** A mule runner conducting multiple rapid withdrawals with structured debit cards blends into dense tourist foot traffic without alerting local security or bank staff.
* **Exploitation of Inter-State Jurisdictional Friction:** Syndicates rely on the fact that local police (e.g., Tamil Nadu Police) face jurisdictional boundaries, inter-state transit permissions, and manual coordination delays that traditionally take days to resolve.

### 4. How Aegis Solves the Cross-Border Problem
* **Decoupled Jurisdictional Alerting:** Because the system operates centrally at the national I4C / NCRP telemetry layer, it bypasses inter-state administrative friction. The moment a target H3 hexagon in Goa is forecasted, the system issues an automated dispatch payload directly to the Goa Police Emergency Response Support System (ERSS Dial 112) CAD console.
* **Targeted Digital Containment (Card-Session Layer):** Aegis triggers an immediate API request to the NPCI / Core Banking Switch, deploying a 15-minute micro-delay or dynamic step-up authentication hold on the specific card session. The physical ATM remains 100% operational for the public, while the runner's transaction is stalled, eliminating their escape margin.

### 5. SIH Evaluation Jury Defense Pitch
> *"Our model does not look for ATMs near the victim. In over 90% of organized cyber financial crimes, victims and cash-out points are separated by hundreds or thousands of kilometers. Aegis uses the victim complaint strictly as the root node to traverse the multi-hop mule graph. The spatial ranker dynamically anchors on the terminating mule account's digital telemetry, device IP cluster, and syndicate graph patterns—in this case, forecasting the cash-out in Goa while alerting Goa's Dial 112 CAD within milliseconds of a report filed in Chennai."*

---

## 3. Core System Architecture

Aegis is architected as an asynchronous, event-driven pipeline split into four discrete, highly decoupled operational tiers executing under strict sub-50ms inference SLAs:

1. **Ingestion & CFCFRMS Telemetry Rail**: Captures 1930 NCRP incident tickets and streams real-time NPCI/bank webhook callbacks.
2. **Graph Topology & Mule Trajectory Engine**: Traverses multi-hop downstream cash splits, computing formal velocity decay $\mathcal{V}_k$ and leaf accounts.
3. **Dual-Stage ML & TreeSHAP Core**: LightGBM regression computes the cashout horizon $\hat{T}$, while a LambdaMART ranker scores Uber H3 Res 8 hexagons based on runner attractiveness utility.
4. **Actionable Intervention Layer**: Dispatches emergency CAD beat units via ERSS Dial 112, triggers NPCI switch holds, and streams live tactical telemetry to operator command consoles.

<!-- ============================================================================== -->
<!-- 3. CORE SYSTEM ARCHITECTURE DIAGRAM (INLINE SVG)                               -->
<!-- ============================================================================== -->

<div align="center">
<svg width="100%" height="auto" viewBox="0 0 900 530" xmlns="http://www.w3.org/2000/svg" style="max-width: 900px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#111827" />
      <stop offset="100%" stop-color="#1E293B" />
    </linearGradient>
    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#00F0FF" />
    </marker>
    <marker id="arrowEmerald" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#10B981" />
    </marker>
  </defs>

  <!-- Canvas -->
  <rect width="900" height="530" rx="14" fill="#070B14" stroke="#1E293B" stroke-width="1.5" />
  
  <text x="36" y="36" fill="#F8FAFC" font-size="16" font-weight="900" letter-spacing="1">
    AEGIS-CYBER END-TO-END PIPELINE ARCHITECTURE
  </text>
  <text x="36" y="54" fill="#64748B" font-size="11" font-weight="500">
    High-Throughput Reactive Microservice Topology • Sub-50ms Execution Target
  </text>

  <!-- ==================== TIER 1: INGESTION ==================== -->
  <rect x="36" y="75" width="828" height="85" rx="8" fill="url(#cardGrad)" stroke="#374151" stroke-width="1" />
  <rect x="36" y="75" width="6" height="85" rx="3" fill="#3B82F6" />
  <text x="56" y="96" fill="#60A5FA" font-size="12" font-weight="800">TIER 1 // INGESTION &amp; TELEMETRY STREAMING RAIL</text>

  <!-- Box 1A -->
  <rect x="56" y="108" width="240" height="42" rx="6" fill="#0B132B" stroke="#1E293B" />
  <text x="70" y="126" fill="#F8FAFC" font-size="11" font-weight="700">1930 NCRP Ingest API</text>
  <text x="70" y="140" fill="#94A3B8" font-size="9.5">Victim Account, Bank, Loss, Coords</text>

  <!-- Box 1B -->
  <rect x="330" y="108" width="240" height="42" rx="6" fill="#0B132B" stroke="#1E293B" />
  <text x="344" y="126" fill="#F8FAFC" font-size="11" font-weight="700">CFCFRMS Webhook Hook</text>
  <text x="344" y="140" fill="#94A3B8" font-size="9.5">Multi-Hop IMPS/UPI Money Trail</text>

  <!-- Box 1C -->
  <rect x="604" y="108" width="240" height="42" rx="6" fill="#0B132B" stroke="#1E293B" />
  <text x="618" y="126" fill="#F8FAFC" font-size="11" font-weight="700">ATM &amp; CSP Network Feed</text>
  <text x="618" y="140" fill="#94A3B8" font-size="9.5">1,500 Delhi-NCR Cash Terminals</text>

  <!-- Arrow T1 -> T2 -->
  <line x1="450" y1="160" x2="450" y2="185" stroke="#00F0FF" stroke-width="2" marker-end="url(#arrow)" />

  <!-- ==================== TIER 2: GRAPH & SPATIAL ENGINE ==================== -->
  <rect x="36" y="188" width="828" height="92" rx="8" fill="url(#cardGrad)" stroke="#374151" stroke-width="1" />
  <rect x="36" y="188" width="6" height="92" rx="3" fill="#00F0FF" />
  <text x="56" y="209" fill="#00F0FF" font-size="12" font-weight="800">TIER 2 // IN-MEMORY GRAPH TOPOLOGY &amp; SPATIAL ENRICHMENT ENGINE</text>

  <!-- Box 2A -->
  <rect x="56" y="222" width="250" height="46" rx="6" fill="#0B132B" stroke="#1E293B" />
  <text x="70" y="241" fill="#F8FAFC" font-size="11" font-weight="700">CybercrimeGraphEngine</text>
  <text x="70" y="256" fill="#94A3B8" font-size="9.5">MultiDiGraph • Downstream BFS Trajectory</text>

  <!-- Box 2B -->
  <rect x="330" y="222" width="240" height="46" rx="6" fill="#0B132B" stroke="#1E293B" />
  <text x="344" y="241" fill="#F8FAFC" font-size="11" font-weight="700">Velocity Decay Estimator</text>
  <text x="344" y="256" fill="#94A3B8" font-size="9.5">V_k = Product(Retention) * exp(-lambda*dt)</text>

  <!-- Box 2C -->
  <rect x="594" y="222" width="250" height="46" rx="6" fill="#0B132B" stroke="#1E293B" />
  <text x="608" y="241" fill="#F8FAFC" font-size="11" font-weight="700">SpatialEnricher (H3 + cKDTree)</text>
  <text x="608" y="256" fill="#94A3B8" font-size="9.5">Hex Resolution 8 &amp; 9 • Police/Highway Dist</text>

  <!-- Arrow T2 -> T3 -->
  <line x1="450" y1="280" x2="450" y2="305" stroke="#00F0FF" stroke-width="2" marker-end="url(#arrow)" />

  <!-- ==================== TIER 3: DUAL-STAGE ML ENGINE ==================== -->
  <rect x="36" y="308" width="828" height="98" rx="8" fill="url(#cardGrad)" stroke="#374151" stroke-width="1" />
  <rect x="36" y="308" width="6" height="98" rx="3" fill="#A855F7" />
  <text x="56" y="329" fill="#C084FC" font-size="12" font-weight="800">TIER 3 // DUAL-STAGE PREDICTIVE FORECASTER &amp; TREESHAP EXPLAINER</text>

  <!-- Box 3A -->
  <rect x="56" y="342" width="250" height="52" rx="6" fill="#0B132B" stroke="#1E293B" />
  <text x="70" y="360" fill="#F8FAFC" font-size="11" font-weight="700">Stage 1: LightGBM Regressor</text>
  <text x="70" y="374" fill="#A855F7" font-size="9.5" font-weight="700">Time-to-Cashout Horizon Delta t</text>
  <text x="70" y="386" fill="#94A3B8" font-size="9">Validation MAE: 10.78 min (&lt; 15m SLA)</text>

  <!-- Box 3B -->
  <rect x="330" y="342" width="250" height="52" rx="6" fill="#0B132B" stroke="#1E293B" />
  <text x="344" y="360" fill="#F8FAFC" font-size="11" font-weight="700">Stage 2: LambdaMART Ranker</text>
  <text x="344" y="374" fill="#A855F7" font-size="9.5" font-weight="700">Uber H3 Res 8 Spatial Ranking</text>
  <text x="344" y="386" fill="#94A3B8" font-size="9">NDCG@3: 0.653 | Top-3 Recall: 82.04%</text>

  <!-- Box 3C -->
  <rect x="604" y="342" width="240" height="52" rx="6" fill="#0B132B" stroke="#1E293B" />
  <text x="618" y="360" fill="#F8FAFC" font-size="11" font-weight="700">TacticalSHAPExplainer</text>
  <text x="618" y="374" fill="#A855F7" font-size="9.5" font-weight="700">TreeSHAP Local Attribution</text>
  <text x="618" y="386" fill="#94A3B8" font-size="9">Section 106/107 BNSS &amp; BNS Legal Brief</text>

  <!-- Arrow T3 -> T4 -->
  <line x1="450" y1="406" x2="450" y2="431" stroke="#10B981" stroke-width="2" marker-end="url(#arrowEmerald)" />

  <!-- ==================== TIER 4: ACTIONABLE INTERVENTION ==================== -->
  <rect x="36" y="434" width="828" height="78" rx="8" fill="url(#cardGrad)" stroke="#10B981" stroke-width="1.2" />
  <rect x="36" y="434" width="6" height="78" rx="3" fill="#10B981" />
  <text x="56" y="454" fill="#10B981" font-size="12" font-weight="800">TIER 4 // ACTIONABLE LAW ENFORCEMENT &amp; CORE BANKING COUNTERMEASURES</text>

  <!-- Box 4A -->
  <rect x="56" y="464" width="250" height="38" rx="6" fill="#064E3B" fill-opacity="0.3" stroke="#10B981" stroke-width="0.8" />
  <text x="70" y="480" fill="#F8FAFC" font-size="11" font-weight="700">ERSS Dial 112 CAD Dispatch</text>
  <text x="70" y="493" fill="#6EE7B7" font-size="9.5">Beat PCR Geofence (ETA ~6.2 mins)</text>

  <!-- Box 4B -->
  <rect x="330" y="464" width="250" height="38" rx="6" fill="#064E3B" fill-opacity="0.3" stroke="#10B981" stroke-width="0.8" />
  <text x="344" y="480" fill="#F8FAFC" font-size="11" font-weight="700">Bank Switch Micro-Delay</text>
  <text x="344" y="493" fill="#6EE7B7" font-size="9.5">ATM Hold (15 Min Window / Step-Up Auth)</text>

  <!-- Box 4C -->
  <rect x="604" y="464" width="240" height="38" rx="6" fill="#064E3B" fill-opacity="0.3" stroke="#10B981" stroke-width="0.8" />
  <text x="618" y="480" fill="#F8FAFC" font-size="11" font-weight="700">Next.js 14 Command Center</text>
  <text x="618" y="493" fill="#6EE7B7" font-size="9.5">Live WebSocket Hotspot Radar Feed</text>
</svg>
</div>

---

## 4. Multi-Hop Money Flow & Spatial Prediction Cone

When cyber criminals siphon funds, they employ automated laundering structures. Aegis tracks the transaction dispersion tree from the victim's node down to terminating mule couriers, dynamically projecting a **kinematic travel isochrone** based on urban traffic velocity ($d \le 35\text{ km/h} \times \hat{T}$).

<!-- ============================================================================== -->
<!-- 4. MULTI-HOP MONEY FLOW & H3 CONE (INLINE SVG)                                 -->
<!-- ============================================================================== -->

<div align="center">
<svg width="100%" height="auto" viewBox="0 0 900 310" xmlns="http://www.w3.org/2000/svg" style="max-width: 900px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <linearGradient id="coneGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.6" />
      <stop offset="50%" stop-color="#F59E0B" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#EF4444" stop-opacity="0.15" />
    </linearGradient>
    <filter id="atmGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <rect width="900" height="310" rx="14" fill="#080D1A" stroke="#1E293B" stroke-width="1.5" />
  <text x="32" y="32" fill="#F8FAFC" font-size="14" font-weight="800" letter-spacing="0.8">
    MULE GRAPH TRAVERSAL &amp; KINEMATIC EXTRACTION CONE
  </text>
  <text x="32" y="48" fill="#64748B" font-size="10.5">
    Propagation from Victim Node to High-Risk Uber H3 Res 8 Extraction Hexagon
  </text>

  <!-- ==================== GRAPH LAYER (LEFT) ==================== -->
  <!-- Victim Node -->
  <circle cx="80" cy="160" r="24" fill="#0F172A" stroke="#3B82F6" stroke-width="2.5" />
  <text x="80" y="157" fill="#60A5FA" font-size="10" font-weight="800" text-anchor="middle">VICTIM</text>
  <text x="80" y="171" fill="#FFFFFF" font-size="9" font-weight="700" text-anchor="middle">&#8377;7.50L</text>
  <text x="80" y="200" fill="#94A3B8" font-size="9" text-anchor="middle">New Delhi</text>

  <!-- Hop 1 Arrow -->
  <line x1="104" y1="160" x2="186" y2="160" stroke="#3B82F6" stroke-width="2" stroke-dasharray="4,3" />
  <text x="145" y="152" fill="#94A3B8" font-size="8.5" text-anchor="middle">IMPS</text>

  <!-- Layer 1 Mule -->
  <circle cx="210" cy="160" r="22" fill="#0F172A" stroke="#F59E0B" stroke-width="2" />
  <text x="210" y="157" fill="#FBBF24" font-size="9.5" font-weight="800" text-anchor="middle">MULE L1</text>
  <text x="210" y="171" fill="#FFFFFF" font-size="8.5" text-anchor="middle">Punjab NB</text>

  <!-- Hop 2 Split Arrows -->
  <line x1="232" y1="150" x2="310" y2="115" stroke="#F59E0B" stroke-width="1.8" stroke-dasharray="4,3" />
  <text x="265" y="125" fill="#94A3B8" font-size="8.5" text-anchor="middle">&#8377;2.50L</text>

  <line x1="232" y1="170" x2="310" y2="205" stroke="#64748B" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.6" />
  <text x="265" y="198" fill="#64748B" font-size="8" text-anchor="middle">&#8377;2.40L</text>

  <!-- Layer 2 Mules -->
  <circle cx="330" cy="115" r="18" fill="#0F172A" stroke="#F59E0B" stroke-width="2" />
  <text x="330" y="118" fill="#FBBF24" font-size="8.5" font-weight="800" text-anchor="middle">MULE L2</text>
  <text x="330" y="145" fill="#94A3B8" font-size="8" text-anchor="middle">HDFC Bank</text>

  <circle cx="330" cy="205" r="16" fill="#0F172A" stroke="#64748B" stroke-width="1.2" opacity="0.6" />
  <text x="330" y="209" fill="#94A3B8" font-size="8" text-anchor="middle">ICICI</text>

  <!-- Hop 3 to Terminating Mule L3 -->
  <line x1="348" y1="115" x2="428" y2="140" stroke="#EF4444" stroke-width="2.5" />
  <text x="390" y="120" fill="#EF4444" font-size="8.5" font-weight="700" text-anchor="middle">&#8377;2.45L</text>

  <!-- Terminating Mule L3 (Origin of Extraction) -->
  <circle cx="450" cy="145" r="22" fill="#1E1B4B" stroke="#EF4444" stroke-width="2.5" />
  <text x="450" y="142" fill="#F87171" font-size="9.5" font-weight="900" text-anchor="middle">MULE L3</text>
  <text x="450" y="156" fill="#FFFFFF" font-size="8" text-anchor="middle">Debit Card</text>
  <text x="450" y="180" fill="#EF4444" font-size="8.5" font-weight="700" text-anchor="middle">LAST KNOWN PING</text>

  <!-- ==================== KINEMATIC CONE ==================== -->
  <polygon points="472,145 610,65 610,245" fill="url(#coneGrad)" />
  <text x="545" y="140" fill="#CBD5E1" font-size="10" font-weight="700" text-anchor="middle">Kinematic Reach</text>
  <text x="545" y="154" fill="#94A3B8" font-size="8.5" text-anchor="middle">d &lt;= 35 km/h * T_hat</text>

  <!-- ==================== UBER H3 HEXAGONS (RIGHT) ==================== -->
  <!-- Hexagon 1 (Top Ambient Hex) -->
  <polygon points="660,70 690,53 720,70 720,105 690,122 660,105" fill="#1E293B" stroke="#475569" stroke-width="1" opacity="0.6" />
  <text x="690" y="90" fill="#94A3B8" font-size="8" text-anchor="middle">P = 12%</text>

  <!-- Hexagon 2 (Secondary Target Hex) -->
  <polygon points="620,140 650,123 680,140 680,175 650,192 620,175" fill="#78350F" fill-opacity="0.4" stroke="#F59E0B" stroke-width="1.5" />
  <text x="650" y="160" fill="#FCD34D" font-size="8.5" font-weight="700" text-anchor="middle">P = 24%</text>

  <!-- Hexagon 3 (Bottom Ambient Hex) -->
  <polygon points="660,210 690,193 720,210 720,245 690,262 660,245" fill="#1E293B" stroke="#475569" stroke-width="1" opacity="0.6" />
  <text x="690" y="230" fill="#94A3B8" font-size="8" text-anchor="middle">P = 8%</text>

  <!-- Hexagon 4: PRIMARY TARGET HEX (Crimson Highlighted) -->
  <polygon points="720,140 755,120 790,140 790,180 755,200 720,180" fill="#7F1D1D" fill-opacity="0.65" stroke="#EF4444" stroke-width="2.5" />
  <text x="755" y="152" fill="#FCA5A5" font-size="9" font-weight="900" text-anchor="middle">TARGET HEX (Res 8)</text>
  <text x="755" y="166" fill="#FFFFFF" font-size="9" font-weight="800" text-anchor="middle">883da18da3fffff</text>
  <text x="755" y="180" fill="#EF4444" font-size="10" font-weight="900" text-anchor="middle">P = 82.4%</text>

  <!-- Radar Pulse Marker on Target ATM -->
  <circle cx="755" cy="140" r="14" fill="none" stroke="#EF4444" stroke-width="1.5" filter="url(#atmGlow)" />
  <circle cx="755" cy="140" r="4" fill="#EF4444" />

  <!-- Police Intercept Vector -->
  <path d="M 870 260 C 830 220, 800 180, 765 146" fill="none" stroke="#00F0FF" stroke-width="2.5" stroke-dasharray="5,4" />
  <rect x="800" y="252" width="85" height="28" rx="5" fill="#082F49" stroke="#00F0FF" stroke-width="1" />
  <text x="842" y="266" fill="#38BDF8" font-size="8.5" font-weight="800" text-anchor="middle">BEAT-PCR-4</text>
  <text x="842" y="276" fill="#FFFFFF" font-size="7.5" text-anchor="middle">ETA 6.2 mins</text>
</svg>
</div>

---

## 5. Technology Stack Architecture

AegisCashout is built on a sovereign, zero-external-API, air-gappable architecture engineered for high-throughput stream processing, sub-50ms inference latency, and institutional courtroom compliance.

```
+----------------------------------------------------------------------------------------------------+
|                                  AEGIS-CYBER TECHNOLOGY ECOSYSTEM                                  |
+---------------------------------+----------------------------------+-------------------------------+
|     FRONTEND ARCHITECTURE       |       BACKEND MICROSERVICE       |      AI & SPATIAL ENGINE      |
|  - Next.js 14 (App Router)      |  - Python 3.11 / 3.12            |  - LightGBM Regressor (S1)    |
|  - TypeScript 5.x (Strict)      |  - FastAPI (Async ASGI)          |  - LGBMRanker / LambdaMART(S2)|
|  - Leaflet GIS & React-Leaflet  |  - Uvicorn High-Perf Server      |  - TreeSHAP Explainable AI    |
|  - CartoDB Dark Matter Basemap  |  - Pydantic v2 Contract Layer    |  - Uber H3 v4 Discrete Grid   |
|  - Uber h3-js Hex Mesh          |  - Starlette WebSockets Hub      |  - SciPy cKDTree 3D Spatial   |
|  - Tailwind CSS + Tactical HUD  |  - In-Memory Lifespan Cache      |  - NetworkX Peeling Multigraph|
|  - Lucide React Iconography     |  - Async Task Broadcasting       |  - Polars Vectorized Features |
+---------------------------------+----------------------------------+-------------------------------+
|                           DEPLOYMENT, INFRASTRUCTURE & VERIFICATION                                |
|  - Docker Multi-Stage (Alpine/Slim) | Docker Compose | Pytest Suite (25/25 Tests Passed) | Redis 7     |
+----------------------------------------------------------------------------------------------------+
```

### 5.1 Comprehensive Technology Matrix

| Layer / Domain | Technology | Version / Spec | Tactical Purpose & Production Benchmark |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **Next.js** | `v14.2+` (App Router) | Hybrid Server/Client component tree; zero-layout-shift UI; server-side metadata optimization. |
| **Language & Typing** | **TypeScript** | `v5.0+` (Strict Mode) | End-to-end compile-time type safety; strict schema parity with backend Pydantic models. |
| **Tactical GIS Canvas** | **Leaflet & React-Leaflet** | `v1.9.4` | High-fps hardware-accelerated 2D GIS canvas; zero commercial API keys required. |
| **Tactical Basemap** | **CartoDB Dark Matter** | Open Access (OSM) | Sovereign, free, high-contrast dark theme tiles optimized for tactical operations centers. |
| **Hexagonal Grid Engine** | **Uber H3 (Web)** | `h3-js v4.1+` | Client-side boundary polyline calculation and dynamic GeoJSON rendering of Res 8/9 cells. |
| **Styling & UI Aesthetics** | **Tailwind CSS & Vanilla CSS**| `v3.4+` | Glassmorphic HUD telemetry, pulsating radar keyframe animations, and high-contrast tactical badges. |
| **Real-Time Client Streaming**| **Native WebSockets** | W3C Standard | Custom `useRealtimeAlerts` hook featuring auto-reconnect, 1-second countdown tickers, and state sync. |
| **Iconography & Glyphs** | **Lucide React** | Latest | Vector iconography for police beat units, ATM dispensers, cash locks, and threat urgency tiers. |
| **Backend Framework** | **FastAPI** | `v0.110+` | Asynchronous ASGI framework; non-blocking coroutines delivering sub-5ms internal route latency. |
| **ASGI Web Server** | **Uvicorn** | `v0.29+` (uvloop/httptools) | Production-grade asynchronous server handling concurrent telemetry webhooks and streaming sockets. |
| **Data Validation & Schemas** | **Pydantic** | `v2.6+` | Strict serialization, runtime type validation, alias mapping (`sender`/`sender_account`), and OpenAPI docs. |
| **WebSocket Broadcast Hub** | **Starlette WebSockets** | ASGI Event Bus | Connection manager managing real-time broadcast of `HIGH_CONFIDENCE_CASHOUT_ALERT` events. |
| **Application State Management**| **In-Memory Singleton** | Thread-safe RAM Cache | `GraphService` & `MLService` singletons enabling sub-millisecond graph queries with zero cold-start delay. |
| **Temporal ML (Stage 1)** | **LightGBM Regressor** | `v4.3+` | Time-to-cashout ($\hat{\Delta t}$) survival analysis; MAE: $10.78\text{ mins}$ ($<15.0\text{ min SLA}$). |
| **Spatial Ranker (Stage 2)** | **LGBMRanker (LambdaMART)**| `v4.3+` | Multi-candidate H3 cell ranking; NDCG@3: $0.6531$; Top-3 Spatial Recall: $82.04\%$. |
| **Explainable AI (XAI)** | **TreeSHAP & FastTreeSHAP**| `shap v0.45+` | Exact Shapley local feature attributions synthesized into Section 106/107 BNSS court briefs in $<2\text{ms}$. |
| **Sequential Interdiction** | **InterdictionService** | Custom 2-Condition Engine| Evaluates Condition 1 (Digital Pre-emption) & Condition 2 (Physical Intercept) into 4-state matrix. |
| **Graph Peeling Engine** | **NetworkX** | `v3.2+` | Directed acyclic multigraph (`DiGraph`) modeling Layer 1 to Layer 4 rapid peeling topologies in RAM. |
| **High-Speed Feature Matrix** | **Polars & NumPy** | `polars v0.20+` | Vectorized pipeline execution ($10\times$ faster than Pandas); computes velocity decay ($\mathcal{V}_k$) in $<1.2\text{s}$. |
| **Spatial Proximity Indexing** | **Uber H3 (Core)** | `h3-py v4.1+` | Native H3 v4 API (`latlng_to_cell`, `grid_disk`, `cell_to_latlng`, `grid_distance`) for spatial binning. |
| **Nearest-Neighbor Spatial KD-Tree**| **SciPy Spatial** | `scipy v1.12+` | `scipy.spatial.cKDTree` coordinate index for $O(\log N)$ spatial queries over 5,200+ physical dispensers. |
| **Synthetic Data Simulator** | **Faker & NumPy** | `Faker v24+` (`en_IN`) | Synthesizes realistic Indian banking fraud datasets, IFSC codes, UTR numbers, and NCR corridors. |
| **Automated Testing Suite** | **Pytest** | `pytest v8.1+` | 25/25 automated unit & E2E tests validating null immunity, API contracts, and $<50\text{ms}$ inference SLA. |
| **Containerization & Deployment**| **Docker & Docker Compose** | Multi-Stage Slim | Python 3.11-slim backend and Node 20-alpine frontend with health check probes and zero-downtime restarts. |

---

### 5.2 Deep-Dive: Frontend Architecture (`frontend/`)
The tactical command center is designed as an all-in-one, low-cognitive-load situational awareness terminal:
* **Next.js 14 App Router**: Utilizes React Server Components (RSC) for instantaneous initial shell rendering and client boundary components for real-time interactivity (`TacticalMap.tsx`, `AlertFeed.tsx`, `ActionPanel.tsx`).
* **Sovereign Basemap & Leaflet GIS**: Employs CartoDB Dark Matter tiles hosted on open infrastructure. Eliminates Google Maps / Mapbox recurring billing, commercial API rate limits, and external internet exfiltration risks.
* **Reactive Telemetry Streaming**: Implemented via custom React hook [`useRealtimeAlerts.ts`](file:///c:/Users/heman/Desktop/Projects/pervekkala/frontend/hooks/useRealtimeAlerts.ts) establishing a persistent WebSocket link to `ws://localhost:8000/ws/alerts`. Features automatic exponential backoff reconnection, local state caching, and millisecond-accurate countdown tickers.
* **Tactical Action Panel & Explainability HUD**: Docked floating sidebar displaying real-time countdown clocks (Stage 1 Natural Window vs. Extended Interdiction Horizon), Layer 1-3 mule peeling trajectories, TreeSHAP feature drivers, and one-click CAD / banking interdiction buttons.

---

### 5.3 Deep-Dive: Backend Architecture (`backend/`)
The backend microservice is designed for continuous 24/7 ingestion of national cyber fraud telemetry:
* **FastAPI Async Pipeline**: Every endpoint (`/complaints/ingest`, `/transactions/hook`, `/dispatch/dial112`, `/bank/friction`) is written with non-blocking `async def` handlers, ensuring that heavy machine learning inferences do not block streaming transaction webhooks.
* **Pydantic v2 Data Contracts**: Strict data models with automatic bidirectional alias translation (`sender_account` $\leftrightarrow$ `sender`, `payment_channel` $\leftrightarrow$ `chan`) ensuring seamless compatibility with CFCFRMS / NPCI bank switches.
* **Lifespan Preloading**: Models, spatial KD-trees, and terminal catalogs are loaded into RAM during the ASGI startup event (`lifespan`), completely eliminating cold-start latency and guaranteeing sub-50ms response times from the very first request.
* **Real-Time WebSocket Broadcaster**: Thread-safe async event hub dispatching push alerts to tactical dispatchers whenever high-confidence extraction corridors are identified ($P \ge 70\%$).

---

### 5.4 Deep-Dive: Predictive & Interdiction Engine (`features/`, `ml_models/`, `backend/services/`)
The analytical brain of Aegis couples graph network analysis with dual-stage machine learning and operational jurisprudence:
* **Topology & Feature Engineering (`features/`)**:
  - `CybercrimeGraphEngine`: Computes multi-hop peeling depth, fan-out branching ratios, cumulative latency, and the exponential velocity decay function ($\mathcal{V}_k$).
  - `SpatialEnricher`: Bins dispensers into Uber H3 Resolution 8 hexagons ($\approx 0.737\text{ km}^2$) and Resolution 9 hexagons ($\approx 0.1\text{ km}^2$), computing highway proximity, CCTV density, and historical syndicate extraction frequency.
* **Dual-Stage Machine Learning Pipeline (`ml_models/`)**:
  - **Stage 1 (Temporal Horizon Estimation)**: Predicts remaining extraction minutes ($\hat{\Delta t}$) before the courier reaches a dispenser.
  - **Stage 2 (Spatial Isochrone Ranking)**: Evaluates all candidate hexagons within the courier's kinematic travel radius (35 km/h urban transit isochrone) and ranks the Top-3 highest-probability cells.
* **TreeSHAP Legal Synthesis (`ml_models/explainer.py`)**:
  - Computes exact local Shapley attributions for each prediction factor.
  - Automatically drafts **dual statutory briefs**:
    * **Section 106 BNSS**: Police field seizure and targeted card-session debit hold at the switch (preserving 100% kiosk uptime for legitimate citizens).
    * **Section 107 BNSS**: Magistrate application for attachment of proceeds of crime arising from offenses under **Section 318(4) & 319 BNS, 2023 read with Section 66D IT Act**.
* **Sequential Interdiction Feasibility Engine (`backend/services/interdiction_service.py`)**:
  - Evaluates the formal sequential dependency math:
    $$\text{Condition 1 (Digital Pre-emption)}: \quad T_{\text{digital\_freeze}} < \hat{\Delta t} \implies i_{\text{freeze}} = 1$$
    $$\text{Condition 2 (Physical Intercept)}: \quad T_{\text{physical\_dispatch}} < \hat{\Delta t} + (i_{\text{freeze}} \cdot \tau_{\text{friction}})$$
  - Classifies outcomes into the 4-state matrix: `OPTIMAL_INTERDICTION`, `ASSET_PRESERVED_ONLY`, `KINETIC_INTERCEPT`, `INTERDICTION_FAILED`.

---

## SECTION 2: MATHEMATICAL FORMULATIONS

```
[Victim Anchor: Chennai]
           │
           ▼ (Graph Traversal & Telemetry Fusion)
[1. Dynamic Spatial Anchor Transition (MAP Estimation)] ──> Shifts centroid to Goa
           │
           ▼
[2. Syndicate Corridor Transition (Bilinear Interaction)] ──> Weighs regional probability
           │
           ▼
[3. Cross-Border Adversary Utility Scoring (Runner Logic)] ──> Ranks local H3 cells & ATMs
           │
           ▼
[4. Two-Condition Sequential Interdiction Dependency] ──> Digital Hold enables Physical Intercept
```

### 1. Dynamic Spatial Anchor Transition (Bayesian Telemetry Fusion)
Instead of searching near the victim $\mathbf{x}_{\text{victim}} \in \mathbb{R}^2$, the search anchor $\mathbf{x}_{\text{anchor}}$ shifts to the geographic footprint of the terminating mule node $v_k$ via Maximum A Posteriori (MAP) estimation across all digital and structural telemetry sensors $\mathcal{S} = \{\text{IP\_Subnet}, \text{Cell\_BTS}, \text{Branch\_KYC}, \text{Historical\_ATM}\}$:

$$\mathbf{x}_{\text{anchor}} = \arg\max_{\mathbf{x}} \sum_{s \in \mathcal{S}} \omega_s \cdot \exp\left( -\frac{1}{2} (\mathbf{x} - \boldsymbol{\mu}_s)^T \boldsymbol{\Sigma}_s^{-1} (\mathbf{x} - \boldsymbol{\mu}_s) \right)$$

Where:
* $\boldsymbol{\mu}_s \in \mathbb{R}^2$ represents the geographic coordinate vector (latitude, longitude) of sensor $s$ (e.g., cell tower location in Calangute or bank branch in Margao).
* $\boldsymbol{\Sigma}_s \in \mathbb{R}^{2 \times 2}$ is the sensor-specific spatial covariance error matrix ($\boldsymbol{\Sigma}_{\text{BTS}}$ is localized to $\sim 500\text{ m}$, whereas $\boldsymbol{\Sigma}_{\text{IP}}$ covers $\sim 5\text{ km}$).
* $\omega_s$ is the dynamic reliability weight satisfying $\sum_{s \in \mathcal{S}} \omega_s = 1$.

### 2. Syndicate Corridor Transition Probability (Graph ML Interaction)
Let $\mathbf{z}_{S} \in \mathbb{R}^d$ be the structural graph embedding (e.g., GraphSAGE / Node2Vec) of the active laundering subgraph, and let $\mathbf{z}_{R_j} \in \mathbb{R}^d$ denote the learned territorial profile of target region $R_j$ (e.g., North Goa Coastal Belt). The cross-border transition probability under specific fraud modus $M$ is:

$$P(R_j \mid \mathcal{G}, M) = \frac{\exp\left( \mathbf{z}_S^T \mathbf{W}_M \mathbf{z}_{R_j} \right)}{\sum_{l \in \mathcal{R}} \exp\left( \mathbf{z}_S^T \mathbf{W}_M \mathbf{z}_{R_l} \right)}$$

Where:
* $\mathbf{W}_M \in \mathbb{R}^{d \times d}$ is a learned bilinear routing weight matrix specific to fraud modus $M$ (e.g., `DIGITAL_ARREST`, `INVESTMENT_SCAM`).
* $\mathcal{R}$ is the universe of all state/metro police jurisdictions.

### 3. Mule Velocity Decay Formulation ($\mathcal{V}_k$)
Transaction velocity decreases exponentially as funds fragment across multiple intermediary accounts and encounter banking batch settlement delays:

$$\mathcal{V}_k = \left( \prod_{i=1}^{k} \frac{A_i}{A_{i-1}} \right) \cdot \exp\left( -\lambda \sum_{i=1}^{k} \Delta t_i \right) \cdot \left[ 1 - \tanh\left( \gamma \cdot \frac{\text{Out-Degree}}{\text{In-Degree}} \right) \right]$$

Where:
* $A_i / A_{i-1}$ represents the **capital retention ratio** after peeling at hop $i$.
* $\lambda = 0.05$ represents the **temporal half-life decay parameter** over cumulative latency $\Delta t_i$ in hours.
* $\gamma = 0.5$ penalizes high **fan-out dispersion** into multiple mule branches.

### 4. Cross-Border Mule Runner Utility Function
To model runner selection of high-yield commercial terminals over low-activity kiosks, the utility $U_m(a)$ of cash-out terminal $a \in \mathcal{A}$ within the target state is:

$$U_m(a) = w_1 \cdot \psi_{\text{dist}}(d(\mathbf{x}_{\text{anchor}}, x_a)) + w_2 \cdot \psi_{\text{liq}}(L_a) + w_3 \cdot \mathcal{E}_{\text{crowd}}(a) + w_4 \cdot \mathcal{J}(x_a, \mathbf{x}_{\text{victim}}) - w_5 \cdot \psi_{\text{police}}(x_a, \mathcal{P}_{\text{local}})$$

Where:
1. **Spatial Distance Attenuation:**
   $$\psi_{\text{dist}}(d(\mathbf{x}_{\text{anchor}}, x_a)) = \exp\left( -\frac{d(\mathbf{x}_{\text{anchor}}, x_a)^2}{2\sigma_d^2} \right)$$
   evaluates physical distance relative to the mule's newly anchored location in Goa.
2. **Liquidity Attractiveness:**
   $$\psi_{\text{liq}}(L_a) = \frac{1}{1 + \exp\left( -\kappa \cdot \left( \frac{L_a}{A_{\text{target}}} - 1 \right) \right)}$$
   rewards terminals with high cash reserves ($L_a$) matching the target withdrawal sum ($A_{\text{target}}$).
3. **Crowd Anonymity Factor:**
   $$\mathcal{E}_{\text{crowd}}(a) = -\sum_{c} p_c \log p_c$$
   measures foot-traffic entropy in transient commercial areas, reflecting lower risk of detection for repetitive withdrawals.
4. **Jurisdictional Friction Exploitation:**
   $$\mathcal{J}(x_a, \mathbf{x}_{\text{victim}}) = \tanh\left( \frac{\mathcal{D}_{\text{state\_border}}(x_a, \mathbf{x}_{\text{victim}})}{\delta_{\text{jurisdiction}}} \right)$$
   quantifies distance from the victim's originating police boundary, capturing the operational benefit of cross-border jurisdictional delays.
5. **Local Police Proximity Penalty:**
   $$\psi_{\text{police}}(x_a, \mathcal{P}_{\text{local}}) = \sum_{p \in \mathcal{P}_{\text{local}}} \frac{1}{1 + \left( \frac{d(x_a, p)}{R_{\text{patrol}}} \right)^2}$$
   penalizes terminals close to local beat patrols and police stations.

### 5. Two-Condition Sequential Interdiction Dependency (Corrected Race Condition)
Physical apprehension is successful if and only if both conditions are satisfied sequentially:

$$\begin{cases} 
1. \quad T_{\text{digital\_freeze}} < \hat{\Delta t} & \text{(Condition 1: Digital Pre-emption)} \\[1.5ex] 
2. \quad T_{\text{physical\_dispatch}} < \hat{\Delta t} + \left(\mathbb{I}_{\text{freeze}} \cdot \tau_{\text{friction}}\right) & \text{(Condition 2: Physical Intercept)} 
\end{cases}$$

Where the binary indicator $\mathbb{I}_{\text{freeze}}$ is defined as:
$$\mathbb{I}_{\text{freeze}} = \begin{cases} 1 & \text{if } T_{\text{digital\_freeze}} < \hat{\Delta t} \quad \land \quad \text{API\_Status} = \text{SUCCESS} \\[1ex] 0 & \text{if API fails, times out, or runner arrives before call completes} \end{cases}$$

And total physical patrol response latency is:
$$T_{\text{physical\_dispatch}} = t_{\text{CAD\_route}} + \frac{d(\text{PCR}_{\text{unit}}, x_a)}{v_{\text{patrol}}}$$

#### The 4-State Operational Decision Matrix
```
                          [Digital Freeze Attempt]
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼ (Success: I_freeze = 1)               ▼ (Failure: I_freeze = 0)
        [Window Extended by +15m]                [Natural Window Only]
                 │                                       │
         ┌───────┴───────┐                       ┌───────┴───────┐
         ▼               ▼                       ▼               ▼
     ETA < Window    ETA >= Window           ETA < Window    ETA >= Window
   [OPTIMAL INTER.] [ASSET PRESERVED]       [KINETIC INT.]  [FAILED CRIME]
```

| State | Condition $\mathbb{I}_{\text{freeze}}$ (Digital) | Condition $T_{\text{physical\_dispatch}}$ (Physical) | Operational Classification | Tactical Outcome |
| :---: | :---: | :---: | :---: | :--- |
| **State 1** | **$1$** | $< \hat{\Delta t} + \tau_{\text{friction}}$ | **`OPTIMAL_INTERDICTION`** | **Funds Secured + Runner Apprehended On-Site**. Card session hold stalled runner; PCR arrives in time for physical arrest. |
| **State 2** | **$1$** | $\ge \hat{\Delta t} + \tau_{\text{friction}}$ | **`ASSET_PRESERVED_ONLY`** | **Funds Saved, Runner Escapes**. Card rejected under Sec 106 BNSS. Runner flees before police arrive. |
| **State 3** | **$0$** | $< \hat{\Delta t}$ | **`KINETIC_INTERCEPT`** | **Direct Physical Capture**. Digital freeze failed, but nearby beat patrol intercepts runner mid-transaction. |
| **State 4** | **$0$** | $\ge \hat{\Delta t}$ | **`INTERDICTION_FAILED`** | **Extraction Consummated**. Cash drawn; case transitions to post-incident recovery under **Section 107 BNSS**. |

---

## SECTION 3: HOW THE PROTOTYPE WORKS (END-TO-END SYSTEM EXECUTION)

```
[1. 1930 NCRP Ingestion] ──> Chennai: Incident Root Node (v0)
           │
           ▼
[2. Graph Traversal & Telemetric Shift] ──> IP / Tower / Branch points to Goa
           │
           ▼
[3. Dual-Stage ML Inference] ──> Stage 1: Window (22.4m) | Stage 2: H3 Hexes & ATMs
           │
           ▼
[4. Explainability Engine] ──> SHAP generates Sec 106 & Sec 107 BNSS Dockets
           │
           ▼
[5. Automated Dual Interdiction] 
   ├── Digital: Bank Switch API locks card session (15m delay, Sec 106 BNSS)
   └── Physical: Direct API dispatch to Goa Police Dial 112 CAD Console
           │
           ▼
[6. LEA Command Interface] ──> Real-time countdown & 4-state outcome tracking
```

### Step 1: Incident Ingestion at Origin Point
* A victim calls the 1930 Cyber Fraud Helpline in Chennai, reporting an immediate loss of ₹7,50,000 to a "Digital Arrest" scam.
* The complaint hits `POST /api/v1/complaints/ingest`. The ingestion engine records the victim's location in Chennai strictly as the root node ($v_0$), initializing the directed transaction graph without restricting the search space to Tamil Nadu.

### Step 2: In-Memory Graph Unfolding & Telemetric Anchor Re-Centering
* As CFCFRMS transaction webhooks arrive at `POST /api/v1/transactions/hook`, the in-memory directed multigraph (`features/graph_engine.py`) builds the downstream fund propagation path:
  - **Layer 1 (Entry Mule):** Stolen funds are split into Layer 2 accounts within 6 minutes.
  - **Layer 2 → Layer 3 (Peeling Chain):** Funds are broken into structured amounts under ₹50,000 and routed to Layer 3 accounts equipped with active debit cards.
* The Spatial Anchor Transition module inspects the terminating mule account:
  - An app-based balance inquiry generates network telemetry with an IP address routed through a telecom circle in Goa.
  - The mule debit card's registered home branch maps to a South Goa PIN code.
* The spatial anchor $\mathbf{x}_{\text{anchor}}$ shifts from Chennai to Goa.

### Step 3: Dual-Stage ML Inference Engine
With the search centroid reset to Goa:
1. **Stage 1 (Temporal Engine):** A LightGBM regressor evaluates peeling variance, hop latency, and transaction velocity decay ($\mathcal{V}_k$), computing:
   $$\text{Predicted Natural Cashout Window } (\hat{\Delta t}) = 22.4 \text{ minutes}$$
2. **Stage 2 (Spatial Ranking Engine):**
   - A kinematic reachability isochrone identifies all Uber H3 cells (Resolution 8) reachable from the Goa telemetry anchor within travel limits.
   - The Spatial Ranker scores candidate cells using the Adversary Utility Function, outputting the Top-3 target H3 hexagons and pinpointing specific cash-dispense terminals (e.g., an off-site commercial ATM in Calangute).

### Step 4: Real-Time Explainability & Statutory Legal Briefing
`ml_models/explainer.py` uses `shap.TreeExplainer` to calculate local feature attributions, mapping them to the proper procedural and substantive penal codes:
* **Procedural Orders under the Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023:**
  - **Section 106 BNSS Order:** Orders an immediate card-session debit freeze and switch latency loop, citing positive SHAP factors (High Peeling Velocity: +0.38, Proximity to NH-66 Corridor: +0.29, Layer-3 Telemetry Nexus: +0.22).
  - **Section 107 BNSS Dossier:** Compiles an automated attachment report for the jurisdictional Magistrate, identifying terminating accounts as direct proceeds of crime.
* **Substantive Penal Grounding under Bharatiya Nyaya Sanhita (BNS) & IT Act:**
  - Offenses are formally categorized under **Section 318(4) (Cheating) & Section 319 (Cheating by personation) of the Bharatiya Nyaya Sanhita (BNS), 2023**, read with **Section 66D of the Information Technology Act, 2000**.

### Step 5: Automated Dual Interdiction Execution
The framework immediately executes two simultaneous interventions:
1. **Targeted Digital Pre-emption (Card-Session Layer):**
   - `POST /api/v1/bank/friction` sends an automated directive to the NPCI / Bank Core Switch under Section 106 BNSS.
   - The switch applies a $\tau_{\text{friction}} = 15.0\text{ minute}$ session-level latency hold and requires dynamic step-up authentication exclusively on the suspect debit card.
   - **Public Availability Preserved:** The ATM kiosk remains 100% operational for all ordinary citizens; only the suspect card transaction is stalled.
   - Digital pre-emption succeeds ($T_{\text{digital\_freeze}} = 1.4\text{ s} < 22.4\text{ m}$), setting $\mathbb{I}_{\text{freeze}} = 1$.
   - The effective physical intercept window expands to $22.4 + 15.0 = 37.4\text{ minutes}$.
2. **Physical Intercept via Decoupled ERSS Dial 112 Dispatch:**
   - Bypassing manual inter-state coordination, `POST /api/v1/dispatch/dial112` pushes an automated dispatch payload directly to the Goa Police Dial 112 CAD console.
   - The nearest PCR van (stationed $4.2\text{ km}$ away) is assigned to the Calangute ATM.
   - Calculated travel time:
     $$T_{\text{physical\_dispatch}} = 1.5\text{ m (CAD route)} + 7.2\text{ m (transit)} = 8.7\text{ minutes}$$

### Step 6: Command Center Visualization & Resolution
* The interdiction engine evaluates the two-condition sequential dependency:
  $$\begin{cases} 
  1.4\text{ seconds} < 22.4\text{ minutes} & \implies \mathbb{I}_{\text{freeze}} = 1 \quad (\text{Digital Hold Active}) \\[1.5ex] 
  8.7\text{ minutes} < 37.4\text{ minutes} & \implies \text{Condition Met (Margin: } +28.7\text{ minutes)} 
  \end{cases}$$
* The system classifies the incident as **`OPTIMAL_INTERDICTION`**.
* The tactical command dashboard displays:
  - An animated curved arc tracing funds moving from the victim in Chennai to the target terminal in Goa.
  - A highlighted H3 hexagon over Calangute.
  - A dynamic countdown timer tracking the extended window ($37\text{m } 24\text{s}$).
  - A real-time patrol dispatch status banner confirming PCR arrival and physical apprehension of the runner at the kiosk before any cash is dispensed.

---

## 7. Quickstart & Reproducibility Guide

### Prerequisites
* **Docker & Docker Compose** (Recommended) or **Python 3.11+** & **Node.js 18+**

---

### Option A: Complete Docker Compose Stack (One-Click)

Launch the entire stack (FastAPI Backend on port `8000`, Next.js Frontend on port `3000`, and Redis):

```bash
# Clone the repository
git clone https://github.com/hemanth2607-cyber/aegis-cyber-cashout.git
cd aegis-cyber-cashout

# Build and start all services in detached mode
docker compose -f deploy/docker-compose.yml up --build -d
```

Verify services are running:
* **Tactical Command Center**: [http://localhost:3000](http://localhost:3000)
* **Backend API & Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **Backend Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

### Option B: Local Native Setup

```bash
# 1. Install Python dependencies
python -m venv venv
# On Windows: venv\Scripts\activate | On Linux/Mac: source venv/bin/activate
pip install -r requirements.txt

# 2. Launch FastAPI backend
uvicorn backend.main:app --host 127.0.0.1 --port 8000

# 3. In a separate terminal, launch Next.js frontend
cd frontend
npm install
npm run build
npm run start -- -p 3000
```

---

### Running the Live SIH Jury Demonstration Script

With the backend running, execute the automated end-to-end cyber heist simulation script:

```bash
python simulate_live_attack.py
```

```
+-----------------------------------------------------------------------------+
|         SIH26184: PREDICTIVE ANALYTICS FOR CYBERCRIME INTERVENTION          |
|         LIVE DEMONSTRATION: NCRP -> MULE FLOW -> PROACTIVE DISPATCH         |
+-----------------------------------------------------------------------------+

[PHASE 1] Ingesting simulated 1930 NCRP Cyber Fraud Complaint...
+--------------------------------------------------------------+
| Complaint Docket     | NCRP-2026-DEL-88319                   |
| Victim Account       | SBIN0001928374 (State Bank of India)  |
| Financial Siphon     | INR 7,50,000.00                       |
| Fraud Modus Operandi | DIGITAL_ARREST                        |
| Origin Coordinates   | Lat 28.6139, Lon 77.2090 (New Delhi)  |
| Ingestion Status     | HTTP 201 | Tracking Graph Initialized |
+--------------------------------------------------------------+

[PHASE 2] CFCFRMS Webhook Trigger: Layer 1 to Layer 3 Rapid Peeling Flow...
+-----------------------------------------------------------------------------+
| Hop   | Origin Account | Destination Account | Amount (INR) | Channel | UTR |
|-------+----------------+---------------------+--------------+---------+-----|
| Hop 1 | SBIN0001928374 | PUNB09988112        | 7,50,000.00  | IMPS    | ... |
| Hop 2 | PUNB09988112   | HDFC00041231        | 2,50,000.00  | IMPS    | ... |
| Hop 3 | PUNB09988112   | ICIC00091822        | 2,40,000.00  | UPI     | ... |
| Hop 4 | HDFC00041231   | YESB00010921        | 2,45,000.00  | IMPS    | ... |
+-----------------------------------------------------------------------------+

[PHASE 3] Querying Dual-Stage Predictive Engine for Intercept Target...
+--------------------------------------------------------------+
| Predicted Cash-Out Window   | 8.7 MINUTES                    |
| Forecast Confidence         | 8.4%                           |
| Target H3 Hexagon (Res 8)   | 883da18da3fffff                |
| Centroid Coordinates        | Lat 28.645184, Lon 77.121242   |
| Suspect Terminal Identified | ATM-DL-10068 (SBI Offsite ATM) |
+--------------------------------------------------------------+
                      TreeSHAP Explainable AI Attribution                      
+-----------------------------------------------------------------------------+
| Feature Driver         | Attribution (+/-) | Law Enforcement Intelligence   |
|------------------------+-------------------+--------------------------------|
| Cumulative Latency Sec |             +5.49 | Rapid IMPS settlement speed    |
| Fan Out Ratio          |             +3.04 | Multi-account fragmentation    |
| H3 Distance            |             +1.40 | Outer Ring Road corridor proximity |
+-----------------------------------------------------------------------------+

[PHASE 4] Executing Automated Law Enforcement Countermeasures...
[+] ERSS Dial 112 Dispatched: Unit BEAT-PCR-GURUGRAM-9 | ETA: 7.2 mins | Ref: CAD-112-9037
[+] Bank Micro-Delay Deployed: Action: ATM_MICRO_DELAY_15MIN | Status: SUCCESS | Ref: I4C-BLOCK-3091

+-----------------------------------------------------------------------------+
|       RESULT: WITHDRAWAL PRE-EMPTED. INCIDENT INTERDICTED IN ADVANCE.       |
|         Law Enforcement Unit En Route | Mule Account Switch Frozen          |
+-----------------------------------------------------------------------------+
```

---

### Running Automated Test Suites

```bash
# Run End-to-End Pytest Suite (Latency SLA benchmark, null immunity, API checks)
pytest tests/test_e2e.py -v -s

# Run All Unit Tests
python -m unittest discover tests
```

---

## 8. Sample Actionable JSON Dispatch Payload

When an imminent cash-out is detected ($\hat{T} \le 30\text{ minutes}$ and confidence score $\ge 0.70$), Aegis automatically generates and dispatches the following court-ready JSON intelligence docket to the Police Emergency Response Support System (**ERSS Dial 112 CAD**) and Core Banking switch:

```json
{
  "dispatch_id": "CAD-112-9982",
  "timestamp": "2026-09-07T12:32:00+05:30",
  "priority": "CRITICAL",
  "incident": {
    "complaint_id": "NCRP-2026-DEL-88319",
    "fraud_modus": "DIGITAL_ARREST",
    "total_loss_inr": 750000.0,
    "amount_at_risk_inr": 245000.0,
    "victim_bank": "State Bank of India"
  },
  "tactical_forecast": {
    "predicted_cashout_window_minutes": 8.7,
    "confidence_score": 0.884,
    "target_h3_resolution_8": "883da18da3fffff",
    "target_h3_resolution_9": "893da18da3bffff",
    "centroid_coordinates": {
      "latitude": 28.645184,
      "longitude": 77.121242
    },
    "search_radius_meters": 450.0
  },
  "suspect_terminals_ranked": [
    {
      "terminal_id": "ATM-DL-10068",
      "bank_name": "State Bank of India",
      "terminal_type": "ATM_OFFSITE_STANDALONE",
      "latitude": 28.646102,
      "longitude": 77.120891,
      "address": "Opposite Metro Pillar 382, Outer Ring Road, Rohini, New Delhi",
      "current_cash_liquidity_inr": 485000.0,
      "cctv_active": false
    },
    {
      "terminal_id": "CSP-DL-10492",
      "bank_name": "Punjab National Bank",
      "terminal_type": "BANK_MITRA_CSP",
      "latitude": 28.644211,
      "longitude": 77.122104,
      "address": "Shop 14, Main Market, Sector 8, Rohini, New Delhi",
      "current_cash_liquidity_inr": 150000.0,
      "cctv_active": true
    }
  ],
  "interdicting_unit": {
    "assigned_patrol_unit": "BEAT-PCR-ROHINI-4",
    "current_location": {
      "latitude": 28.6521,
      "longitude": 77.1189
    },
    "estimated_time_of_arrival_minutes": 5.4,
    "dispatch_status": "DISPATCHED"
  },
  "bank_friction_action": {
    "target_mule_account": "YESB00010921",
    "action_deployed": "ATM_MICRO_DELAY_15MIN",
    "friction_mode": "CARD_SESSION_HOLD",
    "transaction_freeze_status": "SUCCESS",
    "risk_reference": "BNSS106-BLOCK-9921",
    "statutory_power": "SECTION_106_BNSS",
    "kiosk_public_availability": "ACTIVE_FOR_PUBLIC",
    "penal_code_sections": [
      "Section 318(4) BNS",
      "Section 319 BNS",
      "Section 66D IT Act"
    ]
  },
  "explainable_ai_attribution": {
    "top_positive_risk_drivers": [
      {
        "feature": "cumulative_latency_sec",
        "shap_value": 5.49,
        "tactical_meaning": "Rapid IMPS settlement across 4 hops indicates automated bot courier handoff"
      },
      {
        "feature": "fan_out_ratio",
        "shap_value": 3.04,
        "tactical_meaning": "High outbound branching ratio (multi-account fragmentation) confirms professional mule syndicate"
      },
      {
        "feature": "min_distance_to_highway",
        "shap_value": 1.40,
        "tactical_meaning": "Target ATM intersects Outer Ring Road escape corridor within 320m"
      }
    ],
    "statutory_legal_brief": "SECTION 106 & 107 BNSS / SECTION 63 BSA DUAL COMPLIANCE BRIEF: Dual-stage TreeSHAP machine learning inference indicates high-confidence physical cashout trajectory. Terminating Layer 3 mule account YESB00010921 has received siphoned capital within 8.7 minutes of extraction threshold at H3 cell 883da18da3fffff. Invoking Section 106 BNSS (Police seizure/lien power), immediate targeted card-session debit lien and latency dilation are deployed (preserving terminal uptime for the public). Judicial attachment report docketed under Section 107 BNSS for offenses under Section 318(4) & Section 319 BNS, 2023 read with Section 66D IT Act."
  }
}
```

---

## 9. Statutory Compliance & Legal Tenability

Aegis-Cyber outputs are constructed specifically to adhere to India's new criminal codes enacted in 2024:

### 1. Procedural Code: Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023
- **Section 106 BNSS (Police Seizure & Targeted Field Lien)**: Authorizes police officers to immediately seize and place a lien on property/accounts suspected to be stolen or linked to cognizable cyber offenses. Aegis utilizes this power to enforce **targeted card-session debit holds and transaction latency dilation at the switch**, ensuring the physical ATM/CSP dispenser remains **100% operational for legitimate citizens**.
- **Section 107 BNSS (Magistrate Attachment of Proceeds of Crime)**: Directs the investigating officer to submit a formal report to the District Magistrate or Sessions Court praying for formal attachment, confiscation, and eventual victim restitution of the siphoned funds.

### 2. Substantive Penal Code: Bharatiya Nyaya Sanhita (BNS), 2023 & IT Act
- **Section 318(4) BNS, 2023**: Substantive penal offense of Cheating and dishonestly inducing delivery of property (replacing Section 420 IPC).
- **Section 319 BNS, 2023**: Substantive penal offense of Cheating by personation (replacing Section 416/419 IPC).
- **Section 66D Information Technology Act, 2000**: Punishment for cheating by personation by using computer resources.

### 3. Electronic Evidence & Cryptographic Non-Repudiation
- **Section 63 Bharatiya Sakshya Adhiniyam (BSA), 2023**: Replaces Section 65B of the Indian Evidence Act. Every AI inference vector, graph edge, card-session lien, and CAD dispatch is cryptographically signed with SHA-256 hashes and timestamped for court admissibility without manual evidentiary challenges.

---

## 10. Contributors & License

Developed with ❤️ for the **Smart India Hackathon 2024** by **Team Aegis**.  
Licensed under the **Apache License 2.0**.
