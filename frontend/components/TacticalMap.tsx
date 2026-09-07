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
  const [showMlHeatmap, setShowMlHeatmap] = useState(true);
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
    showMlHeatmap,
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

            // Regional ML Risk Heatmap Field across Delhi-NCR
            if (showMlHeatmap) {
              const REGIONAL_HEAT_NODES = [
                { h3: "883da11701fffff", name: "Karol Bagh Corridor", risk: 0.745, color: "#F97316" },
                { h3: "883da11059fffff", name: "Connaught Place Financial Ring", risk: 0.620, color: "#F59E0B" },
                { h3: "883da11205fffff", name: "Dwarka Sector 10 ATM Hub", risk: 0.582, color: "#F59E0B" },
                { h3: "883da11663fffff", name: "Noida Sector 18 Kiosks", risk: 0.490, color: "#00F0FF" },
                { h3: "883da11327fffff", name: "Gurugram Cyber Hub", risk: 0.465, color: "#00F0FF" },
              ];

              REGIONAL_HEAT_NODES.forEach((node) => {
                try {
                  const nodeBoundary = cellToBoundary(node.h3);
                  const nodePoly = L.polygon(nodeBoundary, {
                    color: node.color,
                    weight: 1.5,
                    fillColor: node.color,
                    fillOpacity: 0.28,
                    dashArray: "3, 3",
                  }).addTo(map);

                  nodePoly.bindTooltip(
                    `<div class="font-mono text-xs"><strong>ML FORECAST: ${node.name}</strong><br/>Cell: ${node.h3}<br/>Risk: ${(node.risk * 100).toFixed(1)}%</div>`,
                    { className: "tactical-tooltip" }
                  );
                  newPolygons.push(nodePoly);
                } catch {
                  // ignore
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

      // Target ATM Kiosk location (centered inside target H3 cell)
      const atmCoord: [number, number] = [targetCoord[0], targetCoord[1]];

      // Symmetrically centered ATM Marker
      const atmRadarIcon = L.divIcon({
        className: "custom-atm-marker",
        html: `
          <div class="relative w-10 h-10 flex items-center justify-center pointer-events-none">
            <!-- Pulsing outer radar waves -->
            <div class="absolute w-10 h-10 rounded-full border border-red-500/80 animate-ping opacity-60"></div>
            <div class="absolute w-7 h-7 rounded-full border border-red-500 animate-pulse opacity-80"></div>
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
        iconSize: [40, 40],
        iconAnchor: [20, 20],
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

      // 3. Police Patrol Car (PCR-North-14) with Realistic Street Corridor Intercept Route
      // Road network geometry from Beat-14 Post through Outer Ring Rd, Bhagwan Mahavir Marg, Vishram Chowk to Sector 7 ATM
      const roadWaypoints: { coord: [number, number]; label: string }[] = [
        { coord: [atmCoord[0] - 0.0240, atmCoord[1] - 0.0260], label: "Beat-14 Dispatch Station" },
        { coord: [atmCoord[0] - 0.0195, atmCoord[1] - 0.0250], label: "Outer Ring Rd Feeder" },
        { coord: [atmCoord[0] - 0.0160, atmCoord[1] - 0.0195], label: "Sector 3-4 Junction" },
        { coord: [atmCoord[0] - 0.0118, atmCoord[1] - 0.0142], label: "Bhagwan Mahavir Roundabout" },
        { coord: [atmCoord[0] - 0.0075, atmCoord[1] - 0.0090], label: "Bhagwan Mahavir Marg Arterial" },
        { coord: [atmCoord[0] - 0.0040, atmCoord[1] - 0.0048], label: "Vishram Chowk Junction" },
        { coord: [atmCoord[0] - 0.0018, atmCoord[1] - 0.0022], label: "Sector 7 Commercial Avenue" },
        { coord: [atmCoord[0], atmCoord[1]], label: "Target ATM Kiosk Forecourt" },
      ];

      // Calculate accurate road distances along corridor segments
      const segmentLengths: number[] = [];
      const cumDistances: number[] = [0];

      for (let i = 0; i < roadWaypoints.length - 1; i++) {
        const p1 = roadWaypoints[i].coord;
        const p2 = roadWaypoints[i + 1].coord;
        const dLat = (p2[0] - p1[0]) * 111.0;
        const dLon = (p2[1] - p1[1]) * 98.0;
        const dist = Math.sqrt(dLat * dLat + dLon * dLon);
        segmentLengths.push(dist);
        cumDistances.push(cumDistances[i] + dist);
      }

      const totalRouteKm = cumDistances[cumDistances.length - 1];

      // Interpolate patrol car along the realistic street corridor
      const clampedProgress = Math.max(0, Math.min(0.96, patrolProgress));
      const targetDistance = clampedProgress * totalRouteKm;

      let activeSegmentIndex = 0;
      for (let i = 0; i < cumDistances.length - 1; i++) {
        if (targetDistance >= cumDistances[i] && targetDistance <= cumDistances[i + 1]) {
          activeSegmentIndex = i;
          break;
        }
      }

      const segStartDist = cumDistances[activeSegmentIndex];
      const segLength = segmentLengths[activeSegmentIndex] || 0.001;
      const segRatio = Math.max(0, Math.min(1, (targetDistance - segStartDist) / segLength));

      const pStart = roadWaypoints[activeSegmentIndex].coord;
      const pEnd = roadWaypoints[activeSegmentIndex + 1].coord;

      const currentCarCoord: [number, number] = [
        pStart[0] + (pEnd[0] - pStart[0]) * segRatio,
        pStart[1] + (pEnd[1] - pStart[1]) * segRatio,
      ];

      // Accurate remaining road distance and dynamic emergency ETA
      const remainingDistKm = Math.max(0.1, totalRouteKm - targetDistance);
      // Emergency ERSS-112 speed ~38 km/h + 8s per junction turn
      const remainingJunctions = roadWaypoints.length - 1 - activeSegmentIndex;
      const junctionDelayMin = remainingJunctions * (8 / 60);
      const driveTimeMin = (remainingDistKm / 38) * 60;
      const liveEtaMinutes = (driveTimeMin + junctionDelayMin).toFixed(1);

      if (showPatrolRoute) {
        // Origin Station Marker
        const originIcon = L.divIcon({
          className: "custom-origin-marker",
          html: `
            <div class="relative w-6 h-6 flex items-center justify-center">
              <div class="w-3 h-3 rounded-full bg-slate-600 border border-slate-400"></div>
              <div class="absolute -bottom-4 whitespace-nowrap text-[9px] font-mono text-slate-400 bg-black/70 px-1 rounded border border-white/10">
                Beat-14 Post
              </div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        const originMarker = L.marker(roadWaypoints[0].coord, { icon: originIcon }).addTo(map);
        newPolice.push(originMarker);

        // A. Traversed Trail (behind the patrol car): subtle dimmed path along road segments
        const traversedCoords: [number, number][] = [
          ...roadWaypoints.slice(0, activeSegmentIndex + 1).map((w) => w.coord),
          currentCarCoord,
        ];

        const traversedPoly = L.polyline(traversedCoords, {
          color: "#00F0FF",
          weight: 2.5,
          opacity: 0.35,
          dashArray: "3, 6",
        }).addTo(map);
        newRoutes.push(traversedPoly);

        // B. Active Remaining Intercept Route along road network geometry to ATM:
        // Highly visible, glowing, animated electric cyan dashed line
        const remainingRouteCoords: [number, number][] = [
          currentCarCoord,
          ...roadWaypoints.slice(activeSegmentIndex + 1).map((w) => w.coord),
        ];

        const activeRoutePoly = L.polyline(remainingRouteCoords, {
          color: "#00F0FF",
          weight: 3.5,
          dashArray: "6, 6",
          className: "flow-polyline",
        }).addTo(map);
        newRoutes.push(activeRoutePoly);

        // C. Intermediate Road Junction Nodes (Visual feedback of corridor waypoints)
        for (let j = activeSegmentIndex + 1; j < roadWaypoints.length - 1; j++) {
          const juncPt = roadWaypoints[j];
          const juncMarker = L.circleMarker(juncPt.coord, {
            radius: 3.5,
            color: "#00F0FF",
            weight: 1.5,
            fillColor: "#0B0F17",
            fillOpacity: 0.9,
          }).addTo(map);
          juncMarker.bindTooltip(
            `<div class="font-mono text-[10px] text-cyan-300"><strong>${juncPt.label}</strong><br/>Corridor Waypoint</div>`,
            { className: "tactical-tooltip", direction: "top" }
          );
          newRoutes.push(juncMarker);
        }

        // Symmetrically centered Police Car DivIcon with live route telemetry badge
        const policeCarIcon = L.divIcon({
          className: "custom-pcr-marker",
          html: `
            <div class="relative w-10 h-10 flex items-center justify-center">
              <!-- Floating live ETA badge (centered directly above the car) -->
              <div class="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 px-2 py-0.5 rounded bg-[#0E1422]/95 border border-cyan-400/80 shadow-[0_0_14px_rgba(0,240,255,0.45)] text-[10px] font-mono text-cyan-300 font-bold whitespace-nowrap backdrop-blur-md z-30 pointer-events-none">
                <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                <span class="text-white">PCR-North-14</span>
                <span class="text-cyan-500/70">|</span>
                <span class="text-emerald-400">${liveEtaMinutes} min ETA</span>
                <span class="text-slate-400 text-[9px]">(${remainingDistKm.toFixed(1)} km)</span>
              </div>

              <!-- Police Patrol Icon Badge (Centered exactly at coordinate) -->
              <div class="relative z-20 w-8 h-8 rounded-full bg-[#0B0F17] border-2 border-cyan-400 shadow-[0_0_16px_rgba(0,240,255,0.9)] flex items-center justify-center">
                <svg class="w-4 h-4 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.25a1 1 0 0 0-.8.4L2 11l-1.16.86A1 1 0 0 0 0 12.85V16h3"/>
                  <circle cx="6.5" cy="16.5" r="2.5"/>
                  <circle cx="16.5" cy="16.5" r="2.5"/>
                </svg>
              </div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
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
                <span className="w-2 h-2 rounded-sm bg-gradient-to-r from-cyan-400 via-amber-400 to-red-500"></span>
                <span>ML Risk Heatmap Field</span>
              </span>
              <input
                type="checkbox"
                checked={showMlHeatmap}
                onChange={(e) => setShowMlHeatmap(e.target.checked)}
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
          <span>ERSS PCR-North-14 (Street Intercept Corridor)</span>
        </div>
      </div>
    </div>
  );
};
