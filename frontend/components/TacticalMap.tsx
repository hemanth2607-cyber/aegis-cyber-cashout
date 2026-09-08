// frontend/components/TacticalMap.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { fetchRoadRoute, RouteResult, PatrolTick, createPatrolAnimator, LatLng } from "../utils/roadRouter";

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersGroupRef = useRef<any>(null);
  const patrolGroupRef = useRef<any>(null);
  const patrolCancelRef = useRef<(() => void) | null>(null);

  const [patrolInfo, setPatrolInfo] = useState<PatrolTick | null>(null);
  const [pulseTick, setPulseTick] = useState(0);

  // Smooth continuous flow ticker
  useEffect(() => {
    let animId: number;
    function loop() {
      setPulseTick((prev) => (prev + 0.04) % 1);
      animId = requestAnimationFrame(loop);
    }
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [suspectAtm?.lat || 15.5212, suspectAtm?.lng || 73.7699],
        zoom: 12.5,
        zoomControl: false,
        attributionControl: false,
        fadeAnimation: true,
      });

      // Esri World Dark Gray Canvas Base (100% reliable, zero tokens)
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 16,
          subdomains: ["server", "services"],
        }
      ).addTo(map);

      // Esri Reference Labels
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 16,
          opacity: 0.75,
        }
      ).addTo(map);

      const layersGroup = L.layerGroup().addTo(map);
      const patrolGroup = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      layersGroupRef.current = layersGroup;
      patrolGroupRef.current = patrolGroup;

      setTimeout(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
      }, 200);
    });

    return () => {
      isMounted = false;
      if (patrolCancelRef.current) {
        patrolCancelRef.current();
        patrolCancelRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // ResizeObserver for canvas integrity
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const ro = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    ro.observe(mapContainerRef.current);
    return () => ro.disconnect();
  }, []);

  // Recenter if suspect coordinates update
  useEffect(() => {
    if (!mapInstanceRef.current || !suspectAtm?.lat || !suspectAtm?.lng) return;
    mapInstanceRef.current.panTo([suspectAtm.lat, suspectAtm.lng], { animate: true, duration: 1.0 });
  }, [suspectAtm?.lat, suspectAtm?.lng]);

  // Render 2D layers (Markers, 2D lines, H3 Hexagons)
  useEffect(() => {
    if (!mapInstanceRef.current || !layersGroupRef.current) return;

    import("leaflet").then((L) => {
      const group = layersGroupRef.current;
      if (!group) return;

      group.clearLayers();

      // 1. Origin Marker
      if (originMarker) {
        const originIcon = L.divIcon({
          className: "origin-icon",
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
              <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(251, 191, 36, 0.4); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 18px; height: 18px; border-radius: 50%; background: #f59e0b; border: 2px solid #ffffff; box-shadow: 0 0 12px #f59e0b; z-index: 10; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 900; color: #000;">v₀</div>
              <div style="margin-top: 4px; white-space: nowrap; background: rgba(10, 15, 29, 0.95); border: 1px solid #f59e0b; padding: 1px 6px; border-radius: 4px; font-family: monospace; font-size: 9px; color: #f59e0b; font-weight: bold;">
                ${originMarker.label || "Victim Root v₀"}
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        L.marker([originMarker.lat, originMarker.lng], { icon: originIcon }).addTo(group);
      }

      // 2. 2D Fund Flow Lines
      if (fundFlow && fundFlow.length > 0) {
        fundFlow.forEach((hop) => {
          const p1: [number, number] = [hop.from[1], hop.from[0]];
          const p2: [number, number] = [hop.to[1], hop.to[0]];

          // Glow base line
          L.polyline([p1, p2], {
            color: "#00f0ff",
            weight: 5,
            opacity: 0.25,
            lineCap: "round",
          }).addTo(group);

          // Core 2D dashed track
          L.polyline([p1, p2], {
            color: "#00f0ff",
            weight: 3,
            opacity: 0.75,
            dashArray: "6, 10",
            lineCap: "round",
          }).addTo(group);

          // Moving 2D tracer pulse
          const curLat = p1[0] + (p2[0] - p1[0]) * pulseTick;
          const curLng = p1[1] + (p2[1] - p1[1]) * pulseTick;

          const tracerIcon = L.divIcon({
            className: "tracer-node",
            html: `
              <div style="width: 10px; height: 10px; border-radius: 50%; background: #00f0ff; border: 2px solid #ffffff; box-shadow: 0 0 10px #00f0ff;"></div>
            `,
            iconSize: [10, 10],
            iconAnchor: [5, 5],
          });
          L.marker([curLat, curLng], { icon: tracerIcon }).addTo(group);
        });
      }

      // 3. Suspect Target ATM Marker
      if (suspectAtm) {
        const atmIcon = L.divIcon({
          className: "atm-icon",
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
              <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; border: 2px solid #ef4444; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 22px; height: 22px; border-radius: 50%; background: #ef4444; border: 2px solid #ffffff; box-shadow: 0 0 16px #ef4444; z-index: 10; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; color: #ffffff;">ATM</div>
              
              <div style="margin-top: 4px; white-space: nowrap; background: rgba(10, 15, 29, 0.95); border: 1px solid #ef4444; padding: 2px 8px; border-radius: 6px; font-family: monospace; font-size: 10px; font-weight: bold; color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.8);">
                ${suspectAtm.name || "Target Cashout ATM"}
              </div>

              ${
                suspectAtm.frozen
                  ? `
                <div style="margin-top: 3px; white-space: nowrap; background: rgba(5, 30, 20, 0.95); border: 1px solid #10b981; padding: 2px 8px; border-radius: 6px; font-family: monospace; font-size: 9px; font-weight: bold; color: #10b981; box-shadow: 0 0 10px rgba(16,185,129,0.4);">
                  🛡 CARD SESSION FROZEN (Sec 106 BNSS) • Kiosk 100% Public
                </div>
              `
                  : ""
              }
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });
        L.marker([suspectAtm.lat, suspectAtm.lng], { icon: atmIcon }).addTo(group);
      }

      // 4. H3 Hexagon Clusters
      if (hotspotH3Indices && hotspotH3Indices.length > 0) {
        const hexCoords: [number, number][] = [
          [15.534, 73.755],
          [15.542, 73.765],
          [15.538, 73.782],
          [15.523, 73.786],
          [15.512, 73.774],
          [15.516, 73.758],
        ];

        L.polygon(hexCoords, {
          color: "#ef4444",
          weight: 2,
          opacity: 0.9,
          fillColor: "#ef4444",
          fillOpacity: 0.2,
          dashArray: "4, 6",
        }).addTo(group);
      }
    });
  }, [originMarker, fundFlow, hotspotH3Indices, suspectAtm, pulseTick]);

  // 5. Patrol Dispatch Road Routing
  useEffect(() => {
    if (!mapInstanceRef.current || !patrolGroupRef.current) return;

    if (!dispatchActive) {
      if (patrolCancelRef.current) {
        patrolCancelRef.current();
        patrolCancelRef.current = null;
      }
      patrolGroupRef.current.clearLayers();
      setPatrolInfo(null);
      return;
    }

    let isMounted = true;

    import("leaflet").then(async (L) => {
      const group = patrolGroupRef.current;
      if (!group || !isMounted) return;

      group.clearLayers();

      const origin: LatLng = pcrBase || { lat: 15.5449, lng: 73.7517 };
      const dest: LatLng = suspectAtm || { lat: 15.5212, lng: 73.7699 };

      const route: RouteResult = await fetchRoadRoute(origin, dest);
      if (!isMounted) return;

      const latLngs: [number, number][] = route.coordinates.map((c) => [c.lat, c.lng]);

      // 2D Road track
      L.polyline(latLngs, {
        color: "#10b981",
        weight: 5,
        opacity: 0.85,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(group);

      const carIcon = (bearingDeg: number) =>
        L.divIcon({
          className: "patrol-car-icon",
          html: `
            <div style="transform: rotate(${bearingDeg}deg); font-size: 26px; filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0.9));">
              🚓
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

      let marker: any = null;

      patrolCancelRef.current = createPatrolAnimator(route, 35, (tick) => {
        if (!isMounted) return;
        setPatrolInfo(tick);

        if (!marker) {
          marker = L.marker([tick.position.lat, tick.position.lng], {
            icon: carIcon(tick.bearingDeg),
            zIndexOffset: 1000,
          }).addTo(group);
        } else {
          marker.setLatLng([tick.position.lat, tick.position.lng]);
          marker.setIcon(carIcon(tick.bearingDeg));
        }
      });
    });

    return () => {
      isMounted = false;
      if (patrolCancelRef.current) {
        patrolCancelRef.current();
        patrolCancelRef.current = null;
      }
    };
  }, [dispatchActive, pcrBase, suspectAtm]);

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden border border-white/[0.1] bg-[#070B14] shadow-2xl">
      {/* HUD Top Overlay */}
      <div className="absolute top-4 left-4 z-[1000] flex items-center space-x-3 bg-black/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/[0.12] shadow-xl">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
          </span>
          <span className="font-mono text-xs font-bold tracking-wider text-cyan-300 uppercase">
            2D Tactical Grid
          </span>
        </div>
        <div className="h-4 w-[1px] bg-white/20" />
        <span className="font-mono text-[11px] text-slate-300">
          H3 Res: <span className="text-amber-400 font-bold">{h3Resolution}</span> (~0.7km²)
        </span>
        <div className="h-4 w-[1px] bg-white/20" />
        <span className="font-mono text-[11px] text-slate-300">
          Confidence: <span className="text-emerald-400 font-bold">{(confidenceScore * 100).toFixed(0)}%</span>
        </span>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} className="h-full w-full z-0" id="tactical-command-map" />

      {/* Patrol ETA HUD */}
      {dispatchActive && patrolInfo && (
        <div className="absolute bottom-4 left-4 z-[1000] rounded-xl bg-black/90 border border-emerald-500/50 px-4 py-2.5 font-mono text-xs text-emerald-300 shadow-2xl flex items-center space-x-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            Patrol Speed {patrolInfo.speedKmh} km/h · {(patrolInfo.distanceRemainingMeters / 1000).toFixed(2)} km remaining · ETA{" "}
            {Math.round(patrolInfo.etaSeconds / 60)}m {Math.round(patrolInfo.etaSeconds % 60)}s
          </span>
        </div>
      )}
    </div>
  );
}
