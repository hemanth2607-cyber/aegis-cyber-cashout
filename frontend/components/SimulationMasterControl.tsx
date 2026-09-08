// frontend/components/SimulationMasterControl.tsx
"use client";
import React from "react";
import { PlaybackSpeed, SimulationState, SimulationAction, STAGES } from "../state/simulationTimeline";
import { Play, Pause, RotateCcw, SkipBack, SkipForward, Columns2, Map as MapIcon, Terminal } from "lucide-react";

export default function SimulationMasterControl({
  state,
  dispatch,
}: {
  state: SimulationState;
  dispatch: React.Dispatch<SimulationAction>;
}) {
  const stage = STAGES[state.currentStageIndex];
  const speeds: PlaybackSpeed[] = [0.5, 1, 2];

  return (
    <div className="w-full rounded-xl border border-tactical-border/40 bg-tactical-bg/95 px-4 py-3 font-mono text-zinc-200 flex items-center gap-4 shadow-xl">
      <div className="flex items-center gap-2">
        <button
          onClick={() => dispatch({ type: "RESET" })}
          className="p-2 rounded hover:bg-white/5 transition-colors text-slate-400 hover:text-slate-200"
          title="Reset Simulation"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={() => dispatch({ type: "STEP_BACKWARD" })}
          className="p-2 rounded hover:bg-white/5 transition-colors text-slate-400 hover:text-slate-200"
          title="Previous Stage"
        >
          <SkipBack size={16} />
        </button>
        <button
          onClick={() => dispatch({ type: state.playing ? "PAUSE" : "PLAY" })}
          className="p-2 rounded bg-tactical-border/20 hover:bg-tactical-border/30 text-tactical-border transition-colors flex items-center justify-center"
          title={state.playing ? "Pause" : "Play"}
        >
          {state.playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          onClick={() => dispatch({ type: "STEP_FORWARD" })}
          className="p-2 rounded hover:bg-white/5 transition-colors text-slate-400 hover:text-slate-200"
          title="Next Stage"
        >
          <SkipForward size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1 text-xs">
        {speeds.map((s) => (
          <button
            key={s}
            onClick={() => dispatch({ type: "SET_SPEED", speed: s })}
            className={`px-2 py-1 rounded border transition-colors ${
              state.speed === s
                ? "border-tactical-amber text-tactical-amber bg-tactical-amber/10"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      <div className="flex-1 text-center text-xs text-tactical-border font-bold tracking-wider">
        Stage {stage.index}/6: {stage.label}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => dispatch({ type: "SET_VIEW_MODE", mode: "map" })}
          className={`p-2 rounded transition-colors ${state.viewMode === "map" ? "bg-tactical-border/20 text-tactical-border" : "hover:bg-white/5 text-slate-400"}`}
          title="Map only"
        >
          <MapIcon size={16} />
        </button>
        <button
          onClick={() => dispatch({ type: "SET_VIEW_MODE", mode: "split" })}
          className={`p-2 rounded transition-colors ${state.viewMode === "split" ? "bg-tactical-border/20 text-tactical-border" : "hover:bg-white/5 text-slate-400"}`}
          title="Split view"
        >
          <Columns2 size={16} />
        </button>
        <button
          onClick={() => dispatch({ type: "SET_VIEW_MODE", mode: "inspector" })}
          className={`p-2 rounded transition-colors ${state.viewMode === "inspector" ? "bg-tactical-border/20 text-tactical-border" : "hover:bg-white/5 text-slate-400"}`}
          title="Inspector only"
        >
          <Terminal size={16} />
        </button>
      </div>
    </div>
  );
}
