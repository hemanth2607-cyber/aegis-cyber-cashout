"use client";

import React, { useState, useEffect } from "react";
import { Activity, CheckCircle2, Clock, Play, Loader2 } from "lucide-react";

interface TopNavProps {
  connected: boolean;
  activeComplaints?: number;
  preemptedValue?: number;
  mttrMinutes?: number;
  isSimulating: boolean;
  simulationStatus: string | null;
  onSimulate: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  connected,
  activeComplaints = 1,
  preemptedValue = 450000,
  mttrMinutes = 3.2,
  isSimulating,
  simulationStatus,
  onSimulate,
}) => {
  const [timeStr, setTimeStr] = useState({ ist: "", utc: "" });

  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      // IST: UTC + 5:30
      const istTime = now.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const utcTime = now.toLocaleTimeString("en-US", {
        timeZone: "UTC",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setTimeStr({ ist: istTime, utc: utcTime });
    };

    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format Pre-empted ₹ in Lakhs (e.g. ₹4.50L)
  const formattedPreempted = `₹${(preemptedValue / 100000).toFixed(2)}L`;

  return (
    <header className="h-12 bg-[#0B0F17]/95 border-b border-white/[0.08] px-4 flex items-center justify-between select-none relative z-30 backdrop-blur-md">
      {/* 1. Left: Badge & Live Status Indicator */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono font-bold tracking-widest text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded shadow-[0_0_10px_rgba(0,240,255,0.15)]">
            PERVEKKALA // SIH-26184
          </span>
        </div>

        <div className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono ${
          connected
            ? "bg-emerald-950/40 border border-emerald-500/20 text-emerald-400"
            : "bg-amber-950/40 border border-amber-500/20 text-amber-400"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
          <span className="tracking-wide">
            {connected ? "SYSTEM ARMED - STREAMING NCRP FEED" : "SYSTEM ARMED - LOCAL MONITOR ACTIVE"}
          </span>
        </div>
      </div>

      {/* 2. Center: Quick Metrics Pill Strip */}
      <div className="hidden lg:flex items-center space-x-2 bg-white/[0.03] border border-white/[0.06] px-2 py-1 rounded-md">
        {/* Active Complaints Pill */}
        <div className="flex items-center space-x-1.5 px-2 py-0.5 text-xs font-mono">
          <Activity className="w-3 h-3 text-cyan-400" />
          <span className="text-slate-400 text-[11px]">Active Complaints:</span>
          <span className="font-bold text-white">{activeComplaints}</span>
        </div>

        <span className="text-slate-700 text-xs">|</span>

        {/* Pre-empted Pill */}
        <div className="flex items-center space-x-1.5 px-2 py-0.5 text-xs font-mono">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span className="text-slate-400 text-[11px]">Pre-empted:</span>
          <span className="font-bold text-emerald-400">{formattedPreempted}</span>
        </div>

        <span className="text-slate-700 text-xs">|</span>

        {/* Avg MTTR Pill */}
        <div className="flex items-center space-x-1.5 px-2 py-0.5 text-xs font-mono">
          <Clock className="w-3 h-3 text-amber-400" />
          <span className="text-slate-400 text-[11px]">Avg Intervention MTTR:</span>
          <span className="font-bold text-amber-400">{mttrMinutes}m</span>
        </div>
      </div>

      {/* 3. Right: Live UTC/IST Clock + Demo Trigger Button */}
      <div className="flex items-center space-x-3">
        {/* Live Clocks */}
        <div className="hidden md:flex items-center space-x-2 text-[11px] font-mono text-slate-400 bg-white/[0.02] border border-white/[0.06] px-2.5 py-1 rounded">
          <span className="text-slate-200 font-semibold">{timeStr.ist || "00:00:00"} IST</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400">{timeStr.utc || "00:00:00"} UTC</span>
        </div>

        {/* Status indicator during simulation */}
        {simulationStatus && (
          <span className="text-[11px] font-mono text-amber-400 animate-pulse hidden xl:inline">
            [{simulationStatus}]
          </span>
        )}

        {/* Demo Trigger Button */}
        <button
          onClick={onSimulate}
          disabled={isSimulating}
          className={`h-8 px-3 rounded text-xs font-mono font-semibold flex items-center space-x-1.5 transition-all shadow-sm ${
            isSimulating
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-wait"
              : "bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 hover:shadow-[0_0_12px_rgba(0,240,255,0.25)] active:scale-95"
          }`}
        >
          {isSimulating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Simulating...</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current text-cyan-400" />
              <span>Simulate Live Incident</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
