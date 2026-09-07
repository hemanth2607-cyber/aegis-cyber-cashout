"use client";

import React from "react";
import { Shield, Radio, Activity, AlertTriangle, IndianRupee, Car, Play, Loader2 } from "lucide-react";

interface TopNavProps {
  connected: boolean;
  activeComplaints: number;
  imminentCashouts: number;
  interdictedValue: number;
  activeBeatUnits: number;
  isSimulating: boolean;
  simulationStatus: string | null;
  onSimulate: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  connected,
  activeComplaints,
  imminentCashouts,
  interdictedValue,
  activeBeatUnits,
  isSimulating,
  simulationStatus,
  onSimulate,
}) => {
  const formattedValue = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(interdictedValue);

  return (
    <header className="h-16 bg-tactical-panel border-b border-tactical-border px-4 flex items-center justify-between select-none relative z-30 shadow-lg">
      {/* Left: Branding & Jurisdiction */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-tactical-card border border-tactical-cyan/40 flex items-center justify-center shadow-tactical-cyan">
          <Shield className="w-5 h-5 text-tactical-cyan animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold tracking-wider text-base text-white">
              AEGIS<span className="text-tactical-cyan">CASHOUT</span>
            </span>
            <span className="text-[10px] bg-tactical-cyan/10 text-tactical-cyan border border-tactical-cyan/30 px-1.5 py-0.5 rounded font-mono font-semibold uppercase">
              BNSS 102 Compliant
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono flex items-center space-x-1">
            <Radio className="w-3 h-3 text-tactical-green inline animate-pulse" />
            <span>I4C / NCRP LIVE MONITORING - DELHI-NCR SECTOR</span>
          </p>
        </div>
      </div>

      {/* Middle: Live Counter KPIs */}
      <div className="hidden xl:flex items-center space-x-3">
        {/* KPI 1 */}
        <div className="bg-tactical-card/80 border border-slate-800 px-3 py-1.5 rounded flex items-center space-x-2.5">
          <Activity className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Active Complaints</div>
            <div className="text-sm font-mono font-bold text-white leading-tight">{activeComplaints} Tracked</div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-tactical-card/80 border border-tactical-crimson/30 px-3 py-1.5 rounded flex items-center space-x-2.5 shadow-tactical-crimson/20">
          <AlertTriangle className="w-4 h-4 text-tactical-crimson animate-bounce" />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-tactical-crimson font-mono">Imminent Cashouts (&lt;30m)</div>
            <div className="text-sm font-mono font-bold text-white leading-tight">{imminentCashouts} Hotspots</div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-tactical-card/80 border border-tactical-green/30 px-3 py-1.5 rounded flex items-center space-x-2.5">
          <IndianRupee className="w-4 h-4 text-tactical-green" />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-tactical-green font-mono">Interdicted Value</div>
            <div className="text-sm font-mono font-bold text-tactical-green leading-tight">{formattedValue}</div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-tactical-card/80 border border-slate-800 px-3 py-1.5 rounded flex items-center space-x-2.5">
          <Car className="w-4 h-4 text-tactical-cyan" />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Dial 112 ERSS Beat</div>
            <div className="text-sm font-mono font-bold text-white leading-tight">{activeBeatUnits} Mobile Units</div>
          </div>
        </div>
      </div>

      {/* Right: Simulation Button & WebSocket Badge */}
      <div className="flex items-center space-x-3">
        {simulationStatus && (
          <span className="text-xs font-mono text-tactical-amber animate-pulse hidden md:inline">
            [{simulationStatus}]
          </span>
        )}

        <button
          onClick={onSimulate}
          disabled={isSimulating}
          className="bg-tactical-crimson/20 hover:bg-tactical-crimson/40 text-tactical-crimson border border-tactical-crimson/50 hover:border-tactical-crimson px-3 py-1.5 rounded text-xs font-mono font-semibold flex items-center space-x-1.5 transition-all shadow-tactical-crimson disabled:opacity-50"
        >
          {isSimulating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Simulating...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate 1930 Heist</span>
            </>
          )}
        </button>

        {/* WebSocket Status */}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono border ${
            connected
              ? "bg-tactical-green/10 text-tactical-green border-tactical-green/40 shadow-tactical-green/20"
              : "bg-tactical-crimson/10 text-tactical-crimson border-tactical-crimson/40 animate-pulse"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${connected ? "bg-tactical-green animate-ping" : "bg-tactical-crimson"}`} />
          <span>{connected ? "LIVE FEED" : "OFFLINE"}</span>
        </div>
      </div>
    </header>
  );
};
