// frontend/components/TacticalJourneyMap.tsx
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import { SimulationState, SimulationAction, STAGES } from "../state/simulationTimeline";
import { fetchRoadRoute, RouteResult, PatrolTick, createPatrolAnimator, LatLng } from "../utils/roadRouter";

// High-precision geographic coordinates
export const CHENNAI: LatLng = { lat: 13.0827, lng: 80.2707 }; // Anna Salai, Chennai (Incident Origin)
export const PUNE: LatLng = { lat: 18.5314, lng: 73.8446 };    // Shivaji Nagar, Pune (PNB Mule Bank Hop 1)
export const MARGAO: LatLng = { lat: 15.2736, lng: 73.9582 };  // Margao Municipal Market (ICICI Mule Bank Hop 2 - 100% on land)
export const GOA_ATM: LatLng = { lat: 15.5439, lng: 73.7553 }; // SBI Calangute Market Kiosk Terminal #042 (Target ATM)
export const PCR_BASE: LatLng = { lat: 15.5408, lng: 73.7645 };// Calangute Police Station (Beat-3 Unit Base)

// High-precision national highway & banking optical fiber corridor waypoints
const DENSE_CORRIDOR_WAYPOINTS: [number, number][] = [
  // Segment 1: Chennai to Pune via Golden Quadrilateral (NH48)
  [13.0827, 80.2707], // Chennai Anna Salai (v0 Origin)
  [12.9830, 79.9700], // Sriperumbudur
  [12.8342, 79.7036], // Kanchipuram
  [12.9165, 79.1325], // Vellore
  [12.7150, 78.6000], // Vaniyambadi
  [12.5186, 78.2138], // Krishnagiri
  [12.7409, 77.8253], // Hosur
  [12.9716, 77.5946], // Bengaluru Financial Hub
  [13.3422, 77.1017], // Tumakuru
  [13.7441, 76.9080], // Sira
  [14.2251, 76.3980], // Chitradurga
  [14.4644, 75.9218], // Davanagere
  [14.7955, 75.4024], // Haveri
  [15.3647, 75.1240], // Hubballi
  [15.4589, 75.0078], // Dharwad
  [15.8497, 74.4977], // Belagavi
  [16.2625, 74.4840], // Sankeshwar
  [16.7050, 74.2433], // Kolhapur
  [17.2885, 74.1844], // Karad
  [17.6805, 73.9997], // Satara
  [18.1345, 73.9876], // Shirwal
  [18.5314, 73.8446], // Pune Shivaji Nagar PNB (Hop 1 Node)

  // Segment 2: Pune to Margao (South Goa) via Western Ghats / Anmod Pass
  [18.1345, 73.9876], // Shirwal
  [17.6805, 73.9997], // Satara
  [17.2885, 74.1844], // Karad
  [16.7050, 74.2433], // Kolhapur
  [15.8497, 74.4977], // Belagavi
  [15.6372, 74.5165], // Khanapur
  [15.5385, 74.3120], // Anmod Ghat Pass
  [15.3780, 74.2250], // Mollem
  [15.4025, 74.0150], // Ponda
  [15.2736, 73.9582], // Margao Municipal Market (Hop 2 Node)

  // Segment 3: Margao to Calangute (North Goa) via Zuari & Mandovi
  [15.3560, 73.9310], // Verna Industrial Highway
  [15.4120, 73.8960], // Cortalim / Zuari Bridge
  [15.4570, 73.8560], // Bambolim
  [15.4989, 73.8278], // Panaji / Mandovi River Bridge
  [15.5260, 73.8120], // Porvorim
  [15.5420, 73.7820], // Saligao Road
  [15.5439, 73.7553], // SBI Calangute Market Kiosk Terminal #042 (Hop 3 / Target)
];

