"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { TopNav } from "../components/TopNav";
import { ActionPanel } from "../components/ActionPanel";
import { TelemetryDrawer } from "../components/TelemetryDrawer";
import { useRealtimeAlerts } from "../hooks/useRealtimeAlerts";
import { Loader2 } from "lucide-react";

// Dynamic import of TacticalMap to disable SSR for Leaflet
const TacticalMap = dynamic(
  () => import("../components/TacticalMap").then((mod) => mod.TacticalMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#0B0F17] flex items-center justify-center font-mono text-cyan-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Initializing Cyber-Command Geospatial Grid...</span>
      </div>
    ),
  }
);

export default function Home() {
  const {
    predictions,
    selectedPrediction,
    setSelectedPrediction,
    connected,
    beatUnits,
    interdictedValue,
    activeComplaintsCount,
    dispatchCAD,
    triggerBankFriction,
  } = useRealtimeAlerts();

  // Dual-Interdiction Interactive States
  const [frictionActive, setFrictionActive] = useState(false);
  const [cadActive, setCadActive] = useState(false);
  const [cadDetails, setCadDetails] = useState<{ unit: string; officer: string; eta: string } | null>(null);

  // Story Simulation State (3-second rapid decision-making cycle)
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);
  const [preemptedAmount, setPreemptedAmount] = useState(interdictedValue || 450000);

  // Bottom Telemetry Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Default fallback prediction if none streamed yet
  const activePred = selectedPrediction || (predictions.length > 0 ? predictions[0] : {
    complaint_id: "NCRP-2026-DEL-8921",
    timestamp: new Date().toISOString(),
    fraud_category: "DIGITAL_ARREST",
    target_h3_res8: "886196a52ffffff",
    window_minutes: 14.2,
    countdown_seconds: 852,
    confidence_score: 0.94,
    peeled_amount: 450000,
    primary_target_cell: {
      h3_res8: "886196a52ffffff",
      lat: 28.7041,
      lon: 77.1025,
      confidence: 0.94,
      candidate_terminals: [
        {
          terminal_id: "ATM-DL-ROH-082",
          bank: "HDFC Bank Offsite Kiosk",
          address: "Sector 7, Rohini Hub, New Delhi",
          lat: 28.7041,
          lon: 77.1025,
          current_cash: 250000,
        },
      ],
    },
    graph_trace: {
      nodes: [
        { account: "SBIN000492810", lat: 28.6139, lon: 77.2090, role: "VICTIM" },
        { account: "ICIC000182749", lat: 28.6500, lon: 77.1800, role: "MULE_L1" },
        { account: "YESB00010921", lat: 28.7041, lon: 77.1025, role: "TERMINAL_MULE" },
      ],
      edges: [
        { from: "SBIN000492810", to: "ICIC000182749", amount: 450000 },
        { from: "ICIC000182749", to: "YESB00010921", amount: 450000 },
      ],
    },
  });

  // Automated 3-Second "Simulate Live Incident" Story Transition
  const handleSimulateLiveIncident = async () => {
    if (isSimulating) return;
    setIsSimulating(true);

    // Reset action toggles to start fresh
    setFrictionActive(false);
    setCadActive(false);
    setCadDetails(null);

    // Step 1 (0.0s - 0.7s): Ingested
    setSimulationStatus("Step 1: Incident Ingested (₹4.50L via Digital Arrest)");
    await new Promise((r) => setTimeout(r, 700));

    // Step 2 (0.7s - 1.8s): Spatial Forecast Pinpointed
    setSimulationStatus("Step 2: H3 Spatial Forecast (Rohini Sector 7 Pinpointed)");
    await new Promise((r) => setTimeout(r, 1100));

    // Step 3 (1.8s - 3.0s): Dual Interdiction (Bank Friction + ERSS 112 Patrol)
    setSimulationStatus("Step 3: Dual Interdiction (Sec 106 Hold + Dial 112 CAD Dispatched)");
    setFrictionActive(true);
    setCadActive(true);
    setCadDetails({
      unit: "PCR-North-14",
      officer: "SI Sharma",
      eta: "3.8 min",
    });
    setPreemptedAmount((prev) => prev + 450000);

    await new Promise((r) => setTimeout(r, 1200));
    setSimulationStatus("Dual Interdiction Executed • Funds Secured");

    setTimeout(() => {
      setSimulationStatus(null);
      setIsSimulating(false);
    }, 3500);
  };

  return (
    <main className="w-screen h-screen flex flex-col bg-[#0B0F17] text-white overflow-hidden select-none font-sans">
      {/* 1. Top Navigation Bar (Slim, 48px height) */}
      <TopNav
        connected={connected}
        activeComplaints={activeComplaintsCount || 1}
        preemptedValue={preemptedAmount}
        mttrMinutes={3.2}
        isSimulating={isSimulating}
        simulationStatus={simulationStatus}
        onSimulate={handleSimulateLiveIncident}
      />

      {/* 2. Asymmetric 2-Column Tactical Stage */}
      <div className="flex-1 flex w-full h-[calc(100vh-48px)] overflow-hidden relative">
        {/* Left Stage: Geospatial Focus Area (65% width) */}
        <section className="w-[65%] h-full relative border-r border-white/[0.08] overflow-hidden">
          <TacticalMap
            predictions={predictions.length > 0 ? predictions : [activePred as any]}
            selectedPrediction={activePred as any}
            onSelectPrediction={(pred) => setSelectedPrediction(pred)}
            beatUnits={beatUnits}
            isSimulating={isSimulating}
            patrolDispatched={cadActive}
          />
        </section>

        {/* Right Sidebar: Actionable Incident Telemetry (35% width) */}
        <section className="w-[35%] h-full relative overflow-hidden flex flex-col">
          <ActionPanel
            prediction={activePred as any}
            onDispatchCAD={dispatchCAD}
            onTriggerFriction={triggerBankFriction}
            frictionActive={frictionActive}
            setFrictionActive={setFrictionActive}
            cadActive={cadActive}
            setCadActive={setCadActive}
            cadDetails={cadDetails}
            setCadDetails={setCadDetails}
            onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
            isDrawerOpen={isDrawerOpen}
          />
        </section>
      </div>

      {/* 3. Bottom Sliding Drawer (Collapsible / Default Closed) */}
      <TelemetryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        prediction={activePred as any}
      />
    </main>
  );
}
