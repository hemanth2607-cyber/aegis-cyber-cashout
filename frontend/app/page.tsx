"use client";

import React from "react";
import dynamic from "next/dynamic";
import { TopNav } from "../components/TopNav";
import { AlertFeed } from "../components/AlertFeed";
import { ActionPanel } from "../components/ActionPanel";
import { useRealtimeAlerts } from "../hooks/useRealtimeAlerts";
import { Loader2 } from "lucide-react";

// Dynamic import of TacticalMap to disable server-side rendering for Leaflet
const TacticalMap = dynamic(
  () => import("../components/TacticalMap").then((mod) => mod.TacticalMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-tactical-bg flex items-center justify-center font-mono text-tactical-cyan">
        <Loader2 className="w-8 h-8 animate-spin mr-2" />
        <span>Loading Delhi-NCR Tactical GIS Grid...</span>
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
    imminentCashoutsCount,
    isSimulating,
    simulationStatus,
    triggerHeistSimulation,
    dispatchCAD,
    triggerBankFriction,
  } = useRealtimeAlerts();

  return (
    <main className="w-screen h-screen flex flex-col bg-tactical-bg overflow-hidden">
      {/* 1. Top Tactical Navigation Bar */}
      <TopNav
        connected={connected}
        activeComplaints={activeComplaintsCount}
        imminentCashouts={imminentCashoutsCount}
        interdictedValue={interdictedValue}
        activeBeatUnits={beatUnits.length}
        isSimulating={isSimulating}
        simulationStatus={simulationStatus}
        onSimulate={triggerHeistSimulation}
      />

      {/* 2. Main Workspace: Feed + Map + Action Panel */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left: Real-Time Hotspot Feed */}
        <AlertFeed
          predictions={predictions}
          selectedPrediction={selectedPrediction}
          onSelectPrediction={(pred) => setSelectedPrediction(pred)}
        />

        {/* Center: Full-Screen Tactical Map */}
        <div className="flex-1 relative h-full">
          <TacticalMap
            predictions={predictions}
            selectedPrediction={selectedPrediction}
            onSelectPrediction={(pred) => setSelectedPrediction(pred)}
            beatUnits={beatUnits}
          />

          {/* Right Floating Drawer: Tactical Action & TreeSHAP Explainability */}
          {selectedPrediction && (
            <ActionPanel
              prediction={selectedPrediction}
              onClose={() => setSelectedPrediction(null)}
              onDispatchCAD={dispatchCAD}
              onTriggerFriction={triggerBankFriction}
            />
          )}
        </div>
      </div>
    </main>
  );
}
