// frontend/hooks/useStageTelemetry.ts
import { useState, useEffect } from "react";
import { InspectorTelemetry } from "../components/AlgorithmRealityInspector";

const BASELINE_TELEMETRY: InspectorTelemetry = {
  ncrp: {
    ticketId: "NCR-2026-08832",
    amountInr: 750000,
    edgeInsertLatencyMs: 3.8,
  },
  peeling: {
    formulaVars: {
      Ai_ratio: 0.942,
      lambda_sum: 0.385,
      sigma: 0.12,
    },
    velocityDecay: 0.86,
  },
  bayesian: {
    sensors: [
      { source: "Device IP Subnet (ISP)", location: "157.48.22.90 (Goa Telecom Circle)" },
      { source: "Cell-BTS Tower Ping", location: "BTS-GOA-CALANGUTE-7 (4G LTE)" },
      { source: "Debit Mule Branch KYC", location: "YESB-CALANGUTE-002" },
    ],
    fromCoord: [13.08, 80.27],
    toCoord: [15.52, 73.77],
  },
  mlForecast: {
    cashoutWindowMin: 22.4,
    reachRadiusKm: 13.07,
    rankedCells: [
      { h3: "886196a52ffffff", atmId: "SBI Calangute Market Kiosk #042", probability: 0.884 },
      { h3: "886196a50ffffff", atmId: "HDFC Candolim Beach Road #019", probability: 0.082 },
      { h3: "886196a56ffffff", atmId: "Axis Baga Tourist Corridor #007", probability: 0.034 },
    ],
  },
  shap: {
    factors: [
      { label: "Mule Proximity ψ_dist", weight: 0.38 },
      { label: "ATM Liquidity Tier ψ_liq", weight: 0.29 },
      { label: "Historical Cashout Density", weight: 0.22 },
      { label: "Interstate Jurisdiction Jump", weight: 0.18 },
      { label: "Police Station Distance -ψ_police", weight: -0.15 },
    ],
    sections: [
      "Sec 106 BNSS (Lien Order)",
      "Sec 107 BNSS (Magistrate Attachment)",
      "Sec 318(4) & 319 BNS, 2023",
      "Sec 66D IT Act, 2000",
      "Sec 63 BSA (SHA-256 Certificate)",
    ],
  },
  interdiction: {
    digitalFreezeSec: 1.4,
    physicalDispatchMin: 6.8,
    windowMin: 22.4,
    frictionMin: 15.0,
    marginMin: 30.6,
    outcome: "OPTIMAL_INTERDICTION",
  },
};

export function useStageTelemetry(stageIndex: number, alertId = "NCR-2026-08832") {
  const [telemetry, setTelemetry] = useState<InspectorTelemetry>(BASELINE_TELEMETRY);

  useEffect(() => {
    let isMounted = true;

    async function fetchBackendPrediction() {
      try {
        const res = await fetch(`/api/v1/predictions/${alertId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted || !data) return;

        setTelemetry((prev) => {
          const updated: InspectorTelemetry = { ...prev };

          if (data.complaint_id) {
            updated.ncrp.ticketId = data.complaint_id;
          }
          if (data.predicted_cashout_window_mins || data.window_minutes) {
            const win = data.predicted_cashout_window_mins || data.window_minutes;
            updated.mlForecast.cashoutWindowMin = win;
            updated.mlForecast.reachRadiusKm = 35 * (win / 60);
            updated.interdiction.windowMin = win;
            updated.interdiction.marginMin = win + updated.interdiction.frictionMin - updated.interdiction.physicalDispatchMin;
          }

          if (data.candidate_atms && Array.isArray(data.candidate_atms)) {
            updated.mlForecast.rankedCells = data.candidate_atms.slice(0, 3).map((atm: any, i: number) => ({
              h3: atm.h3_index || data.target_h3_res8 || prev.mlForecast.rankedCells[i]?.h3 || "886196a52ffffff",
              atmId: `${atm.bank || "ATM"} (${atm.terminal_id || "ID"})`,
              probability: atm.softmax_score || atm.confidence || (i === 0 ? 0.88 : i === 1 ? 0.08 : 0.04),
            }));
          }

          if (data.shap_explanations && Array.isArray(data.shap_explanations)) {
            updated.shap.factors = data.shap_explanations.map((item: any) => ({
              label: item.feature || item.label || "Feature Factor",
              weight: typeof item.attribution === "number" ? item.attribution : 0.25,
            }));
          }

          return updated;
        });
      } catch (err) {
        // Fallback to rich baseline
      }
    }

    fetchBackendPrediction();
    return () => {
      isMounted = false;
    };
  }, [alertId, stageIndex]);

  return telemetry;
}
