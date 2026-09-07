"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { cellToBoundary, cellToChildren } from "h3-js";
import {
  Crosshair,
  Layers,
  ZoomIn,
  ZoomOut,
  Radio,
  Shield,
} from "lucide-react";
import { Prediction, BeatUnit } from "../types";

interface TacticalMapProps {
  predictions: Prediction[];
  selectedPrediction: Prediction | null;
  onSelectPrediction: (pred: Prediction) => void;
  beatUnits: BeatUnit[];
  isSimulating?: boolean;
  patrolDispatched?: boolean;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  predictions,
  selectedPrediction,
  onSelectPrediction,
  beatUnits,
  isSimulating,
  patrolDispatched,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const lastFlownComplaintIdRef = useRef<string | null>(null);

  // Floating controls state
  const [h3Resolution, setH3Resolution] = useState<8 | 9>(8);
  const [showHexagons, setShowHexagons] = useState(true);
  const [showAtmRadar, setShowAtmRadar] = useState(true);
  const [showPatrolRoute, setShowPatrolRoute] = useState(true);
  const [mapCenterInfo, setMapCenterInfo] = useState({
    lat: 28.6139,
    lon: 77.2090,
    zoom: 12,
  });

  // Police car live position for simulated movement
  const [patrolProgress, setPatrolProgress] = useState(0.15); // 0 = origin, 1 = at ATM

  const layersRef = useRef<{
    polygons: any[];
    atms: any[];
    routes: any[];
    police: any[];
  }>({
    polygons: [],
    atms: [],
    routes: [],
    police: [],
  });

  // Recenter map on active prediction target cell
  const handleRecenter = useCallback(() => {
    if (!mapInstanceRef.current || !selectedPrediction) return;
    const targetCell = selectedPrediction.primary_target_cell;
    if (targetCell?.lat && targetCell?.lon) {
      mapInstanceRef.current.flyTo([targetCell.lat, targetCell.lon], 13.5, {
        duration: 0.8,
      });
    }
  }, [selectedPrediction]);

