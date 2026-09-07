"use client";

import React, { useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Clock, MapPin, IndianRupee, Zap, Radio } from "lucide-react";
import { Prediction } from "../types";

interface AlertFeedProps {
  predictions: Prediction[];
  selectedPrediction: Prediction | null;
  onSelectPrediction: (pred: Prediction) => void;
}

export const AlertFeed: React.FC<AlertFeedProps> = ({
  predictions,
  selectedPrediction,
  onSelectPrediction,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  // Sort by lowest remaining countdown minutes
  const sorted = [...predictions].sort((a, b) => {
    const aMin = a.remaining_window_minutes ?? a.window_minutes ?? 60;
    const bMin = b.remaining_window_minutes ?? b.window_minutes ?? 60;
    return aMin - bMin;
  });

  return (
    <div
      className={`relative z-20 h-full bg-tactical-panel/95 border-r border-tactical-border backdrop-blur-md transition-all duration-300 flex flex-col ${
        collapsed ? "w-12" : "w-80 md:w-96"
      }`}
    >
      {/* Header */}
      <div className="p-3 border-b border-tactical-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-tactical-crimson animate-pulse" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              Hotspot Threat Feed ({sorted.length})
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded bg-tactical-card hover:bg-tactical-border text-slate-400 hover:text-white transition-colors ml-auto"
          title={collapsed ? "Expand Feed" : "Collapse Feed"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Alert Cards Container */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {sorted.length === 0 ? (
            <div className="p-6 text-center text-slate-500 font-mono text-xs">
              <Zap className="w-8 h-8 mx-auto mb-2 text-slate-600 animate-pulse" />
              Scanning Delhi-NCR CFCFRMS transaction streams...
            </div>
          ) : (
            sorted.map((pred) => {
              const isSelected = selectedPrediction?.complaint_id === pred.complaint_id;
              const remainingMin = pred.remaining_window_minutes ?? pred.window_minutes ?? 30;
              const isCritical = remainingMin <= 15;
              const targetCell = pred.primary_target_cell;
              const h8 = targetCell?.h3_res8 || pred.target_h3_res8;
              const atm = targetCell?.candidate_terminals?.[0] || pred.candidate_atms?.[0];

              // Calculate timer progress percentage (assuming max 45m window)
              const maxWindow = pred.window_minutes || 45;
              const progressPct = Math.min(100, Math.max(5, (remainingMin / maxWindow) * 100));

              return (
                <div
                  key={pred.complaint_id}
                  onClick={() => onSelectPrediction(pred)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-tactical-card border-tactical-cyan shadow-tactical-cyan"
                      : isCritical
                      ? "bg-tactical-card/70 border-tactical-crimson/50 hover:border-tactical-crimson"
                      : "bg-tactical-card/40 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {/* Top Badge: Urgency & Time */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase flex items-center space-x-1 ${
                        isCritical
                          ? "bg-tactical-crimson/20 text-tactical-crimson border border-tactical-crimson/40 animate-pulse"
                          : "bg-tactical-amber/20 text-tactical-amber border border-tactical-amber/40"
                      }`}
                    >
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      {isCritical ? "CRITICAL" : "HIGH ALERT"} - {Math.ceil(remainingMin)}M REMAINING
                    </span>

                    <span className="text-[11px] font-mono text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3 inline mr-0.5" />
                      <span>{Math.floor(remainingMin)}m</span>
                    </span>
                  </div>

                  {/* Complaint ID & Modus */}
                  <div className="font-mono text-xs font-bold text-white mb-1 flex items-center justify-between">
                    <span>{pred.complaint_id}</span>
                    <span className="text-tactical-green flex items-center text-[11px]">
                      <IndianRupee className="w-3 h-3 inline mr-0.5" />
                      {pred.initial_amount ? pred.initial_amount.toLocaleString("en-IN") : "7,50,000"}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono mb-2">
                    Modus: <span className="text-slate-200">{pred.fraud_category || "DIGITAL_ARREST"}</span>
                  </div>

                  {/* Suspect Extraction Point */}
                  <div className="text-[11px] font-mono text-slate-300 bg-slate-900/60 p-1.5 rounded flex items-center space-x-1.5 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-tactical-cyan shrink-0" />
                    <span className="truncate">
                      {atm ? `${atm.terminal_id} (${atm.bank})` : `Hex ${h8?.substring(0, 9)}...`}
                    </span>
                  </div>

                  {/* Countdown Progress Bar */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        isCritical ? "bg-tactical-crimson" : "bg-tactical-amber"
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Collapsed view indicator */}
      {collapsed && (
        <div className="flex-1 py-4 flex flex-col items-center space-y-4">
          <div className="text-[10px] font-mono text-slate-500 uppercase rotate-90 whitespace-nowrap mt-8">
            Hotspots ({sorted.length})
          </div>
          {sorted.slice(0, 3).map((p, i) => (
            <div
              key={i}
              onClick={() => {
                setCollapsed(false);
                onSelectPrediction(p);
              }}
              className="w-3 h-3 rounded-full bg-tactical-crimson animate-ping cursor-pointer"
            />
          ))}
        </div>
      )}
    </div>
  );
};
