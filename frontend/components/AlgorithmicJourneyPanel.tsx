// frontend/components/AlgorithmicJourneyPanel.tsx
"use client";
import { useState } from "react";
import { ChevronDown, Zap, CheckCircle2 } from "lucide-react";

export interface Telemetry {
  ncrp: {
    ticketId: string;
    amountInr: number;
    rootNode: string;
    category?: string;
  };
  graphPeeling: {
    velocityDecay: number;
    hopLatencyMs: number;
    peelingRatio?: number;
    activeHop?: number;
  };
  bayesianShift: {
    fromCity: string;
    toCity: string;
    sourceSignal: "ip" | "cell" | "branch";
    sensorCoordinates?: [number, number];
  };
  mlInference: {
    cashoutWindowMin: number;
    h3Confidence: number;
    targetH3?: string;
    candidateAtmsCount?: number;
  };
  statutory: {
    shapFactors: { label: string; weight: number }[];
    sections: string[];
    courtDossierId?: string;
  };
  interdiction: {
    digitalFreezeTime: number;
    physicalDispatchTime: number;
    predictedWindowMin: number;
    frictionDelayMin: number;
    marginSeconds: number;
    outcome: "OPTIMAL_INTERDICTION" | "AT_RISK" | "PENDING" | "ASSET_PRESERVED_ONLY" | "KINETIC_INTERCEPT" | "INTERDICTION_FAILED";
  };
}

const STEP_META = [
  { key: "ncrp", title: "1930 NCRP Ingestion", badge: "ROOT v₀" },
  { key: "graphPeeling", title: "Temporal Graph Peeling", badge: "V_k DECAY" },
  { key: "bayesianShift", title: "Bayesian MAP Telemetry Shift", badge: "CENTROID" },
  { key: "mlInference", title: "Dual-Stage ML Inference", badge: "H3 RES 8/9" },
  { key: "statutory", title: "Statutory Explainability", badge: "TreeSHAP" },
  { key: "interdiction", title: "Sequential Interdiction", badge: "4-STATE" },
] as const;

