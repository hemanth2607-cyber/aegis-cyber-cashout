"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, X, Copy, Check } from "lucide-react";
import { Prediction } from "../types";

interface TelemetryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  prediction: Prediction | null;
}

export const TelemetryDrawer: React.FC<TelemetryDrawerProps> = ({
  isOpen,
  onClose,
  prediction,
}) => {
  const [activeTab, setActiveTab] = useState<"json" | "cbs" | "legal">("json");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const complaintId = prediction?.complaint_id || "NCRP-2026-DEL-8921";
  const h8 = prediction?.primary_target_cell?.h3_res8 || "886196a52ffffff";
  const amount = prediction?.peeled_amount || 450000;

  const rawJsonPayload = {
    incident_id: complaintId,
    timestamp_ist: new Date().toISOString(),
    source: "NCRP_1930_REALTIME_HOOK",
    victim: {
      account: "SBIN000492810",
      bank: "State Bank of India",
      initial_defrauded_inr: 850000.0,
      reported_delay_mins: 18.4,
    },
    peeled_trajectory: [
      { hop: 1, account: "ICIC000182749", amount: 450000.0, method: "IMPS" },
      { hop: 2, account: "YESB00010921", amount: amount, method: "IMPS", terminal_flag: true },
    ],
    h3_forecast: {
      resolution: 8,
      primary_cell: h8,
      confidence: prediction?.confidence_score || 0.88,
      estimated_cashout_window_mins: 14.2,
    },
  };

  const cbsSwitchPayload = {
    switch_reference: `CBS-TXN-HOLD-${Date.now()}`,
    interdiction_protocol: "CARD_SESSION_HOLD_SEC106",
    acquirer_bank: "HDFC Bank ATM Network",
    target_card_bin: "4591-XXXX-XXXX-1092",
    linked_account: "YESB00010921",
    terminal_id: "ATM-DL-ROH-082",
    switch_action: "INJECT_STEP_UP_BIOMETRIC_CHALLENGE",
    iso8583_field39_response_code: "05_STEP_UP_REQUIRED",
    added_dispenser_latency_seconds: 900,
    status: "ENFORCED_SUCCESSFULLY",
  };

  const legalDocket = {
    statutory_mandate: "Sections 106 & 107 of Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023",
    penal_sections: "Sections 318(4) & 319 of Bharatiya Nyaya Sanhita (BNS), 2023 r/w Section 66D IT Act",
    police_lien_order_sec106: `ORDER FOR IMMEDIATE POLICE LIEN (SEC 106 BNSS): Directing the nodal officer of Yes Bank & NPCI to freeze debit operations and enforce card-session friction on account [YESB00010921] and target terminal [ATM-DL-ROH-082] situated at H3 cell [${h8}] to halt proceeds of crime.`,
    magistrate_report_sec107: `ATTACHMENT COMPLIANCE REPORT (SEC 107 BNSS): Submitted to the Court of Chief Judicial Magistrate, Rohini Courts, New Delhi. Confirming pre-emptive attachment of ₹${amount.toLocaleString("en-IN")} pending final judicial decree and victim restitution.`,
  };

  const getActiveContent = () => {
    switch (activeTab) {
      case "json":
        return JSON.stringify(rawJsonPayload, null, 2);
      case "cbs":
        return JSON.stringify(cbsSwitchPayload, null, 2);
      case "legal":
        return JSON.stringify(legalDocket, null, 2);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 h-72 z-[2000] bg-[#0B0F17]/95 border-t border-white/[0.12] backdrop-blur-xl shadow-2xl flex flex-col font-mono"
      >
        {/* Drawer Header */}
        <div className="h-10 px-4 border-b border-white/[0.08] flex items-center justify-between bg-black/40">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 text-xs text-cyan-400 font-bold">
              <Terminal className="w-3.5 h-3.5" />
              <span>RAW TELEMETRY &amp; AUDIT STREAM</span>
            </div>

            {/* Tabs */}
            <div className="flex items-center space-x-1 bg-white/[0.03] p-0.5 rounded border border-white/[0.06]">
              <button
                onClick={() => setActiveTab("json")}
                className={`px-2 py-0.5 text-[10px] rounded transition-all ${
                  activeTab === "json"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                NCRP Ingest JSON
              </button>
              <button
                onClick={() => setActiveTab("cbs")}
                className={`px-2 py-0.5 text-[10px] rounded transition-all ${
                  activeTab === "cbs"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                CBS Switch ISO-8583
              </button>
              <button
                onClick={() => setActiveTab("legal")}
                className={`px-2 py-0.5 text-[10px] rounded transition-all ${
                  activeTab === "legal"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                BNSS 106/107 Legal Docket
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-2 py-0.5 text-[10px] rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 flex items-center space-x-1 transition-colors"
              title="Copy Payload"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
              title="Close Drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Terminal Content */}
        <div className="flex-1 overflow-auto p-4 text-xs text-slate-300 bg-black/60 font-mono select-text">
          <pre className="text-[11px] leading-relaxed text-cyan-300/90 whitespace-pre-wrap">
            {getActiveContent()}
          </pre>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
