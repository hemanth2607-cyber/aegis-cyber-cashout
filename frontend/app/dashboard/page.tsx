// frontend/app/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Shield, RefreshCw } from "lucide-react";
import AlgorithmicJourneyPanel, { Telemetry } from "../../components/AlgorithmicJourneyPanel";
import ActionPanel from "../../components/ActionPanel";
import { useRealtimeAlerts } from "../../hooks/useRealtimeAlerts";
import { FundHop } from "../../components/TacticalMap";

// Dynamic import with SSR false for Mapbox & DeckGL canvas
const TacticalMap = dynamic(() => import("../../components/TacticalMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] rounded-2xl border border-white/[0.08] bg-[#070B14] flex flex-col items-center justify-center font-mono text-cyan-400 space-y-3">
      <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      <span className="text-xs uppercase tracking-widest text-slate-400">
        Initializing Spatio-Temporal WebGL Canvas...
      </span>
    </div>
  ),
});

// Default Chennai to Goa benchmark data
const DEFAULT_ORIGIN = {
  lat: 13.0827,
  lng: 80.2707,
  label: "Victim v₀: Chennai, TN (₹7.5L Digital Arrest)",
};

const DEFAULT_PCR_BASE = {
  lat: 15.5449,
  lng: 73.7517,
};

const DEFAULT_SUSPECT_ATM = {
  lat: 15.5212,
  lng: 73.7699,
  frozen: false,
  name: "SBI Calangute Market Kiosk (ATM-GOA-042)",
};

const DEFAULT_HOTSPOTS = [
  "886196a52ffffff", // Calangute coastal hub
  "886196a50ffffff", // Candolim transit strip
  "886196a56ffffff", // Baga corridor
];

const DEFAULT_FUND_FLOW: FundHop[] = [
  { from: [80.2707, 13.0827], to: [73.8567, 18.5204], hop: 1 }, // Chennai -> Pune
  { from: [73.8567, 18.5204], to: [73.8180, 15.2993], hop: 2 }, // Pune -> Margao
  { from: [73.8180, 15.2993], to: [73.7699, 15.5212], hop: 3 }, // Margao -> Calangute
];

const DEFAULT_TELEMETRY: Telemetry = {
  ncrp: {
    ticketId: "NCR-2026-08832",
    amountInr: 750000,
    rootNode: "SBIN000492810 (Chennai)",
    category: "Digital Arrest / Institutional Extortion",
  },
  graphPeeling: {
    velocityDecay: 0.1428,
    hopLatencyMs: 380,
    peelingRatio: 0.88,
    activeHop: 3,
  },
  bayesianShift: {
    fromCity: "Chennai (Tamil Nadu)",
    toCity: "North Goa (Calangute)",
    sourceSignal: "cell",
    sensorCoordinates: [15.5212, 73.7699],
  },
  mlInference: {
    cashoutWindowMin: 22.4,
    h3Confidence: 0.89,
    targetH3: "886196a52ffffff",
    candidateAtmsCount: 4,
  },
  statutory: {
    shapFactors: [
      { label: "Peeling Velocity Decay", weight: 0.38 },
      { label: "NH-66 Highway Artery", weight: 0.29 },
      { label: "L3 App IP Nexus (Goa)", weight: 0.22 },
      { label: "Tourist Foot-Traffic Density", weight: 0.18 },
      { label: "Nearest Police Station Distance", weight: -0.12 },
    ],
    sections: [
      "Section 106 BNSS (Field Seizure Lien)",
      "Section 107 BNSS (Magistrate Attachment)",
      "Section 318(4) & 319 BNS r/w 66D IT Act",
    ],
    courtDossierId: "DOSSIER-2026-GOA-08832",
  },
  interdiction: {
    digitalFreezeTime: 1.4,
    physicalDispatchTime: 8.7,
    predictedWindowMin: 22.4,
    frictionDelayMin: 15.0,
    marginSeconds: 1722, // ~28.7 mins
    outcome: "OPTIMAL_INTERDICTION",
  },
};

