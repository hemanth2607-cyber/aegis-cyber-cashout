"""
Master Word Document Generator for AegisCashout (SIH26184)
Generates an exhaustive, high-fidelity technical specification dossier
covering every logic component, file structure, algorithm, mathematical formulation,
API schema, and statutory legal citation.
"""

import os
import sys
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    """Sets background color of a table cell."""
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Sets internal padding for a table cell in dxa (1 pt = 20 dxa)."""
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def add_callout(doc, title, text, border_color="00F0FF", fill_color="F0FDF4"):
    """Adds a tactical callout box with a colored left accent border."""
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, fill_color)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    # Custom left border
    tcPr = cell._element.get_or_add_tcPr()
    tcBorders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="none"/>'
        f'<w:left w:val="single" w:sz="36" w:space="0" w:color="{border_color}"/>'
        f'<w:bottom w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(tcBorders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    run_t = p.add_run(f"TACTICAL MANDATE // {title.upper()}\n")
    run_t.bold = True
    run_t.font.name = "Segoe UI"
    run_t.font.size = Pt(9.5)
    run_t.font.color.rgb = RGBColor(15, 23, 42)
    
    run_b = p.add_run(text)
    run_b.font.name = "Segoe UI"
    run_b.font.size = Pt(9.5)
    run_b.font.color.rgb = RGBColor(51, 65, 85)

def format_code_block(doc, code_text):
    """Adds a shaded monospace code block."""
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, "0F172A")
    set_cell_margins(cell, top=120, bottom=120, left=160, right=160)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run(code_text)
    run.font.name = "Consolas"
    run.font.size = Pt(8.5)
    run.font.color.rgb = RGBColor(226, 232, 240)

def main():
    doc = Document()
    
    # Page setup - 0.75 in margins
    sections = doc.sections
    for s in sections:
        s.top_margin = Inches(0.75)
        s.bottom_margin = Inches(0.75)
        s.left_margin = Inches(0.75)
        s.right_margin = Inches(0.75)
        s.different_first_page_header_footer = True
        
        # Header / Footer
        header = s.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("AEGISCASHOUT // SIH26184 MASTER TECHNICAL DOSSIER  |  CONFIDENTIAL")
        hrun.font.name = "Segoe UI"
        hrun.font.size = Pt(8)
        hrun.font.color.rgb = RGBColor(148, 163, 184)
        
        footer = s.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("National Cybercrime Reporting Portal (1930 NCRP) • I4C • Ministry of Home Affairs (MHA)")
        frun.font.name = "Segoe UI"
        frun.font.size = Pt(8)
        frun.font.color.rgb = RGBColor(148, 163, 184)

    # Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Segoe UI'
    normal_style.font.size = Pt(10)
    normal_style.font.color.rgb = RGBColor(30, 41, 59)
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(4)

    # -------------------------------------------------------------
    # TITLE & HERO HEADER
    # -------------------------------------------------------------
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(10)
    title_p.paragraph_format.space_after = Pt(2)
    r_sub = title_p.add_run("SMART INDIA HACKATHON 2026 // PROBLEM STATEMENT ID: SIH26184\n")
    r_sub.bold = True
    r_sub.font.size = Pt(10)
    r_sub.font.color.rgb = RGBColor(2, 132, 199)
    
    r_main = title_p.add_run("PROJECT AEGISCASHOUT\n")
    r_main.bold = True
    r_main.font.size = Pt(26)
    r_main.font.color.rgb = RGBColor(15, 23, 42)
    
    r_desc = title_p.add_run(
        "Predictive Analytics Framework for Cybercrime Complaints to Forecast Likely Cash Withdrawal Locations in Advance, "
        "Enabling Generation of Actionable Intelligence for Timely and Proactive Cybercrime Intervention."
    )
    r_desc.font.size = Pt(12)
    r_desc.font.color.rgb = RGBColor(71, 85, 105)

    doc.add_paragraph()

    # Meta Table
    tbl = doc.add_table(rows=5, cols=2)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Nodal Authority", "Indian Cyber Crime Coordination Centre (I4C), Ministry of Home Affairs (MHA)"),
        ("System Designation", "Project AegisCashout (National Automated Cashout Interception Engine)"),
        ("Statutory Compliance", "Section 106 & 107 BNSS, 2023 | Section 318(4) & 319 BNS, 2023 | Sec 66D IT Act | Sec 63 BSA"),
        ("Pilot Coverage", "13,000 ATMs across 3 Metro Pilot Zones (Delhi-NCR: 5,000, Mumbai: 4,500, Bengaluru: 3,500) • 12 Cyber Cells"),
        ("SLA Performance", "Sub-50ms Dual-Stage ML Inference | Sub-10ms RAM Multigraph Traversal | 100% Kiosk Public Uptime")
    ]
    for idx, (k, v) in enumerate(meta_data):
        row = tbl.rows[idx]
        cell_k, cell_v = row.cells[0], row.cells[1]
        set_cell_background(cell_k, "0F172A")
        set_cell_background(cell_v, "F8FAFC" if idx % 2 == 0 else "FFFFFF")
        set_cell_margins(cell_k, top=80, bottom=80, left=120, right=120)
        set_cell_margins(cell_v, top=80, bottom=80, left=120, right=120)
        
        pk = cell_k.paragraphs[0]
        pk.paragraph_format.space_before = Pt(0)
        pk.paragraph_format.space_after = Pt(0)
        rk = pk.add_run(k)
        rk.bold = True
        rk.font.size = Pt(9)
        rk.font.color.rgb = RGBColor(255, 255, 255)
        
        pv = cell_v.paragraphs[0]
        pv.paragraph_format.space_before = Pt(0)
        pv.paragraph_format.space_after = Pt(0)
        rv = pv.add_run(v)
        rv.font.size = Pt(9)
        rv.font.color.rgb = RGBColor(30, 41, 59)

    doc.add_paragraph()
    doc.add_page_break()

    # -------------------------------------------------------------
    # SECTION 1: EXECUTIVE SUMMARY & THREAT LANDSCAPE
    # -------------------------------------------------------------
    h1 = doc.add_heading("1. Executive Summary & Operational Context", level=1)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(4)

    doc.add_paragraph(
        "In contemporary Indian financial cybercrime (encompassing Digital Arrest extortion, investment scams, "
        "phishing APK sweeps, and loan fraud), criminal syndicates exploit a massive asymmetric latency advantage over "
        "law enforcement. When a citizen in Chennai, Mumbai, or Bengaluru falls victim to a financial fraud, they lodge a "
        "formal distress report on the Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS / Helpline 1930)."
    )
    doc.add_paragraph(
        "Within seconds of siphoning funds, automated criminal botnets execute rapid peeling chains across 3 to 5 intermediary "
        "layers of digital money mule accounts via UPI and IMPS switches. The terminal objective is physical cashout: "
        "converting digital balances into paper banknotes at off-site ATMs, micro-ATMs, and Bank Mitra (AePS/CSP) kiosks "
        "before judicial freeze notices can be dispatched."
    )

    add_callout(
        doc,
        "The Golden Hour Breakdown",
        "Physical Cash-Out Extraction Horizon: Syndicates pull paper cash within 15 to 45 minutes of theft.\n"
        "Legacy Reactive Police Lag: Traditional inter-state manual investigations take 4 to 6 hours for jurisdictional "
        "verification, nodal bank emails, and account freezes—long after the funds have evaporated into the shadow economy.\n"
        "Aegis Impact: Recovers the initiative by predicting the physical extraction hexagon and terminal 15 to 45 minutes "
        "in advance with sub-50ms inference latency.",
        border_color="EF4444",
        fill_color="FEF2F2"
    )

    doc.add_paragraph()
    doc.add_paragraph(
        "To break this asymmetric timeline, Project AegisCashout implements a predictive spatio-temporal AI engine "
        "directly downstream of central 1930 NCRP telemetry, evaluating mule graph velocities, mobile application telemetry, "
        "and spatial terminal infrastructure to pinpoint candidate cash-out points within ~700 meters."
    )

    # -------------------------------------------------------------
    # SECTION 2: THE EXTRACTED INTELLIGENCE DOCTRINE
    # -------------------------------------------------------------
    h2 = doc.add_heading("2. Extracted Intelligence Doctrine: The Cross-Border Paradigm Shift", level=1)
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(4)

    doc.add_heading("2.1 The Core Misconception: Why Victim Location ≠ Cash-Out Location", level=2)
    doc.add_paragraph(
        "• The Root Cause: Organized cybercrime syndicates decouple the victim acquisition layer from the physical cash "
        "liquidation layer. A victim losing money in Chennai while a cash runner extracts notes from an ATM in Goa is standard operational tradecraft.\n"
        "• The Algorithmic Failure: Any spatial model that naively queries for ATMs in proximity to the victim's location in Chennai will fail 100% of the time.\n"
        "• The Paradigm Shift: The victim's geographic location is exclusively treated as the incident root node (v0). "
        "The predictive framework tracks the terminating mule entity (vk) where physical cashout occurs."
    )

    doc.add_heading("2.2 The Three Telemetric Bridges Connecting Chennai to Goa", level=2)
    doc.add_paragraph(
        "The predictive framework shifts its spatial search centroid from Chennai to Goa using three digital and financial telemetry vectors:\n"
        "1. Device & App Telemetry (Real-Time Sensor Anchor): Layer-3 and Layer-4 mules access mobile banking or UPI applications to verify fund arrival "
        "before traveling to an ATM. That app login emits network telemetry (IP subnet, ISP operating circle, BTS cell-tower ping) originating from a telecom "
        "circle in Goa, instantly resetting the spatial search anchor to that territory.\n"
        "2. Mule KYC & Debit Node (Structural Spatial Anchor): Terminating accounts receiving split funds typically have branch records, registered "
        "residential addresses, or debit card delivery PIN codes mapped to specific geographic clusters (e.g., Margao, Panaji).\n"
        "3. Syndicate Behavioral Footprint (Graph ML Spatial Anchor): Syndicates operate across repeatable laundering corridors. Graph embeddings "
        "(Node2Vec / GraphSAGE) link entry nodes in Chennai to historical complaint subgraphs that consistently liquidate in high-turnover tourist and commercial corridors."
    )

    doc.add_heading("2.3 Adversary Rationale: Why Syndicates Cash Out in Destinations Like Goa", level=2)
    doc.add_paragraph(
        "Adversary behavioral modeling shows syndicates favor tourist and commercial corridors due to three operational advantages:\n"
        "• High ATM Liquidity: Tourist corridors feature heavily stocked ATMs with frequent replenishment schedules.\n"
        "• Transient Crowd Anonymity: A runner conducting multiple rapid withdrawals with structured debit cards blends into dense foot traffic without alerting local bank staff.\n"
        "• Exploitation of Inter-State Jurisdictional Friction: Syndicates rely on the fact that local police (e.g., Tamil Nadu Police) face jurisdictional boundaries, "
        "inter-state transit permissions, and manual coordination delays that traditionally take days to resolve."
    )

    doc.add_heading("2.4 How Aegis Solves the Cross-Border Problem", level=2)
    doc.add_paragraph(
        "• Decoupled Jurisdictional Alerting: Because the system operates centrally at the national I4C / NCRP telemetry layer, it bypasses inter-state "
        "administrative friction. The moment a target H3 hexagon in Goa is forecasted, the system issues an automated dispatch payload directly to the "
        "Goa Police Emergency Response Support System (ERSS Dial 112) CAD console.\n"
        "• Targeted Digital Containment (Card-Session Layer): Aegis triggers an immediate API request to the NPCI / Core Banking Switch, deploying a "
        "15-minute micro-delay or dynamic step-up authentication hold on the specific card session. The physical ATM remains 100% operational for the public, "
        "while the runner's transaction is stalled, eliminating their escape margin."
    )

    add_callout(
        doc,
        "SIH Evaluation Jury Defense Pitch",
        "\"Our model does not look for ATMs near the victim. In over 90% of organized cyber financial crimes, victims and cash-out points are separated "
        "by hundreds or thousands of kilometers. Aegis uses the victim complaint strictly as the root node to traverse the multi-hop mule graph. "
        "The spatial ranker dynamically anchors on the terminating mule account's digital telemetry, device IP cluster, and syndicate graph patterns—in "
        "this case, forecasting the cash-out in Goa while alerting Goa's Dial 112 CAD within milliseconds of a report filed in Chennai.\"",
        border_color="00F0FF",
        fill_color="F0FDFA"
    )

    doc.add_page_break()

    # -------------------------------------------------------------
    # SECTION 3: MATHEMATICAL FORMULATIONS & ALGORITHMS
    # -------------------------------------------------------------
    h3 = doc.add_heading("3. Mathematical Formulations & Algorithmic Specifications", level=1)
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(4)

    doc.add_heading("3.1 Dynamic Spatial Anchor Transition (Bayesian Telemetry Fusion & MAP Estimation)", level=2)
    doc.add_paragraph(
        "Instead of searching near the victim x_victim in R^2, the search anchor x_anchor shifts to the geographic footprint of the terminating mule node v_k "
        "via Maximum A Posteriori (MAP) estimation across all digital and structural telemetry sensors S = {IP_Subnet, Cell_BTS, Branch_KYC, Historical_ATM}:"
    )
    format_code_block(
        doc,
        "x_anchor = argmax_x  SUM_{s in S}  w_s * exp( -0.5 * (x - mu_s)^T * Sigma_s^-1 * (x - mu_s) )\n\n"
        "Where:\n"
        "  - mu_s in R^2 is the geographic coordinate vector (latitude, longitude) of sensor s.\n"
        "  - Sigma_s in R^(2x2) is the sensor-specific spatial covariance error matrix:\n"
        "      Sigma_BTS ~ 500m (cellular sector precision)\n"
        "      Sigma_IP  ~ 5km (telecom circle precision)\n"
        "  - w_s is the dynamic sensor reliability weight satisfying SUM_{s in S} w_s = 1."
    )

    doc.add_heading("3.2 Syndicate Corridor Transition Probability (Graph ML Interaction)", level=2)
    doc.add_paragraph(
        "Let z_S in R^d be the structural graph embedding (GraphSAGE / Node2Vec) of the active laundering subgraph, and let z_{R_j} in R^d denote the learned "
        "territorial profile of target region R_j (e.g., North Goa Coastal Belt). The cross-border transition probability under specific fraud modus M is:"
    )
    format_code_block(
        doc,
        "P(R_j | G, M) = exp( z_S^T * W_M * z_{R_j} ) / SUM_{l in R} exp( z_S^T * W_M * z_{R_l} )\n\n"
        "Where:\n"
        "  - W_M in R^(d x d) is a learned bilinear routing weight matrix specific to fraud modus M\n"
        "    (e.g., DIGITAL_ARREST, INVESTMENT_SCAM, PHISHING_APK).\n"
        "  - R is the universe of all state/metro police jurisdictions."
    )

    doc.add_heading("3.3 Formal Mule Velocity Decay Formulation (V_k)", level=2)
    doc.add_paragraph(
        "Transaction velocity decreases exponentially as funds fragment across multiple intermediary accounts and encounter banking settlement intervals:"
    )
    format_code_block(
        doc,
        "V_k = [ PROD_{i=1}^k (A_i / A_{i-1}) ] * exp( -lambda * SUM_{i=1}^k Delta_t_i ) * [ 1 - tanh( gamma * Out_Degree / In_Degree ) ]\n\n"
        "Where:\n"
        "  - A_i / A_{i-1} is the capital retention ratio after peeling at hop i.\n"
        "  - lambda = 0.05 is the temporal half-life decay parameter over cumulative latency Delta_t_i.\n"
        "  - gamma = 0.5 penalizes high fan-out dispersion into multiple mule branches."
    )

    doc.add_heading("3.4 Cross-Border Mule Runner Utility Function (U_m(a))", level=2)
    doc.add_paragraph(
        "To model runner terminal selection trading off liquidity against apprehension risk, utility U_m(a) for cash-out terminal a in A is:"
    )
    format_code_block(
        doc,
        "U_m(a) = w1 * psi_dist(d(x_anchor, x_a)) + w2 * psi_liq(L_a) + w3 * E_crowd(a) + w4 * J(x_a, x_victim) - w5 * psi_police(x_a, P_local)\n\n"
        "1. Spatial Distance Attenuation:\n"
        "   psi_dist = exp( -d(x_anchor, x_a)^2 / (2 * sigma_d^2) )\n\n"
        "2. Liquidity Attractiveness:\n"
        "   psi_liq = 1 / ( 1 + exp( -kappa * (L_a / A_target - 1) ) )\n\n"
        "3. Crowd Anonymity Factor (Foot-traffic entropy):\n"
        "   E_crowd(a) = - SUM_c p_c * log(p_c)\n\n"
        "4. Jurisdictional Friction Exploitation (Interstate boundary distance):\n"
        "   J(x_a, x_victim) = tanh( D_state_border(x_a, x_victim) / delta_jurisdiction )\n\n"
        "5. Local Police Proximity Penalty:\n"
        "   psi_police = SUM_{p in P_local} 1 / [ 1 + (d(x_a, p) / R_patrol)^2 ]"
    )

    doc.add_heading("3.5 Two-Condition Sequential Interdiction Dependency (Corrected Race Condition)", level=2)
    doc.add_paragraph(
        "Physical apprehension is successful if and only if both conditions are satisfied sequentially:"
    )
    format_code_block(
        doc,
        "Condition 1 (Digital Pre-emption):  T_digital_freeze < Delta_t_hat\n"
        "Condition 2 (Physical Intercept):   T_physical_dispatch < Delta_t_hat + ( I_freeze * tau_friction )\n\n"
        "Where I_freeze is defined as:\n"
        "  I_freeze = 1 if (T_digital_freeze < Delta_t_hat  AND  API_Status == SUCCESS) else 0\n\n"
        "Total physical patrol response latency:\n"
        "  T_physical_dispatch = t_CAD_route + d(PCR_unit, x_a) / v_patrol\n"
        "  Effective Window Horizon:  W_effective = Delta_t_hat + ( I_freeze * tau_friction )\n"
        "  Operational Buffer Margin: Margin = W_effective - T_physical_dispatch"
    )

    # 4-State Table
    doc.add_paragraph("The 4-State Operational Decision Matrix:")
    matrix_tbl = doc.add_table(rows=5, cols=5)
    matrix_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cols_header = ["State", "Digital Hold (I_freeze)", "Physical Dispatch ETA", "Classification", "Tactical Operational Outcome"]
    for j, h in enumerate(cols_header):
        c = matrix_tbl.cell(0, j)
        set_cell_background(c, "0F172A")
        set_cell_margins(c, 80, 80, 100, 100)
        p = c.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    matrix_rows = [
        ("State 1", "1 (SUCCESS)", "< Δt_hat + tau_friction", "OPTIMAL_INTERDICTION", "Funds Secured + Runner Apprehended On-Site. Card session hold stalled runner; PCR arrives in time."),
        ("State 2", "1 (SUCCESS)", ">= Δt_hat + tau_friction", "ASSET_PRESERVED_ONLY", "Funds Saved, Runner Escapes. Card rejected under Sec 106 BNSS; runner flees before police arrive."),
        ("State 3", "0 (FAILURE)", "< Δt_hat", "KINETIC_INTERCEPT", "Direct Physical Capture. Digital freeze failed/timed out, but nearby beat patrol intercepts runner mid-transaction."),
        ("State 4", "0 (FAILURE)", ">= Δt_hat", "INTERDICTION_FAILED", "Extraction Consummated. Cash drawn; case transitions to post-incident recovery under Section 107 BNSS.")
    ]
    for idx, row in enumerate(matrix_rows, 1):
        for col_idx, val in enumerate(row):
            c = matrix_tbl.cell(idx, col_idx)
            set_cell_background(c, "F8FAFC" if idx % 2 == 0 else "FFFFFF")
            set_cell_margins(c, 70, 70, 90, 90)
            p = c.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8.5)
            if col_idx == 3:
                r.bold = True
                if val == "OPTIMAL_INTERDICTION":
                    r.font.color.rgb = RGBColor(5, 150, 105)
                elif val == "INTERDICTION_FAILED":
                    r.font.color.rgb = RGBColor(220, 38, 38)
                else:
                    r.font.color.rgb = RGBColor(217, 119, 6)

    doc.add_page_break()

    # -------------------------------------------------------------
    # SECTION 4: END-TO-END SYSTEM EXECUTION (LIVE WALKTHROUGH)
    # -------------------------------------------------------------
    h4 = doc.add_heading("4. How the Prototype Works: End-to-End System Execution", level=1)
    h4.paragraph_format.space_before = Pt(14)
    h4.paragraph_format.space_after = Pt(4)

    steps = [
        ("Step 1: Incident Ingestion at Origin Point (Chennai Root Node v0)",
         "A victim in Chennai calls 1930 reporting an immediate ₹7,50,000 loss to a 'Digital Arrest' scam. "
         "The ingestion engine (POST /api/v1/complaints/ingest) records Chennai strictly as the incident root node v0, "
         "initializing the multigraph in RAM without restricting the search boundary to Tamil Nadu."),
        
        ("Step 2: In-Memory Graph Unfolding & Telemetric Anchor Re-Centering",
         "As CFCFRMS webhooks stream to POST /api/v1/transactions/hook, the graph engine (features/graph_engine.py) builds "
         "the downstream fund trail: Layer 1 splits in 6m; Layer 2 to Layer 3 peeling structures funds into tranches under ₹50,000. "
         "The terminating mule triggers a mobile banking balance check emitting an IP address from a Goa telecom circle, and the registered "
         "home branch maps to a South Goa PIN code. The spatial anchor x_anchor instantly shifts from Chennai to Goa."),
        
        ("Step 3: Dual-Stage ML Inference Engine",
         "Stage 1 (LightGBM Survival Regressor) evaluates peeling variance and velocity decay (V_k), predicting a natural cashout window "
         "Delta_t_hat = 22.4 minutes. Stage 2 (Spatial Ranker) computes kinematic reachability isochrones on Uber H3 Resolution 8 cells, "
         "scoring candidate cells with the Adversary Utility Function to output Top-3 hexagons and pinpointing an off-site ATM in Calangute."),
        
        ("Step 4: Real-Time TreeSHAP & Statutory Legal Briefing",
         "ml_models/explainer.py calculates local Shapley attributions in <35ms and auto-compiles court-ready dossiers:\n"
         "• Section 106 BNSS Order: Card-session debit freeze citing positive SHAP factors (Peeling Velocity: +0.38, NH-66 Corridor: +0.29, L3 Telemetry: +0.22).\n"
         "• Section 107 BNSS Dossier: Attachment report for the Magistrate identifying terminating balances as proceeds of crime.\n"
         "• Penal Charges: Section 318(4) & 319 BNS, 2023 r/w Section 66D IT Act, certified via SHA-256 hash under Section 63 BSA."),
        
        ("Step 5: Automated Dual Interdiction Execution",
         "1. Targeted Digital Pre-emption: POST /api/v1/bank/friction deploys a tau_friction = 15.0m session-level hold at the switch under Sec 106 BNSS. "
         "The physical ATM remains 100% active for the public; only the suspect card is stalled. With T_digital_freeze = 1.4s < 22.4m, I_freeze = 1, "
         "expanding the effective physical intercept window to 22.4 + 15.0 = 37.4 minutes.\n"
         "2. Physical Intercept via Decoupled ERSS Dial 112 Dispatch: POST /api/v1/dispatch/dial112 pushes an automated CAD payload directly to Goa Police Dial 112. "
         "Nearest PCR van (4.2 km away) arrives in T_dispatch = 1.5m (CAD route) + 7.2m (transit) = 8.7 minutes."),
        
        ("Step 6: Command Center Visualization & Resolution",
         "The engine evaluates: 1.4s < 22.4m (Digital Hold Active) and 8.7m < 37.4m (Physical Intercept Met with +28.7m buffer margin). "
         "The incident resolves as OPTIMAL_INTERDICTION. The dashboard displays the curved fund arc from Chennai to Goa, the pulsing Calangute H3 hexagon, "
         "the extended 37m 24s countdown timer, and live PCR patrol intercept status.")
    ]

    for title, body in steps:
        doc.add_heading(title, level=2)
        doc.add_paragraph(body)

    doc.add_page_break()

    # -------------------------------------------------------------
    # SECTION 5: COMPLETE REPOSITORY FILE STRUCTURE & SUBSYSTEMS
    # -------------------------------------------------------------
    h5 = doc.add_heading("5. Complete Repository File Structure & Architecture", level=1)
    h5.paragraph_format.space_before = Pt(14)
    h5.paragraph_format.space_after = Pt(4)

    doc.add_paragraph(
        "The project is structured into four decoupled, modular layers designed for high-throughput streaming and sub-50ms inference SLAs:"
    )

    format_code_block(
        doc,
        "aegis-cyber-cashout/ (pervekkala)\n"
        "├── backend/\n"
        "│   ├── main.py                     # FastAPI application root, lifespan, CORS & WebSocket routing\n"
        "│   ├── schemas.py                  # Pydantic v2 data validation schemas (Complaints, Inferences, CAD, Friction)\n"
        "│   ├── websocket.py                # Starlette WebSocket manager broadcasting live tactical alerts to frontend\n"
        "│   ├── routes/\n"
        "│   │   ├── complaints.py           # Ingestion (POST /complaints/ingest) & predictions (GET /predictions/current)\n"
        "│   │   ├── transactions.py         # Real-time CFCFRMS multi-hop webhooks (POST /transactions/hook)\n"
        "│   │   └── interventions.py        # ERSS Dial 112 CAD dispatch, Sec 106 bank friction, mobile feed, CCTV\n"
        "│   └── services/\n"
        "│       ├── graph_service.py        # Thread-safe in-memory multigraph management & velocity calculation\n"
        "│       └── interdiction_service.py # Two-condition sequential feasibility engine & 4-state matrix evaluator\n"
        "├── frontend/\n"
        "│   ├── app/\n"
        "│   │   ├── layout.tsx              # Root HTML shell, fonts (Inter/JetBrains Mono), tactical HUD wrapper\n"
        "│   │   ├── page.tsx                # Master tactical dashboard coordinating map, feed, action panel & modals\n"
        "│   │   └── globals.css             # Tailwind CSS tokens, neon glows, glassmorphism panel styles\n"
        "│   └── components/\n"
        "│       ├── TacticalMap.tsx         # Leaflet/CartoDB Dark Matter GIS map, H3 hexagons, road PCR routes\n"
        "│       ├── ActionPanel.tsx         # Dual-Interdiction hub, Sec 106 BNSS trigger, Dial 112 CAD, XAI pills\n"
        "│       ├── AlertFeed.tsx           # Left sidebar streaming active NCRP 1930 incident cards by urgency\n"
        "│       ├── ForensicBriefDrawer.tsx # Collapsible forensic drawer: TreeSHAP bars, BNSS legal briefs, logs\n"
        "│       └── HeistSimulationModal.tsx# Interactive modal allowing jury evaluators to inject synthetic cyber heists\n"
        "├── ml_models/\n"
        "│   ├── train_stage1_timetocashout.py # LightGBM regressor training pipeline predicting Delta_t_hat\n"
        "│   ├── train_stage2_spatialranker.py # CatBoost / LambdaMART training pipeline scoring candidate H3 cells\n"
        "│   ├── explainer.py                # TreeSHAP explainer generating game-theoretic attributions & BNSS legal text\n"
        "│   ├── cv_surveillance.py          # Edge YOLOv8 / OpenCV camera telemetry simulation for ATM kiosks\n"
        "│   └── artifacts/                  # Serialized Joblib model weights (stage1_regressor, stage2_ranker)\n"
        "├── features/\n"
        "│   ├── graph_engine.py             # NetworkX multigraph builder computing formal velocity decay (V_k)\n"
        "│   └── pipeline.py                 # Vectorizer extracting 12 real-time spatio-temporal ML features\n"
        "├── data_generator/\n"
        "│   ├── generate_synthetic_graphs.py# Generates realistic synthetic multi-hop laundering subgraphs\n"
        "│   └── export_db.py                # Exports synthetic training records to CSV/JSON databases\n"
        "├── deploy/\n"
        "│   ├── docker-compose.yml          # Complete multi-container orchestration (FastAPI + Next.js + Redis)\n"
        "│   ├── Dockerfile.backend          # Production multi-stage Docker container for Python 3.11 backend\n"
        "│   └── Dockerfile.frontend         # Standalone production container for Next.js frontend\n"
        "├── tests/\n"
        "│   ├── test_pipeline_e2e.py        # End-to-end traversal, ML inference latency (<50ms) & null immunity test\n"
        "│   └── test_backend_api.py         # Full pytest suite validating all 8 REST endpoints & WebSocket feeds\n"
        "├── COMPARISON.md                   # Detailed comparative audit against SIH26184 PPT deck\n"
        "├── USER_GUIDE.md                   # Law enforcement standard operating procedure (SOP) & operator manual\n"
        "└── README.md                       # Master GitHub repository documentation & architectural overview"
    )

    doc.add_page_break()

    # -------------------------------------------------------------
    # SECTION 6: API SPECIFICATIONS & REST CONTRACTS
    # -------------------------------------------------------------
    h6 = doc.add_heading("6. API Endpoints & REST Interface Specifications", level=1)
    h6.paragraph_format.space_before = Pt(14)
    h6.paragraph_format.space_after = Pt(4)

    api_endpoints = [
        ("POST /api/v1/complaints/ingest", "Ingests new 1930 NCRP citizen distress complaint; records victim as root node v0 and triggers dual-stage inference in <50ms.",
         '{\n  "complaint_id": "NCR-2026-08832",\n  "victim_id": "VICTIM-CHENNAI-01",\n  "victim_latitude": 13.0827,\n  "victim_longitude": 80.2707,\n  "fraud_category": "DIGITAL_ARREST",\n  "initial_amount": 750000.0,\n  "initial_mule_account": "HDFC00018921"\n}'),

        ("POST /api/v1/transactions/hook", "Streams bank core switch / CFCFRMS multi-hop peeling webhooks to update graph in RAM.",
         '{\n  "transaction_id": "TXN-99410",\n  "from_account": "HDFC00018921",\n  "to_account": "SBIN00088192",\n  "amount": 45000.0,\n  "channel": "IMPS",\n  "timestamp": "2026-09-08T01:10:00Z",\n  "device_ip": "157.34.12.98",\n  "bts_cell_id": "GOA-BTS-403516"\n}'),

        ("GET /api/v1/predictions/current", "Fetches latest spatio-temporal inference, predicted H3 cells, remaining extraction minutes, and TreeSHAP risk factors.",
         '{\n  "complaint_id": "NCR-2026-08832",\n  "predicted_cashout_window_mins": 22.4,\n  "top_candidate_h3_res8": ["886196a52ffffff", "886196a50ffffff"],\n  "pinpointed_atm": {\n    "terminal_id": "SBI-ATM-CAL-042",\n    "name": "State Bank of India - Calangute Kiosk",\n    "latitude": 15.5432,\n    "longitude": 73.7554,\n    "cash_reserves_inr": 850000\n  },\n  "shap_drivers": [{"feature": "peeling_velocity", "shap_value": 0.38}]\n}'),

        ("POST /api/v1/bank/friction", "Invokes Section 106 BNSS directive to apply 15-min session latency hold at switch while leaving kiosk active for public.",
         '{\n  "complaint_id": "NCR-2026-08832",\n  "target_mule_account": "SBIN00088192",\n  "action": "STEP_UP_AUTH",\n  "friction_mode": "ATM_MICRO_DELAY_15MIN"\n}'),

        ("POST /api/v1/dispatch/dial112", "Dispatches nearest police beat patrol via ERSS Dial 112 CAD console; evaluates sequential interdiction feasibility.",
         '{\n  "complaint_id": "NCR-2026-08832",\n  "target_h3_index": "886196a52ffffff",\n  "assigned_patrol_unit_id": "BEAT-PCR-GOA-COASTAL-3",\n  "delta_t_hat_mins": 22.4,\n  "pcr_distance_km": 4.2\n}'),

        ("GET /api/v1/analytics/pilot-metrics", "Serves nationwide coverage metrics (13,000 ATMs across Delhi, Mumbai, Bengaluru) and recovery rate benchmarks (2.7% -> 8.5%).",
         '{\n  "total_coverage": {"total_atms_monitored": 13000, "total_cities": 3, "total_cells": 12},\n  "fund_recovery_benchmark": {"legacy_rate_pct": 2.7, "with_aegis_ai_rate_pct": 8.5, "improvement_pct": 215.0}\n}'),

        ("POST /api/v1/surveillance/cctv-check", "Executes edge computer vision (YOLOv8 / OpenCV) telemetry simulation on ATM kiosk cameras.",
         '{\n  "terminal_id": "SBI-ATM-CAL-042",\n  "camera_active": true,\n  "cctv_risk_score": 0.88,\n  "face_obscured": true,\n  "loitering_duration_sec": 185.0,\n  "anomalous_behavior_flag": true\n}')
    ]

    for ep, desc, sample_json in api_endpoints:
        doc.add_heading(ep, level=2)
        doc.add_paragraph(desc)
        format_code_block(doc, sample_json)

    doc.add_page_break()

    # -------------------------------------------------------------
    # SECTION 7: STATUTORY COMPLIANCE & LEGAL TENABILITY
    # -------------------------------------------------------------
    h7 = doc.add_heading("7. Statutory Compliance & Judicial Tenability (2024 Criminal Codes)", level=1)
    h7.paragraph_format.space_before = Pt(14)
    h7.paragraph_format.space_after = Pt(4)

    doc.add_paragraph(
        "A critical strength of Project AegisCashout is that all mathematical outputs and algorithmic interventions "
        "directly generate legally tenable, court-admissible dossiers under India's newly enacted criminal codes:"
    )

    legal_items = [
        ("1. Procedural Police Seizure & Lien (Section 106 BNSS, 2023)",
         "Empowers police officers to seize suspect property or freeze accounts creating a direct lien. "
         "Aegis uses this power to enforce switch-level debit micro-delays on suspect card sessions while preserving "
         "100% kiosk uptime for innocent citizens."),

        ("2. Magistrate Attachment of Proceeds of Crime (Section 107 BNSS, 2023)",
         "Mandates formal reporting to the jurisdictional Magistrate praying for judicial attachment of properties "
         "derived from criminal activity. Aegis auto-synthesizes this dossier identifying terminating accounts as direct proceeds of crime."),

        ("3. Substantive Penal Grounding (Section 318(4) & 319 BNS, 2023 r/w Sec 66D IT Act, 2000)",
         "Formally categorizes offenses under Section 318(4) (Cheating) and Section 319 (Cheating by personation) of the Bharatiya "
         "Nyaya Sanhita, 2023, coupled with Section 66D of the Information Technology Act (Cheating by personation using computer resources)."),

        ("4. Electronic Evidence Admissibility & Non-Repudiation (Section 63 BSA, 2023)",
         "Replaces legacy Section 65B IEA certificates. Every inference vector, SHAP attribution, switch directive, and CAD dispatch payload "
         "is timestamped and cryptographically signed with SHA-256 to ensure complete evidentiary integrity and non-repudiation in court.")
    ]

    for title, desc in legal_items:
        doc.add_heading(title, level=2)
        doc.add_paragraph(desc)

    doc.add_page_break()

    # -------------------------------------------------------------
    # SECTION 8: DEPLOYMENT & QUICKSTART GUIDE
    # -------------------------------------------------------------
    h8 = doc.add_heading("8. Deployment Guide & Zero-Cost Sovereign Architecture", level=1)
    h8.paragraph_format.space_before = Pt(14)
    h8.paragraph_format.space_after = Pt(4)

    doc.add_paragraph(
        "To ensure operational viability across all state police headquarters without recurring SaaS licensing fees or cloud dependencies, "
        "Aegis is built entirely on open, sovereign technology requiring zero external commercial API keys:"
    )

    sovereign_table = doc.add_table(rows=6, cols=4)
    sovereign_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    sov_headers = ["Layer", "Technology", "Commercial API Dependency?", "Licensing & Cost Tier"]
    for j, h in enumerate(sov_headers):
        c = sovereign_table.cell(0, j)
        set_cell_background(c, "0F172A")
        set_cell_margins(c, 80, 80, 100, 100)
        p = c.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(8.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    sov_rows = [
        ("Tactical GIS Basemap", "CartoDB Dark Matter / OSM", "NO (Zero tokens)", "100% Free Open-Access Tiles"),
        ("Spatial Indexing", "Uber H3 (`h3-py`, `h3-js`)", "NO (In-memory math)", "Apache 2.0 Open Source"),
        ("Nearest ATM Index", "SciPy `cKDTree`", "NO (Local RAM index)", "BSD Open Source"),
        ("Predictive ML Core", "LightGBM + CatBoost + TreeSHAP", "NO (Local CPU inference)", "MIT / Apache 2.0"),
        ("Streaming Microservices", "Python 3.11 + FastAPI + Redis", "NO (Self-hosted)", "BSD / MIT Open Source")
    ]
    for idx, row in enumerate(sov_rows, 1):
        for col_idx, val in enumerate(row):
            c = sovereign_table.cell(idx, col_idx)
            set_cell_background(c, "F8FAFC" if idx % 2 == 0 else "FFFFFF")
            set_cell_margins(c, 70, 70, 90, 90)
            p = c.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8.5)

    doc.add_paragraph()
    doc.add_heading("8.1 One-Click Docker Compose Launch", level=2)
    format_code_block(
        doc,
        "# Launch complete multi-service stack (FastAPI Backend on :8000, Next.js on :3000, Redis on :6379)\n"
        "docker compose -f deploy/docker-compose.yml up --build -d"
    )

    doc.add_heading("8.2 Local Native Execution", level=2)
    format_code_block(
        doc,
        "# 1. Launch FastAPI Backend\n"
        "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload\n\n"
        "# 2. Launch Next.js Frontend\n"
        "cd frontend && npm run dev (or npm run start -- -p 3000)\n\n"
        "# 3. Run Automated Validation Test Suite (9 passing tests)\n"
        "python -m pytest tests/test_pipeline_e2e.py tests/test_backend_api.py -v"
    )

    # -------------------------------------------------------------
    # SAVE DOCUMENT
    # -------------------------------------------------------------
    desktop_path1 = r"C:\Users\heman\Desktop\AegisCashout_Master_System_Specification_SIH26184.docx"
    desktop_path2 = r"C:\Users\heman\Desktop\AegisCashout_SIH26184_Dossier.docx"

    doc.save(desktop_path1)
    doc.save(desktop_path2)
    print(f"Master Word document successfully saved to:\n  1. {desktop_path1}\n  2. {desktop_path2}")

if __name__ == "__main__":
    main()
