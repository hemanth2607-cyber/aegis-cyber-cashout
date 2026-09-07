"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { cellToBoundary } from "h3-js";
import { Crosshair } from "lucide-react";
import { Prediction, BeatUnit } from "../types";

interface TacticalMapProps {
  predictions: Prediction[];
  selectedPrediction: Prediction | null;
  onSelectPrediction: (pred: Prediction) => void;
  beatUnits: BeatUnit[];
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  predictions,
  selectedPrediction,
  onSelectPrediction,
  beatUnits,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const lastFlownComplaintIdRef = useRef<string | null>(null);
  const [mapCenterInfo, setMapCenterInfo] = useState({
    lat: 28.6139,
    lon: 77.2090,
    zoom: 11,
  });

  const layersRef = useRef<{
    polygons: any[];
    atms: any[];
    flows: any[];
    police: any[];
  }>({
    polygons: [],
    atms: [],
    flows: [],
    police: [],
  });

  // Recenter map on the currently selected prediction
  const handleRecenter = useCallback(() => {
    if (!mapInstanceRef.current || !selectedPrediction) return;
    const targetCell = selectedPrediction.primary_target_cell;
    if (targetCell?.lat && targetCell?.lon) {
      mapInstanceRef.current.flyTo([targetCell.lat, targetCell.lon], 13, {
        duration: 1.0,
      });
    }
  }, [selectedPrediction]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    let isCancelled = false;

    import("leaflet").then((L) => {
      if (isCancelled || !mapContainerRef.current) return;

      // Center on Delhi-NCR
      const map = L.map(mapContainerRef.current, {
        center: [28.6139, 77.2090],
        zoom: 11,
        zoomControl: true,
        attributionControl: false,
      });

      // CartoDB Dark Matter Tiles (Public OpenStreetMap-based tiles, zero API key required)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 18,
        subdomains: "abcd",
      }).addTo(map);

      // Track pan and zoom movements for live HUD coordinates
      map.on("moveend", () => {
        const center = map.getCenter();
        setMapCenterInfo({
          lat: parseFloat(center.lat.toFixed(4)),
          lon: parseFloat(center.lng.toFixed(4)),
          zoom: map.getZoom(),
        });
      });

      mapInstanceRef.current = map;
      renderAllLayers(L);
    });

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Invalidate map size when container width/height changes (e.g. sidebar open/close)
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

  // Memoized layer cache keys so the 1-second countdown tick doesn't tear down & recreate Leaflet layers
  const predictionsSummary = predictions
    .map((p) => `${p.complaint_id}:${p.target_h3_res8}:${p.confidence_score}`)
    .join("|");
  const selectedComplaintId = selectedPrediction?.complaint_id || "";
  const beatUnitsSummary = beatUnits
    .map((u) => `${u.unit_id}:${u.status}`)
    .join("|");

  // Re-render layers ONLY when predictions, selected prediction ID, or beat units actually change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import("leaflet").then((L) => {
      renderAllLayers(L);
    });
  }, [predictionsSummary, selectedComplaintId, beatUnitsSummary]);

  // Smooth camera fly-to ONLY when selected complaint ID changes (prevents snapping back on countdown tick)
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedPrediction) return;

    // Do NOT re-fly if it's the exact same complaint whose countdown seconds simply ticked
    if (lastFlownComplaintIdRef.current === selectedPrediction.complaint_id) {
      return;
    }

    lastFlownComplaintIdRef.current = selectedPrediction.complaint_id;
    const targetCell = selectedPrediction.primary_target_cell;
    if (targetCell?.lat && targetCell?.lon) {
      mapInstanceRef.current.flyTo([targetCell.lat, targetCell.lon], 13, {
        duration: 1.2,
      });
    }
  }, [selectedPrediction?.complaint_id]);

  // Comprehensive layer rendering function
  const renderAllLayers = (L: any) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous layers
    const { polygons, atms, flows, police } = layersRef.current;
    polygons.forEach((p) => map.removeLayer(p));
    atms.forEach((a) => map.removeLayer(a));
    flows.forEach((f) => map.removeLayer(f));
    police.forEach((u) => map.removeLayer(u));

    const newPolygons: any[] = [];
    const newAtms: any[] = [];
    const newFlows: any[] = [];
    const newPolice: any[] = [];

    // =========================================================================
    // LAYER 1: H3 Heatmap Hexagons
    // =========================================================================
    predictions.forEach((pred) => {
      const isSelected = selectedPrediction?.complaint_id === pred.complaint_id;
      const targetCell = pred.primary_target_cell;
      const h8 = targetCell?.h3_res8 || pred.target_h3_res8;

      if (h8) {
        try {
          const boundaryCoords = cellToBoundary(h8); // [[lat, lng], ...]
          const confidence = pred.confidence_score || 0.5;
          const isCrimson = confidence >= 0.70;
          const color = isCrimson ? "#ff0055" : "#ffaa00";

          const poly = L.polygon(boundaryCoords, {
            color: color,
            weight: isSelected ? 3 : 1.5,
            fillColor: color,
            fillOpacity: isSelected ? 0.45 : 0.25,
            dashArray: isSelected ? "" : "4, 4",
          }).addTo(map);

          poly.bindTooltip(
            `<strong>TARGET HEX: ${h8}</strong><br/>Forecast Window: ${pred.remaining_window_minutes ?? pred.window_minutes} mins<br/>Confidence: ${(confidence * 100).toFixed(1)}%`,
            { className: "tactical-tooltip", permanent: false }
          );

          poly.on("click", () => {
            onSelectPrediction(pred);
          });

          newPolygons.push(poly);
        } catch (e) {
          console.warn("[Aegis] Hex boundary error:", e);
        }
      }

      // Also render secondary spatial clusters if present
      if (isSelected && pred.top_3_spatial_clusters) {
        pred.top_3_spatial_clusters.slice(1).forEach((cluster) => {
          if (cluster.h3_res8) {
            try {
              const clusterBoundary = cellToBoundary(cluster.h3_res8);
              const cPoly = L.polygon(clusterBoundary, {
                color: "#00f0ff",
                weight: 1,
                fillColor: "#00f0ff",
                fillOpacity: 0.15,
                dashArray: "2, 4",
              }).addTo(map);
              newPolygons.push(cPoly);
            } catch {
              // ignore
            }
          }
        });
      }
    });

    // =========================================================================
    // LAYER 2: Money Flow Arcs (Victim -> Mule Hops -> Target ATM)
    // =========================================================================
    const activeTarget = selectedPrediction || predictions[0];
    if (activeTarget) {
      const trace = activeTarget.graph_trace;
      const targetCell = activeTarget.primary_target_cell;
      const targetCoord: [number, number] = targetCell
        ? [targetCell.lat, targetCell.lon]
        : [28.6139, 77.2090];

      if (trace && trace.nodes.length > 0) {
        // Draw links between consecutive hops
        trace.edges.forEach((edge) => {
          const fromNode = trace.nodes.find((n) => n.account === edge.from);
          const toNode = trace.nodes.find((n) => n.account === edge.to);
          if (fromNode && toNode) {
            const flowLine = L.polyline(
              [
                [fromNode.lat, fromNode.lon],
                [toNode.lat, toNode.lon],
              ],
              {
                color: "#ffaa00",
                weight: 2.5,
                className: "flow-polyline",
              }
            ).addTo(map);
            newFlows.push(flowLine);
          }
        });

        // Link terminating mule to Target Cell
        const lastNode = trace.nodes[trace.nodes.length - 1];
        if (lastNode) {
          const finalLine = L.polyline(
            [
              [lastNode.lat, lastNode.lon],
              targetCoord,
            ],
            {
              color: "#ff0055",
              weight: 3,
              className: "flow-polyline",
            }
          ).addTo(map);
          newFlows.push(finalLine);
        }
      } else {
        // Fallback default flow arc: Victim (Central Delhi) -> Rohini/Target
        const victimPt: [number, number] = [28.6139, 77.2090];
        const midPt: [number, number] = [
          (victimPt[0] + targetCoord[0]) / 2 + 0.015,
          (victimPt[1] + targetCoord[1]) / 2 - 0.02,
        ];
        const defaultFlow = L.polyline([victimPt, midPt, targetCoord], {
          color: "#ff0055",
          weight: 2.5,
          className: "flow-polyline",
        }).addTo(map);
        newFlows.push(defaultFlow);
      }
    }

    // =========================================================================
    // LAYER 3: Target High-Risk ATM Pins (with Radar-Ping Animation)
    // =========================================================================
    predictions.forEach((pred) => {
      const isSelected = selectedPrediction?.complaint_id === pred.complaint_id;
      const atms = pred.candidate_atms || pred.primary_target_cell?.candidate_terminals || [];

      atms.slice(0, 3).forEach((atm, idx) => {
        if (atm.lat && atm.lon) {
          const isPrimary = idx === 0 && isSelected;
          const pingClass = isPrimary ? "radar-beacon" : "radar-beacon amber";

          const radarIcon = L.divIcon({
            className: "custom-radar-icon",
            html: `
              <div class="${pingClass}">
                <div class="core-dot"></div>
                <div class="pulse-ring"></div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          const marker = L.marker([atm.lat, atm.lon], { icon: radarIcon }).addTo(map);
          marker.bindPopup(
            `
            <div style="color: #f8fafc; font-family: monospace; font-size: 11px;">
              <strong style="color: #00f0ff; font-size: 12px;">SUSPECT DISPENSER PINPOINTED</strong><br/>
              <strong>Terminal:</strong> ${atm.terminal_id}<br/>
              <strong>Bank:</strong> ${atm.bank}<br/>
              <strong>Address:</strong> ${atm.address}<br/>
              <strong>Reserves:</strong> ₹${(atm.current_cash || 250000).toLocaleString("en-IN")}<br/>
              <div style="margin-top: 4px; color: #ff0055; font-weight: bold;">[INTERCEPT PRIORITY: CRITICAL]</div>
            </div>
            `,
            { className: "tactical-popup" }
          );

          newAtms.push(marker);
        }
      });
    });

    // =========================================================================
    // LAYER 4: Dial 112 Beat Patrol Locations (Police Units & Response Buffers)
    // =========================================================================
    beatUnits.forEach((unit) => {
      const policeIcon = L.divIcon({
        className: "custom-police-icon",
        html: `
          <div class="radar-beacon police">
            <div class="core-dot"></div>
            <div class="pulse-ring"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const pMarker = L.marker([unit.lat, unit.lon], { icon: policeIcon }).addTo(map);
      pMarker.bindTooltip(
        `<strong>${unit.callsign}</strong><br/>Status: ${unit.status}<br/>Radius: ${unit.buffer_radius_km} km`,
        { className: "tactical-tooltip" }
      );

      // 2.5km Radial Response Buffer
      const buffer = L.circle([unit.lat, unit.lon], {
        radius: unit.buffer_radius_km * 1000,
        color: "#00f0ff",
        weight: 1,
        fillColor: "#00f0ff",
        fillOpacity: 0.04,
        dashArray: "3, 5",
      }).addTo(map);

      newPolice.push(pMarker);
      newPolice.push(buffer);
    });

    // Save references for clean garbage collection
    layersRef.current = {
      polygons: newPolygons,
      atms: newAtms,
      flows: newFlows,
      police: newPolice,
    };
  };

  return (
    <div className="relative w-full h-full">
      {/* Map DOM Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" id="tactical-map" />

      {/* Tactical Map Overlay HUD: Coordinates & Compass */}
      <div className="absolute top-4 right-4 z-20 pointer-events-auto flex flex-col items-end space-y-2">
        <div className="bg-tactical-panel/95 border border-tactical-border px-3 py-1.5 rounded text-[11px] font-mono text-slate-300 backdrop-blur shadow-md flex items-center space-x-2">
          <span className="text-tactical-cyan font-bold">GRID:</span>
          <span>NCR | LAT: {mapCenterInfo.lat} | LON: {mapCenterInfo.lon} | Z: {mapCenterInfo.zoom}</span>
          {selectedPrediction && (
            <button
              onClick={handleRecenter}
              className="ml-2 px-2 py-0.5 bg-tactical-cyan/15 hover:bg-tactical-cyan/25 border border-tactical-cyan/40 hover:border-tactical-cyan text-tactical-cyan rounded text-[10px] font-mono font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-sm"
              title="Recenter Camera on Active Target Hotspot"
            >
              <Crosshair className="w-3 h-3" />
              <span>RECENTER</span>
            </button>
          )}
        </div>
        <div className="bg-tactical-panel/95 border border-tactical-border px-3 py-1 rounded text-[10px] font-mono text-tactical-amber backdrop-blur shadow-md">
          TACTICAL RESOLUTION: H3 RES 8 (AREA ~0.737 km²)
        </div>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto bg-tactical-panel/90 border border-tactical-border p-2.5 rounded text-[11px] font-mono backdrop-blur shadow-lg space-y-1.5">
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tactical Legend</div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-sm bg-tactical-crimson/60 border border-tactical-crimson" />
          <span className="text-slate-300">Imminent Extraction Hex (P &ge; 70%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-sm bg-tactical-amber/60 border border-tactical-amber" />
          <span className="text-slate-300">Probable Corridor Hex (P &lt; 70%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-tactical-crimson animate-ping" />
          <span className="text-slate-300">Offsite ATM Target Dispenser</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-tactical-cyan" />
          <span className="text-slate-300">Dial 112 Beat Patrol Buffer</span>
        </div>
      </div>
    </div>
  );
};
