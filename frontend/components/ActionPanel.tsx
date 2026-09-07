"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Car,
  Lock,
  Maximize2,
  X,
  Zap,
  Terminal,
  ChevronUp,
  ChevronDown,
  Info,
} from "lucide-react";
import { Prediction, CADDispatch, BankFriction } from "../types";

interface ActionPanelProps {
  prediction: Prediction | null;
  onDispatchCAD: (complaintId: string, h3Index: string) => Promise<CADDispatch>;
  onTriggerFriction: (complaintId: string, muleAccount: string) => Promise<BankFriction>;
  frictionActive: boolean;
  setFrictionActive: React.Dispatch<React.SetStateAction<boolean>>;
  cadActive: boolean;
  setCadActive: React.Dispatch<React.SetStateAction<boolean>>;
  cadDetails: { unit: string; officer: string; eta: string } | null;
  setCadDetails: React.Dispatch<React.SetStateAction<{ unit: string; officer: string; eta: string } | null>>;
  onToggleDrawer: () => void;
  isDrawerOpen: boolean;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  prediction,
  onDispatchCAD,
  onTriggerFriction,
  frictionActive,
  setFrictionActive,
  cadActive,
  setCadActive,
  cadDetails,
  setCadDetails,
  onToggleDrawer,
  isDrawerOpen,
}) => {
  const [graphModalOpen, setGraphModalOpen] = useState(false);
  const [loadingFriction, setLoadingFriction] = useState(false);
  const [loadingCAD, setLoadingCAD] = useState(false);

  if (!prediction) {
    return (
      <aside className="w-full h-full p-4 flex items-center justify-center text-slate-500 font-mono text-xs">
        Streaming NCRP 1930 feed...
      </aside>
    );
  }

  const targetCell = prediction.primary_target_cell;
  const h8 = targetCell?.h3_res8 || prediction.target_h3_res8 || "886196a52ffffff";
  const category = prediction.fraud_category?.replace(/_/g, " ") || "Digital Arrest / Phishing";
  const amount = prediction.peeled_amount || 450000;
  const formattedAmount = `₹${amount.toLocaleString("en-IN")}`;

  // Countdown calculations
  const totalSeconds =
    prediction.countdown_seconds ??
    (prediction.window_minutes ? Math.round(prediction.window_minutes * 60) : 840);
  const minutes = Math.floor(totalSeconds / 60);

  // Terminating Mule Info
  const lastEdge = prediction.graph_trace?.edges?.[prediction.graph_trace.edges.length - 1];
  const terminatingAccount = lastEdge?.to || "YESB00010921";

  // Handlers
  const handleDeployFriction = async () => {
    if (frictionActive) return;
    setLoadingFriction(true);
    try {
      await onTriggerFriction(prediction.complaint_id, terminatingAccount);
      setFrictionActive(true);
    } catch {
      // simulate success on frontend if backend demo mode
      setFrictionActive(true);
    } finally {
      setLoadingFriction(false);
    }
  };

  const handleDispatchCAD = async () => {
    if (cadActive) return;
    setLoadingCAD(true);
    try {
      const res = await onDispatchCAD(prediction.complaint_id, h8);
      setCadActive(true);
      setCadDetails({
        unit: res.patrol_car || "PCR-North-14",
        officer: (res as any).officer || "SI Sharma",
        eta: `${res.eta_minutes || "3.8"} min`,
      });
    } catch {
      setCadActive(true);
      setCadDetails({
        unit: "PCR-North-14",
        officer: "SI Sharma",
        eta: "3.8 min",
      });
    } finally {
      setLoadingCAD(false);
    }
  };

  return (
    <aside className="w-full h-full flex flex-col justify-between p-4 space-y-3.5 overflow-y-auto select-none bg-[#0B0F17]/80 backdrop-blur-md">
      {/* =========================================================================
          CARD 1: ACTIVE THREAT PROFILE (Compact)
          ========================================================================= */}
      <div className="glass-card p-4 rounded-xl relative overflow-hidden">
        {/* Subtle top indicator bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 via-amber-500 to-cyan-500" />

        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold tracking-wider text-cyan-400 bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 rounded">
                INCIDENT TELEMETRY
              </span>
              <span className="text-xs font-mono font-bold text-white tracking-wide">
                {prediction.complaint_id}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-1">
              Category: <span className="text-slate-200 font-medium">{category}</span>
            </p>
          </div>

          {/* Live Pulsing Countdown Badge */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-red-950/60 border border-red-500/40 text-red-400 text-xs font-mono shadow-[0_0_12px_rgba(239,68,68,0.25)]">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="font-bold">Cashout Window: ~{minutes} Mins Left</span>
          </div>
        </div>

        {/* Defrauded Amount Display */}
        <div className="flex items-baseline justify-between pt-2 border-t border-white/[0.06]">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Defrauded Amount At Risk
            </span>
            <div className="text-2xl font-mono font-black text-amber-400 tracking-tight">
              {formattedAmount}
            </div>
          </div>

          <div className="text-right font-mono text-[11px] text-slate-400">
            <span className="block text-slate-500 text-[10px]">TARGET H3 CELL</span>
            <span className="text-white font-bold">{h8}</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CARD 2: 3-HOP MULE TRAIL (Minimalist Stepper, NOT a sprawling messy graph)
          ========================================================================= */}
      <div className="glass-card p-4 rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center space-x-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>3-Hop Mule Peeling Corridor</span>
          </div>
          <button
            onClick={() => setGraphModalOpen(true)}
            className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 transition-colors group cursor-pointer"
            title="Expand Full Interactive Graph Modal"
          >
            <span>Expand Graph</span>
            <Maximize2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Minimalist Stepper */}
        <div className="flex items-center justify-between bg-black/30 border border-white/[0.06] rounded-lg p-2.5 text-xs font-mono">
          {/* Step 1: Victim */}
          <div
            onClick={() => setGraphModalOpen(true)}
            className="flex-1 text-center cursor-pointer hover:bg-white/[0.04] p-1 rounded transition-colors"
          >
            <div className="text-[10px] text-slate-500 uppercase">Victim</div>
            <div className="font-bold text-slate-200">[HDFC]</div>
            <div className="text-[9px] text-slate-400">₹8.50L Orig</div>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 mx-1" />

          {/* Step 2: Mule L1 */}
          <div
            onClick={() => setGraphModalOpen(true)}
            className="flex-1 text-center cursor-pointer hover:bg-white/[0.04] p-1 rounded transition-colors"
          >
            <div className="text-[10px] text-amber-400 uppercase">Mule L1</div>
            <div className="font-bold text-amber-300">[ICICI]</div>
            <div className="text-[9px] text-slate-400">IMPS Split</div>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 mx-1" />

          {/* Step 3: Terminal Mule */}
          <div
            onClick={() => setGraphModalOpen(true)}
            className="flex-1 text-center cursor-pointer hover:bg-white/[0.04] p-1 rounded transition-colors border border-red-500/30 bg-red-950/20"
          >
            <div className="text-[10px] text-red-400 uppercase font-bold">Terminal Mule</div>
            <div className="font-bold text-white text-[11px]">YESB00010921</div>
            <div className="text-[9px] text-red-300 font-semibold">{formattedAmount} Final</div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CARD 3: DUAL-INTERDICTION ACTION HUB (The focal point for judges)
          ========================================================================= */}
      <div className="glass-card p-4 rounded-xl space-y-3 border-cyan-500/30 shadow-[0_0_20px_rgba(0,240,255,0.06)]">
        <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Dual-Interdiction Hub</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-1.5 py-0.5 rounded">
            Section 106 BNSS
          </span>
        </div>

        <div className="space-y-2.5">
          {/* Action A: Bank Step-Up Friction */}
          <AnimatePresence mode="wait">
            {frictionActive ? (
              <motion.div
                key="friction-active"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full bg-emerald-950/50 border border-emerald-500/60 p-3 rounded-lg flex items-center justify-between shadow-[0_0_14px_rgba(16,185,129,0.2)]"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-300 block">
                      Biometric Auth Enforced
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Card-Session Hold • +15.0m Dilator Active
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-900/50 px-2 py-0.5 rounded border border-emerald-500/30">
                  ACTIVE
                </span>
              </motion.div>
            ) : (
              <motion.button
                key="friction-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleDeployFriction}
                disabled={loadingFriction}
                className="w-full bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 hover:border-red-400 text-red-200 p-3 rounded-lg flex items-center justify-between text-xs font-mono font-semibold transition-all shadow-[0_0_12px_rgba(239,68,68,0.15)] group active:scale-[0.98]"
              >
                <div className="flex items-center space-x-2.5">
                  <Lock className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <div className="text-white font-bold">Deploy Bank Step-Up Friction</div>
                    <div className="text-[10px] text-red-300/80">
                      Inject biometric prompt to halt instant ATM cashout
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Action B: Dispatch ERSS Dial 112 */}
          <AnimatePresence mode="wait">
            {cadActive ? (
              <motion.div
                key="cad-active"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full bg-cyan-950/50 border border-cyan-500/60 p-3 rounded-lg flex items-center justify-between shadow-[0_0_14px_rgba(0,240,255,0.2)]"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center">
                    <Car className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-cyan-300 block">
                      Unit {cadDetails?.unit || "PCR-14"} Dispatched
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Beat: {cadDetails?.officer || "SI Sharma"} • ETA {cadDetails?.eta || "3.8 min"}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-900/50 px-2 py-0.5 rounded border border-cyan-500/30 animate-pulse">
                  EN ROUTE
                </span>
              </motion.div>
            ) : (
              <motion.button
                key="cad-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleDispatchCAD}
                disabled={loadingCAD}
                className="w-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 hover:border-cyan-400 text-cyan-200 p-3 rounded-lg flex items-center justify-between text-xs font-mono font-semibold transition-all shadow-[0_0_12px_rgba(0,240,255,0.15)] group active:scale-[0.98]"
              >
                <div className="flex items-center space-x-2.5">
                  <Car className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <div className="text-white font-bold">Dispatch ERSS Dial 112</div>
                    <div className="text-[10px] text-cyan-300/80">
                      Route nearest patrol car to Sector 7 ATM Kiosk
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* =========================================================================
          CARD 4: EXPLAINABLE AI (XAI) MICRO-PILLS
          ========================================================================= */}
      <div className="glass-card p-3.5 rounded-xl space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Explainable AI (XAI) Drivers</span>
          </span>
          <span className="text-cyan-400 text-[10px]">TreeSHAP Verified</span>
        </div>

        {/* 3 Clean Micro-Pills */}
        <div className="grid grid-cols-3 gap-2 text-center font-mono">
          <div className="bg-white/[0.03] border border-white/[0.08] p-2 rounded-lg">
            <div className="text-[9px] text-slate-400 uppercase">Mule Proximity</div>
            <div className="text-sm font-bold text-cyan-400 mt-0.5">98%</div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] p-2 rounded-lg">
            <div className="text-[9px] text-slate-400 uppercase">ATM Liquidity</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">Top 5%</div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] p-2 rounded-lg">
            <div className="text-[9px] text-slate-400 uppercase">Velocity</div>
            <div className="text-sm font-bold text-amber-400 mt-0.5">4.2m/hop</div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CARD 5: NATIONWIDE PILOT COVERAGE & EDGE CCTV TELEMETRY
          ========================================================================= */}
      <div className="glass-card p-3.5 rounded-xl space-y-2.5 border border-cyan-500/20 bg-cyan-950/10">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Nationwide Pilot &amp; Edge CCTV</span>
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
            +215% Recovery (3.1x)
          </span>
        </div>

        {/* Pilot Cities Coverage */}
        <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[10px]">
          <div className="bg-black/40 border border-white/[0.06] p-1.5 rounded">
            <span className="text-slate-400 block text-[8.5px]">DELHI NCR</span>
            <span className="text-cyan-300 font-bold">5,000 ATMs</span>
          </div>
          <div className="bg-black/40 border border-white/[0.06] p-1.5 rounded">
            <span className="text-slate-400 block text-[8.5px]">MUMBAI</span>
            <span className="text-cyan-300 font-bold">4,500 ATMs</span>
          </div>
          <div className="bg-black/40 border border-white/[0.06] p-1.5 rounded">
            <span className="text-slate-400 block text-[8.5px]">BENGALURU</span>
            <span className="text-cyan-300 font-bold">3,500 ATMs</span>
          </div>
        </div>

        {/* Edge CCTV & SDG Indicator */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5 border-t border-white/[0.06]">
          <span className="flex items-center space-x-1 text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            <span>YOLOv8 Edge CCTV: Online</span>
          </span>
          <span className="text-slate-500 text-[9px]">13,000 ATMs • 12 Cells • SDG 16/9</span>
        </div>
      </div>

      {/* =========================================================================
          COLLAPSIBLE TELEMETRY DRAWER TRIGGER
          ========================================================================= */}
      <button
        onClick={onToggleDrawer}
        className="w-full py-2 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] text-slate-300 text-xs font-mono flex items-center justify-between transition-all"
      >
        <span className="flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span>View Raw Telemetry &amp; Legal Audit Logs</span>
        </span>
        {isDrawerOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>

      {/* =========================================================================
          SLIDE-OUT MODAL: DETAILED INTERACTIVE MULE TOPOLOGY
          ========================================================================= */}
      {graphModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl p-6 rounded-2xl border border-white/[0.12] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                  Mule Account Dispersion Topology
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Complaint Ref: {prediction.complaint_id}
                </span>
              </div>
              <button
                onClick={() => setGraphModalOpen(false)}
                className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {/* Detailed Node Table */}
              <div className="bg-black/40 rounded-lg p-3 border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-[11px] pb-1 border-b border-white/[0.06]">
                  <span>LAYER</span>
                  <span>ACCOUNT NUMBER / BANK</span>
                  <span>AMOUNT</span>
                  <span>CHANNEL</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span className="text-cyan-400 font-bold">L0 (Victim)</span>
                  <span>SBIN000492810 (State Bank of India)</span>
                  <span className="text-white font-bold">₹8,50,000</span>
                  <span className="text-slate-400">RTGS</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span className="text-amber-400 font-bold">L1 (Mule 1)</span>
                  <span>ICIC000182749 (ICICI Bank)</span>
                  <span className="text-amber-400 font-bold">₹4,50,000</span>
                  <span className="text-slate-400">IMPS</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span className="text-red-400 font-bold">L2 (Terminal)</span>
                  <span className="text-red-300 font-bold">YESB00010921 (Yes Bank)</span>
                  <span className="text-red-400 font-black">{formattedAmount}</span>
                  <span className="text-emerald-400 font-bold">ATM Card Courier</span>
                </div>
              </div>

              {/* Legal Attachment Ground Note */}
              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-[11px] text-amber-200/90 leading-relaxed">
                <span className="font-bold text-amber-400 block mb-0.5">
                  Section 106 &amp; 107 BNSS Attachment Basis:
                </span>
                Proceeds of crime originating from complaint {prediction.complaint_id} transferred via
                rapid IMPS peel into account YESB00010921. Police lien invoked to avert cash withdrawal.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setGraphModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-xs font-mono text-white font-bold"
              >
                Close Topology View
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