export default function DashboardPage() {
  const { lastMessage, connected } = useRealtimeAlerts();

  // Component states
  const [telemetry, setTelemetry] = useState<Telemetry>(DEFAULT_TELEMETRY);
  const [originMarker, setOriginMarker] = useState(DEFAULT_ORIGIN);
  const [suspectAtm, setSuspectAtm] = useState(DEFAULT_SUSPECT_ATM);
  const [pcrBase, setPcrBase] = useState(DEFAULT_PCR_BASE);
  const [hotspotH3Indices, setHotspotH3Indices] = useState<string[]>(DEFAULT_HOTSPOTS);
  const [fundFlow, setFundFlow] = useState<FundHop[]>(DEFAULT_FUND_FLOW);
  const [dispatchActive, setDispatchActive] = useState(false);
  const [alertId, setAlertId] = useState("NCR-2026-08832");
  const [isSimulating, setIsSimulating] = useState(false);

  // Synchronize incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    // Handle generic "new_alert" or backend "NEW_COMPLAINT_INGESTED" / "GRAPH_VELOCITY_UPDATE"
    const eventType = lastMessage.event_type || lastMessage.type;
    const data = lastMessage.data || lastMessage.payload || lastMessage;

    if (eventType === "new_alert" || eventType === "NEW_COMPLAINT_INGESTED") {
      const pred = data.prediction || data;
      const cid = data.complaint_id || alertId;
      setAlertId(cid);

      // Auto-populate telemetry
      setTelemetry((prev) => ({
        ...prev,
        ncrp: {
          ticketId: cid,
          amountInr: data.initial_amount || prev.ncrp.amountInr,
          rootNode: data.victim_account || prev.ncrp.rootNode,
          category: data.fraud_category || prev.ncrp.category,
        },
        mlInference: {
          ...prev.mlInference,
          cashoutWindowMin: pred.window_minutes || pred.predicted_cashout_window_mins || prev.mlInference.cashoutWindowMin,
          h3Confidence: pred.confidence_score || prev.mlInference.h3Confidence,
          targetH3: pred.target_h3_res8 || prev.mlInference.targetH3,
        },
        interdiction: {
          ...prev.interdiction,
          predictedWindowMin: pred.window_minutes || prev.interdiction.predictedWindowMin,
        },
      }));

      // Update map markers
      if (data.victim_lat && data.victim_lon) {
        setOriginMarker({
          lat: data.victim_lat,
          lng: data.victim_lon,
          label: `Victim v₀: ${cid}`,
        });
      }

      if (pred.candidate_atms && pred.candidate_atms.length > 0) {
        const topAtm = pred.candidate_atms[0];
        setSuspectAtm({
          lat: topAtm.lat,
          lng: topAtm.lon,
          frozen: false,
          name: `${topAtm.bank} (${topAtm.terminal_id})`,
        });
      }

      if (pred.target_h3_res8) {
        setHotspotH3Indices([pred.target_h3_res8, ...DEFAULT_HOTSPOTS.filter((h) => h !== pred.target_h3_res8)]);
      }

      if (data.pcr_base) {
        setPcrBase(data.pcr_base);
      }

      if (data.fund_hops) {
        setFundFlow(data.fund_hops);
      }

      if (data.autoDispatch || lastMessage.autoDispatch) {
        setDispatchActive(true);
      }
    }

    if (eventType === "DIAL112_CAD_DISPATCHED") {
      setDispatchActive(true);
      setTelemetry((prev) => ({
        ...prev,
        interdiction: {
          ...prev.interdiction,
          outcome: data.interdiction_outcome || "OPTIMAL_INTERDICTION",
          physicalDispatchTime: data.patrol_eta_mins || prev.interdiction.physicalDispatchTime,
        },
      }));
    }

    if (eventType === "BANK_FRICTION_DEPLOYED") {
      setSuspectAtm((prev) => ({ ...prev, frozen: true }));
      setTelemetry((prev) => ({
        ...prev,
        interdiction: {
          ...prev.interdiction,
          digitalFreezeTime: 1.4,
          outcome: "OPTIMAL_INTERDICTION",
        },
      }));
    }
  }, [lastMessage, alertId]);

  // Handler for manual synthetic cyber heist simulation
  const handleSimulateHeist = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch("/api/v1/complaints/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint_id: `NCR-2026-GOA-${Math.floor(1000 + Math.random() * 9000)}`,
          victim_account: "SBIN000492810",
          victim_bank: "State Bank of India",
          initial_amount: 750000.0,
          fraud_category: "DIGITAL_ARREST",
          initial_utr: `UTR-GOA-${Date.now()}`,
          victim_lat: 13.0827,
          victim_lon: 80.2707,
        }),
      });
      const resData = await res.json();
      console.log("Ingested simulation heist:", resData);
    } catch (err) {
      console.warn("Simulation fallback triggered:", err);
      setAlertId(`NCR-2026-SIM-${Math.floor(1000 + Math.random() * 9000)}`);
      setDispatchActive(false);
      setSuspectAtm((prev) => ({ ...prev, frozen: false }));
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#05070E] text-slate-100 flex flex-col font-mono selection:bg-cyan-500 selection:text-black">
      {/* =========================================================================
          TOP COMMAND BAR / HUD
          ========================================================================= */}
      <header className="h-16 w-full border-b border-white/[0.08] bg-[#070B14]/90 backdrop-blur-xl px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)] border border-cyan-400">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-sm tracking-wider text-white">
                AEGIS-CYBER <span className="text-cyan-400">{"// SIH26184"}</span>
              </span>
              <span className="text-[10px] bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded font-bold">
                MHA / I4C ALIGNED
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-normal">
              National Predictive Cybercrime Analytics &amp; Cashout Forecaster Console
            </span>
          </div>
        </div>

        {/* Live Status Indicators & Action Controls */}
        <div className="flex items-center space-x-4">
          {/* Pilot Coverage Pill */}
          <div className="hidden lg:flex items-center space-x-2 bg-white/[0.03] border border-white/[0.08] px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-400">Pilot Scope:</span>
            <span className="text-cyan-300 font-bold">13,000 ATMs</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-bold">+215% Recovery</span>
          </div>

          {/* WebSocket Status Indicator */}
          <div className="flex items-center space-x-2 bg-black/60 border border-white/[0.08] px-3 py-1.5 rounded-xl text-xs">
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-red-500"}`} />
            <span className="text-[11px] font-bold text-slate-300">
              {connected ? "TELEMETRY LIVE" : "DISCONNECTED"}
            </span>
          </div>

          {/* Dual-Mode Simulation Link */}
          <Link
            href="/simulation"
            className="hidden sm:flex items-center space-x-1.5 bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-[0_0_12px_rgba(0,240,255,0.2)]"
          >
            <span>⚡ Dual-Mode Simulation</span>
          </Link>

          {/* Simulate Cyber Heist Button */}
          <button
            onClick={handleSimulateHeist}
            disabled={isSimulating}
            className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 border border-red-400/50 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin" : ""}`} />
            <span>{isSimulating ? "Injecting Heist..." : "Simulate Cyber Heist"}</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          MAIN TWO-COLUMN COMMAND VIEWPORT (65% Map | 35% Telemetry & Actions)
          ========================================================================= */}
      <main className="flex-1 w-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[calc(100vh-4rem)] overflow-hidden">
        {/* LEFT COLUMN: TACTICAL MAP (65% / 8 cols) */}
        <section className="lg:col-span-8 h-[550px] lg:h-full flex flex-col space-y-3">
          <div className="flex-1 w-full relative">
            <TacticalMap
              originMarker={originMarker}
              fundFlow={fundFlow}
              hotspotH3Indices={hotspotH3Indices}
              suspectAtm={suspectAtm}
              pcrBase={pcrBase}
              dispatchActive={dispatchActive}
              h3Resolution={8}
              confidenceScore={telemetry.mlInference.h3Confidence}
            />
          </div>

          {/* Map Status Bar */}
          <div className="h-10 bg-black/60 rounded-xl border border-white/[0.08] px-4 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1.5 text-cyan-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
                <span>Active Routing: OSRM Public Road Graph</span>
              </span>
              <span>•</span>
              <span>Kinematic Isochrone: 4.2 km beat radius</span>
            </div>
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="text-amber-400 font-bold">Chennai (v₀)</span>
              <span>➔</span>
              <span className="text-rose-400 font-bold">Goa (v_k)</span>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: STACKED ACTION PANEL & ALGORITHMIC TELEMETRY (35% / 4 cols) */}
        <section className="lg:col-span-4 h-full flex flex-col space-y-4 overflow-y-auto pr-1">
          {/* 1. Tactical Action Panel */}
          <ActionPanel
            naturalWindowMin={telemetry.mlInference.cashoutWindowMin}
            extendedHorizonMin={telemetry.mlInference.cashoutWindowMin + 15.0}
            alertId={alertId}
            targetH3={telemetry.mlInference.targetH3}
            onDispatchSuccess={() => {
              setDispatchActive(true);
              setTelemetry((prev) => ({
                ...prev,
                interdiction: { ...prev.interdiction, outcome: "OPTIMAL_INTERDICTION" },
              }));
            }}
            onFrictionSuccess={() => {
              setSuspectAtm((prev) => ({ ...prev, frozen: true }));
              setTelemetry((prev) => ({
                ...prev,
                interdiction: { ...prev.interdiction, digitalFreezeTime: 1.4 },
              }));
            }}
          />

          {/* 2. Algorithmic Journey Telemetry Sidebar */}
          <AlgorithmicJourneyPanel telemetry={telemetry} />
        </section>
      </main>
    </div>
  );
}
