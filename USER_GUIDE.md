# AegisCashout — Law Enforcement Operator Manual & Tactical Standard Operating Procedure (SOP)
### Predictive Cybercrime Analytics & Pre-Withdrawal Interdiction Framework
**Target Authority:** Indian Cyber Crime Coordination Centre (I4C), Ministry of Home Affairs (MHA), Government of India  
**System Designation:** Project AegisCashout (National Automated Cashout Interception Engine)  
**Regulatory & Procedural Compliance:** Section 106 & 107, Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 | Section 318(4) & 319, Bharatiya Nyaya Sanhita (BNS), 2023 r/w Section 66D IT Act, 2000 | Section 63, Bharatiya Sakshya Adhiniyam (BSA), 2023 | CERT-In Cyber Incident Directives | National Cyber Crime Reporting Portal (NCRP) / Helpline 1930 / CFCFRMS Interdiction Protocols  
**Classification:** Operational Field Manual — Nodal Cyber Patrol & Dispatch Desk  

---

## Executive Summary & Tactical Purpose

In contemporary Indian cyber fraud operations, criminal syndicates exploit an asymmetric time advantage. When a victim in Mumbai, Bengaluru, or Hyderabad falls prey to an investment scam, digital arrest extortion, or APK credential theft, they lodge a formal distress complaint on the **Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS / Helpline 1930)**.

Within minutes of victim transfer, syndicate botnets execute **rapid automated fund peeling** across 3 to 5 intermediary layers of digital "money mule" accounts via IMPS and UPI switches. The terminal objective is physical **Cashout**: converting digital illicit balances into untraceable paper currency before judicial freeze notices can be dispatched.

**AegisCashout** alters this paradigm. Operating as an early-warning predictive intelligence layer directly downstream of central NCRP complaint telemetry, Aegis models transaction velocity, mule network topology, and spatial infrastructure to **forecast the terminal extraction neighborhood (within ~700 meters) and pinpoint suspect cash-out points (Off-site Bank ATMs, Micro-ATMs, and AePS Customer Service Points) 15 to 45 minutes in advance**.

This manual establishes the operational standard operating procedures (SOPs) for cybercrime nodal officers, state emergency response dispatchers (Dial 112 ERSS), and financial liaison desks utilizing the Aegis command console.

---

## 1. Tactical Threat Context & Terminal Multiplicity

Modern cyber syndicates do not rely exclusively on traditional branch ATMs. Aegis continuously monitors three distinct terminal dispenser classes across urban and peri-urban extraction corridors:

```
                                  CFCFRMS / 1930 COMPLAINT TELEMETRY
                                                  │
                                                  ▼
                                    LAYER 1: PRIMARY MULE ACCOUNT
                                                  │ (IMPS Split: 120s)
                                                  ▼
                                   LAYER 2: SECONDARY MULE ACCOUNTS
                                                  │ (Layered Peeling: 180s)
                                                  ▼
                                  LAYER 3: TERMINATING CASHOUT MULE
                                                  │
                 ┌────────────────────────────────┼────────────────────────────────┐
                 ▼                                ▼                                ▼
    [ OFF-SITE WHITE-LABEL ATMS ]        [ MICRO-ATMS (mATMs) ]         [ AePS MERCHANT CSPs / BCs ]
    - Unmanned standalone kiosks         - Handheld POS card readers    - Aadhaar biometric cash-out
    - High-cash transit corridors        - Kirana / Mobile repair shops - Rural / Peri-urban fringes
    - Limited CCTV / security staff      - Zero physical surveillance   - High single-transaction limits
```

### 1.1 Dispenser Modalities Targeted by Syndicates

#### A. Off-site White-Label & Brown-Label ATMs
* **Operational Characteristics:** Located in standalone shopping complexes, petrol pumps, or transit corridors outside bank branch perimeters.
* **Syndicate Exploit Vector:** Operatives utilize clone cards or mule debit cards to perform rapid-fire max-limit withdrawals (₹10,000–₹50,000 per swipe) late at night or during peak commuter hours, fleeing within 120 seconds.

