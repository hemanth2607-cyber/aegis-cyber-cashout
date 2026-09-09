// frontend/app/simulation/page.tsx
"use client";
import React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import { useSimulationClock } from "../../hooks/useSimulationClock";
import { useStageTelemetry } from "../../hooks/useStageTelemetry";
import AlgorithmRealityInspector from "../../components/AlgorithmRealityInspector";
import SimulationMasterControl from "../../components/SimulationMasterControl";

// Dynamic import with ssr: false for WebGL Deck.gl & Mapbox map canvas
const TacticalJourneyMap = dynamic(
  () => import("../../components/TacticalJourneyMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[450px] rounded-xl border border-tactical-border/30 bg-tactical-bg flex flex-col items-center justify-center font-mono text-tactical-border space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-tactical-border border-t-transparent animate-spin" />
        <span className="text-xs uppercase tracking-widest text-slate-400">
          Initializing Geospatial Simulation Canvas...
        </span>
      </div>
    ),
  }
);

export default function SimulationPage() {
  const { state, dispatch } = useSimulationClock();
  const telemetry = useStageTelemetry(state.currentStageIndex);

  return (
    <div className="flex h-screen flex-col gap-3 bg-tactical-bg p-4 font-mono select-none overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-14 w-full rounded-xl border border-tactical-border/30 bg-tactical-bg/95 px-5 flex items-center justify-between shadow-lg shrink-0">
        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard"
            className="p-1.5 rounded-lg border border-tactical-border/30 bg-black/40 text-slate-400 hover:text-white hover:border-tactical-border transition-all flex items-center space-x-1 text-xs"
            title="Return to Live Command Center"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Live Console</span>
          </Link>
          <Link
            href="/blockchain"
            className="p-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 hover:text-white hover:border-emerald-400 transition-all flex items-center space-x-1 text-xs font-bold"
            title="Open Sentinel Consortium Blockchain Explorer"
          >
            <span>⛓️ Blockchain Ledger</span>
          </Link>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-tactical-border to-blue-600 flex items-center justify-center border border-tactical-border">
              <Shield className="w-4 h-4 text-black" />
            </div>
            <div>
              <span className="font-black text-xs sm:text-sm tracking-wider text-white">
                AEGIS-CYBER <span className="text-amber-400">{"//"} JUDICIAL GRAND JURY DEMONSTRATION</span>
              </span>
              <span className="text-[10px] ml-2 text-emerald-400 hidden md:inline font-bold">
                [BNSS 2023 · Statutory Forensic Protocol · SIH26184]
              </span>
            </div>
          </div>
        </div>

        {/* Live Synchronized Progress Strip */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="hidden lg:flex items-center space-x-2 bg-black/60 border border-white/5 px-3 py-1 rounded-lg">
            <span className="text-slate-400 text-[11px]">Sync Rate:</span>
            <span className="text-tactical-green font-bold">60 FPS</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 text-[11px]">Speed:</span>
            <span className="text-tactical-amber font-bold">{state.speed}x</span>
          </div>
          <div className="flex items-center space-x-2 bg-black/60 border border-tactical-border/40 px-3 py-1 rounded-lg">
            <span className={`w-2 h-2 rounded-full ${state.playing ? "bg-tactical-green animate-pulse" : "bg-tactical-amber"}`} />
            <span className="text-[11px] font-bold text-slate-200">
              {state.playing ? "PLAYING" : "PAUSED"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Dual-View Stage */}
      <main
        className="flex-1 grid gap-3 overflow-hidden"
        style={{
          gridTemplateColumns:
            state.viewMode === "split"
              ? "1fr 1fr"
              : "1fr",
        }}
      >
        {(state.viewMode === "map" || state.viewMode === "split") && (
          <div className="h-full w-full relative min-h-[300px]">
            <TacticalJourneyMap state={state} dispatch={dispatch} />
          </div>
        )}
        {(state.viewMode === "inspector" || state.viewMode === "split") && (
          <div className="h-full w-full relative min-h-[300px]">
            <AlgorithmRealityInspector state={state} telemetry={telemetry} />
          </div>
        )}
      </main>

      {/* Master Control Bar */}
      <footer className="shrink-0">
        <SimulationMasterControl state={state} dispatch={dispatch} />
      </footer>
    </div>
  );
}