export default function AlgorithmicJourneyPanel({ telemetry }: { telemetry: Telemetry }) {
  const [open, setOpen] = useState<string>("interdiction");

  const isDigitalFrozen = telemetry.interdiction.digitalFreezeTime < telemetry.interdiction.predictedWindowMin;
  const isPhysicalIntercepted =
    telemetry.interdiction.physicalDispatchTime <
    telemetry.interdiction.predictedWindowMin + telemetry.interdiction.frictionDelayMin;

  return (
    <aside className="w-full rounded-2xl border border-white/[0.08] bg-zinc-950/90 backdrop-blur-xl p-4 font-mono text-sm text-zinc-200 shadow-2xl space-y-3">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 px-1">
        <div>
          <h2 className="text-xs uppercase tracking-widest text-cyan-400 font-bold flex items-center space-x-2">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Algorithmic Journey</span>
          </h2>
          <span className="text-[10px] text-slate-400 font-normal">
            Real-time Telemetry &amp; Multi-Hop State Pipeline
          </span>
        </div>
        <span className="text-[9px] bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 px-2 py-0.5 rounded font-bold">
          LIVE WS
        </span>
      </div>

      <div className="space-y-1.5">
        {STEP_META.map((step, i) => {
          const isOpen = open === step.key;
          return (
            <div
              key={step.key}
              className="border border-white/[0.06] bg-white/[0.02] rounded-xl overflow-hidden transition-colors hover:border-white/[0.12]"
            >
              <button
                onClick={() => setOpen(isOpen ? "" : step.key)}
                className="flex w-full items-center justify-between py-2.5 px-3 text-left hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-[10px] font-bold text-slate-300">
                    {i + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">{step.title}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] font-mono text-slate-400 bg-black/40 px-1.5 py-0.5 rounded border border-white/[0.05]">
                    {step.badge}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-cyan-400" : ""
                    }`}
                  />
                </div>
              </button>

              {isOpen && (
                <div className="px-3 pb-3 text-xs text-zinc-400 space-y-1.5 border-t border-white/[0.04] pt-2.5 bg-black/30">
                  {step.key === "ncrp" && (
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Incident Ticket:</span>
                        <span className="text-white font-bold">{telemetry.ncrp.ticketId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Siphoned Amount:</span>
                        <span className="text-amber-300 font-bold">
                          ₹{(telemetry.ncrp.amountInr / 100000).toFixed(2)} Lakhs
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Incident Root Node v₀:</span>
                        <span className="text-cyan-300">{telemetry.ncrp.rootNode}</span>
                      </div>
                      {telemetry.ncrp.category && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Modus Operandi:</span>
                          <span className="text-slate-200">{telemetry.ncrp.category}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {step.key === "graphPeeling" && (
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Velocity Decay V_k:</span>
                        <span className="text-emerald-400 font-bold">
                          {telemetry.graphPeeling.velocityDecay.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Hop Latency SLA:</span>
                        <span className="text-white font-bold">{telemetry.graphPeeling.hopLatencyMs} ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mule Peeling Tier:</span>
                        <span className="text-rose-400 font-bold">Layer-3 (Peeling Chain)</span>
                      </div>
                    </div>
                  )}

                  {step.key === "bayesianShift" && (
                    <div className="space-y-1">
                      <div className="p-2 rounded bg-cyan-950/30 border border-cyan-500/20 text-[11px] leading-relaxed">
                        <div className="text-cyan-300 font-bold mb-0.5">Spatial Centroid Reset:</div>
                        <span className="text-white font-bold">{telemetry.bayesianShift.fromCity}</span>
                        <span className="text-cyan-400 mx-1.5">➔</span>
                        <span className="text-white font-bold">{telemetry.bayesianShift.toCity}</span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Signal Anchor: <span className="text-amber-300 font-bold">{telemetry.bayesianShift.sourceSignal.toUpperCase()} Sensor Fusion</span> (Tower BTS + Device IP)
                        </div>
                      </div>
                    </div>
                  )}

                  {step.key === "mlInference" && (
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Stage 1 Window (Δt̂):</span>
                        <span className="text-amber-300 font-bold">
                          {telemetry.mlInference.cashoutWindowMin.toFixed(1)} mins
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Stage 2 H3 Confidence:</span>
                        <span className="text-emerald-400 font-bold">
                          {(telemetry.mlInference.h3Confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      {telemetry.mlInference.targetH3 && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Target H3 Index:</span>
                          <span className="text-cyan-300 font-mono">{telemetry.mlInference.targetH3}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {step.key === "statutory" && (
                    <div className="space-y-2">
                      <div className="text-[11px] text-slate-400 font-semibold">TreeSHAP Feature Attributions:</div>
                      <div className="space-y-1">
                        {telemetry.statutory.shapFactors.map((f) => (
                          <div key={f.label} className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-300 truncate max-w-[170px]">{f.label}</span>
                            <span className={`font-bold ${f.weight >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {f.weight >= 0 ? "+" : ""}{f.weight.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 p-1.5 rounded bg-amber-950/20 border border-amber-500/30 text-[10px] text-amber-300/90 font-mono">
                        {telemetry.statutory.sections.join(" · ")}
                      </div>
                    </div>
                  )}

                  {step.key === "interdiction" && (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        <div className="p-1.5 rounded bg-white/[0.03] border border-white/[0.06]">
                          <span className="text-[9px] text-slate-400 block">Digital Pre-emption</span>
                          <span className={`font-bold text-xs ${isDigitalFrozen ? "text-emerald-400" : "text-amber-400"}`}>
                            {isDigitalFrozen ? "I_freeze = 1" : "I_freeze = 0"}
                          </span>
                        </div>
                        <div className="p-1.5 rounded bg-white/[0.03] border border-white/[0.06]">
                          <span className="text-[9px] text-slate-400 block">CAD Dispatch Status</span>
                          <span className={`font-bold text-xs ${isPhysicalIntercepted ? "text-cyan-400" : "text-rose-400"}`}>
                            {isPhysicalIntercepted ? "Satisfied (En Route)" : "At Risk"}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between text-[11px] pt-1 border-t border-white/[0.05]">
                        <span className="text-slate-400">Extended Horizon:</span>
                        <span className="text-white font-bold">
                          {(telemetry.interdiction.predictedWindowMin + telemetry.interdiction.frictionDelayMin).toFixed(1)} mins
                        </span>
                      </div>

                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Operational Margin:</span>
                        <span className="text-emerald-300 font-bold">
                          +{Math.round(telemetry.interdiction.marginSeconds / 60)}m {Math.round(telemetry.interdiction.marginSeconds % 60)}s
                        </span>
                      </div>

                      <div className="pt-1">
                        <span
                          className={`inline-flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold border tracking-wide ${
                            telemetry.interdiction.outcome === "OPTIMAL_INTERDICTION"
                              ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                              : "bg-amber-950/80 border-amber-500/50 text-amber-300"
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{telemetry.interdiction.outcome}</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
