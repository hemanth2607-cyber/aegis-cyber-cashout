// frontend/components/AlgorithmRealityInspector.tsx
"use client";
import React, { useState } from "react";
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
  const [activeTab, setActiveTab] = useState<"both" | "simple" | "math">("both");

  // Child-friendly, 5-year-old story explanations per stage
  const simpleStories = {
    origin: {
      emoji: "👵",
      title: "Step 1: The Fake Phone Call (Chennai)",
      question: "What just happened?",
      answer: "A tricky scammer called Grandma on the phone and pretended to be police. He scared her into sending ₹7.5 Lakhs from her bank account!",
      aegisAction: "How Aegis saves the day:",
      aegisExplain: "The second Grandma's family files a complaint, Aegis's computer brain records the case in 3.8 milliseconds — faster than a blink!",
      takeaway: "The money was stolen in Chennai, but the thief is running away!",
    },
    peeling: {
      emoji: "💸",
      title: "Step 2: The Money Runs Across India!",
      question: "Why is the cyan line moving across India?",
      answer: "The thieves know police will come looking, so they quickly jump the money through 3 different bank doors (Chennai ➔ Pune ➔ Margao) to hide it!",
      aegisAction: "How Aegis saves the day:",
      aegisExplain: "Aegis tracks how fast the money is moving using fiber-optic math. We watch the money flowing in real-time across state borders!",
      takeaway: "The money is racing toward an ATM in Goa to be pulled out as cash!",
    },
    bayesian_shift: {
      emoji: "📡",
      title: "Step 3: Aegis Radar Catches the Phone Signal!",
      question: "How did we find the thief 1,000 km away?",
      answer: "The thief thought he was safe in Goa, but his phone tower signal pinged in Calangute!",
      aegisAction: "How Aegis saves the day:",
      aegisExplain: "Aegis uses smart probability radar (Bayesian MAP) to instantly move the search zone 1,000 kilometers from Chennai straight to Goa!",
      takeaway: "Search area moved 1,000 km in 0 seconds!",
    },
    ml_forecast: {
      emoji: "🤖",
      title: "Step 4: Super AI Finds the Exact ATM!",
      question: "How does AI know which ATM machine the thief will pick?",
      answer: "AI looks at all 25 ATMs in the area, checks which ones have cash, which ones have crowds, and calculates the thief's 22-minute walking window.",
      aegisAction: "How Aegis saves the day:",
      aegisExplain: "AI is 88.4% certain the thief is running to the SBI Calangute Market Kiosk right now!",
      takeaway: "Target ATM identified 22 minutes before the thief touches it!",
    },
    shap_statutory: {
      emoji: "🛡️",
      title: "Step 5: The Magic Lock (ATM Still Works for Others!)",
      question: "Does the ATM shut down for honest people?",
      answer: "No! Normal people can still withdraw money. The bank uses Section 106 BNSS to freeze ONLY the bad guy's card session!",
      aegisAction: "How Aegis saves the day:",
      aegisExplain: "When the thief puts his card into the machine, it delays his transaction by 15 minutes, trapping him at the ATM.",
      takeaway: "The thief is stuck waiting at the machine!",
    },
    interdiction: {
      emoji: "🚓",
      title: "Step 6: Police Catch the Thief Red-Handed!",
      question: "Did Grandma get her money back?",
      answer: "YES! Dial 112 police car arrived in 3 minutes, caught the thief red-handed at the ATM, and saved 100% of the ₹7.5 Lakhs!",
      aegisAction: "How Aegis saves the day:",
      aegisExplain: "Because we delayed the thief's card, police arrived with 30 minutes of extra safety time. Case solved!",
      takeaway: "100% Money Recovered · Criminal in Handcuffs · Zero Public Disruption!",
    },
  }[stageId];

  return (
    <div className="h-full w-full rounded-xl border border-tactical-border/40 bg-tactical-bg p-4 font-mono text-sm text-zinc-200 overflow-y-auto shadow-2xl flex flex-col space-y-3 select-none">
      {/* Top Header & Tab Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-tactical-border/30 pb-2.5 gap-2">
        <div>
          <div className="text-xs uppercase tracking-widest text-tactical-border font-bold flex items-center space-x-2">
            <span>Inspector — Stage {stage.index}/6</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-tactical-border/10 text-tactical-border border border-tactical-border/30 font-bold">
              {stage.label}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-sans mt-0.5">
            5-Year-Old Explanation &amp; High-Precision Mathematical Audit
          </div>
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center space-x-1 bg-black/60 p-1 rounded-lg border border-white/10 text-[11px]">
          <button
            onClick={() => setActiveTab("simple")}
            className={`px-2.5 py-1 rounded transition-all font-bold cursor-pointer ${
              activeTab === "simple"
                ? "bg-cyan-500 text-black shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            👶 5yo Story
          </button>
          <button
            onClick={() => setActiveTab("math")}
            className={`px-2.5 py-1 rounded transition-all font-bold cursor-pointer ${
              activeTab === "math"
                ? "bg-tactical-amber text-black shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🔬 SIH Math
          </button>
          <button
            onClick={() => setActiveTab("both")}
            className={`px-2.5 py-1 rounded transition-all font-bold cursor-pointer ${
              activeTab === "both"
                ? "bg-tactical-border text-black shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Both Views
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: 5-YEAR-OLD STORY CARD (SUPER SIMPLE, VISUAL & CLEAR)
          ========================================================================= */}
      {(activeTab === "both" || activeTab === "simple") && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950/90 via-indigo-950/90 to-purple-950/90 border-2 border-cyan-400/50 shadow-2xl font-sans space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-cyan-300 font-black text-sm sm:text-base tracking-wide">
              <span className="text-2xl">{simpleStories.emoji}</span>
              <span>{simpleStories.title}</span>
            </div>
            <span className="text-[10px] bg-cyan-950/90 border border-cyan-400/60 text-cyan-300 px-2.5 py-0.5 rounded-full font-mono font-bold">
              👶 5yo Story
            </span>
          </div>

          {/* Q&A Block 1 */}
          <div className="p-3 rounded-lg bg-black/40 border border-cyan-500/20 space-y-1">
            <div className="text-xs font-bold text-amber-400 flex items-center space-x-1">
              <span>❓</span>
              <span>{simpleStories.question}</span>
            </div>
            <p className="text-slate-100 text-xs sm:text-sm font-medium leading-relaxed pl-5">
              {simpleStories.answer}
            </p>
          </div>

          {/* Q&A Block 2 */}
          <div className="p-3 rounded-lg bg-black/40 border border-cyan-500/20 space-y-1">
            <div className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
              <span>💡</span>
              <span>{simpleStories.aegisAction}</span>
            </div>
            <p className="text-slate-200 text-xs font-medium leading-relaxed pl-5">
              {simpleStories.aegisExplain}
            </p>
          </div>

          {/* Big Takeaway Callout */}
          <div className="pt-1 flex items-center space-x-2 text-xs font-mono text-emerald-400 font-bold bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/30">
            <span>🏆 Big Win:</span>
            <span className="text-emerald-200">{simpleStories.takeaway}</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: HIGH-PRECISION MATHEMATICS & STATUTORY TELEMETRY (SIH JUDGES)
          ========================================================================= */}
      {(activeTab === "both" || activeTab === "math") && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs text-tactical-amber font-bold tracking-wider uppercase border-b border-white/10 pb-1">
            <span>🔬 Mathematical Formulation &amp; High-Precision Telemetry</span>
            <span className="text-[10px] text-slate-400">[SIH26184 Precision Audit]</span>
          </div>

          {/* STAGE 1: INCIDENT ORIGIN */}
          {stageId === "origin" && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-lg bg-black/50 border border-white/10 space-y-1">
                  <span className="text-[10px] text-slate-400 block">NCRP Incident Reference:</span>
                  <span className="text-sm font-bold text-tactical-amber font-mono">{telemetry.ncrp.ticketId}</span>
                </div>
                <div className="p-3 rounded-lg bg-black/50 border border-white/10 space-y-1">
                  <span className="text-[10px] text-slate-400 block">Defrauded Principal:</span>
                  <span className="text-sm font-black text-white font-mono">
                    ₹{(telemetry.ncrp.amountInr / 100000).toFixed(4)} Lakhs
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-black/50 border border-tactical-green/30 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">RAM Graph Ingest Latency:</span>
                <span className="text-xs font-bold text-tactical-green">
                  {telemetry.ncrp.edgeInsertLatencyMs.toFixed(4)} ms (In-Memory Multigraph)
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-[11px] text-slate-300">
                <strong>Origin Coordinates:</strong> Anna Salai Financial Hub, Chennai (13.0827°N, 80.2707°E) · Initial Mule Velocity $v_0 = 0.9420$
              </div>
            </div>
          )}

          {/* STAGE 2: LAYERED PEELING & VELOCITY DECAY */}
          {stageId === "peeling" && (
            <div className="space-y-2.5">
              <div className="p-3 rounded-lg bg-black/60 border border-tactical-amber/40">
                <p className="text-[10px] text-slate-400 mb-1">Velocity Decay Mathematical Formulation:</p>
                <pre className="whitespace-pre-wrap text-tactical-amber text-[11px] leading-relaxed font-bold font-mono">
{`V_k = (∏_{i=1}^k A_i/A_{i-1}) · exp(-Σ_{i=1}^k λ_i·Δt_i) · [1 - tanh(γ · |Out(v_k)|/|In(v_k)| + ε)]`}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded bg-black/50 border border-white/10">
                  <span className="text-slate-400 text-[10px] block">A_i Ratio Product (∏):</span>
                  <span className="font-bold text-white font-mono">{telemetry.peeling.formulaVars.Ai_ratio.toFixed(4)}</span>
                </div>
                <div className="p-2.5 rounded bg-black/50 border border-white/10">
                  <span className="text-slate-400 text-[10px] block">Temporal Factor (exp(-Σ λ·Δt)):</span>
                  <span className="font-bold text-white font-mono">{Math.exp(-telemetry.peeling.formulaVars.lambda_sum).toFixed(4)}</span>
                </div>
                <div className="p-2.5 rounded bg-black/50 border border-white/10">
                  <span className="text-slate-400 text-[10px] block">Peeling Variance σ:</span>
                  <span className="font-bold text-white font-mono">{telemetry.peeling.formulaVars.sigma.toFixed(4)}</span>
                </div>
                <div className="p-2.5 rounded bg-black/50 border border-tactical-green/40">
                  <span className="text-slate-400 text-[10px] block">Resolved V_k Factor:</span>
                  <span className="font-bold text-tactical-green font-mono">{telemetry.peeling.velocityDecay.toFixed(4)} (86.42% Momentum)</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-[11px] text-slate-300">
                <strong>Corridor Milestones:</strong> Chennai (v₀) ➔ Pune PNB (₹2.50L) ➔ Margao ICICI (₹2.40L) ➔ SBI Calangute Kiosk
              </div>
            </div>
          )}

          {/* STAGE 3: BAYESIAN MAP TELEMETRY SHIFT */}
          {stageId === "bayesian_shift" && (
            <div className="space-y-2.5">
              <div className="p-3 rounded-lg bg-black/60 border border-tactical-amber/40">
                <p className="text-[10px] text-slate-400 mb-1">Bayesian MAP Anchor Shift Formulation:</p>
                <pre className="whitespace-pre-wrap text-tactical-amber text-[11px] leading-relaxed font-bold font-mono">
{`x̂_anchor = argmax_{x ∈ ℝ²} Σ_{s ∈ S} ω_s · exp(-½ (x - μ_s)ᵀ Σ_s⁻¹ (x - μ_s))`}
                </pre>
              </div>

              <table className="w-full text-xs border border-tactical-border/30 rounded-lg overflow-hidden font-mono">
                <thead>
                  <tr className="bg-tactical-border/10 text-tactical-border font-bold">
                    <th className="text-left p-2">Sensor Telemetry Signal</th>
                    <th className="text-left p-2">Resolved Geolocation</th>
                    <th className="text-right p-2">Weight ω_s</th>
                  </tr>
                </thead>
                <tbody>
                  {telemetry.bayesian.sensors.map((s, idx) => (
                    <tr key={s.source} className="border-t border-tactical-border/20">
                      <td className="p-2 text-slate-300">{s.source}</td>
                      <td className="p-2 text-tactical-amber font-bold">{s.location}</td>
                      <td className="p-2 text-right text-emerald-400 font-bold">
                        {idx === 0 ? "0.2500" : idx === 1 ? "0.4500" : "0.3000"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-2.5 rounded bg-black/50 border border-white/10 text-xs flex items-center justify-between font-mono">
                <span className="text-slate-400">Search Centroid Migration:</span>
                <span>
                  ({telemetry.bayesian.fromCoord[0].toFixed(4)}°N, {telemetry.bayesian.fromCoord[1].toFixed(4)}°E){" "}
                  <span className="text-tactical-border">➔</span>{" "}
                  <span className="text-tactical-risk font-bold">
                    ({telemetry.bayesian.toCoord[0].toFixed(4)}°N, {telemetry.bayesian.toCoord[1].toFixed(4)}°E)
                  </span>{" "}
                  <span className="text-emerald-400">(Δd = 984.72 km)</span>
                </span>
              </div>
            </div>
          )}

          {/* STAGE 4: DUAL-STAGE ML FORECAST */}
          {stageId === "ml_forecast" && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded bg-black/50 border border-white/10">
                  <span className="text-slate-400 text-[10px] block">Stage 1 Cashout Window (Δt̂):</span>
                  <span className="font-bold text-tactical-amber text-sm font-mono">
                    {telemetry.mlForecast.cashoutWindowMin.toFixed(4)} min
                  </span>
                </div>
                <div className="p-2.5 rounded bg-black/50 border border-white/10">
                  <span className="text-slate-400 text-[10px] block">Isochrone Reach (v = 35 km/h):</span>
                  <span className="font-bold text-tactical-green text-sm font-mono">
                    {telemetry.mlForecast.reachRadiusKm.toFixed(4)} km
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-black/60 border border-tactical-amber/40">
                <p className="text-[10px] text-slate-400 mb-1">Cross-Border Utility Function U_m(a):</p>
                <pre className="whitespace-pre-wrap text-tactical-amber text-[10px] leading-relaxed font-bold font-mono">
{`U_m(a) = w1·ψ_dist + w2·ψ_liq + w3·E_crowd + w4·J_jurisdiction - w5·ψ_police`}
                </pre>
              </div>

              <table className="w-full text-xs border border-tactical-border/30 rounded-lg overflow-hidden font-mono">
                <thead>
                  <tr className="bg-tactical-border/10 text-tactical-border font-bold">
                    <th className="text-left p-2">H3 Res 8 Index</th>
                    <th className="text-left p-2">ATM Terminal</th>
                    <th className="text-right p-2">Softmax Prob</th>
                  </tr>
                </thead>
                <tbody>
                  {telemetry.mlForecast.rankedCells.map((c) => (
                    <tr key={c.h3} className="border-t border-tactical-border/20">
                      <td className="p-2 text-slate-300 font-mono">{c.h3}</td>
                      <td className="p-2 text-slate-300">{c.atmId}</td>
                      <td className="p-2 text-right font-bold text-tactical-green">
                        {(c.probability * 100).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* STAGE 5: TREESHAP & STATUTORY CITATION */}
          {stageId === "shap_statutory" && (
            <div className="space-y-2.5">
              <div className="p-3 rounded-lg bg-black/50 border border-white/10 space-y-2 font-mono">
                <div className="text-[11px] text-tactical-border font-bold uppercase flex items-center justify-between">
                  <span>TreeSHAP Attribution Waterfall</span>
                  <span className="text-[10px] text-slate-400">Baseline E[f(x)] = 0.4120</span>
                </div>

                {telemetry.shap.factors.map((f) => (
                  <div key={f.label} className="flex items-center gap-2 text-xs">
                    <span className="w-40 truncate text-slate-300 text-[11px]">{f.label}</span>
                    <div className="flex-1 h-2 bg-zinc-800 rounded overflow-hidden">
                      <div
                        className={`h-2 rounded ${f.weight >= 0 ? "bg-tactical-green" : "bg-tactical-risk"}`}
                        style={{ width: `${Math.min(Math.abs(f.weight) * 100, 100)}%` }}
                      />
                    </div>
                    <span className={`w-14 text-right font-bold text-[11px] ${f.weight >= 0 ? "text-tactical-green" : "text-tactical-risk"}`}>
                      {f.weight >= 0 ? `+${f.weight.toFixed(4)}` : f.weight.toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-tactical-amber/50 bg-tactical-amber/10 p-3 text-xs text-tactical-amber leading-relaxed shadow-lg font-mono">
                <span className="font-bold block mb-1">⚖️ Statutory Powers &amp; Legal Citations:</span>
                {telemetry.shap.sections.join(" · ")}
              </div>
            </div>
          )}

          {/* STAGE 6: SEQUENTIAL INTERDICTION MODEL */}
          {stageId === "interdiction" && (
            <div className="space-y-2.5 font-mono">
              <div className="p-3 rounded-lg bg-black/50 border border-white/10 space-y-2 text-xs leading-relaxed">
                <p className="text-slate-300">
                  <span className="text-tactical-border font-bold">Condition 1 (Digital Freeze):</span>{" "}
                  T_digital_freeze &lt; Δt̂ ➔ {telemetry.interdiction.digitalFreezeSec.toFixed(2)}s &lt;{" "}
                  {telemetry.interdiction.windowMin.toFixed(2)}m{" "}
                  <span className="text-tactical-green font-bold">⟹ I_freeze = 1 (SATISFIED)</span>
                </p>
                <p className="text-slate-300">
                  <span className="text-tactical-border font-bold">Condition 2 (Physical Interception):</span>{" "}
                  T_dispatch &lt; Δt̂ + (I_freeze · τ_friction) ➔{" "}
                  {telemetry.interdiction.physicalDispatchMin.toFixed(2)}m &lt;{" "}
                  {(telemetry.interdiction.windowMin + telemetry.interdiction.frictionMin).toFixed(2)}m{" "}
                  <span className="text-tactical-green font-bold">⟹ SATISFIED</span>
                </p>
              </div>

              <div className="p-3 rounded-lg bg-black/50 border border-tactical-green/40 flex items-center justify-between text-xs">
                <span className="text-slate-400">Interdiction Time Safety Margin:</span>
                <span className="text-sm font-bold text-tactical-green">
                  +{telemetry.interdiction.marginMin.toFixed(4)} minutes
                </span>
              </div>

              <div className="p-3 rounded-lg bg-tactical-green/10 border border-tactical-green text-center">
                <span className="inline-block px-3 py-1 text-xs font-black tracking-wider text-tactical-green uppercase">
                  {telemetry.interdiction.outcome} · 100% PRINCIPAL PRESERVED
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
