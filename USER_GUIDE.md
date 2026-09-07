# AegisCashout — Personal Operator Guide & Feature Manual

Welcome to **AegisCashout**! This document explains what this system is, how it works in the real world, what every visual element on the tactical map represents, and how to use every button and option on the screen.

---

## 1. What Does This Project Do?

### The Real-World Problem
When a citizen in India falls victim to cyber fraud (e.g., investment scams, task scams, OTP frauds), they report it to the **National Cyber Crime Reporting Portal (NCRP / Helpline 1930)** under the **Indian Cyber Crime Coordination Centre (I4C), Ministry of Home Affairs (MHA)**.

Cyber syndicates use automated botnets to rapidly "peel" and split the stolen funds across 3 to 5 layers of digital "money mule" bank accounts via IMPS and UPI within minutes. Their ultimate goal is **Cashout**: a physical operative walks up to an ATM (usually an offsite, high-cash dispenser) and withdraws physical currency. 

* **The Problem:** By the time standard bank freeze notices reach banks hours or days later, the cash is already gone. Once physical currency leaves the dispenser, tracing and recovering it is almost impossible.
* **The Aegis Solution:** Aegis is a **predictive early-warning intelligence system**. Instead of reacting after the crime, Aegis analyzes transaction flow velocity and spatial patterns to **forecast the exact ATM and neighborhood (within ~700 meters) where the criminals will attempt cash withdrawal 15 to 45 minutes in advance**.

This allows law enforcement and banks to interdict the crime **before** the cash leaves the ATM dispenser.

---

## 2. What Are All Those Visuals on the Map?

When you look at the tactical GIS map of Delhi-NCR, you see several distinct layers:

### A. The Hexagons (H3 Res-8 Spatial Grid)
* **What they are:** Aegis breaks the entire Delhi-NCR region down into discrete hexagonal zones using **Uber H3 (Resolution 8)**. Each hexagon covers approximately **0.737 km²** (about 700–800 meters across).
* **Crimson Red Hexagon (`#FF0055`):** **Imminent Extraction Zone**. High AI confidence ($\ge 70\%$). Indicates high probability that a mule runner is currently heading to an ATM inside this specific hexagon within the remaining time window.
* **Amber / Orange Hexagon (`#FFAA00`):** **Probable Transit Corridor**. Moderate AI confidence ($< 70\%$). Shows secondary or alternate extraction zones.
* **Cyan Outlined Hexagons:** Secondary spatial clusters calculated by Stage 1 spatial clustering algorithms.
* **Clicking any Hexagon:** Immediately selects that threat and loads its full profile into the right sidebar.

### B. Pulsing Radar Dots / Pins (Target ATMs)
* **What they are:** Physical Automated Teller Machines identified within the predicted target cell.
* **Animated Ping Ring:** Highlights high-risk off-site ATMs (ATMs not attached to a bank branch, commonly favored by criminals for quick escapes).
* **Clicking an ATM Marker:** Opens a popup showing the ATM Terminal ID, Bank Name, Street Address, and estimated Vault Cash Reserves.

### C. Flowing Lines / Arcs (Money Peeling Flow)
* **What they are:** Multi-hop transaction traces.
* **Orange Lines:** The digital flow of stolen money hopping from the victim's account through Layer 1 and Layer 2 mule accounts.
* **Crimson Red Line:** The final hop from the terminating Layer 3 mule account pointing directly to the target ATM dispenser.

### D. Cyan Shield Icons & Dotted Circles (Police Beat Patrols)
* **What they are:** Active **Delhi Police / ERSS Dial 112 PCR Beat Patrol Vans** patrolling the streets (e.g., `BEAT-PCR-ROHINI-4`, `BEAT-PCR-DWARKA-2`).
* **Cyan Dotted Circles:** The **2.5 km rapid response buffer** of each patrol vehicle.
* **Status:** Units show either `PATROLLING` (standing by) or `DISPATCHED` (actively responding to an intercepted ATM).

### E. Top-Right Map HUD
* **Live GPS Coordinates:** Displays your current view center in real time (`NCR | LAT: 28.6139 | LON: 77.2090 | Z: 13`).
* **`[RECENTER]` Button:** Clicking this instantly glides the camera back to the active suspect hotspot if you panned away.

---

## 3. How to Use Every Option on the Dashboard

### 1. Top Navigation Bar (Header)
* **Jurisdiction Badge:** Indicates compliance with **Section 102 BNSS** (Bharatiya Nagarik Suraksha Sanhita) for digital asset attachment and freezing.
* **Active Complaints Counter:** Number of live cybercrime complaint streams currently being monitored.
* **Imminent Cashouts (<30m):** High-priority alerts where the cashout window is closing in under 30 minutes.
* **Interdicted Value:** Total rupees (₹) successfully saved and protected through police dispatches and bank friction freezes.
* **Dial 112 ERSS Beat:** Number of mobile police units active on the grid.
* **"Simulate Live Cyber Heist" (Top Right Button with Play Icon):**
  * **What it does:** Injects a dynamic, high-stakes cybercrime scenario into the live backend.
  * **How to use:** Click **`Simulate Live Cyber Heist`**. The backend will generate a new ₹4.8 Lakh fraud incident in Rohini Sector 16, simulate multi-hop mule account transfers, forecast the target ATM dispenser, and broadcast it via WebSocket. You will see a new alert appear in the feed with live countdown!

