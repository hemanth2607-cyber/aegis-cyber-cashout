// frontend/components/TacticalMap.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Map, { Marker } from "react-map-gl/mapbox";
import DeckGL from "@deck.gl/react";
import { ArcLayer } from "@deck.gl/layers";
import { H3HexagonLayer } from "@deck.gl/geo-layers";
import "mapbox-gl/dist/mapbox-gl.css";
import { useRoadPatrol } from "../hooks/useRoadPatrol";

export interface FundHop {
  from: [number, number]; // [lng, lat]
  to: [number, number];   // [lng, lat]
  hop: number;
}

export interface TacticalMapProps {
  originMarker: { lat: number; lng: number; label: string };
  fundFlow: FundHop[];
  hotspotH3Indices: string[];
  suspectAtm: { lat: number; lng: number; frozen: boolean; name?: string };
  pcrBase: { lat: number; lng: number };
  dispatchActive: boolean;
  h3Resolution?: number; // 8 or 9
  confidenceScore?: number;
}

export default function TacticalMap({
  originMarker,
  fundFlow,
  hotspotH3Indices,
  suspectAtm,
  pcrBase,
  dispatchActive,
  h3Resolution = 8,
  confidenceScore = 0.88,
}: TacticalMapProps) {
  const [viewState, setViewState] = useState({
    latitude: suspectAtm?.lat || 15.5212,
    longitude: suspectAtm?.lng || 73.7699,
    zoom: 12.8,
    pitch: 45,
    bearing: -15,
  });

  // Cycle arc opacity for dynamic pulsating fund flow effect
  const [pulsePhase, setPulsePhase] = useState(0);
  useEffect(() => {
    let animId: number;
    function pulse() {
      setPulsePhase((prev) => (prev + 0.05) % (Math.PI * 2));
      animId = requestAnimationFrame(pulse);
    }
    animId = requestAnimationFrame(pulse);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Update viewState if suspectAtm coordinates change
  useEffect(() => {
    if (suspectAtm?.lat && suspectAtm?.lng) {
      setViewState((prev) => ({
        ...prev,
        latitude: suspectAtm.lat,
        longitude: suspectAtm.lng,
      }));
    }
  }, [suspectAtm?.lat, suspectAtm?.lng]);

  const patrol = useRoadPatrol(
    dispatchActive ? pcrBase : null,
    suspectAtm ? { lat: suspectAtm.lat, lng: suspectAtm.lng } : null
  );

  // Dynamic alpha based on sine wave
  const arcAlpha = Math.round(180 + 55 * Math.sin(pulsePhase));

  const arcLayer = useMemo(
    () =>
      new ArcLayer({
        id: "fund-flow-arcs",
        data: fundFlow,
        getSourcePosition: (d: FundHop) => d.from,
        getTargetPosition: (d: FundHop) => d.to,
        getSourceColor: [245, 158, 11, arcAlpha], // Glowing amber
        getTargetColor: [239, 68, 68, 240],       // Red extraction target
        getWidth: 4,
        greatCircle: true,
      }),
    [fundFlow, arcAlpha]
  );

  // Switch resolution based on confidence or prop (8 or 9)
  const activeRes = confidenceScore > 0.85 ? Math.max(h3Resolution, 9) : h3Resolution;

  const hexLayer = useMemo(
    () =>
      new H3HexagonLayer({
        id: "predicted-hotspot",
        data: hotspotH3Indices.map((h) => ({ hex: h, res: activeRes })),
        getHexagon: (d: { hex: string }) => d.hex,
        getFillColor: [239, 68, 68, 70],
        getLineColor: [0, 240, 255, 220],
        lineWidthMinPixels: 2.5,
        extruded: false,
      }),
    [hotspotH3Indices, activeRes]
  );

  // Use CartoDB Dark Matter if no Mapbox token is provided to guarantee 100% offline/free functionality
  const mapStyleUrl = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    ? "mapbox://styles/mapbox/dark-v11"
    : "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden border border-white/[0.1] bg-[#070B14] shadow-2xl">
      {/* HUD Top Overlay */}
      <div className="absolute top-4 left-4 z-20 flex items-center space-x-3 bg-black/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/[0.12] shadow-xl">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
          </span>
          <span className="font-mono text-xs font-bold tracking-wider text-cyan-300 uppercase">
            Spatio-Temporal Tactical Grid
          </span>
        </div>
        <div className="h-4 w-[1px] bg-white/20" />
        <span className="font-mono text-[11px] text-slate-300">
          H3 Res: <span className="text-amber-400 font-bold">{activeRes}</span> (~0.7km²)
        </span>
        <div className="h-4 w-[1px] bg-white/20" />
        <span className="font-mono text-[11px] text-slate-300">
          Confidence: <span className="text-emerald-400 font-bold">{(confidenceScore * 100).toFixed(0)}%</span>
        </span>
      </div>

      <DeckGL
        viewState={viewState}
        onViewStateChange={(e: any) => setViewState(e.viewState)}
        controller={true}
        layers={[arcLayer, hexLayer]}
      >
        <Map
          mapStyle={mapStyleUrl}
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        >
          {/* 1. Incident Origin Marker (v0, pulsating amber) */}
          <Marker latitude={originMarker.lat} longitude={originMarker.lng} anchor="center">
            <div className="relative flex flex-col items-center group cursor-pointer">
              <div className="absolute -inset-2 rounded-full bg-amber-400/40 animate-ping" />
              <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 border-2 border-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.8)] z-10 flex items-center justify-center">
                <span className="text-[9px] font-black text-black">v₀</span>
              </div>
              <div className="mt-1 whitespace-nowrap rounded bg-black/80 px-2 py-0.5 text-[9px] font-mono text-amber-300 border border-amber-500/40 backdrop-blur-sm">
                {originMarker.label || "Victim Root Node (v₀)"}
              </div>
            </div>
          </Marker>

          {/* 2. Suspect Target ATM Marker with Radar Ping & Shield Badge */}
          <Marker latitude={suspectAtm.lat} longitude={suspectAtm.lng} anchor="center">
            <div className="relative flex flex-col items-center group cursor-pointer">
              {/* Radar Ping Ring */}
              <div className="absolute -inset-4 rounded-full border-2 border-red-500/80 animate-ping pointer-events-none" />
              <div className="absolute -inset-8 rounded-full border border-red-500/30 animate-pulse pointer-events-none" />
              
              {/* Core Terminal Pin */}
              <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 border-2 border-white shadow-[0_0_20px_rgba(239,68,68,0.9)] z-10 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">ATM</span>
              </div>

              {/* Terminal Label */}
              <div className="mt-1.5 whitespace-nowrap rounded-md bg-black/85 border border-red-500/60 px-2 py-0.5 text-[10px] font-mono text-white font-bold shadow-lg">
                {suspectAtm.name || "Target Cashout Dispenser"}
              </div>

              {/* Card Session Shield Badge (Sec 106 BNSS) */}
              {suspectAtm.frozen && (
                <div className="mt-1 whitespace-nowrap rounded-md bg-emerald-950/90 border border-emerald-400 px-2.5 py-1 text-[10px] font-mono text-emerald-300 font-bold shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center space-x-1.5 animate-bounce">
                  <span>🛡️</span>
                  <span>CARD SESSION FROZEN (Sec 106 BNSS)</span>
                </div>
              )}
            </div>
          </Marker>

          {/* 3. Patrol Car Marker (Rotates via bearingDeg, ETA label) */}
          {patrol && (
            <Marker latitude={patrol.position.lat} longitude={patrol.position.lng} anchor="center">
              <div className="relative flex flex-col items-center">
                <div
                  className="transition-transform duration-100 ease-linear drop-shadow-[0_0_15px_rgba(0,240,255,0.9)]"
                  style={{ transform: `rotate(${patrol.bearingDeg}deg)` }}
                >
                  <div className="w-8 h-8 rounded-full bg-cyan-950/90 border-2 border-cyan-400 flex items-center justify-center text-lg">
                    🚓
                  </div>
                </div>
                <div className="mt-1 whitespace-nowrap rounded bg-black/85 border border-cyan-500 px-2 py-0.5 font-mono text-[9px] text-cyan-300 font-bold">
                  PCR BEAT-3 · {patrol.speedKmh} km/h
                </div>
              </div>
            </Marker>
          )}
        </Map>
      </DeckGL>

      {/* Live Patrol Dispatch Floating Status HUD */}
      {patrol && (
        <div className="absolute bottom-5 left-5 z-20 flex items-center space-x-3 rounded-xl bg-black/85 backdrop-blur-md border border-cyan-500/50 px-4 py-2.5 font-mono text-xs text-emerald-300 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-white uppercase tracking-wider">PCR En Route</span>
          </div>
          <div className="h-4 w-[1px] bg-white/20" />
          <div>
            ETA: <span className="font-bold text-cyan-300">{Math.floor(patrol.etaSeconds / 60)}m {Math.round(patrol.etaSeconds % 60)}s</span>
          </div>
          <div className="h-4 w-[1px] bg-white/20" />
          <div>
            Remaining: <span className="font-bold text-amber-300">{(patrol.distanceRemainingMeters / 1000).toFixed(1)} km</span>
          </div>
        </div>
      )}
    </div>
  );
}
