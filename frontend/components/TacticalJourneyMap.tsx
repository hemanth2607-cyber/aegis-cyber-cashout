// frontend/components/TacticalJourneyMap.tsx
"use client";
import React, { useMemo, useState } from "react";
import Map, { Marker } from "react-map-gl/mapbox";
import DeckGL from "@deck.gl/react";
import { ArcLayer } from "@deck.gl/layers";
import { H3HexagonLayer } from "@deck.gl/geo-layers";
import "mapbox-gl/dist/mapbox-gl.css";
import { SimulationState, STAGES } from "../state/simulationTimeline";
import { useRoadPatrol } from "../hooks/useRoadPatrol";

const CHENNAI = { lat: 13.08, lng: 80.27 };
const GOA_ATM = { lat: 15.5212, lng: 73.7699 };
const PCR_BASE = { lat: 15.5449, lng: 73.7517 };

interface SplitTransfer {
  toBank: string;
  amountInr: number;
  to: [number, number]; // [lng, lat]
}

const LAYER2_SPLITS: SplitTransfer[] = [
  { toBank: "PNB (Pune Hub)", amountInr: 250000, to: [73.8567, 18.5204] },
  { toBank: "ICICI (Margao)", amountInr: 240000, to: [73.818, 15.2993] },
  { toBank: "Yes Bank (Calangute)", amountInr: 245000, to: [73.7699, 15.5212] },
];

export default function TacticalJourneyMap({ state }: { state: SimulationState }) {
  const stageId = STAGES[state.currentStageIndex].id;
  const progress = state.stageProgress;

  const [viewState, setViewState] = useState({
    latitude: 15.2,
    longitude: 76.5,
    zoom: 6.2,
    pitch: 42,
    bearing: 0,
  });

  const patrol = useRoadPatrol(
    stageId === "interdiction" ? PCR_BASE : null,
    GOA_ATM,
    35
  );

  const arcs = useMemo(() => {
    if (
      stageId === "peeling" ||
      stageId === "bayesian_shift" ||
      stageId === "ml_forecast" ||
      stageId === "shap_statutory" ||
      stageId === "interdiction"
    ) {
      return LAYER2_SPLITS.map((s) => ({
        source: [CHENNAI.lng, CHENNAI.lat],
        target: s.to,
        label: `${s.toBank}: ₹${(s.amountInr / 100000).toFixed(2)}L`,
      }));
    }
    return [];
  }, [stageId]);

  const arcLayer = useMemo(
    () =>
      new ArcLayer({
        id: "peeling-arcs",
        data: arcs,
        getSourcePosition: (d: any) => d.source,
        getTargetPosition: (d: any) => d.target,
        getSourceColor: [255, 170, 0, 200], // tactical.amber
        getTargetColor: [255, 0, 85, 220],  // tactical.risk
        getWidth: 3.5,
        greatCircle: true,
      }),
    [arcs]
  );

  const showHexagon = stageId !== "origin" && stageId !== "peeling";
  const hexLayer = useMemo(
    () =>
      new H3HexagonLayer({
        id: "hotspot-hex",
        data: showHexagon ? [{ hex: "886196a52ffffff" }] : [],
        getHexagon: (d: { hex: string }) => d.hex,
        getFillColor: [255, 0, 85, 65],
        getLineColor: [255, 0, 85, 220],
        lineWidthMinPixels: 2,
        extruded: false,
      }),
    [showHexagon]
  );

  const mapStyle = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    ? "mapbox://styles/mapbox/dark-v11"
    : "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden border border-tactical-border/40 bg-tactical-bg shadow-2xl">
      <DeckGL
        viewState={viewState}
        onViewStateChange={(e: any) => setViewState(e.viewState)}
        controller
        layers={[arcLayer, hexLayer]}
      >
        <Map
          mapStyle={mapStyle}
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        >
          {/* Stage 1: Origin Beacon at Chennai */}
          <Marker latitude={CHENNAI.lat} longitude={CHENNAI.lng}>
            <div className="relative flex flex-col items-center">
              <div className="absolute h-10 w-10 rounded-full bg-tactical-amber/40 animate-ping" />
              <div className="h-4 w-4 rounded-full bg-tactical-amber ring-2 ring-white/50 z-10" />
              {stageId === "origin" && (
                <div className="mt-2 rounded-md bg-black/85 border border-tactical-amber px-2.5 py-1 text-[10px] font-mono text-tactical-amber whitespace-nowrap shadow-lg">
                  Victim v₀ Defrauded: ₹7,50,000 via Digital Arrest
                </div>
              )}
            </div>
          </Marker>

          {/* Stage 3+: Suspect ATM + Sec 106 BNSS Shield */}
          {showHexagon && (
            <Marker latitude={GOA_ATM.lat} longitude={GOA_ATM.lng}>
              <div className="relative flex flex-col items-center">
                <div className="absolute h-12 w-12 rounded-full border-2 border-tactical-risk animate-ping" />
                <div className="h-4 w-4 rounded-full bg-tactical-risk ring-2 ring-white/60 z-10" />
                <div className="mt-2 rounded-md bg-black/90 border border-tactical-green px-2 py-1 text-[10px] font-mono text-tactical-green whitespace-nowrap shadow-xl">
                  🛡 CARD-SESSION FREEZE ACTIVE (Sec 106 BNSS) — ATM live for public
                </div>
              </div>
            </Marker>
          )}

          {/* Stage 6: Patrol Vehicle with Bearing */}
          {stageId === "interdiction" && patrol && (
            <Marker latitude={patrol.position.lat} longitude={patrol.position.lng}>
              <div
                className="flex flex-col items-center drop-shadow-[0_0_12px_rgba(0,255,170,0.8)]"
                style={{ transform: `rotate(${patrol.bearingDeg}deg)` }}
              >
                <span className="text-2xl">🚓</span>
              </div>
            </Marker>
          )}
        </Map>
      </DeckGL>

      {/* Patrol telemetry HUD */}
      {stageId === "interdiction" && patrol && (
        <div className="absolute bottom-4 left-4 rounded-lg bg-black/85 border border-tactical-border/60 px-3.5 py-2 font-mono text-xs text-tactical-green shadow-xl flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-tactical-green animate-pulse" />
          <span>
            Speed {patrol.speedKmh} km/h · {(patrol.distanceRemainingMeters / 1000).toFixed(1)} km remaining · ETA{" "}
            {Math.round(patrol.etaSeconds / 60)}m {Math.round(patrol.etaSeconds % 60)}s
          </span>
        </div>
      )}

      {/* Stage Tracker Badge */}
      <div className="absolute top-3 left-3 rounded-md bg-black/80 border border-tactical-border/50 px-2.5 py-1 text-[11px] font-mono text-tactical-border shadow-lg flex items-center space-x-2">
        <span className="w-1.5 h-1.5 rounded-full bg-tactical-border animate-ping" />
        <span>
          Stage {STAGES[state.currentStageIndex].index}/6 · {(progress * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