  // Handle Zoom In/Out manually
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };
  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  // Police car movement animation when dispatched or simulating
  useEffect(() => {
    if (!patrolDispatched && !isSimulating) {
      setPatrolProgress(0.15);
      return;
    }

    const interval = setInterval(() => {
      setPatrolProgress((prev) => {
        if (prev >= 0.85) return 0.85;
        return prev + 0.05;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [patrolDispatched, isSimulating]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    let isCancelled = false;

    import("leaflet").then((L) => {
      if (isCancelled || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [28.6250, 77.1650],
        zoom: 12,
        zoomControl: false, // We provide custom floating glass controls
        attributionControl: false,
      });

      // Esri World Dark Gray Canvas (High contrast, defense command center aesthetic, zero watermarks)
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 16,
        }
      ).addTo(map);

      map.on("moveend", () => {
        const center = map.getCenter();
        setMapCenterInfo({
          lat: parseFloat(center.lat.toFixed(4)),
          lon: parseFloat(center.lng.toFixed(4)),
          zoom: map.getZoom(),
        });
      });

      mapInstanceRef.current = map;
      renderLayers(L);
    });

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle container resize
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Re-render layers when data, resolution, or toggles change
  const activeTargetHex = selectedPrediction?.primary_target_cell?.h3_res8 || selectedPrediction?.target_h3_res8;
  const selectedComplaintId = selectedPrediction?.complaint_id || "";

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import("leaflet").then((L) => {
      renderLayers(L);
    });
  }, [
    predictions.length,
    selectedComplaintId,
    activeTargetHex,
    h3Resolution,
    showHexagons,
    showAtmRadar,
    showPatrolRoute,
    patrolProgress,
    beatUnits.length,
  ]);

  // Smooth camera fly-to when complaint selection changes
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedPrediction) return;

    if (lastFlownComplaintIdRef.current === selectedPrediction.complaint_id) {
      return;
    }

    lastFlownComplaintIdRef.current = selectedPrediction.complaint_id;
    const targetCell = selectedPrediction.primary_target_cell;
    if (targetCell?.lat && targetCell?.lon) {
      mapInstanceRef.current.flyTo([targetCell.lat, targetCell.lon], 13.5, {
        duration: 1.0,
      });
    }
  }, [selectedPrediction?.complaint_id]);

  // Main layer render pipeline
  const renderLayers = (L: any) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const { polygons, atms, routes, police } = layersRef.current;
    polygons.forEach((p) => map.removeLayer(p));
    atms.forEach((a) => map.removeLayer(a));
    routes.forEach((r) => map.removeLayer(r));
    police.forEach((u) => map.removeLayer(u));

    const newPolygons: any[] = [];
    const newAtms: any[] = [];
    const newRoutes: any[] = [];
    const newPolice: any[] = [];

    const activePred = selectedPrediction || predictions[0];
    const targetCell = activePred?.primary_target_cell;
    const targetCoord: [number, number] = targetCell?.lat && targetCell?.lon
      ? [targetCell.lat, targetCell.lon]
      : [28.7041, 77.1025]; // Default Rohini sector

    // 1. Uber H3 Hexagon Layer (Res 8 & Res 9 with smooth opacity gradients)
    if (showHexagons && activePred) {
      const h8 = targetCell?.h3_res8 || activePred.target_h3_res8;
      if (h8) {
        try {
          if (h3Resolution === 8) {
            // High-Risk Cashout Cluster (Crimson #EF4444)
            const boundary8 = cellToBoundary(h8);
            const poly8 = L.polygon(boundary8, {
              color: "#EF4444",
              weight: 2.5,
              fillColor: "#EF4444",
              fillOpacity: 0.35,
            }).addTo(map);

            poly8.bindTooltip(
              `<div class="font-mono text-xs"><strong>PRIMARY CASHOUT HEXAGON (RES 8)</strong><br/>Cell: ${h8}<br/>Confidence: ${((activePred.confidence_score || 0.88) * 100).toFixed(0)}%</div>`,
              { className: "tactical-tooltip", permanent: false }
            );
            poly8.on("click", () => onSelectPrediction(activePred));
            newPolygons.push(poly8);

            // Buffer zones (Amber #F59E0B) for adjacent clusters
            if (activePred.top_3_spatial_clusters) {
              activePred.top_3_spatial_clusters.slice(1).forEach((cluster) => {
                if (cluster.h3_res8) {
                  try {
                    const bufBoundary = cellToBoundary(cluster.h3_res8);
                    const bufPoly = L.polygon(bufBoundary, {
                      color: "#F59E0B",
                      weight: 1.5,
                      fillColor: "#F59E0B",
                      fillOpacity: 0.15,
                      dashArray: "4, 4",
                    }).addTo(map);
                    newPolygons.push(bufPoly);
                  } catch {
                    // ignore
                  }
                }
              });
            }
          } else {
            // Resolution 9 Granular Sub-Hexagons
            try {
              const children9 = cellToChildren(h8, 9);
              children9.slice(0, 7).forEach((childHex: string, idx: number) => {
                const childBoundary = cellToBoundary(childHex);
                const isTargetSub = idx === 0 || idx === 1;
                const poly9 = L.polygon(childBoundary, {
                  color: isTargetSub ? "#EF4444" : "#F59E0B",
                  weight: isTargetSub ? 2 : 1,
                  fillColor: isTargetSub ? "#EF4444" : "#F59E0B",
                  fillOpacity: isTargetSub ? 0.4 : 0.12,
                }).addTo(map);

                poly9.bindTooltip(
                  `<div class="font-mono text-xs"><strong>GRANULAR KIOSK CELL (RES 9)</strong><br/>Sub-cell: ${childHex}</div>`,
                  { className: "tactical-tooltip" }
                );
                newPolygons.push(poly9);
              });
            } catch (e) {
              console.warn("H3 Res 9 subdivision notice:", e);
            }
          }
        } catch (e) {
          console.warn("H3 rendering notice:", e);
        }
      }
    }

    // 2. Target ATM Kiosk Icon with glowing radar radius
    if (showAtmRadar && activePred) {
      const atms = activePred.candidate_atms || targetCell?.candidate_terminals || [];
      const primaryAtm = atms[0] || {
        terminal_id: "ATM-DL-ROH-082",
        bank: "HDFC Bank Offsite Kiosk",
        address: "Sector 7, Rohini Hub",
        lat: targetCoord[0],
        lon: targetCoord[1],
        current_cash: 250000,
      };

      const atmCoord: [number, number] = [primaryAtm.lat, primaryAtm.lon];

      // Pulsing Radar Ring Icon
      const atmRadarIcon = L.divIcon({
        className: "custom-atm-marker",
        html: `
          <div class="relative flex items-center justify-center w-12 h-12 -ml-6 -mt-6 pointer-events-none">
            <!-- Pulsing outer waves -->
            <div class="absolute w-12 h-12 rounded-full border border-red-500/70 animate-ping opacity-60"></div>
            <div class="absolute w-8 h-8 rounded-full border border-red-500 animate-pulse opacity-80"></div>
            <!-- Center ATM core pin -->
            <div class="relative z-10 w-6 h-6 rounded-md bg-red-600 border border-red-300 shadow-[0_0_16px_rgba(239,68,68,0.9)] flex items-center justify-center pointer-events-auto">
              <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <rect x="3" y="4" width="18" height="16" rx="2"/>
                <line x1="7" y1="8" x2="17" y2="8"/>
                <line x1="7" y1="12" x2="11" y2="12"/>
                <line x1="13" y1="12" x2="17" y2="12"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const atmMarker = L.marker(atmCoord, { icon: atmRadarIcon }).addTo(map);
      atmMarker.bindPopup(
        `
        <div style="font-family: ui-monospace, monospace; font-size: 11px; color: #F8FAFC; padding: 2px;">
          <div style="color: #00F0FF; font-weight: bold; font-size: 12px; margin-bottom: 2px;">TARGET DISPENSER KIOSK</div>
          <div><strong>ID:</strong> ${primaryAtm.terminal_id}</div>
          <div><strong>Entity:</strong> ${primaryAtm.bank}</div>
          <div><strong>Location:</strong> ${primaryAtm.address}</div>
          <div style="margin-top: 4px; color: #EF4444; font-weight: bold;">[INTERCEPTION TARGET ACTIVE]</div>
        </div>
        `,
        { className: "tactical-popup" }
      );
      newAtms.push(atmMarker);

      // 3. Police Patrol Car (PCR-North-14) with Route Polyline & Live Floating ETA Tag
      // Police Origin: Rohini Sector 3 Patrol Post
      const policeOrigin: [number, number] = [
        targetCoord[0] - 0.024,
        targetCoord[1] - 0.028,
      ];

      // Route waypoint intermediate
      const waypoint: [number, number] = [
        targetCoord[0] - 0.010,
        targetCoord[1] - 0.014,
      ];

      if (showPatrolRoute) {
        // Route polyline from police car to ATM
        const routeCoords: [number, number][] = [policeOrigin, waypoint, atmCoord];
        const routePoly = L.polyline(routeCoords, {
          color: "#00F0FF",
          weight: 3,
          dashArray: "8, 8",
          className: "flow-polyline",
        }).addTo(map);
        newRoutes.push(routePoly);

        // Interpolate live car coordinate based on progress
        const currentCarCoord: [number, number] =
          patrolProgress <= 0.5
            ? [
                policeOrigin[0] + (waypoint[0] - policeOrigin[0]) * (patrolProgress * 2),
                policeOrigin[1] + (waypoint[1] - policeOrigin[1]) * (patrolProgress * 2),
              ]
            : [
                waypoint[0] + (atmCoord[0] - waypoint[0]) * ((patrolProgress - 0.5) * 2),
                waypoint[1] + (atmCoord[1] - waypoint[1]) * ((patrolProgress - 0.5) * 2),
              ];

        // Police Car DivIcon with live floating ETA tag
        const policeCarIcon = L.divIcon({
          className: "custom-pcr-marker",
          html: `
            <div class="relative flex items-center justify-center -ml-16 -mt-8">
              <!-- Floating live ETA badge -->
              <div class="absolute -top-7 flex items-center space-x-1 px-2 py-0.5 rounded bg-[#0E1422]/90 border border-cyan-400/60 shadow-[0_0_10px_rgba(0,240,255,0.3)] text-[10px] font-mono text-cyan-300 font-bold whitespace-nowrap backdrop-blur-md">
                <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                <span>PCR-North-14</span>
                <span class="text-white">|</span>
                <span class="text-emerald-400">${(3.8 * (1 - patrolProgress * 0.7)).toFixed(1)} min ETA</span>
              </div>
              <!-- Police Patrol Icon Badge -->
              <div class="w-8 h-8 rounded-full bg-cyan-500/20 border-2 border-cyan-400 shadow-[0_0_14px_rgba(0,240,255,0.8)] flex items-center justify-center bg-[#0B0F17]">
                <svg class="w-4 h-4 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.25a1 1 0 0 0-.8.4L2 11l-1.16.86A1 1 0 0 0 0 12.85V16h3"/>
                  <circle cx="6.5" cy="16.5" r="2.5"/>
                  <circle cx="16.5" cy="16.5" r="2.5"/>
                </svg>
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const pcrMarker = L.marker(currentCarCoord, { icon: policeCarIcon }).addTo(map);
        newPolice.push(pcrMarker);
      }
    }

    layersRef.current = {
      polygons: newPolygons,
      atms: newAtms,
      routes: newRoutes,
      police: newPolice,
    };
  };

  return (
    <div className="relative w-full h-full bg-[#0B0F17] overflow-hidden">
      {/* Map DOM Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" id="geospatial-stage" />

      {/* Floating Glassmorphism Controls (Anchored Top-Right with ample padding) */}
      <div className="absolute top-5 right-5 z-[1000] flex flex-col items-end space-y-2.5 pointer-events-auto">
        {/* Coordinate / Status Card */}
        <div className="glass-panel px-3 py-1.5 rounded-lg flex items-center space-x-3 text-xs font-mono text-slate-300 shadow-xl">
          <div className="flex items-center space-x-1.5">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span className="text-cyan-400 font-semibold">GRID:</span>
            <span>NCR {mapCenterInfo.lat}°N, {mapCenterInfo.lon}°E</span>
          </div>

          <span className="text-slate-600">|</span>

          {/* Recenter Button */}
          <button
            onClick={handleRecenter}
            className="px-2 py-0.5 rounded bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono flex items-center space-x-1 transition-all active:scale-95"
            title="Recenter Camera on Imminent Target"
          >
            <Crosshair className="w-3 h-3" />
            <span>RECENTER</span>
          </button>
        </div>

        {/* Tactical Controls Palette (Layers + Resolution Slider + Zoom) */}
        <div className="glass-panel p-2.5 rounded-lg flex flex-col space-y-2 shadow-2xl w-56">
          {/* Header */}
          <div className="flex items-center justify-between pb-1 border-b border-white/[0.08] text-[10px] font-mono uppercase tracking-wider text-slate-400">
            <span className="flex items-center space-x-1">
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>Map Layers</span>
            </span>
            <span className="text-cyan-400 font-bold">H3 RES {h3Resolution}</span>
          </div>

          {/* H3 Resolution Toggle Selector */}
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 text-[11px]">H3 Cluster Size:</span>
            <div className="flex items-center bg-black/40 border border-white/[0.08] rounded p-0.5">
              <button
                onClick={() => setH3Resolution(8)}
                className={`px-2 py-0.5 text-[10px] rounded font-bold transition-all ${
                  h3Resolution === 8
                    ? "bg-red-500/30 text-red-300 border border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Res 8 (~0.7km²)
              </button>
              <button
                onClick={() => setH3Resolution(9)}
                className={`px-2 py-0.5 text-[10px] rounded font-bold transition-all ${
                  h3Resolution === 9
                    ? "bg-amber-500/30 text-amber-300 border border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Res 9 (~0.1km²)
              </button>
            </div>
          </div>

          {/* Layer Quick Toggles */}
          <div className="space-y-1.5 pt-1 text-[11px] font-mono text-slate-300">
            <label className="flex items-center justify-between cursor-pointer hover:text-white">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-sm bg-red-500"></span>
                <span>H3 Hexagon Clusters</span>
              </span>
              <input
                type="checkbox"
                checked={showHexagons}
                onChange={(e) => setShowHexagons(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer hover:text-white">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span>ATM Radar Beacon</span>
              </span>
              <input
                type="checkbox"
                checked={showAtmRadar}
                onChange={(e) => setShowAtmRadar(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer hover:text-white">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span>PCR-14 Intercept Route</span>
              </span>
              <input
                type="checkbox"
                checked={showPatrolRoute}
                onChange={(e) => setShowPatrolRoute(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
              />
            </label>
          </div>

          {/* Zoom Buttons */}
          <div className="flex items-center justify-between pt-1 border-t border-white/[0.08]">
            <span className="text-[10px] font-mono text-slate-400">Zoom Level: {mapCenterInfo.zoom}</span>
            <div className="flex items-center space-x-1">
              <button
                onClick={handleZoomIn}
                className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom-Left Tactical Legend */}
      <div className="absolute bottom-5 left-5 z-[1000] pointer-events-auto glass-panel p-3 rounded-lg text-xs font-mono shadow-2xl space-y-1.5 max-w-xs">
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center space-x-1.5">
          <Shield className="w-3 h-3 text-cyan-400" />
          <span>Tactical Map Legend</span>
        </div>
        <div className="flex items-center space-x-2 text-[11px] text-slate-300">
          <span className="w-3 h-3 rounded-sm bg-red-500/50 border border-red-500" />
          <span>High-Risk Cashout Cluster (P &ge; 70%)</span>
        </div>
        <div className="flex items-center space-x-2 text-[11px] text-slate-300">
          <span className="w-3 h-3 rounded-sm bg-amber-500/40 border border-amber-500" />
          <span>Buffer Spatial Zone (P &lt; 70%)</span>
        </div>
        <div className="flex items-center space-x-2 text-[11px] text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00F0FF]" />
          <span>ERSS PCR-North-14 (3.8 min ETA)</span>
        </div>
      </div>
    </div>
  );
};
