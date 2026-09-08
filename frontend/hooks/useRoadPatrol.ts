// frontend/hooks/useRoadPatrol.ts
"use client";

import { useEffect, useState, useRef } from "react";
import {
  LatLng,
  RouteResult,
  PatrolTick,
  fetchRoadRoute,
  createPatrolAnimator,
} from "../utils/roadRouter";

export function useRoadPatrol(
  origin: LatLng | null,
  destination: LatLng | null,
  speedKmh = 40
): PatrolTick | null {
  const [patrolState, setPatrolState] = useState<PatrolTick | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // If either origin or destination is not provided, reset
    if (!origin || !destination) {
      if (cancelRef.current) {
        cancelRef.current();
        cancelRef.current = null;
      }
      setPatrolState(null);
      return;
    }

    let isMounted = true;

    async function startPatrol() {
      if (!origin || !destination) return;
      const route: RouteResult = await fetchRoadRoute(origin, destination);

      if (!isMounted) return;

      // Cancel any ongoing animation
      if (cancelRef.current) {
        cancelRef.current();
      }

      // Start the requestAnimationFrame patrol animator
      cancelRef.current = createPatrolAnimator(route, speedKmh, (tick) => {
        if (isMounted) {
          setPatrolState(tick);
        }
      });
    }

    startPatrol();

    return () => {
      isMounted = false;
      if (cancelRef.current) {
        cancelRef.current();
        cancelRef.current = null;
      }
    };
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng, speedKmh]);

  return patrolState;
}
