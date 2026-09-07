"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Prediction, CADDispatch, BankFriction, BeatUnit } from "../types";

const INITIAL_BEAT_UNITS: BeatUnit[] = [
  { unit_id: "U-1", callsign: "BEAT-PCR-ROHINI-4", lat: 28.7280, lon: 77.1210, status: "PATROLLING", buffer_radius_km: 2.5 },
  { unit_id: "U-2", callsign: "BEAT-PCR-DWARKA-2", lat: 28.5920, lon: 77.0460, status: "PATROLLING", buffer_radius_km: 2.5 },
  { unit_id: "U-3", callsign: "BEAT-PCR-CENTRAL-7", lat: 28.6470, lon: 77.2410, status: "PATROLLING", buffer_radius_km: 2.5 },
  { unit_id: "U-4", callsign: "BEAT-PCR-GURUGRAM-9", lat: 28.4595, lon: 77.0725, status: "PATROLLING", buffer_radius_km: 2.5 },
  { unit_id: "U-5", callsign: "BEAT-PCR-NOIDA-5", lat: 28.5720, lon: 77.3450, status: "PATROLLING", buffer_radius_km: 2.5 },
  { unit_id: "U-6", callsign: "BEAT-PCR-SOUTH-11", lat: 28.5355, lon: 77.2000, status: "PATROLLING", buffer_radius_km: 2.5 },
];

