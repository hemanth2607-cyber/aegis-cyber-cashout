// frontend/utils/roadRouter.ts
export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteResult {
  coordinates: LatLng[]; // ordered polyline, road-following
  distanceMeters: number;
  source: "osrm" | "fallback";
}

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

// High-precision digitized road waypoints connecting Calangute Police Station (Beat 3) to SBI Calangute Market Kiosk
const FALLBACK_WAYPOINTS: LatLng[] = [
  { lat: 15.5408, lng: 73.7645 }, // Calangute Police Station (Beat-3 Headquarters)
  { lat: 15.5412, lng: 73.7622 }, // Naikawaddo Chogm Road Junction
  { lat: 15.5420, lng: 73.7598 }, // Calangute Main Road & Post Office Junction
  { lat: 15.5428, lng: 73.7575 }, // Calangute Market Road Approach
  { lat: 15.5435, lng: 73.7562 }, // Commercial Kiosk Strip
  { lat: 15.5439, lng: 73.7553 }, // Target ATM: SBI Calangute Market Kiosk #042
];


export async function fetchRoadRoute(
  origin: LatLng,
  destination: LatLng,
  fallbackWaypoints: LatLng[] = FALLBACK_WAYPOINTS
): Promise<RouteResult> {
  const coordStr = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = `${OSRM_BASE}/${coordStr}?overview=full&geometries=geojson`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route || !route.geometry?.coordinates) throw new Error("OSRM: no route");
    const coordinates: LatLng[] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => ({ lat, lng })
    );
    return { coordinates, distanceMeters: route.distance, source: "osrm" };
  } catch (err) {
    console.warn("[roadRouter] OSRM unavailable, using offline fallback path:", err);
    
    // Dynamically adjust fallback start & end to match provided origin and destination
    const localizedFallback: LatLng[] = [
      origin,
      ...fallbackWaypoints.slice(1, -1),
      destination
    ];
    
    return {
      coordinates: localizedFallback,
      distanceMeters: haversinePathLength(localizedFallback),
      source: "fallback",
    };
  }
}

export function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(Math.max(0, h)));
}

export function haversinePathLength(points: LatLng[]): number {
  let d = 0;
  for (let i = 1; i < points.length; i++) d += haversineMeters(points[i - 1], points[i]);
  return d;
}

// --- Animation driver -------------------------------------------------

export interface PatrolTick {
  position: LatLng;
  bearingDeg: number;
  distanceRemainingMeters: number;
  etaSeconds: number;
  speedKmh: number;
}

export function createPatrolAnimator(
  route: RouteResult,
  speedKmh = 42,
  onTick: (tick: PatrolTick) => void
) {
  if (!route.coordinates || route.coordinates.length < 2) {
    return () => {};
  }

  const speedMs = (speedKmh * 1000) / 3600;
  const cumulative: number[] = [0];
  for (let i = 1; i < route.coordinates.length; i++) {
    cumulative.push(
      cumulative[i - 1] + haversineMeters(route.coordinates[i - 1], route.coordinates[i])
    );
  }
  const total = cumulative[cumulative.length - 1];
  let traveled = 0;
  let rafId: number;
  let lastTs: number | null = null;

  function step(ts: number) {
    if (lastTs === null) lastTs = ts;
    const dt = Math.min((ts - lastTs) / 1000, 0.1); // clamp to avoid giant jumps
    lastTs = ts;
    traveled = Math.min(traveled + speedMs * dt, total);

    let segIdx = cumulative.findIndex((c) => c >= traveled);
    if (segIdx <= 0) segIdx = 1;
    if (segIdx >= route.coordinates.length) segIdx = route.coordinates.length - 1;

    const segStart = route.coordinates[segIdx - 1];
    const segEnd = route.coordinates[segIdx];
    const segLen = cumulative[segIdx] - cumulative[segIdx - 1] || 1;
    const segProgress = Math.max(0, Math.min(1, (traveled - cumulative[segIdx - 1]) / segLen));

    const position: LatLng = {
      lat: segStart.lat + (segEnd.lat - segStart.lat) * segProgress,
      lng: segStart.lng + (segEnd.lng - segStart.lng) * segProgress,
    };
    const bearingDeg = bearingBetween(segStart, segEnd);
    const remaining = Math.max(0, total - traveled);

    onTick({
      position,
      bearingDeg,
      distanceRemainingMeters: remaining,
      etaSeconds: remaining / (speedMs || 1),
      speedKmh,
    });

    if (traveled < total) {
      rafId = requestAnimationFrame(step);
    }
  }

  rafId = requestAnimationFrame(step);
  return () => cancelAnimationFrame(rafId);
}

export function bearingBetween(a: LatLng, b: LatLng): number {
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const λ1 = (a.lng * Math.PI) / 180;
  const λ2 = (b.lng * Math.PI) / 180;
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