---

### 2. Threat Feed (Left Sidebar)
* **What it is:** A real-time chronological queue of all active cyber fraud complaints in Delhi-NCR, ranked by urgency (lowest remaining time at the top).
* **Urgency Badges:**
  * **Crimson `CRITICAL` Badge:** Less than 15 minutes remaining before cashout.
  * **Amber Badge:** Standard monitoring window (15–45 minutes).
* **Selecting an Alert:** Click any card in the feed to:
  1. Smoothly fly the map camera to that target hexagon and ATM.
  2. Draw the money mule peeling flow lines.
  3. Open the **Tactical Intercept Profile** on the right sidebar.
* **Collapse/Expand:** Click the small `<` or `>` arrow in the header to minimize the feed if you want a wider map view.

---

### 3. Tactical Action & Explainability Panel (Right Sidebar)
When you select an alert, this panel opens with actionable intelligence:

#### A. Dynamic Countdown Clock
* Displays the estimated time remaining in minutes and seconds (`MM:SS`) before the mule reaches the ATM.

#### B. Mule Peeling Trajectory
* Displays the **Terminating Mule Account Number** (e.g., `MULE-AXIS-991204`), the **Peeled Stolen Amount** (e.g., `₹4,80,000`), and the exact **Identified ATM Terminal**.

#### C. TreeSHAP AI Tactical Drivers
* Explains **why** the AI model made this prediction (crucial for court admissibility and preventing algorithmic bias):
  * *Cashout Velocity Surge:* Rapid withdrawals matching syndicate behavior.
  * *Off-site ATM Proximity:* Distance from highway exits or dense market clusters.
  * *Mule Node Density:* Past history of mule withdrawals in this postal zone.
* Includes a **Court-Ready Legal Brief** referencing Section 102 BNSS for judicial documentation.

#### D. Action Buttons
1. **`DISPATCH DIAL 112 BEAT PATROL` (Cyan Button):**
   * **What it does:** Sends an automated dispatch command to the Delhi Police ERSS Dial 112 Computer-Aided Dispatch (CAD) system.
   * **Result:** Assigns the closest patrolling PCR vehicle (e.g., `BEAT-PCR-ROHINI-4`), calculates police ETA (typically 4–7 minutes), marks the patrol unit as `DISPATCHED`, and pops up an official dispatch confirmation reference.
2. **`ACTIVATE BANK CASH-LOCK (15M HOLD)` (Crimson Button):**
   * **What it does:** Connects to the simulated NPCI/bank switch API to initiate a temporary 15-minute emergency security friction hold on the terminating mule account and the suspect dispenser.
   * **Result:** Halts ATM cash dispensing for that account, saves the funds, and adds the protected amount to the **Interdicted Value** counter at the top!
3. **`X` Close Button (Top Right):**
   * Closes the action panel to give you full, unobstructed map views.

---

## 4. Are Any External Paid APIs Required?

**NO.** All features are completely local, free, and self-hosted:

| Component | Provider / Method | Cost / API Key |
| :--- | :--- | :--- |
| **Map Base Tiles** | CartoDB Dark Matter / OSM | **100% Free** (Zero API key needed) |
| **Discrete Spatial Grid** | Uber H3 Mathematical Grid | **100% Free** (Computed in RAM) |
| **Stage 1 Machine Learning** | LightGBM Classifier | **100% Free** (Local Python model) |
| **Stage 2 Explainability** | TreeSHAP Explainer | **100% Free** (Local Python library) |
| **CAD & Bank Friction** | FastAPI Endpoints | **100% Free** (Local REST endpoints) |

---

## 5. Quick Step-by-Step Operator Workflow

Here is how you can showcase or use the system in 30 seconds:

1. Open **`http://localhost:3000`** in your web browser.
2. Look at the **Alert Feed** on the left and select any active threat (e.g., `NCR-2026-08832`).
3. Observe the map camera smoothly glide to the target area in Delhi-NCR, revealing the **red hexagon**, **pulsing ATM dispenser**, and **orange money flow lines**.
4. Check the **Right Sidebar**:
   - See the countdown timer ticking down.
   - Read the **TreeSHAP AI factors** explaining why this ATM was pinpointed.
5. Click **`DISPATCH DIAL 112 BEAT PATROL`** to send the closest police car.
6. Click **`ACTIVATE BANK CASH-LOCK (15M HOLD)`** to freeze the cashout and watch the **Interdicted Value** counter increase.
7. Click **`Simulate Live Cyber Heist`** at the top right to simulate a new live heist scenario in real time!