export function useRealtimeAlerts() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  const [connected, setConnected] = useState(false);
  const [dispatchLogs, setDispatchLogs] = useState<CADDispatch[]>([]);
  const [frictionLogs, setFrictionLogs] = useState<BankFriction[]>([]);
  const [beatUnits, setBeatUnits] = useState<BeatUnit[]>(INITIAL_BEAT_UNITS);
  const [interdictedValue, setInterdictedValue] = useState<number>(4750000);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const API_BASE = "http://127.0.0.1:8000/api/v1";
  const WS_URL = "ws://127.0.0.1:8000/ws/alerts";

  // Fetch all active predictions from API
  const fetchActivePredictions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/predictions/active`);
      if (res.ok) {
        const data = await res.json();
        const incoming: Prediction[] = data.hotspots || [];
        setPredictions(incoming);

        // Keep selected prediction updated
        setSelectedPrediction((curr) => {
          if (!curr && incoming.length > 0) return incoming[0];
          if (curr) {
            const match = incoming.find((p) => p.complaint_id === curr.complaint_id);
            return match || curr;
          }
          return null;
        });
      }
    } catch (err) {
      console.warn("[Aegis] Active predictions fetch retry:", err);
    }
  }, [API_BASE]);

  // Fetch full details of a specific complaint (including graph trace)
  const fetchComplaintDetails = useCallback(async (complaintId: string) => {
    try {
      const res = await fetch(`${API_BASE}/predictions/${complaintId}`);
      if (res.ok) {
        const fullPred: Prediction = await res.json();
        setSelectedPrediction(fullPred);
        setPredictions((prev) =>
          prev.map((p) => (p.complaint_id === complaintId ? { ...p, ...fullPred } : p))
        );
      }
    } catch (err) {
      console.error("[Aegis] Error fetching complaint details:", err);
    }
  }, [API_BASE]);

  // Establish WebSocket Connection
  useEffect(() => {
    let isMounted = true;

    function connectWS() {
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setConnected(true);
          console.log("[Aegis] WebSocket connected to", WS_URL);
          fetchActivePredictions();
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const msg = JSON.parse(event.data);
            const { event_type, data } = msg;

            if (event_type === "HIGH_CONFIDENCE_CASHOUT_ALERT" || event_type === "GRAPH_VELOCITY_UPDATE") {
              fetchActivePredictions();
              if (data?.complaint_id) {
                fetchComplaintDetails(data.complaint_id);
              }
            } else if (event_type === "DIAL112_CAD_DISPATCHED") {
              setDispatchLogs((prev) => [data, ...prev.slice(0, 19)]);
              // Mark corresponding beat unit as dispatched
              if (data.patrol_car) {
                setBeatUnits((prev) =>
                  prev.map((u) =>
                    u.callsign === data.patrol_car ? { ...u, status: "DISPATCHED" } : u
                  )
                );
              }
            } else if (event_type === "BANK_FRICTION_DEPLOYED") {
              setFrictionLogs((prev) => [data, ...prev.slice(0, 19)]);
              setInterdictedValue((prev) => prev + 250000);
            }
          } catch (e) {
            console.warn("[Aegis] WS parse notice:", e);
          }
        };

        ws.onerror = (err) => {
          console.warn("[Aegis] WS Error:", err);
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setConnected(false);
          console.log("[Aegis] WS Disconnected. Reconnecting in 3s...");
          reconnectTimeoutRef.current = setTimeout(connectWS, 3000);
        };
      } catch (err) {
        console.warn("[Aegis] WS connect failed:", err);
        reconnectTimeoutRef.current = setTimeout(connectWS, 3000);
      }
    }

    connectWS();
    fetchActivePredictions();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [WS_URL, fetchActivePredictions, fetchComplaintDetails]);

  // Real-time Countdown Timer Tick (every 1 second)
  useEffect(() => {
    const timer = setInterval(() => {
      setPredictions((prev) =>
        prev.map((p) => {
          const currentSec = p.countdown_seconds ?? (p.window_minutes ? Math.round(p.window_minutes * 60) : 1200);
          const nextSec = Math.max(0, currentSec - 1);
          return {
            ...p,
            countdown_seconds: nextSec,
            remaining_window_minutes: Math.round((nextSec / 60) * 10) / 10,
          };
        })
      );

      setSelectedPrediction((curr) => {
        if (!curr) return null;
        const currentSec = curr.countdown_seconds ?? (curr.window_minutes ? Math.round(curr.window_minutes * 60) : 1200);
        const nextSec = Math.max(0, currentSec - 1);
        return {
          ...curr,
          countdown_seconds: nextSec,
          remaining_window_minutes: Math.round((nextSec / 60) * 10) / 10,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Dispatch Dial 112 CAD unit
  const dispatchCAD = async (complaintId: string, h3Index: string, priority = "CRITICAL") => {
    try {
      const res = await fetch(`${API_BASE}/dispatch/dial112`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint_id: complaintId,
          target_h3_index: h3Index,
          priority,
        }),
      });
      const data: CADDispatch = await res.json();
      setDispatchLogs((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      console.error("[Aegis] Error dispatching CAD:", err);
      throw err;
    }
  };

  // Trigger Bank Friction (Micro-delay / Step-up)
  const triggerBankFriction = async (complaintId: string, muleAccount: string, action = "STEP_UP_AUTH") => {
    try {
      const res = await fetch(`${API_BASE}/bank/friction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint_id: complaintId,
          target_mule_account: muleAccount,
          action,
        }),
      });
      const data: BankFriction = await res.json();
      setFrictionLogs((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      console.error("[Aegis] Error deploying friction:", err);
      throw err;
    }
  };

  // Live Heist Simulation Trigger
  const triggerHeistSimulation = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulationStatus("Ingesting 1930 NCRP Complaint...");

    try {
      const simId = `NCRP-2026-DEL-${Math.floor(10000 + Math.random() * 90000)}`;
      const victimAcc = `SBIN000${Math.floor(1000000 + Math.random() * 9000000)}`;
      const mule1 = `PUNB0${Math.floor(1000000 + Math.random() * 9000000)}`;
      const mule2 = `HDFC0${Math.floor(1000000 + Math.random() * 9000000)}`;
      const mule3 = `YESB0${Math.floor(1000000 + Math.random() * 9000000)}`;

      // Step 1: Ingest
      await fetch(`${API_BASE}/complaints/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint_id: simId,
          victim_account: victimAcc,
          victim_bank: "State Bank of India",
          initial_amount: 850000.0,
          fraud_category: "DIGITAL_ARREST",
          initial_utr: `UTR-INIT-${Date.now()}`,
          victim_lat: 28.6139 + (Math.random() - 0.5) * 0.08,
          victim_lon: 77.2090 + (Math.random() - 0.5) * 0.08,
        }),
      });

      await fetchActivePredictions();
      await fetchComplaintDetails(simId);

      // Step 2: Hops with delays
      setSimulationStatus("Tracking Layer 1 IMPS Peeling...");
      await new Promise((r) => setTimeout(r, 1200));

      await fetch(`${API_BASE}/transactions/hook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: victimAcc,
          receiver: mule1,
          amount: 850000.0,
          chan: "IMPS",
          utr: `UTR-HOP1-${Date.now()}`,
        }),
      });

      setSimulationStatus("Tracking Layer 2 UPI Dispersion...");
      await new Promise((r) => setTimeout(r, 1200));

      await fetch(`${API_BASE}/transactions/hook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: mule1,
          receiver: mule2,
          amount: 450000.0,
          chan: "UPI",
          utr: `UTR-HOP2-${Date.now()}`,
        }),
      });

      setSimulationStatus("Tracking Terminal Hop -> Debit Card Courier...");
      await new Promise((r) => setTimeout(r, 1200));

      await fetch(`${API_BASE}/transactions/hook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: mule2,
          receiver: mule3,
          amount: 420000.0,
          chan: "IMPS",
          utr: `UTR-HOP3-${Date.now()}`,
        }),
      });

      await fetchActivePredictions();
      await fetchComplaintDetails(simId);
      setSimulationStatus("Trajectory Calculated. Cashout Hexagon Pinpointed!");

      setTimeout(() => {
        setSimulationStatus(null);
        setIsSimulating(false);
      }, 3000);
    } catch (err) {
      console.error("[Aegis] Simulation failed:", err);
      setSimulationStatus("Simulation error");
      setIsSimulating(false);
    }
  };

  const imminentCashoutsCount = predictions.filter(
    (p) => (p.remaining_window_minutes ?? p.window_minutes ?? 60) <= 30
  ).length;

  return {
    predictions,
    selectedPrediction,
    setSelectedPrediction,
    fetchComplaintDetails,
    connected,
    dispatchLogs,
    frictionLogs,
    beatUnits,
    interdictedValue,
    activeComplaintsCount: Math.max(predictions.length, 1),
    imminentCashoutsCount: Math.max(imminentCashoutsCount, 1),
    isSimulating,
    simulationStatus,
    triggerHeistSimulation,
    dispatchCAD,
    triggerBankFriction,
  };
}
