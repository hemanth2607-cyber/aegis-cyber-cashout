// frontend/state/simulationTimeline.ts
export type StageId =
  | "origin"
  | "peeling"
  | "bayesian_shift"
  | "ml_forecast"
  | "shap_statutory"
  | "interdiction";

export const STAGES: { id: StageId; index: number; label: string }[] = [
  { id: "origin", index: 1, label: "Incident Origin (v₀)" },
  { id: "peeling", index: 2, label: "Layered Peeling & Velocity Decay" },
  { id: "bayesian_shift", index: 3, label: "Bayesian MAP Telemetry Shift" },
  { id: "ml_forecast", index: 4, label: "Dual-Stage ML Forecast" },
  { id: "shap_statutory", index: 5, label: "TreeSHAP & Statutory Briefing" },
  { id: "interdiction", index: 6, label: "Sequential Interdiction" },
];

export type PlaybackSpeed = 0.5 | 1 | 2;

export interface SimulationState {
  currentStageIndex: number;   // 0-based index into STAGES
  playing: boolean;
  speed: PlaybackSpeed;
  stageProgress: number;       // 0..1 within current stage, drives sub-animations
  viewMode: "map" | "inspector" | "split";
}

export const initialSimulationState: SimulationState = {
  currentStageIndex: 0,
  playing: false,
  speed: 1,
  stageProgress: 0,
  viewMode: "split",
};

export type SimulationAction =
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "RESET" }
  | { type: "STEP_FORWARD" }
  | { type: "STEP_BACKWARD" }
  | { type: "SET_SPEED"; speed: PlaybackSpeed }
  | { type: "SET_VIEW_MODE"; mode: SimulationState["viewMode"] }
  | { type: "TICK"; deltaMs: number };

const STAGE_DURATION_MS = 6000; // baseline duration per stage at 1x

export function simulationReducer(
  state: SimulationState,
  action: SimulationAction
): SimulationState {
  switch (action.type) {
    case "PLAY":
      return { ...state, playing: true };
    case "PAUSE":
      return { ...state, playing: false };
    case "RESET":
      return { ...initialSimulationState, viewMode: state.viewMode };
    case "STEP_FORWARD":
      return {
        ...state,
        currentStageIndex: Math.min(state.currentStageIndex + 1, STAGES.length - 1),
        stageProgress: 0,
        playing: false,
      };
    case "STEP_BACKWARD":
      return {
        ...state,
        currentStageIndex: Math.max(state.currentStageIndex - 1, 0),
        stageProgress: 0,
        playing: false,
      };
    case "SET_SPEED":
      return { ...state, speed: action.speed };
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.mode };
    case "TICK": {
      if (!state.playing) return state;
      const increment = (action.deltaMs * state.speed) / STAGE_DURATION_MS;
      let progress = state.stageProgress + increment;
      let stageIndex = state.currentStageIndex;
      if (progress >= 1) {
        if (stageIndex >= STAGES.length - 1) {
          return { ...state, stageProgress: 1, playing: false };
        }
        stageIndex += 1;
        progress = 0;
      }
      return { ...state, currentStageIndex: stageIndex, stageProgress: progress };
    }
    default:
      return state;
  }
}
