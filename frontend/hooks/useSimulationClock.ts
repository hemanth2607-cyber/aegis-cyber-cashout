// frontend/hooks/useSimulationClock.ts
import { useEffect, useReducer, useRef } from "react";
import { simulationReducer, initialSimulationState } from "../state/simulationTimeline";

export function useSimulationClock() {
  const [state, dispatch] = useReducer(simulationReducer, initialSimulationState);
  const rafRef = useRef<number>();
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => {
    function loop(ts: number) {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const deltaMs = ts - lastTsRef.current;
      lastTsRef.current = ts;
      dispatch({ type: "TICK", deltaMs });
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { state, dispatch };
}