#### B. Micro-ATMs (mATMs)
* **Operational Characteristics:** Bluetooth-connected point-of-sale (POS) terminals operated by non-banking retail vendors (grocers, recharge kiosks).
* **Syndicate Exploit Vector:** Unwitting or complicit retail merchants facilitate large cash disbursements in exchange for a percentage commission, completely bypassing bank branch CCTV networks.

#### C. Aadhaar-enabled Payment System (AePS) Customer Service Points (CSPs) & Business Correspondents (BCs)
* **Operational Characteristics:** Biometric-enabled micro-banking terminals deployed in peri-urban, industrial, and rural fringes (e.g., Nuh/Mewat border, Alwar fringe, Outer North Delhi, Jamtara peripheries).
* **Syndicate Exploit Vector:** Syndicates leverage cloned silicone fingerprints or coerce registered BCs to execute biometric cash withdrawals. Because AePS transactions settle instantly against UIDAI biometric authentication, criminals favor CSPs located near state transit borders where CCTV surveillance is minimal and escape routes into neighboring jurisdictions are accessible within minutes.

---

## 2. Technical Architecture & Dual-Stage AI Formulation

Aegis implements an asymmetric, dual-stage predictive pipeline explicitly engineered to maintain sub-50ms inference latency on streaming transaction graphs:

