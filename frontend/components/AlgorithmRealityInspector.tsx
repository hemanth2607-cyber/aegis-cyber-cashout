// frontend/components/AlgorithmRealityInspector.tsx
"use client";
import React from "react";
import { SimulationState, STAGES } from "../state/simulationTimeline";

export interface InspectorTelemetry {
  ncrp: { ticketId: string; amountInr: number; edgeInsertLatencyMs: number };
  peeling: { formulaVars: { Ai_ratio: number; lambda_sum: number; sigma: number }; velocityDecay: number };
  bayesian: {
    sensors: { source: string; location: string }[];
    fromCoord: [number, number];
    toCoord: [number, number];
  };
  mlForecast: {
    cashoutWindowMin: number;
    reachRadiusKm: number;
    rankedCells: { h3: string; atmId: string; probability: number }[];
  };
  shap: { factors: { label: string; weight: number }[]; sections: string[] };
  interdiction: {
    digitalFreezeSec: number;
    physicalDispatchMin: number;
    windowMin: number;
    frictionMin: number;
    marginMin: number;
    outcome: string;
  };
}

export default function AlgorithmRealityInspector({
  state,
  telemetry,
}: {
  state: SimulationState;
  telemetry: InspectorTelemetry;
}) {
  const stage = STAGES[state.currentStageIndex];
  const stageId = stage.id;

  return (
    <div className="h-full w-full rounded-xl border border-tactical-border/40 bg-tactical-bg p-5 font-mono text-sm text-zinc-200 overflow-y-auto shadow-2xl flex flex-col space-y-4">
      <div className="flex items-center justify-between border-b border-tactical-border/30 pb-3">
        <div className="text-xs uppercase tracking-widest text-tactical-border font-bold">
          Algorithm Reality Inspector — Stage {stage.index}/6
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-tactical-border/10 text-tactical-border border border-tactical-border/30 font-bold">
          {stage.label}
        </span>
      </div>

      {stageId === "origin" && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1.5">
            <p className="text-xs text-slate-400">NCRP Ticket Reference:</p>
            <p className="text-base font-bold text-tactical-amber">{telemetry.ncrp.ticketId}</p>
          </div>
          <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1.5">
            <p className="text-xs text-slate-400">Defrauded Principal:</p>
            <p className="text-lg font-black text-white">
              ₹{(telemetry.ncrp.amountInr / 100000).toFixed(2)} Lakhs{" "}
              <span className="text-xs text-tactical-risk font-normal">(Digital Arrest MO)</span>
            </p>
          </div>
          <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-400">RAM Graph Ingest Latency:</span>
            <span className="text-xs font-bold text-tactical-green">
              {telemetry.ncrp.edgeInsertLatencyMs.toFixed(1)} ms
            </span>
          </div>
        </div>
      )}

      {stageId === "peeling" && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-black/50 border border-tactical-amber/30">
            <p className="text-[10px] text-slate-400 mb-1">Velocity Decay Formulation:</p>
            <pre className="whitespace-pre-wrap text-tactical-amber text-xs leading-relaxed font-bold">
{`V_k = (∏ A_i/A_i-1) · exp(-Σ λ_i·Δt_i) · [1 - tanh(γ · |Out(v_k)|/|In(v_k)|+ε)]`}
            </pre>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded bg-black/40 border border-white/5">
              <span className="text-slate-400 text-[10px] block">A_i Ratio Product:</span>
              <span className="font-bold text-white">{telemetry.peeling.formulaVars.Ai_ratio.toFixed(3)}</span>
            </div>
            <div className="p-2.5 rounded bg-black/40 border border-white/5">
              <span className="text-slate-400 text-[10px] block">Σ λ·Δt (Temporal Cost):</span>
              <span className="font-bold text-white">{telemetry.peeling.formulaVars.lambda_sum.toFixed(3)}</span>
            </div>
            <div className="p-2.5 rounded bg-black/40 border border-white/5">
              <span className="text-slate-400 text-[10px] block">Peeling Variance σ:</span>
              <span className="font-bold text-white">{telemetry.peeling.formulaVars.sigma.toFixed(2)}</span>
            </div>
            <div className="p-2.5 rounded bg-black/40 border border-tactical-green/30">
              <span className="text-slate-400 text-[10px] block">Resolved V_k Factor:</span>
              <span className="font-bold text-tactical-green">{telemetry.peeling.velocityDecay.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {stageId === "bayesian_shift" && (
        <div className="space-y-3">
          <table className="w-full text-xs border border-tactical-border/30 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-tactical-border/10 text-tactical-border font-bold">
                <th className="text-left p-2">Sensor Telemetry Signal</th>
                <th className="text-left p-2">Resolved Geolocation</th>
              </tr>
            </thead>
            <tbody>
              {telemetry.bayesian.sensors.map((s) => (
                <tr key={s.source} className="border-t border-tactical-border/20">
                  <td className="p-2 text-slate-300">{s.source}</td>
                  <td className="p-2 text-tactical-amber font-bold">{s.location}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-3 rounded-lg bg-black/50 border border-tactical-amber/30">
            <p className="text-[10px] text-slate-400 mb-1">Bayesian MAP Anchor Shift Formulation:</p>
            <pre className="whitespace-pre-wrap text-tactical-amber text-xs leading-relaxed font-bold">
{`x_anchor = argmax_x Σ ω_s · exp(-½(x-μ_s)ᵀΣ_s⁻¹(x-μ_s))`}
            </pre>
          </div>

          <div className="p-2.5 rounded bg-black/40 border border-white/5 text-xs flex items-center justify-between">
            <span className="text-slate-400">Search Centroid Migration:</span>
            <span>
              ({telemetry.bayesian.fromCoord[0]}°N, {telemetry.bayesian.fromCoord[1]}°E){" "}
              <span className="text-tactical-border">➔</span>{" "}
              <span className="text-tactical-risk font-bold">
                ({telemetry.bayesian.toCoord[0]}°N, {telemetry.bayesian.toCoord[1]}°E)
              </span>
            </span>
          </div>
        </div>
      )}

      {stageId === "ml_forecast" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded bg-black/40 border border-white/5">
              <span className="text-slate-400 text-[10px] block">Stage 1 Cashout Window (Δt̂):</span>
              <span className="font-bold text-tactical-amber text-sm">
                {telemetry.mlForecast.cashoutWindowMin} min
              </span>
            </div>
            <div className="p-2.5 rounded bg-black/40 border border-white/5">
              <span className="text-slate-400 text-[10px] block">Isochrone Reach (35km/h):</span>
              <span className="font-bold text-tactical-green text-sm">
                {telemetry.mlForecast.reachRadiusKm.toFixed(2)} km
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-black/50 border border-tactical-amber/30">
            <p className="text-[10px] text-slate-400 mb-1">Cross-Border Utility Function:</p>
            <pre className="whitespace-pre-wrap text-tactical-amber text-[11px] leading-relaxed font-bold">
{`U_m(a) = w1·ψ_dist + w2·ψ_liq + w3·E_crowd + w4·J_jurisdiction - w5·ψ_police`}
            </pre>
          </div>

          <table className="w-full text-xs border border-tactical-border/30 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-tactical-border/10 text-tactical-border font-bold">
                <th className="text-left p-2">H3 Cell</th>
                <th className="text-left p-2">ATM Terminal</th>
                <th className="text-left p-2">Softmax Prob</th>
              </tr>
            </thead>
            <tbody>
              {telemetry.mlForecast.rankedCells.map((c) => (
                <tr key={c.h3} className="border-t border-tactical-border/20">
                  <td className="p-2 font-mono text-slate-300">{c.h3}</td>
                  <td className="p-2 text-slate-300">{c.atmId}</td>
                  <td className="p-2 font-bold text-tactical-green">
                    {(c.probability * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {stageId === "shap_statutory" && (
        <div className="space-y-3">
          <div className="text-tactical-border text-xs uppercase font-bold flex items-center justify-between">
            <span>TreeSHAP Attribution Waterfall</span>
            <span className="text-[10px] text-slate-400">Sub-50ms Game Theoretic Vector</span>
          </div>

          <div className="space-y-2 p-3 rounded-lg bg-black/40 border border-white/5">
            {telemetry.shap.factors.map((f) => (
              <div key={f.label} className="flex items-center gap-2 text-xs">
                <span className="w-36 truncate text-slate-300">{f.label}</span>
                <div className="flex-1 h-2 bg-zinc-800 rounded overflow-hidden">
                  <div
                    className={`h-2 rounded ${f.weight >= 0 ? "bg-tactical-green" : "bg-tactical-risk"}`}
                    style={{ width: `${Math.min(Math.abs(f.weight) * 100, 100)}%` }}
                  />
                </div>
                <span className={`w-12 text-right font-bold ${f.weight >= 0 ? "text-tactical-green" : "text-tactical-risk"}`}>
                  {f.weight >= 0 ? `+${f.weight.toFixed(2)}` : f.weight.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-tactical-amber/50 bg-tactical-amber/10 p-3 text-xs text-tactical-amber leading-relaxed shadow-lg">
            <span className="font-bold block mb-1">Statutory Citations:</span>
            {telemetry.shap.sections.join(" · ")}
          </div>
        </div>
      )}

      {stageId === "interdiction" && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2 text-xs leading-relaxed">
            <p className="text-slate-300">
              <span className="text-tactical-border font-bold">1. Digital Freeze:</span>{" "}
              T_digital_freeze &lt; Δt̂ ➔ {telemetry.interdiction.digitalFreezeSec}s &lt;{" "}
              {telemetry.interdiction.windowMin}m{" "}
              <span className="text-tactical-green font-bold">⟹ I_freeze = 1</span>
            </p>
            <p className="text-slate-300">
              <span className="text-tactical-border font-bold">2. Physical Dispatch:</span>{" "}
              T_physical_dispatch &lt; Δt̂ + (I_freeze · τ_friction) ➔{" "}
              {telemetry.interdiction.physicalDispatchMin}m &lt;{" "}
              {telemetry.interdiction.windowMin + telemetry.interdiction.frictionMin}m{" "}
              <span className="text-tactical-green font-bold">⟹ SATISFIED</span>
            </p>
          </div>

          <div className="p-3 rounded-lg bg-black/40 border border-tactical-green/40 flex items-center justify-between">
            <span className="text-xs text-slate-400">Interdiction Time Margin:</span>
            <span className="text-sm font-bold text-tactical-green">
              +{telemetry.interdiction.marginMin.toFixed(1)} minutes
            </span>
          </div>

          <div className="p-3 rounded-lg bg-tactical-green/10 border border-tactical-green text-center">
            <span className="inline-block px-3 py-1 text-xs font-black tracking-wider text-tactical-green uppercase">
              {telemetry.interdiction.outcome}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