// Subdivides waypoints into dense, evenly-spaced coordinate points (250 smooth samples)
function generateSmoothCorridor(waypoints: [number, number][], numSamples = 250): [number, number][] {
  const dists: number[] = [0];
  for (let i = 1; i < waypoints.length; i++) {
    const dLat = waypoints[i][0] - waypoints[i - 1][0];
    const dLng = waypoints[i][1] - waypoints[i - 1][1];
    dists.push(dists[i - 1] + Math.sqrt(dLat * dLat + dLng * dLng));
  }
  const total = dists[dists.length - 1];
  const result: [number, number][] = [];

  for (let s = 0; s <= numSamples; s++) {
    const targetDist = (s / numSamples) * total;
    let idx = dists.findIndex((d) => d >= targetDist);
    if (idx <= 0) idx = 1;
    if (idx >= waypoints.length) idx = waypoints.length - 1;

    const p0 = waypoints[idx - 1];
    const p1 = waypoints[idx];
    const segLen = dists[idx] - dists[idx - 1] || 0.0001;
    const frac = Math.max(0, Math.min(1, (targetDist - dists[idx - 1]) / segLen));

    const lat = p0[0] + (p1[0] - p0[0]) * frac;
    const lng = p0[1] + (p1[1] - p0[1]) * frac;
    result.push([lat, lng]);
  }
  return result;
}

const FULL_SMOOTH_PATH = generateSmoothCorridor(DENSE_CORRIDOR_WAYPOINTS, 250);

// Key progress thresholds along the 250 samples:
// Pune is at ~46% of the path (sample 115)
// Margao is at ~82% of the path (sample 205)
// Calangute is at 100% of the path (sample 250)
const PUNE_THRESHOLD = 0.46;
const MARGAO_THRESHOLD = 0.82;
const ATM_THRESHOLD = 0.98;