```
   COMPLAINT INTAKE               STAGE 1: TEMPORAL ENGINE                 STAGE 2: SPATIAL RANKER
 ┌───────────────────┐           ┌────────────────────────┐              ┌────────────────────────┐
 │ - 1930 Distress   │           │ LightGBM Regressor +   │              │ Multi-Feature CatBoost/│
 │ - Victim Lat/Lon  │ ────────► │ Survival Analysis      │ ───────────► │ LightGBM on Uber H3    │
 │ - Initial Amount  │           │ Predicts:              │              │ Predicts:              │
 │ - Fraud Modality  │           │ Hop Layer & Time-to-   │              │ Top-3 H3 Hexagons      │
 └───────────────────┘           │ Cashout (Δt in mins)   │              │ (Res 8: ~0.737 km²)    │
                                 └────────────────────────┘              └───────────┬────────────┘
                                                                                     │
                                                                                     ▼
 ┌───────────────────────────────────────────────────────────────────────────────────┴────────────┐
 │                                   EXPLAINABILITY ENGINE (TreeSHAP)                             │
 │ - Computes Game-Theoretic Shapley Feature Attribution Vectors (Historical Corridor Velocity,    │
 │   Arterial Highway Distance, Terminal Density, KYC Branch Geodelta)                           │
 │ - Auto-Compiles Court-Admissible Dual Legal Briefs under Section 106 & 107 BNSS (BNS 318(4))   │
 └────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Stage 1: Temporal Cashout Hop & Velocity Regressor
* **Mathematical Formulation:** Survival analysis paired with a gradient-boosted LightGBM regressor modeling conditional time-to-event:
  $$S(t \mid X) = P(T > t \mid X)$$
* **Target Variables:**
  1. *Terminal Peeling Hop:* Probability of fund extraction at Layer 2 vs. Layer 3/Layer 4.
  2. *Remaining Extraction Window ($\Delta t$):* Elapsed interval in minutes between complaint registration and cash dispenser activation.
* **Core Features Ingested:** IMPS/UPI transaction velocity (₹ per second), fan-out ratio ($\text{Out-Degree} / \text{In-Degree}$), reporting latency (interval between victim debit and 1930 report), scam typology (investment scam vs. digital arrest vs. sextortion).

### 2.2 Stage 2: Spatial Extraction Ranker (Uber H3 Resolution 8)
* **Spatial Discretization:** The operational territory (Delhi-NCR UTM-43N) is indexed into a tessellation of **Uber H3 Resolution 8 hexagons** (average edge length ~461 meters; surface area $\approx 0.737\text{ km}^2$).
* **Ranking Formulation:** Multi-class spatial classification ranker scoring all candidate cells:
  $$P(\text{Cashout} \in \text{Hex}_i \mid \text{Graph Topology}, \text{Infrastructure Density}, \text{Historical Hotspots})$$
* **Infrastructure Indexing:** All physical off-site ATMs, micro-ATMs, and AePS CSPs are spatialized into a `scipy.spatial.cKDTree` coordinate index, mapping exact candidate terminals within the Top-3 highest-probability hexagons.

### 2.3 Explainability Engine (TreeSHAP & Dual Statutory Synthesis)
* **Feature Attribution:** To eliminate "black-box" objections during trial and ensure full judicial transparency, the engine runs tree-based Shapley value decompositions (TreeSHAP) on every live prediction:
  $$\phi_i = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|!(|F| - |S| - 1)!}{|F|!} \left[ f(S \cup \{i\}) - f(S) \right]$$
* **Dual Statutory Brief Compilation:** Translates mathematical attribution weights directly into procedural and substantive legal briefs adhering to India's new criminal codes (effective 2024):
  1. **Procedural Field Seizure & Targeted Card-Session Lien (Section 106 BNSS):** Authorizes police officers to execute immediate field liens and transaction latency holds against terminating accounts and suspect card sessions at the payment switch without taking down physical kiosk availability for the legitimate public.
  2. **Magistrate Judicial Attachment of Proceeds of Crime (Section 107 BNSS):** Formulates formal reports to the Magistrate praying for attachment of siphoned proceeds of crime arising from substantive offenses under **Section 318(4) (Cheating) & Section 319 (Cheating by personation) of the Bharatiya Nyaya Sanhita (BNS), 2023, read with Section 66D of the Information Technology Act, 2000**.
  3. **Digital Evidence Integrity (Section 63 BSA, 2023):** Every inference vector and dispatch event is hashed with SHA-256 for non-repudiation and electronic record admissibility.

---

## SECTION 1: EXTRACTED INTELLIGENCE DOCTRINE & OPERATIONAL DOCTRINE

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

### 4. Cross-Border Mule Runner Utility Function
To model runner selection of high-yield commercial terminals over low-activity kiosks, the utility $U_m(a)$ of cash-out terminal $a \in \mathcal{A}$ within the target state is:

$$U_m(a) = w_1 \cdot \psi_{\text{dist}}(d(\mathbf{x}_{\text{anchor}}, x_a)) + w_2 \cdot \psi_{\text{liq}}(L_a) + w_3 \cdot \mathcal{E}_{\text{crowd}}(a) + w_4 \cdot \mathcal{J}(x_a, \mathbf{x}_{\text{victim}}) - w_5 \cdot \psi_{\text{police}}(x_a, \mathcal{P}_{\text{local}})$$

Where:
1. **Spatial Distance Attenuation:** $\psi_{\text{dist}}(d(\mathbf{x}_{\text{anchor}}, x_a)) = \exp\left( -\frac{d(\mathbf{x}_{\text{anchor}}, x_a)^2}{2\sigma_d^2} \right)$ evaluates physical distance relative to the mule's newly anchored location in Goa.
2. **Liquidity Attractiveness:** $\psi_{\text{liq}}(L_a) = \frac{1}{1 + \exp\left( -\kappa \cdot \left( \frac{L_a}{A_{\text{target}}} - 1 \right) \right)}$ rewards terminals with high cash reserves ($L_a$) matching the target withdrawal sum ($A_{\text{target}}$).
3. **Crowd Anonymity Factor:** $\mathcal{E}_{\text{crowd}}(a) = -\sum_{c} p_c \log p_c$ measures foot-traffic entropy in transient commercial areas, reflecting lower risk of detection for repetitive withdrawals.
4. **Jurisdictional Friction Exploitation:** $\mathcal{J}(x_a, \mathbf{x}_{\text{victim}}) = \tanh\left( \frac{\mathcal{D}_{\text{state\_border}}(x_a, \mathbf{x}_{\text{victim}})}{\delta_{\text{jurisdiction}}} \right)$ quantifies distance from the victim's originating police boundary, capturing the operational benefit of cross-border jurisdictional delays.
5. **Local Police Proximity Penalty:** $\psi_{\text{police}}(x_a, \mathcal{P}_{\text{local}}) = \sum_{p \in \mathcal{P}_{\text{local}}} \frac{1}{1 + \left( \frac{d(x_a, p)}{R_{\text{patrol}}} \right)^2}$ penalizes terminals close to local beat patrols and police stations.

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

---

## 4. Operational Screen Layout & Map Element Decoder

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [TOP NAVIGATION BAR]  AEGISCASHOUT | BNSS 106/107 | Active: 24 | Imminent: 7 | Interdicted: ₹47.5L | [SIM] │
├───────────────────────────────┬────────────────────────────────────────┬───────────────────────────────┤
│ [ALERT FEED: LEFT SIDEBAR]    │ [TACTICAL GIS MAP: CENTER VIEWPORT]    │ [ACTION PANEL: RIGHT SIDEBAR] │
│                               │                                        │                               │
│ > NCR-2026-08832  [CRITICAL]  │   [HUD: NCR | LAT: 28.61 | RECENTER]   │ TACTICAL INTERCEPT PROFILE    │
│   Window: 14m 20s             │                                        │ Complaint: NCR-2026-08832     │
│   Target: Rohini Sec 16       │      (Police PCR Unit: BEAT-4)         │                               │
│   Amount: ₹4,80,000           │         \  [2.5km Buffer]              │ COUNTDOWN: 14:20 (CRITICAL)   │
│                               │          \                             │ Terminating Mule: MULE-AXIS   │
│ > NCR-2026-09144  [WARNING]   │        [Crimson H3 Hexagon]            │ Suspect ATM: AXIS-ROH-091     │
│   Window: 28m 45s             │        /   * (Target ATM Ping)         │ Reserves: ₹3,20,000           │
│   Target: Dwarka Sector 11    │       /                                │ Public Kiosk: ACTIVE (100%)   │
│   Amount: ₹2,10,000           │    [Orange Money Flow Arc]             │ TreeSHAP Explainability:      │
│                               │    /                                   │ +0.42 Cashout Velocity Surge  │
│ > NCR-2026-09201  [STABLE]    │  (Victim: Connaught Place)             │ +0.28 Offsite Dispenser Clust │
│   Window: 41m 10s             │                                        │ Sec 106/107 BNSS Dual Brief   │
│   Target: Noida Sector 62     │   [Tactical Legend: Hex, ATM, Beat]    │                               │
│   Amount: ₹1,50,000           │                                        │ [DISPATCH DIAL 112 BEAT]      │
│                               │                                        │ [ACTIVATE CARD-SESSION HOLD]  │
└───────────────────────────────┴────────────────────────────────────────┴───────────────────────────────┘
```

