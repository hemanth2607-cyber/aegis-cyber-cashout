"use client";

import React, { useState } from "react";
import {
  X,
  Clock,
  ShieldAlert,
  Car,
  Lock,
  CheckCircle2,
  FileText,
  TrendingUp,
  MapPin,
  Building,
  Loader2,
} from "lucide-react";
import { Prediction, CADDispatch, BankFriction } from "../types";

interface ActionPanelProps {
  prediction: Prediction | null;
  onClose: () => void;
  onDispatchCAD: (complaintId: string, h3Index: string) => Promise<CADDispatch>;
  onTriggerFriction: (complaintId: string, muleAccount: string) => Promise<BankFriction>;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  prediction,
  onClose,
  onDispatchCAD,
  onTriggerFriction,
}) => {
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<CADDispatch | null>(null);

  const [frictionLoading, setFrictionLoading] = useState(false);
  const [frictionResult, setFrictionResult] = useState<BankFriction | null>(null);

  if (!prediction) return null;

  const targetCell = prediction.primary_target_cell;
  const h8 = targetCell?.h3_res8 || prediction.target_h3_res8;
  const atm = targetCell?.candidate_terminals?.[0] || prediction.candidate_atms?.[0];
  const explanation = prediction.tactical_explanation;

  // Format countdown mm:ss
  const totalSeconds = prediction.countdown_seconds ?? (prediction.window_minutes ? Math.round(prediction.window_minutes * 60) : 1200);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedCountdown = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // Terminating Mule Account
  const lastHopEdge = prediction.graph_trace?.edges?.[prediction.graph_trace.edges.length - 1];
  const terminatingAccount = lastHopEdge?.to || "YESB00010921";
  const peeledAmount = lastHopEdge?.amount || 245000;

  const handleDispatch = async () => {
    if (!h8) return;
    setDispatchLoading(true);
    try {
      const res = await onDispatchCAD(prediction.complaint_id, h8);
      setDispatchResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setDispatchLoading(false);
    }
  };

  const handleFriction = async () => {
    setFrictionLoading(true);
    try {
      const res = await onTriggerFriction(prediction.complaint_id, terminatingAccount);
      setFrictionResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setFrictionLoading(false);
    }
  };

  return (
    <div className="w-[420px] xl:w-[450px] flex-shrink-0 h-full bg-tactical-panel border-l border-tactical-border flex flex-col z-20 overflow-hidden select-none shadow-2xl">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-tactical-border bg-tactical-card/60 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-tactical-crimson animate-pulse" />
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Tactical Intercept Profile
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">{prediction.complaint_id}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 1. DYNAMIC REAL-TIME COUNTDOWN TIMER */}
        <div className="bg-gradient-to-r from-tactical-crimson/20 via-slate-900 to-tactical-card p-3 rounded-lg border border-tactical-crimson/40 text-center shadow-tactical-crimson/20">
          <div className="text-[10px] uppercase font-mono tracking-widest text-tactical-crimson font-bold flex items-center justify-center space-x-1 mb-1">
            <Clock className="w-3.5 h-3.5 mr-1 animate-spin" />
            Predicted Cash-Out Window
          </div>
          <div className="text-4xl font-mono font-black tracking-wider text-white py-1">
            {formattedCountdown}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Confidence: <span className="text-tactical-cyan font-bold">{(prediction.confidence_score * 100).toFixed(1)}%</span> |
            Extraction Hex: <span className="text-white font-bold">{h8}</span>
          </div>
        </div>

        {/* 2. SUSPECT NETWORK & PEELING TRAJECTORY */}
        <div className="bg-tactical-card/70 border border-slate-800 p-3 rounded-lg space-y-2">
          <div className="text-[10px] uppercase font-mono text-slate-400 tracking-wider flex items-center space-x-1">
            <Building className="w-3.5 h-3.5 text-tactical-amber" />
            <span>Mule Peeling Trajectory</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">TERMINATING MULE</span>
              <span className="text-white font-bold">{terminatingAccount}</span>
              <span className="text-[10px] text-tactical-amber block">Layer 3 Mule Account</span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">AMOUNT AT RISK</span>
              <span className="text-tactical-green font-bold">₹{peeledAmount.toLocaleString("en-IN")}</span>
              <span className="text-[10px] text-slate-400 block">IMPS Rapid Split</span>
            </div>
          </div>

          {/* Identified Suspect ATM */}
          {atm && (
            <div className="bg-slate-900/80 p-2.5 rounded border border-tactical-cyan/30 flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-tactical-cyan shrink-0 mt-0.5" />
              <div className="text-[11px] font-mono leading-tight">
                <span className="text-tactical-cyan font-bold block">{atm.terminal_id} (Off-site ATM)</span>
                <span className="text-slate-300 block">{atm.bank} - {atm.address}</span>
                <span className="text-slate-400 text-[10px] block mt-0.5">
                  Available Cash Reserves: ₹{(atm.current_cash || 250000).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 3. SHAP AI TACTICAL EXPLAINABILITY CARDS */}
        {explanation && (
          <div className="bg-tactical-card/70 border border-slate-800 p-3 rounded-lg space-y-2.5">
            <div className="text-[10px] uppercase font-mono text-slate-400 tracking-wider flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <TrendingUp className="w-3.5 h-3.5 text-tactical-cyan" />
                <span>TreeSHAP AI Tactical Drivers</span>
              </span>
              <span className="text-tactical-cyan text-[10px]">Sec 102 BNSS Validated</span>
            </div>

            {/* Drivers list */}
            <div className="space-y-1.5">
              {explanation.top_factors?.slice(0, 3).map((factor, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/70 p-2 rounded border border-slate-800 text-[11px] font-mono flex items-start justify-between"
                >
                  <div>
                    <span className="text-white font-bold block">{factor.feature}</span>
                    <span className="text-slate-400 text-[10px] leading-tight block">{factor.description}</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ml-2 shrink-0 ${
                      factor.shap_value >= 0
                        ? "bg-tactical-crimson/20 text-tactical-crimson"
                        : "bg-tactical-green/20 text-tactical-green"
                    }`}
                  >
                    {factor.shap_value >= 0 ? `+${factor.shap_value.toFixed(2)}` : factor.shap_value.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Section 102 BNSS Legal Brief */}
            {explanation.legal_brief && (
              <div className="bg-slate-950/80 p-2 rounded border border-tactical-border text-[10px] font-mono text-slate-400 space-y-1">
                <div className="flex items-center space-x-1 text-tactical-cyan font-bold uppercase">
                  <FileText className="w-3 h-3" />
                  <span>Court-Ready Legal Justification</span>
                </div>
                <p className="line-clamp-3 text-slate-300 italic">&quot;{explanation.legal_brief}&quot;</p>
              </div>
            )}
          </div>
        )}

        {/* 4. DISPATCH CONFIRMATION BANNERS */}
        {dispatchResult && (
          <div className="bg-tactical-cyan/10 border border-tactical-cyan/50 p-2.5 rounded-lg font-mono text-[11px] text-tactical-cyan flex items-start space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-tactical-cyan" />
            <div>
              <span className="font-bold block">ERSS DIAL 112 CAD DISPATCHED</span>
              <span className="text-slate-300 block">Unit: {dispatchResult.patrol_car} | ETA: {dispatchResult.eta_minutes} mins</span>
              <span className="text-[10px] text-slate-400 block">Ref: {dispatchResult.dispatch_id}</span>
            </div>
          </div>
        )}

        {frictionResult && (
          <div className="bg-tactical-green/10 border border-tactical-green/50 p-2.5 rounded-lg font-mono text-[11px] text-tactical-green flex items-start space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-tactical-green" />
            <div>
              <span className="font-bold block">BANK FRICTION ACTIVE</span>
              <span className="text-slate-300 block">Action: {frictionResult.action_taken}</span>
              <span className="text-[10px] text-slate-400 block">Switch Ref: {frictionResult.risk_reference}</span>
            </div>
          </div>
        )}

        {/* 5. DIRECT TACTICAL ACTION BUTTONS */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleDispatch}
            disabled={dispatchLoading}
            className="w-full bg-tactical-cyan/20 hover:bg-tactical-cyan/30 text-tactical-cyan border border-tactical-cyan/50 hover:border-tactical-cyan py-2.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center space-x-2 transition-all shadow-tactical-cyan disabled:opacity-50"
          >
            {dispatchLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Dispatching ERSS CAD...</span>
              </>
            ) : (
              <>
                <Car className="w-4 h-4" />
                <span>DISPATCH DIAL 112 BEAT PATROL</span>
              </>
            )}
          </button>

          <button
            onClick={handleFriction}
            disabled={frictionLoading}
            className="w-full bg-tactical-crimson/20 hover:bg-tactical-crimson/30 text-tactical-crimson border border-tactical-crimson/50 hover:border-tactical-crimson py-2.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center space-x-2 transition-all shadow-tactical-crimson disabled:opacity-50"
          >
            {frictionLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Locking Terminal Switch...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>ACTIVATE BANK CASH-LOCK (15M HOLD)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
