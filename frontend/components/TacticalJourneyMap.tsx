// frontend/components/TacticalJourneyMap.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { SimulationState, STAGES } from "../state/simulationTimeline";
import { fetchRoadRoute, RouteResult, PatrolTick, createPatrolAnimator, LatLng } from "../utils/roadRouter";

// Coordinate constants
const CHENNAI: LatLng = { lat: 13.0827, lng: 80.2707 };
const PUNE: LatLng = { lat: 18.5204, lng: 73.8567 };
const MARGAO: LatLng = { lat: 15.2993, lng: 73.8180 };
const GOA_ATM: LatLng = { lat: 15.5212, lng: 73.7699 };
const PCR_BASE: LatLng = { lat: 15.5449, lng: 73.7517 };

export default function TacticalJourneyMap({ state }: { state: SimulationState }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersGroupRef = useRef<any>(null);
  const routeLayersGroupRef = useRef<any>(null);
  const patrolMarkerRef = useRef<any>(null);
  const patrolCancelRef = useRef<(() => void) | null>(null);

  const stage = STAGES[state.currentStageIndex];
  const stageId = stage.id;
  const progress = state.stageProgress;

  const [patrolInfo, setPatrolInfo] = useState<PatrolTick | null>(null);
  const [pulseTick, setPulseTick] = useState(0);

  // Animation pulse ticker for smooth continuous 2D flow
  useEffect(() => {
    let animId: number;
    function loop() {
      setPulseTick((prev) => (prev + 0.03) % 1);
      animId = requestAnimationFrame(loop);
    }
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Initialize Leaflet map instance once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Create Leaflet map with 2D orthographic top-down projection
      const map = L.map(mapContainerRef.current, {
        center: [15.2, 77.0],
        zoom: 6,
        zoomControl: false,
        attributionControl: false,
        fadeAnimation: true,
      });

      // High-contrast Esri World Dark Gray Base tiles (100% visible, zero token requirement)
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 16,
          subdomains: ["server", "services"],
        }
      ).addTo(map);

      // Overlay readable city/road reference labels
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 16,
          opacity: 0.75,
        }
      ).addTo(map);

      // Layer groups for clean updates
      const layersGroup = L.layerGroup().addTo(map);
      const routeLayersGroup = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      layersGroupRef.current = layersGroup;
      routeLayersGroupRef.current = routeLayersGroup;

      // Invalidate size on resize
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

  // ResizeObserver to keep canvas sized properly
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

  // Smooth camera panning between interstate corridor and Goa local hub
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (stageId === "origin") {
      mapInstanceRef.current.flyTo([13.0827, 80.2707], 7, { duration: 1.2 });
    } else if (stageId === "peeling") {
      mapInstanceRef.current.flyTo([16.0, 77.0], 6, { duration: 1.2 });
    } else {
      // Stages 3-6: Zoom into Goa Cashout Sector
      mapInstanceRef.current.flyTo([15.535, 73.765], 13, { duration: 1.4 });
    }
  }, [stageId]);

  // Render 2D markers, lines, and layers according to stage and progress
  useEffect(() => {
    if (!mapInstanceRef.current || !layersGroupRef.current) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      const group = layersGroupRef.current;
      if (!map || !group) return;

      group.clearLayers();

      // =========================================================================
      // 1. INCIDENT ORIGIN (v₀ CHENNAI) MARKER
      // =========================================================================
      const originIcon = L.divIcon({
        className: "custom-div-icon",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(255, 170, 0, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 18px; height: 18px; border-radius: 50%; background: #ffaa00; border: 2px solid #ffffff; box-shadow: 0 0 15px #ffaa00; z-index: 10; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 900; color: #000;">v₀</div>
            <div style="margin-top: 6px; white-space: nowrap; background: rgba(10, 15, 29, 0.95); border: 1px solid #ffaa00; padding: 2px 8px; border-radius: 6px; font-family: monospace; font-size: 10px; font-weight: bold; color: #ffaa00; box-shadow: 0 4px 12px rgba(0,0,0,0.8);">
              ${stageId === "origin" ? "Victim v₀: Chennai (₹7.50L Digital Arrest)" : "Chennai (Root v₀)"}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      L.marker([CHENNAI.lat, CHENNAI.lng], { icon: originIcon }).addTo(group);

      // =========================================================================
      // 2. FLAT 2D MONEY FLOW LINES (SLOW SMOOTH MOTION)
      // =========================================================================
      if (stageId !== "origin") {
        const fullPoints: [number, number][] = [
          [CHENNAI.lat, CHENNAI.lng],
          [PUNE.lat, PUNE.lng],
          [MARGAO.lat, MARGAO.lng],
          [GOA_ATM.lat, GOA_ATM.lng],
        ];

        // Background glow line
        L.polyline(fullPoints, {
          color: "#00f0ff",
          weight: 6,
          opacity: 0.2,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(group);

        // Core 2D dashed track
        L.polyline(fullPoints, {
          color: "#00f0ff",
          weight: 3,
          opacity: 0.65,
          dashArray: "8, 12",
          lineCap: "round",
        }).addTo(group);

        // Slow smooth motion: Calculate animated tracer dot position along the 3 hops
        // Combine stageProgress with continuous pulseTick for ultra-smooth fluid movement
        const effectiveProgress = stageId === "peeling" ? progress : pulseTick;
        const totalSegments = fullPoints.length - 1;
        const scaled = effectiveProgress * totalSegments;
        const segIndex = Math.min(Math.floor(scaled), totalSegments - 1);
        const segFraction = scaled - segIndex;

        const pStart = fullPoints[segIndex];
        const pEnd = fullPoints[segIndex + 1];
        const currentLat = pStart[0] + (pEnd[0] - pStart[0]) * segFraction;
        const currentLng = pStart[1] + (pEnd[1] - pStart[1]) * segFraction;

        // Animated 2D pulse head marker traveling along the line
        const tracerIcon = L.divIcon({
          className: "tracer-div-icon",
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background: rgba(0, 240, 255, 0.4); animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #00f0ff; border: 2px solid #ffffff; box-shadow: 0 0 16px #00f0ff;"></div>
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        L.marker([currentLat, currentLng], { icon: tracerIcon }).addTo(group);

        // Intermediate branch pins with peeling amounts
        const branchNodes = [
          { coord: PUNE, bank: "PNB (Pune)", amt: "₹2.50L Peeled" },
          { coord: MARGAO, bank: "ICICI (Margao)", amt: "₹2.40L Peeled" },
        ];

        branchNodes.forEach((node) => {
          const bIcon = L.divIcon({
            className: "branch-div-icon",
            html: `
              <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="width: 10px; height: 10px; border-radius: 50%; background: #00ffaa; border: 2px solid #ffffff; box-shadow: 0 0 8px #00ffaa;"></div>
                <div style="margin-top: 4px; white-space: nowrap; background: rgba(10, 15, 29, 0.9); border: 1px solid #00ffaa; padding: 1px 6px; border-radius: 4px; font-family: monospace; font-size: 9px; color: #00ffaa;">
                  ${node.bank}: ${node.amt}
                </div>
              </div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });
          L.marker([node.coord.lat, node.coord.lng], { icon: bIcon }).addTo(group);
        });
      }

      // =========================================================================
      // 3. TARGET ATM (GOA) MARKER WITH SEC 106 BNSS SHIELD BADGE
      // =========================================================================
      if (stageId !== "origin") {
        const atmIcon = L.divIcon({
          className: "atm-div-icon",
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
              <!-- Expanding 2D Radar Ping -->
              <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; border: 2px solid #ff0055; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              
              <!-- Core ATM Pin -->
              <div style="width: 22px; height: 22px; border-radius: 50%; background: #ff0055; border: 2px solid #ffffff; box-shadow: 0 0 16px #ff0055; z-index: 10; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; color: #ffffff;">ATM</div>
              
              <!-- Terminal Label -->
              <div style="margin-top: 4px; white-space: nowrap; background: rgba(10, 15, 29, 0.92); border: 1px solid #ff0055; padding: 2px 8px; border-radius: 6px; font-family: monospace; font-size: 10px; font-weight: bold; color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.8);">
                SBI Calangute Market Kiosk (#042)
              </div>

              <!-- Sec 106 BNSS Card Lock Shield Banner -->
              <div style="margin-top: 3px; white-space: nowrap; background: rgba(5, 30, 20, 0.95); border: 1px solid #00ffaa; padding: 2px 8px; border-radius: 6px; font-family: monospace; font-size: 9px; font-weight: bold; color: #00ffaa; box-shadow: 0 0 10px rgba(0,255,170,0.3);">
                🛡 CARD SESSION FROZEN (Sec 106 BNSS) • Kiosk 100% Public
              </div>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });

        L.marker([GOA_ATM.lat, GOA_ATM.lng], { icon: atmIcon }).addTo(group);
      }

      // =========================================================================
      // 4. UBER H3 HEXAGON HOTSPOT OVERLAY (STAGES 4, 5, 6)
      // =========================================================================
      if (stageId === "ml_forecast" || stageId === "shap_statutory" || stageId === "interdiction") {
        // High-precision H3 resolution 8 hexagon boundary around Calangute
        const hexCoords: [number, number][] = [
          [15.534, 73.755],
          [15.542, 73.765],
          [15.538, 73.782],
          [15.523, 73.786],
          [15.512, 73.774],
          [15.516, 73.758],
        ];

        // 2D flat hexagon with glowing red boundary and soft fill
        L.polygon(hexCoords, {
          color: "#ff0055",
          weight: 2,
          opacity: 0.9,
          fillColor: "#ff0055",
          fillOpacity: 0.18,
          dashArray: "4, 6",
        }).addTo(group);

        // H3 Cell HUD Pill
        const h3Label = L.divIcon({
          className: "h3-hud-icon",
          html: `
            <div style="background: rgba(10, 15, 29, 0.9); border: 1px solid #ff0055; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 9px; font-weight: bold; color: #ff0055;">
              H3 Res 8: 886196a52ffffff (88.4% Confidence)
            </div>
          `,
          iconSize: [160, 20],
          iconAnchor: [80, 10],
        });
        L.marker([15.542, 73.770], { icon: h3Label }).addTo(group);
      }
    });
  }, [stageId, progress, pulseTick]);

  // =========================================================================
  // 5. ROAD-NETWORK PATROL CAR INTERCEPTION (STAGE 6)
  // =========================================================================
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLayersGroupRef.current) return;

    if (stageId !== "interdiction") {
      if (patrolCancelRef.current) {
        patrolCancelRef.current();
        patrolCancelRef.current = null;
      }
      routeLayersGroupRef.current.clearLayers();
      patrolMarkerRef.current = null;
      setPatrolInfo(null);
      return;
    }

    let isMounted = true;

    import("leaflet").then(async (L) => {
      const map = mapInstanceRef.current;
      const group = routeLayersGroupRef.current;
      if (!map || !group || !isMounted) return;

      group.clearLayers();

      // Fetch real road polyline from OSRM (or offline fallback)
      const route: RouteResult = await fetchRoadRoute(PCR_BASE, GOA_ATM);
      if (!isMounted) return;

      // Draw 2D road route polyline
      const latLngs: [number, number][] = route.coordinates.map((c) => [c.lat, c.lng]);

      L.polyline(latLngs, {
        color: "#00ffaa",
        weight: 5,
        opacity: 0.85,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(group);

      // PCR Base Station Pin
      const pcrBaseIcon = L.divIcon({
        className: "pcr-base-icon",
        html: `
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #00f0ff; border: 2px solid #ffffff; box-shadow: 0 0 10px #00f0ff;"></div>
            <div style="margin-top: 4px; white-space: nowrap; background: rgba(10, 15, 29, 0.9); border: 1px solid #00f0ff; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 9px; color: #00f0ff; font-weight: bold;">
              PCR Base Station (Beat-3)
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker([PCR_BASE.lat, PCR_BASE.lng], { icon: pcrBaseIcon }).addTo(group);

      // Patrol car marker
      const createCarIcon = (bearingDeg: number) =>
        L.divIcon({
          className: "car-div-icon",
          html: `
            <div style="transform: rotate(${bearingDeg}deg); font-size: 26px; filter: drop-shadow(0 0 12px rgba(0, 255, 170, 0.9));">
              🚓
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

      // Start road animator in slow smooth motion (35 km/h)
      patrolCancelRef.current = createPatrolAnimator(route, 35, (tick) => {
        if (!isMounted) return;
        setPatrolInfo(tick);

        if (!patrolMarkerRef.current) {
          patrolMarkerRef.current = L.marker([tick.position.lat, tick.position.lng], {
            icon: createCarIcon(tick.bearingDeg),
            zIndexOffset: 1000,
          }).addTo(group);
        } else {
          patrolMarkerRef.current.setLatLng([tick.position.lat, tick.position.lng]);
          patrolMarkerRef.current.setIcon(createCarIcon(tick.bearingDeg));
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
  }, [stageId]);

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden border border-tactical-border/40 bg-tactical-bg shadow-2xl">
      {/* Real 2D Leaflet Map Container */}
      <div ref={mapContainerRef} className="h-full w-full z-0" id="tactical-simulation-map" />

      {/* Floating Stage Header Badge */}
      <div className="absolute top-3 left-3 z-[1000] rounded-md bg-black/85 border border-tactical-border/50 px-3 py-1.5 text-[11px] font-mono text-tactical-border shadow-2xl flex items-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-tactical-border animate-ping" />
        <span className="font-bold">
          Stage {stage.index}/6: {stage.label} · {(progress * 100).toFixed(0)}%
        </span>
      </div>

      {/* 2D Line Mode Indicator */}
      <div className="absolute top-3 right-3 z-[1000] rounded-md bg-black/85 border border-white/10 px-2.5 py-1 text-[10px] font-mono text-slate-300 shadow-xl flex items-center space-x-2">
        <span className="w-1.5 h-1.5 rounded-full bg-tactical-green" />
        <span>2D Tactical Surface Mode • Smooth Flow</span>
      </div>

      {/* Patrol telemetry HUD (Stage 6) */}
      {stageId === "interdiction" && patrolInfo && (
        <div className="absolute bottom-4 left-4 z-[1000] rounded-lg bg-black/90 border border-tactical-green/60 px-4 py-2.5 font-mono text-xs text-tactical-green shadow-2xl flex items-center space-x-3">
          <span className="w-2 h-2 rounded-full bg-tactical-green animate-pulse" />
          <span>
            Patrol Speed {patrolInfo.speedKmh} km/h · {(patrolInfo.distanceRemainingMeters / 1000).toFixed(2)} km remaining · ETA{" "}
            {Math.round(patrolInfo.etaSeconds / 60)}m {Math.round(patrolInfo.etaSeconds % 60)}s
          </span>
        </div>
      )}
    </div>
  );
}