### 4.1 Map Visual Decoding Table

| Visual Map Feature | Visual Signature | Tactical Meaning & Operational Instruction |
| :--- | :--- | :--- |
| **Primary Target Hexagon** | Solid Crimson Hexagon (`#FF0055`) with high opacity | **Imminent Extraction Zone ($P \ge 70\%$).** Highest-probability spatial boundary (~0.737 km²) where the mule runner will withdraw cash. Direct field units here. |
| **Secondary Corridor Hexagons** | Dashed Amber Hexagon (`#FFAA00`) with medium opacity | **Probable Transit Corridor ($P < 70\%$).** Secondary extraction zone or alternate transit route. Alert adjacent beat patrols. |
| **Tertiary Spatial Clusters** | Cyan Outlined Hexagon (`#00F0FF`) | **Exploratory Outlier Cells.** Cluster perimeter calculated by spatial density algorithms. |
| **Target ATM Beacon** | Pulsing Crimson Radar Dot with expanding ripple | **Suspect Off-site ATM Dispenser.** Identified physical kiosk matching mule transit speed. Clicking marker reveals terminal ID, bank, street address, and vault cash reserves. |
| **Micro-ATM / CSP Marker** | Amber Radar Marker with store glyph | **Suspect AePS Merchant / Kirana mATM.** Indicates high-probability point-of-sale withdrawal point in peri-urban market. |
| **Money Peeling Vector** | Animated Orange Polyline Arcs (`.flow-polyline`) | **Digital Mule Peeling Trail.** Traces transfer hops from victim account through Layer 1, Layer 2, and Layer 3 accounts. |
| **Terminal Trajectory Hop** | Thick Crimson Polyline (`#FF0055`) | **Terminal Extraction Hop.** Final link connecting terminating mule account to the target physical dispenser. |
| **Police Beat Patrol Unit** | Cyan Vehicle Glyph with pulsating beacon | **Dial 112 ERSS Beat Patrol Van.** Real-time location of active PCR mobile unit (e.g., `BEAT-PCR-ROHINI-4`). |
| **Beat Response Buffer** | Translucent Cyan Dotted Circle (`radius = 2.5km`) | **Patrol Interception Horizon.** 2.5 km operational coverage radius. Terminals inside this circle are reachable within 4 to 6 minutes. |
| **Live Tactical HUD** | Top-Right Glass Badge | **GPS Telemetry & Re-center.** Displays real-time map center coordinates and zoom level (`NCR | LAT: 28.6139 | LON: 77.2090 | Z: 13`). Includes **`[RECENTER]`** crosshair button. |
| **Map Legend** | Bottom-Left Fixed Overlay | **Operator Reference Card.** Instant decoding of layer symbology. |