export default function TacticalJourneyMap({
  state,
  dispatch,
}: {
  state: SimulationState;
  dispatch?: React.Dispatch<SimulationAction>;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersGroupRef = useRef<any>(null);
  const routeLayersGroupRef = useRef<any>(null);
  const patrolMarkerRef = useRef<any>(null);
  const patrolCancelRef = useRef<(() => void) | null>(null);

  const stage = STAGES[state.currentStageIndex];
  const stageId = stage.id;

  // Local animated gradual line drawing progress (0 to 1)
  const [lineDrawProgress, setLineDrawProgress] = useState(stageId === "origin" ? 0 : 1);
  const [pulsePhase, setPulsePhase] = useState(0); // 0 to 1 continuous flow loop
  const [patrolInfo, setPatrolInfo] = useState<PatrolTick | null>(null);
  const [isManualReplaying, setIsManualReplaying] = useState(false);

  // 1. Continuous smooth loop for flowing movements (GPU dashoffset + sliding money pulses)
  useEffect(() => {
    let animId: number;
    function loop() {
      setPulsePhase((prev) => (prev + 0.008) % 1);
      animId = requestAnimationFrame(loop);
    }
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // 2. Gradual line extension controller (prevents sudden appearance!)
  useEffect(() => {
    if (stageId === "origin") {
      setLineDrawProgress(0);
      setIsManualReplaying(false);
      return;
    }

    if (stageId === "peeling") {
      // In Stage 2, synchronize with stageProgress if playing, or run smooth replay
      if (state.playing) {
        setLineDrawProgress(Math.max(0.02, Math.min(1, state.stageProgress)));
      } else if (!isManualReplaying && lineDrawProgress === 0) {
        // Trigger smooth automatic entry extension over 4.5 seconds
        triggerSmoothLineExtension();
      }
    } else {
      // In Stages 3-6: line is fully extended across India
      setLineDrawProgress(1);
    }
  }, [stageId, state.playing, state.stageProgress]);

  // Smooth line extension function over 4.5 seconds
  const triggerSmoothLineExtension = useCallback(() => {
    setIsManualReplaying(true);
    setLineDrawProgress(0.01);

    const startTime = performance.now();
    const durationMs = 4500; // 4.5 seconds of smooth gradual growth

    function step(now: number) {
      const elapsed = now - startTime;
      const fraction = Math.min(1, elapsed / durationMs);
      // Smooth ease-out cubic
      const eased = 1 - Math.pow(1 - fraction, 3);
      setLineDrawProgress(eased);

      if (fraction < 1) {
        requestAnimationFrame(step);
      } else {
        setIsManualReplaying(false);
      }
    }

    requestAnimationFrame(step);
  }, []);

  // 3. Initialize 2D Leaflet Map (Esri Dark Canvas - 100% stable, zero token revocations)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [15.2, 77.0],
        zoom: 6,
        zoomControl: false,
        attributionControl: false,
        fadeAnimation: true,
      });

      // Esri World Dark Gray Base
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 16,
          subdomains: ["server", "services"],
        }
      ).addTo(map);

      // City & State Reference Boundary Labels
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 16,
          opacity: 0.8,
        }
      ).addTo(map);

      const layersGroup = L.layerGroup().addTo(map);
      const routeLayersGroup = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      layersGroupRef.current = layersGroup;
      routeLayersGroupRef.current = routeLayersGroup;

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

  // 4. Smooth Camera Panning per Stage
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (stageId === "origin") {
      mapInstanceRef.current.flyTo([CHENNAI.lat, CHENNAI.lng], 7, { duration: 1.2 });
    } else if (stageId === "peeling") {
      mapInstanceRef.current.flyTo([16.0, 76.5], 6, { duration: 1.4 });
    } else {
      mapInstanceRef.current.flyTo([GOA_ATM.lat, GOA_ATM.lng], 13, { duration: 1.5 });
    }
  }, [stageId]);

  // 5. Render 2D Geospatial Layers (Gradual Extension + Internal Movements + Simple Pins)
  useEffect(() => {
    if (!mapInstanceRef.current || !layersGroupRef.current) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      const group = layersGroupRef.current;
      if (!map || !group) return;

      group.clearLayers();

      // =========================================================================
      // PIN 1: INCIDENT ORIGIN (v0 CHENNAI)
      // =========================================================================
      const originIcon = L.divIcon({
        className: "custom-div-icon",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(255, 170, 0, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 22px; height: 22px; border-radius: 50%; background: #ffaa00; border: 2.5px solid #ffffff; box-shadow: 0 0 20px #ffaa00; z-index: 10; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; color: #000;">👵</div>
            <div style="margin-top: 5px; white-space: nowrap; background: rgba(10, 15, 29, 0.95); border: 1.5px solid #ffaa00; padding: 4px 10px; border-radius: 6px; font-family: monospace; font-size: 11px; font-weight: bold; color: #ffaa00; box-shadow: 0 4px 14px rgba(0,0,0,0.9);">
              👵 Step 1: Grandma Tricked in Chennai (₹7.50L Stolen)
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      L.marker([CHENNAI.lat, CHENNAI.lng], { icon: originIcon }).addTo(group);

      // =========================================================================
      // 2. GRADUAL LINE EXTENSION + MOVEMENTS (STAGE 2 & BEYOND)
      // =========================================================================
      if (stageId !== "origin" && lineDrawProgress > 0.005) {
        // Number of samples to include along the dense path (2 to 250)
        const sampleCount = Math.max(2, Math.floor(lineDrawProgress * FULL_SMOOTH_PATH.length));
        const activePath = FULL_SMOOTH_PATH.slice(0, sampleCount);
        const currentHead = activePath[activePath.length - 1];

        // 2A. Background soft luminous glow
        L.polyline(activePath, {
          color: "#00f0ff",
          weight: 9,
          opacity: 0.25,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(group);

        // 2B. Core solid 2D line
        L.polyline(activePath, {
          color: "#00f0ff",
          weight: 4,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(group);

        // 2C. Animated dashed flow line (Fluid movement streaming inside the line!)
        L.polyline(activePath, {
          color: "#ffffff",
          weight: 2.2,
          opacity: 0.95,
          dashArray: "8, 14",
          dashOffset: `${Math.round(pulsePhase * 40)}`,
          lineCap: "round",
        }).addTo(group);

        // 2D. Advancing Tracer Head Marker (shows where the line is currently growing)
        if (stageId === "peeling" && lineDrawProgress < 0.98) {
          const tracerIcon = L.divIcon({
            className: "tracer-div-icon",
            html: `
              <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
                <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(0, 255, 170, 0.45); animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                <div style="width: 16px; height: 16px; border-radius: 50%; background: #00ffaa; border: 2px solid #ffffff; box-shadow: 0 0 18px #00ffaa; z-index: 20; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: bold; color: #000;">₹</div>
                <div style="margin-top: 5px; white-space: nowrap; background: rgba(2, 35, 20, 0.95); border: 1px solid #00ffaa; padding: 3px 8px; border-radius: 5px; font-family: monospace; font-size: 10px; font-weight: bold; color: #00ffaa; box-shadow: 0 4px 12px rgba(0,0,0,0.85);">
                  💸 Money Moving... (${(lineDrawProgress * 100).toFixed(0)}%)
                </div>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });
          L.marker(currentHead, { icon: tracerIcon }).addTo(group);
        }

        // 2E. MOVEMENTS IN THE LINE: 3 Continuous Flying Money Tokens (₹)
        // They glide smoothly along the drawn path from Chennai through the banks
        if (activePath.length >= 10) {
          const tokenOffsets = [0.1, 0.45, 0.8];
          tokenOffsets.forEach((offset) => {
            const tokenFrac = (pulsePhase + offset) % 1.0;
            // Only show token if it is within the currently drawn portion
            if (tokenFrac <= lineDrawProgress) {
              const ptIdx = Math.floor(tokenFrac * (FULL_SMOOTH_PATH.length - 1));
              const pt = FULL_SMOOTH_PATH[ptIdx];
              if (pt) {
                const tokenIcon = L.divIcon({
                  className: "money-token-icon",
                  html: `
                    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
                      <div style="width: 18px; height: 18px; border-radius: 50%; background: linear-gradient(135deg, #ffd700, #ffaa00); border: 1.5px solid #ffffff; box-shadow: 0 0 14px rgba(255, 215, 0, 0.95); font-size: 9px; font-weight: 900; color: #000; display: flex; align-items: center; justify-content: center;">
                        ₹
                      </div>
                    </div>
                  `,
                  iconSize: [18, 18],
                  iconAnchor: [9, 9],
                });
                L.marker(pt, { icon: tokenIcon }).addTo(group);
              }
            }
          });
        }

        // 2F. Intermediate Bank Pin 1: Pune PNB (pops up ONLY when reached!)
        if (lineDrawProgress >= PUNE_THRESHOLD || stageId !== "peeling") {
          const puneIcon = L.divIcon({
            className: "pune-div-icon",
            html: `
              <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="width: 14px; height: 14px; border-radius: 50%; background: #00ffaa; border: 2px solid #ffffff; box-shadow: 0 0 12px #00ffaa;"></div>
                <div style="margin-top: 4px; white-space: nowrap; background: rgba(10, 15, 29, 0.95); border: 1px solid #00ffaa; padding: 3px 7px; border-radius: 5px; font-family: monospace; font-size: 10px; color: #00ffaa; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.8);">
                  🏦 Hop 1: PNB Pune (₹2.50L)
                </div>
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });
          L.marker([PUNE.lat, PUNE.lng], { icon: puneIcon }).addTo(group);
        }

        // 2G. Intermediate Bank Pin 2: Margao ICICI (pops up ONLY when reached!)
        if (lineDrawProgress >= MARGAO_THRESHOLD || stageId !== "peeling") {
          const margaoIcon = L.divIcon({
            className: "margao-div-icon",
            html: `
              <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="width: 14px; height: 14px; border-radius: 50%; background: #00ffaa; border: 2px solid #ffffff; box-shadow: 0 0 12px #00ffaa;"></div>
                <div style="margin-top: 4px; white-space: nowrap; background: rgba(10, 15, 29, 0.95); border: 1px solid #00ffaa; padding: 3px 7px; border-radius: 5px; font-family: monospace; font-size: 10px; color: #00ffaa; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.8);">
                  🏦 Hop 2: ICICI Margao (₹2.40L)
                </div>
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });
          L.marker([MARGAO.lat, MARGAO.lng], { icon: margaoIcon }).addTo(group);
        }
      }

      // =========================================================================
      // PIN 3: TARGET ATM (CALANGUTE MARKET KIOSK #042)
      // =========================================================================
      if (stageId !== "origin") {
        const showAtm = stageId !== "peeling" || lineDrawProgress >= ATM_THRESHOLD;
        if (showAtm) {
          const atmIcon = L.divIcon({
            className: "atm-div-icon",
            html: `
              <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
                <div style="position: absolute; width: 48px; height: 48px; border-radius: 50%; border: 2px solid #ff0055; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                <div style="width: 24px; height: 24px; border-radius: 50%; background: #ff0055; border: 2.5px solid #ffffff; box-shadow: 0 0 20px #ff0055; z-index: 10; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; color: #ffffff;">ATM</div>
                
                <div style="margin-top: 5px; white-space: nowrap; background: rgba(10, 15, 29, 0.95); border: 1.5px solid #ff0055; padding: 3px 9px; border-radius: 6px; font-family: monospace; font-size: 11px; font-weight: bold; color: #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.9);">
                  🎯 Final Target: SBI Calangute Market Kiosk #042
                </div>

                <div style="margin-top: 3px; white-space: nowrap; background: rgba(5, 35, 22, 0.95); border: 1px solid #00ffaa; padding: 2px 8px; border-radius: 5px; font-family: monospace; font-size: 9.5px; font-weight: bold; color: #00ffaa; box-shadow: 0 0 10px rgba(0,255,170,0.4);">
                  🛡️ CARD FROZEN (Sec 106 BNSS) • Public ATM 100% Operational
                </div>
              </div>
            `,
            iconSize: [48, 48],
            iconAnchor: [24, 24],
          });

          L.marker([GOA_ATM.lat, GOA_ATM.lng], { icon: atmIcon }).addTo(group);
        }
      }

      // =========================================================================
      // 4. PRECISE UBER H3 RES-8 HEXAGON ZONE (STAGES 4, 5, 6)
      // =========================================================================
      if (stageId === "ml_forecast" || stageId === "shap_statutory" || stageId === "interdiction") {
        // High-precision hexagon vertices centered on Calangute ATM (radius ~460m)
        const centerLat = GOA_ATM.lat;
        const centerLng = GOA_ATM.lng;
        const radiusMeters = 460;
        const hexCoords: [number, number][] = [];

        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i + Math.PI / 6;
          const dLat = (radiusMeters * Math.sin(angle)) / 110574;
          const dLng = (radiusMeters * Math.cos(angle)) / (111320 * Math.cos((centerLat * Math.PI) / 180));
          hexCoords.push([centerLat + dLat, centerLng + dLng]);
        }

        L.polygon(hexCoords, {
          color: "#ff0055",
          weight: 2.5,
          opacity: 0.95,
          fillColor: "#ff0055",
          fillOpacity: 0.22,
          dashArray: "6, 8",
        }).addTo(group);

        const h3Label = L.divIcon({
          className: "h3-hud-icon",
          html: `
            <div style="background: rgba(10, 15, 29, 0.95); border: 1px solid #ff0055; padding: 3px 8px; border-radius: 5px; font-family: monospace; font-size: 9.5px; font-weight: bold; color: #ff0055; box-shadow: 0 3px 10px rgba(0,0,0,0.85); white-space: nowrap;">
              🎯 Predicted Cashout Zone (H3 Res 8: 886196a52ffffff • 88.4% Confidence)
            </div>
          `,
          iconSize: [200, 20],
          iconAnchor: [100, 10],
        });
        L.marker([centerLat + 0.0045, centerLng], { icon: h3Label }).addTo(group);
      }
    });
  }, [stageId, lineDrawProgress, pulsePhase]);

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

      const route: RouteResult = await fetchRoadRoute(PCR_BASE, GOA_ATM);
      if (!isMounted) return;

      const latLngs: [number, number][] = route.coordinates.map((c) => [c.lat, c.lng]);

      // 2D road route polyline
      L.polyline(latLngs, {
        color: "#00ffaa",
        weight: 5,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(group);

      // Police Station Base Station Pin
      const pcrBaseIcon = L.divIcon({
        className: "pcr-base-icon",
        html: `
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="width: 16px; height: 16px; border-radius: 50%; background: #00f0ff; border: 2px solid #ffffff; box-shadow: 0 0 12px #00f0ff;"></div>
            <div style="margin-top: 4px; white-space: nowrap; background: rgba(10, 15, 29, 0.95); border: 1px solid #00f0ff; padding: 2px 7px; border-radius: 4px; font-family: monospace; font-size: 9.5px; color: #00f0ff; font-weight: bold;">
              🚓 Calangute Police Station (Beat-3 Base)
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      L.marker([PCR_BASE.lat, PCR_BASE.lng], { icon: pcrBaseIcon }).addTo(group);

      const carIcon = (bearingDeg: number) =>
        L.divIcon({
          className: "car-div-icon",
          html: `
            <div style="transform: rotate(${bearingDeg}deg); font-size: 30px; filter: drop-shadow(0 0 16px rgba(0, 255, 170, 0.95)); cursor: pointer;">
              🚓
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

      // Smooth slow-motion patrol car animator along digitized roads
      patrolCancelRef.current = createPatrolAnimator(route, 32, (tick) => {
        if (!isMounted) return;
        setPatrolInfo(tick);

        if (!patrolMarkerRef.current) {
          patrolMarkerRef.current = L.marker([tick.position.lat, tick.position.lng], {
            icon: carIcon(tick.bearingDeg),
            zIndexOffset: 1000,
          }).addTo(group);
        } else {
          patrolMarkerRef.current.setLatLng([tick.position.lat, tick.position.lng]);
          patrolMarkerRef.current.setIcon(carIcon(tick.bearingDeg));
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

  // Official Judicial Briefing and Statutory Telemetry per Stage
  const judicialCaseBriefings = [
    {
      icon: "⚖️",
      title: "Stage 1: FIR Ingestion & Cyber Extortion Ingestion (Sec 173 BNSS)",
      story: "High-value extortion complaint registered (₹7,50,000 siphoned under Digital Arrest coercion). Dynamic cybercrime graph initialized in-memory in 3.8ms.",
    },
    {
      icon: "🕸️",
      title: "Stage 2: CFCFRMS Peeling Stream & Zero-Day Sleeper Mule Detection",
      story: "Real-time transaction peeling vector across IMPS/UPI banking rails. Dormancy Burst Score of 9.42 flags sleeper mule account YESB00010921.",
    },
    {
      icon: "📡",
      title: "Stage 3: Bayesian MAP Spatial Discretization & Sensory Shift",
      story: "Cellular tower triangulation and payment gateway IP telemetry re-anchor the operational search zone 984.7 km to the Calangute corridor in North Goa.",
    },
    {
      icon: "🤖",
      title: "Stage 4: Dual-Stage ML Cashout Horizon (LightGBM GBDT)",
      story: "LightGBM regressor forecasts a 18.5-minute natural withdrawal window. Uber H3 Res 8 hexagonal cell isolates target SBI Calangute Kiosk in <50ms.",
    },
    {
      icon: "🛡️",
      title: "Stage 5: Section 106 BNSS Bank Core Switch Hold (Zero Citizen Downtime)",
      story: "Targeted friction (τ = +15 min delay) applied strictly to suspect card session. Physical kiosk remains 100% operational for honest public citizens.",
    },
    {
      icon: "🚓",
      title: "Stage 6: ERSS Dial 112 CAD Interception & Judicial Attachment",
      story: "PCR Patrol BEAT-PCR-ROHINI-4 arrives with +28.3 minutes operational safety buffer. 100% principal recovered; 4-page BNSS Court Docket compiled.",
    },
  ];

  const currentStory = judicialCaseBriefings[state.currentStageIndex];

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden border border-tactical-border/40 bg-tactical-bg shadow-2xl">
      {/* 2D Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="h-full w-full z-0" id="tactical-simulation-map" />

      {/* TOP FLOATING JUDICIAL BRIEFING BAR */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-col gap-2 pointer-events-none">
        {/* Main Judicial Briefing Banner */}
        <div className="rounded-xl bg-black/95 border border-tactical-border/60 p-3 shadow-2xl backdrop-blur-md pointer-events-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{currentStory.icon}</span>
            <div>
              <div className="flex items-center space-x-2 text-tactical-border text-[11px] font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-tactical-border animate-ping" />
                <span>{currentStory.title}</span>
              </div>
              <div className="text-slate-100 font-sans text-xs sm:text-sm font-semibold leading-snug">
                {currentStory.story}
              </div>
            </div>
          </div>

          {/* Quick Action Pill & Replay Button */}
          <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto">
            {stageId === "peeling" && (
              <button
                onClick={triggerSmoothLineExtension}
                className="px-2.5 py-1 rounded bg-tactical-border/20 hover:bg-tactical-border/30 text-tactical-border border border-tactical-border/40 text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer"
                title="Watch the line extend smoothly from Chennai across India"
              >
                <span>▶ Replay Money Path</span>
              </button>
            )}
            <div className="hidden sm:flex items-center space-x-1.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Spatio-Temporal Engine</span>
            </div>
          </div>
        </div>

        {/* 6 Clickable Stage Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pointer-events-auto">
          {STAGES.map((stg, i) => {
            const isActive = state.currentStageIndex === i;
            const badgeIcons = [
              "⚖️ 1. FIR Ingestion",
              "🕸️ 2. Peeling & Sleeper Burst",
              "📡 3. Bayesian Spatial Shift",
              "🤖 4. Dual-Stage ML Horizon",
              "🛡️ 5. Sec 106 BNSS Hold",
              "🚓 6. Police CAD Intercept",
            ];
            return (
              <button
                key={stg.id}
                onClick={() => {
                  if (dispatch) {
                    const diff = i - state.currentStageIndex;
                    if (diff > 0) {
                      for (let step = 0; step < diff; step++) dispatch({ type: "STEP_FORWARD" });
                    } else if (diff < 0) {
                      for (let step = 0; step < Math.abs(diff); step++) dispatch({ type: "STEP_BACKWARD" });
                    }
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all whitespace-nowrap shadow-md cursor-pointer ${
                  isActive
                    ? "bg-tactical-border text-black border-2 border-white scale-105 shadow-cyan-500/50"
                    : "bg-black/80 hover:bg-black/95 text-slate-300 border border-white/10 hover:border-tactical-border/50"
                }`}
              >
                {badgeIcons[i]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Patrol Telemetry HUD (Stage 6) */}
      {stageId === "interdiction" && patrolInfo && (
        <div className="absolute bottom-4 left-4 z-[1000] rounded-xl bg-black/95 border border-tactical-green/60 px-4 py-2.5 font-mono text-xs text-tactical-green shadow-2xl flex items-center space-x-3">
          <span className="w-2.5 h-2.5 rounded-full bg-tactical-green animate-pulse" />
          <span>
            Patrol Speed: <strong>{patrolInfo.speedKmh} km/h</strong> · Remaining:{" "}
            <strong>{(patrolInfo.distanceRemainingMeters / 1000).toFixed(2)} km</strong> · Intercept ETA:{" "}
            <strong>
              {Math.round(patrolInfo.etaSeconds / 60)}m {Math.round(patrolInfo.etaSeconds % 60)}s
            </strong>
          </span>
        </div>
      )}
    </div>
  );
}