---

## 5. Exhaustive Operator Walkthrough & Action Controls

### 5.1 Top Navigation Bar Controls
1. **Section 106 & 107 BNSS Compliance Pill:** Confirms all system telemetry, targeted card-session holds, and Magistrate attachment applications conform to Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023.
2. **Active Complaints Monitor:** Displays live stream volume of ingested 1930 / NCRP complaints in the sector.
3. **Imminent Cashouts Counter:** Highlights threats with remaining withdrawal windows of under 30 minutes.
4. **Interdicted Value Counter (₹):** Live cumulative financial metric tracking stolen capital successfully frozen or intercepted across the shift.
5. **Dial 112 ERSS Beat Unit Status:** Displays the count of deployed patrol vehicles connected to the central dispatch queue.
6. **`Simulate Live Cyber Heist` Button:**
   * **Action:** Triggers an end-to-end synthetic fraud incident (e.g., ₹4.8 Lakh investment scam in Rohini Sector 16).
   * **Result:** Exercises the entire pipeline live before observers—generates multi-hop mule peeling, spatial clustering, WebSocket broadcast, and live countdown activation in under 200 milliseconds.

### 5.2 Threat Feed (Left Sidebar)
* **Sorting Hierarchy:** Ingested complaints are sorted in ascending order of **remaining countdown minutes** (most urgent threats anchor the top of the queue).
* **Threat Urgency Thresholds:**
  * **Crimson `CRITICAL` Badge ($\le 15\text{ mins}$):** Mule operative is in close physical proximity to the terminal. Immediate intervention required.
  * **Amber `MONITORING` Badge ($16 - 45\text{ mins}$):** Early peeling phase. Establish bank friction and position patrol units.
* **Selection Workflow:** Clicking an alert card locks the target, glides the Leaflet camera to the coordinates, calculates route lines, and populates the right-hand **Action Panel**.
* **Viewport Expansion:** Click the `<` or `>` icon on the header to collapse the feed for widescreen spatial analysis.

### 5.3 Tactical Action & Explainability Panel (Right Sidebar)
Docked securely on the right edge with zero map-tile occlusion:

#### A. Dynamic Real-Time Countdown Clock & Sequential Evaluation
* Displays the estimated operational window (`MM:SS`) before physical cash extraction.
* Evaluates the **Sequential Interdiction Feasibility Model**:
  $$\text{Condition 1 (Digital Pre-emption)}: \quad T_{\text{digital\_freeze}} < \hat{\Delta t} \implies i_{\text{freeze}} = 1$$
  $$\text{Condition 2 (Physical Intercept)}: \quad T_{\text{physical\_dispatch}} < \hat{\Delta t} + (i_{\text{freeze}} \times \tau_{\text{friction}})$$
  $$\text{Effective Window}: \quad \text{Window}_{\text{effective}} = \hat{\Delta t} + (i_{\text{freeze}} \times \tau_{\text{friction}})$$
  $$\text{Operational Buffer Margin}: \quad \text{Margin} = \text{Window}_{\text{effective}} - T_{\text{physical\_dispatch}}$$

#### B. Suspect Network & Peeling Trajectory
* **Terminating Mule Account:** Identified Layer 3 account (e.g., `MULE-AXIS-991204`).
* **Peeled Amount:** Exact quantum of illicit funds slated for cashout (e.g., `₹4,80,000`).
* **Candidate Terminal Detail:** Specific off-site kiosk (e.g., `AXIS-ROH-091`), street address, bank brand, available vault currency, and confirmation of `kiosk_public_availability: "ACTIVE_FOR_PUBLIC"`.

#### C. TreeSHAP AI Tactical Drivers & Dual Statutory Dossiers
* Breaks down algorithmic confidence into plain, accountable evidentiary factors:
  * *Cashout Velocity Surge:* E.g., `+0.42` Shapley attribution due to rapid 3-hop peeling within 8 minutes.
  * *Terminal Liquidity & Offsite Profile:* E.g., `+0.28` attribution due to isolated ATM dispenser located within 300m of an arterial highway exit.
  * *Mule Cluster Density:* E.g., `+0.18` attribution based on previous syndicate withdrawal history in this postal zone.
* **Dual Statutory Brief Generation:**
  1. **Section 106 BNSS Field Lien Warrant:** Orders targeted card-session hold and switch-level latency dilation without taking the ATM kiosk offline for legitimate citizens.
  2. **Section 107 BNSS Magistrate Attachment Report:** Generates formal prayer to the Magistrate for attachment of proceeds of crime arising from substantive offenses under **Section 318(4) & 319 BNS, 2023, read with Section 66D IT Act, 2000**.

#### D. Operational Interdiction Buttons
1. **`DISPATCH DIAL 112 BEAT PATROL` (Cyan Tactical Button):**
   * **Action:** Sends a formatted CAD packet directly to the nearest Delhi Police PCR beat van (`BEAT-PCR-ROHINI-4`).
   * **Output:** Generates an official dispatch ID (`CAD-DL-89104`), calculates estimated time of arrival (ETA: ~5.2 mins), updates patrol status to `DISPATCHED`, and evaluates the 4-state outcome matrix (`OPTIMAL_INTERDICTION`).
2. **`ACTIVATE BANK CASH-LOCK (CARD SESSION HOLD)` (Crimson Security Button):**
   * **Action:** Issues a Section 106 BNSS targeted interdiction command to the banking switch network (`friction_mode: "CARD_SESSION_HOLD"`).
   * **Operational Effect:** Enforces targeted card-session latency injection and dynamic step-up auth at the switch. The physical ATM/CSP terminal remains **100% active and operational for public use**, while the suspect card session is locked and funds preserved.
3. **`X` Close Button:**
   * Dismisses the sidebar to maximize geographic map visibility.

---

## 6. Zero-Cost, Sovereign Infrastructure Architecture

To ensure operational viability across all state police headquarters without recurring SaaS licensing fees or cloud dependencies, Aegis is built entirely on open, sovereign technology:

| Architecture Layer | Technology Implemented | Commercial API Dependency? | Cost & Licensing Tier |
| :--- | :--- | :---: | :--- |
| **Tactical Map Basemap** | CartoDB Dark Matter / OpenStreetMap | **NO** | 100% Free / Open-access tiles. Zero API token required. |
| **Discrete Spatial Grid** | Uber H3 Discrete Global Grid (`h3-py`, `h3-js`) | **NO** | Open-source Apache 2.0. Mathematical RAM calculation. |
| **Spatial Proximity Index** | SciPy `cKDTree` Coordinate Index | **NO** | Open-source BSD. Local $O(\log N)$ nearest-neighbor engine. |
| **Graph Peeling Engine** | NetworkX In-Memory Directed Graph | **NO** | Open-source BSD-3. Computes multi-hop flow velocities in RAM. |
| **Stage 1 Temporal ML** | LightGBM Regressor + Survival Analysis | **NO** | Open-source MIT. Model weights execute in local Python runtime. |
| **Stage 2 Spatial ML** | Multi-feature Spatial Ranker | **NO** | Open-source Apache 2.0. Sub-50ms local inference execution. |
| **Explainability Engine** | TreeSHAP (`shap` library) | **NO** | Open-source MIT. Pure mathematical game-theoretic Shapley logic. |
| **Sequential Interdiction Engine**| 2-Condition Sequential Mathematical Matrix | **NO** | Custom algorithmic optimization. Zero latency overhead. |
| **Core Microservices** | Python 3.11 / FastAPI / Starlette WebSockets | **NO** | Open-source MIT / BSD. Air-gapped, on-premises deployable. |
| **Tactical Interface** | Next.js 14 / TypeScript / Tailwind CSS | **NO** | Open-source MIT. Node.js native compilation. |

---

## 7. 30-Second Demonstration Workflow for Evaluators

Execute this standard operational demonstration sequence during tactical presentations or hackathon evaluations:

```
 STEP 1: INITIALIZE
   Open dashboard at http://localhost:3000.
   Highlight Top Nav counters: Zero external API keys, 100% local sovereign execution.
          │
          ▼
 STEP 2: INJECT REAL-TIME HEIST
   Click [Simulate Live Cyber Heist] at the top-right.
   Observe: Backend processes complaint in <200ms; a new critical alert surfaces at the top of the feed.
          │
          ▼
 STEP 3: VISUALIZE EXTRACTION CORRIDOR
   Click the newly generated complaint card (e.g., Rohini Sector 16).
   Observe: Camera glides to Rohini; crimson H3 hexagon lights up; suspect ATM radar beacon pulses;
            orange digital money peeling arcs trace the fund path from victim to dispenser.
          │
          ▼
 STEP 4: VERIFY EXPLAINABILITY & BNS/BNSS STATUTORY BRIEFS
   Inspect the Right Action Panel:
   - Dynamic countdown clock counting down remaining window (e.g., 18 mins).
   - Review TreeSHAP attribution bars (+0.42 Velocity, +0.28 ATM Proximity).
   - Read Section 106 BNSS Card-Session Lien & Section 107 BNSS Magistrate Attachment briefs
     citing Section 318(4) & 319 BNS, 2023 r/w Section 66D IT Act.
          │
          ▼
 STEP 5: EXECUTE TACTICAL DUAL-ACTION INTERCEPTION
   1. Click [ACTIVATE BANK CASH-LOCK (CARD SESSION HOLD)] -> Invokes Section 106 BNSS card-session hold;
      ATM kiosk remains active for other citizens; Interdicted Value increments live by ₹4,80,000.
   2. Click [DISPATCH DIAL 112 BEAT PATROL] -> Assigns BEAT-PCR-ROHINI-4; evaluates sequential interdiction
      feasibility: Condition 1 (1.4s < 18m) and Condition 2 (5.2m < 33m) -> OPTIMAL_INTERDICTION ACHIEVED.
```

---

## 8. Dual-Mode Simulation Guide (5-Year-Old Story + High-Precision SIH Math)

Access the dedicated simulation console at `http://localhost:3000/simulation` or click the **⚡ Dual-Mode Simulation** button on the main dashboard header.

### 1. Visual Storytelling & Gradual 2D Line Extension
- **Gradual Money Trail**: When you play or navigate to Stage 2, the cyan line does *not* appear abruptly; it smoothly extends from Chennai across the Golden Quadrilateral (NH48) through Pune and Margao to Calangute over 4.5 seconds.
- **Visible Currents & Flying Money**:
  - Continuous animated dashed currents stream along the line.
  - 3 animated glowing gold tokens (`💸 ₹2.5L`, `₹`, `₹`) physically glide along the path, illustrating real-time digital fund transfer.
- **Milestone Pin Reveals**: The intermediate bank pins (PNB Pune at 46% and ICICI Margao at 82%) pop up with animated ripple rings only when the growing trail reaches them.
- **"▶ Replay Money Path" Button**: Click the button on the top banner to re-watch the money line extend from scratch anytime.

### 2. 5-Year-Old Explanation Mode (Comic-Strip Story)
In the top banner and the right inspector panel, each stage is translated into an intuitive, everyday human story:
1. **👵 Step 1: The Fake Phone Call**: A scammer tricks Grandma in Chennai into sending ₹7.5 Lakhs.
2. **💸 Step 2: The Money Runs**: The thieves quickly bounce funds through 3 bank doors (Chennai ➔ Pune ➔ Margao) to hide.
3. **📡 Step 3: Aegis Radar**: Aegis spots the thief's phone ping 1,000 km away in Calangute, Goa.
4. **🤖 Step 4: Super AI Finds the ATM**: AI calculates the thief's 22-minute window and identifies the SBI Calangute Market Kiosk.
5. **🛡️ Step 5: The Magic Lock**: The bank locks *only* the thief's card session using Section 106 BNSS; regular citizens continue using the ATM normally.
6. **🚓 Step 6: Police Catch the Thief**: Dial 112 police car arrives in 3 minutes, captures the courier red-handed, and restores 100% of the funds!

### 3. High-Precision Mathematical Audit Mode
Switch to `🔬 SIH Math` to audit full 4-decimal scientific telemetry:
- **Velocity Decay**: $V_k = 0.8642$ (Layer ratio product $0.9420$, temporal factor $\exp(-0.3850) = 0.6805$, variance $\sigma = 0.1200$).
- **Bayesian MAP Sensor Fusion**: Centroid migration of $984.72\text{ km}$ from Chennai $(13.0827^\circ\text{N}, 80.2707^\circ\text{E})$ to Goa $(15.5439^\circ\text{N}, 73.7553^\circ\text{E})$ in $0\text{ms}$.
- **Cross-Border Utility**: $U_m(a)$ evaluated across candidates; SBI Calangute Market Kiosk tops at $88.42\%$ confidence.
- **TreeSHAP Attribution Waterfall**: Game-theoretic attribution vectors anchored to baseline $E[f(x)] = 0.4120$.
- **Sequential Interdiction Feasibility**: Digital freeze $1.40\text{s} < 22.40\text{m}$ ($I_{\text{freeze}} = 1$); patrol dispatch $6.80\text{m} < 37.40\text{m}$ yielding $+30.60\text{ min}$ safety margin.

---

*Manual maintained by Project Aegis Technical Architecture Team in compliance with I4C / MHA operational specifications.*

