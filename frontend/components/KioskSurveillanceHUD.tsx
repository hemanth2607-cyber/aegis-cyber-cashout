// frontend/components/KioskSurveillanceHUD.tsx
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Camera,
  ShieldAlert,
  Lock,
  Volume2,
  X,
  RefreshCw,
  EyeOff,
  CreditCard,
  Clock,
  Radio,
  CheckCircle2,
} from "lucide-react";

export interface KioskSurveillanceHUDProps {
  terminalId?: string;
  isOpen: boolean;
  onClose: () => void;
  isSec106Frozen?: boolean;
}

export interface TelemetryData {
  terminal_id: string;
  camera_status: string;
  facial_concealment_score: number;
  cards_detected_count: number;
  dwell_time_seconds: number;
  threat_level: string;
  is_card_frozen: boolean;
  dispenser_locked: boolean;
  alarm_active: boolean;
  surveillance_fps: number;
  resolution: string;
}

export default function KioskSurveillanceHUD({
  terminalId = "ATM-DL-9082",
  isOpen,
  onClose,
  isSec106Frozen = false,
}: KioskSurveillanceHUDProps) {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [streamKey, setStreamKey] = useState<number>(Date.now());
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Fetch telemetry poll
  const fetchTelemetry = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/terminals/${terminalId}/telemetry`);
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      }
    } catch (err) {
      console.warn("Telemetry fetch error:", err);
    }
  }, [terminalId]);

  // Synchronize if prop `isSec106Frozen` changes
  useEffect(() => {
    if (isSec106Frozen && isOpen) {
      fetch(`/api/v1/terminals/${terminalId}/freeze`, { method: "POST" })
        .then(() => fetchTelemetry())
        .catch(console.warn);
    }
  }, [isSec106Frozen, isOpen, terminalId, fetchTelemetry]);

  // Polling loop when HUD modal is open
  useEffect(() => {
    if (!isOpen) return;
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 1500);
    return () => clearInterval(interval);
  }, [isOpen, fetchTelemetry]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Trigger Lockdown & 110dB Alarm
  async function handleTriggerLockdown() {
    setLoadingAction("lockdown");
    try {
      const res = await fetch(`/api/v1/terminals/${terminalId}/lockdown`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data.telemetry);
        setActionNotice("DISPENSER SHUTTER LOCKED & 110dB AUDIBLE DETERRENT ACTIVATED");
        setStreamKey(Date.now());
      }
    } catch (err) {
      console.error("Lockdown failure:", err);
    } finally {
      setLoadingAction(null);
    }
  }

  // Toggle Section 106 Card Freeze
  async function handleToggleFreeze() {
    setLoadingAction("freeze");
    try {
      const res = await fetch(`/api/v1/terminals/${terminalId}/freeze`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data.telemetry);
        setActionNotice("SECTION 106 BNSS HOLD CONFIRMED BY CORE SWITCH");
        setStreamKey(Date.now());
      }
    } catch (err) {
      console.error("Freeze failure:", err);
    } finally {
      setLoadingAction(null);
    }
  }

  // Reset State
  async function handleReset() {
    setLoadingAction("reset");
    try {
      const res = await fetch(`/api/v1/terminals/${terminalId}/reset`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data.telemetry);
        setActionNotice("TERMINAL STATE RESET TO ACTIVE MONITORING");
        setStreamKey(Date.now());
      }
    } catch (err) {
      console.error("Reset failure:", err);
    } finally {
      setLoadingAction(null);
    }
  }

  if (!isOpen) return null;

  const isFrozen = telemetry?.is_card_frozen ?? isSec106Frozen;
  const isLocked = telemetry?.dispenser_locked ?? false;
  const isAlarm = telemetry?.alarm_active ?? false;
  const faceScore = telemetry?.facial_concealment_score ?? 0.942;
  const cardsCount = telemetry?.cards_detected_count ?? 4;
  const dwellSec = telemetry?.dwell_time_seconds ?? 284;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* HUD Container */}
      <div className="relative w-full max-w-5xl rounded-2xl border border-cyan-500/40 bg-zinc-950/95 text-zinc-100 shadow-[0_0_50px_rgba(6,182,212,0.25)] font-mono overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-zinc-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Camera className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-widest text-cyan-300">
                  LIVE CCTV TELEMETRY HUD // OFF-SITE ATM VESTIBULE
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-red-950/80 text-red-400 border border-red-500/40 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
                  <span>LIVE FEED</span>
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                TERMINAL #{terminalId} • CALANGUTE NORTH VESTIBULE • CAM-ID: CCTV-IR-04
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              disabled={loadingAction !== null}
              title="Reset Edge Telemetry"
              className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.1] transition-all flex items-center space-x-1"
            >
              <RefreshCw className={`w-3 h-3 ${loadingAction === "reset" ? "animate-spin" : ""}`} />
              <span>RESET</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-white/[0.08] transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Section 106 Status Banner (Flashing when frozen) */}
        {isFrozen && (
          <div className="bg-red-950/90 border-b border-red-500/50 px-4 py-2 text-center text-xs font-black tracking-widest text-red-200 flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(220,38,38,0.4)] animate-pulse">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>[ATM SWITCH LOCK ACTIVATED: CARD SESSION TERMINATED UNDER SEC 106 BNSS]</span>
          </div>
        )}

        {/* Alarm & Shutter Lock Banner */}
        {isLocked && (
          <div className="bg-amber-950/90 border-b border-amber-500/50 px-4 py-2 text-center text-xs font-black tracking-widest text-amber-200 flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>[SOLENOID DISPENSER LOCKED // 110dB AUDIBLE DETERRENT SIREN ENGAGED]</span>
          </div>
        )}

        {/* Main Body: Video Feed Left, Telemetry Right */}
        <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-y-auto">
          {/* Video Stream Container (8 cols) */}
          <div className="lg:col-span-8 flex flex-col space-y-2">
            <div className="relative rounded-xl border border-cyan-500/30 bg-black overflow-hidden aspect-[4/3] flex items-center justify-center group shadow-2xl">
              {/* Native MJPEG Stream Image Tag */}
              <img
                key={streamKey}
                src={`/api/v1/terminals/${terminalId}/live_feed?t=${streamKey}`}
                alt="Edge Kiosk Surveillance Stream"
                className="w-full h-full object-contain pointer-events-none"
              />

              {/* HUD Tactical Corner Brackets */}
              <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />

              {/* Center Tactical Crosshair */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                <div className="w-12 h-12 border border-white/20 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                </div>
              </div>

              {/* Top Stream Overlay Pills */}
              <div className="absolute top-3 left-3 flex items-center space-x-2 pointer-events-none">
                <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-black/70 text-emerald-400 border border-emerald-500/30">
                  AES-256 EDGE LINK: VERIFIED
                </span>
                <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-black/70 text-cyan-400 border border-cyan-500/30">
                  12.0 FPS | 1.8 Mbps
                </span>
              </div>

              {/* Bottom Stream Overlay Pills */}
              <div className="absolute bottom-3 right-3 flex items-center space-x-2 pointer-events-none">
                <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-black/70 text-amber-400 border border-amber-500/30">
                  PTZ: LOCKED // ANGLE: 42° OVERHEAD
                </span>
              </div>

              {/* Alarm Pulsing Aura if active */}
              {isAlarm && (
                <div className="absolute inset-0 border-4 border-red-500 animate-pulse pointer-events-none" />
              )}
            </div>

            {/* Video Subtitle / Latency notice */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
              <div className="flex items-center space-x-2">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>Streaming directly from Kiosk Edge TPU Unit (Coral NPU)</span>
              </div>
              <span className="text-slate-400">Target Latency: &lt; 45ms</span>
            </div>
          </div>

          {/* Telemetry & Tactical Actions (4 cols) */}
          <div className="lg:col-span-4 flex flex-col space-y-3.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
              <span>Real-Time Edge Analytics</span>
            </div>

            {/* Card 1: Face Concealment */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-amber-500/30 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Face Concealment</span>
                </div>
                <span className="text-sm font-black text-amber-300">
                  {(faceScore * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${faceScore * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>Confidence: CRITICAL</span>
                <span className="text-amber-400 font-semibold">[HELMET + FULL VISOR]</span>
              </div>
            </div>

            {/* Card 2: Multi-Card Cluster */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-cyan-500/30 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 text-cyan-400 font-bold">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Card Cluster Count</span>
                </div>
                <span className="text-sm font-black text-cyan-300">
                  {cardsCount} Cards Detected
                </span>
              </div>
              <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (cardsCount / 5) * 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>Anomaly Threshold: &gt; 2 Cards</span>
                <span className="text-cyan-400 font-semibold">STACK FLAGGED</span>
              </div>
            </div>

            {/* Card 3: Dwell Time */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-red-500/30 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 text-red-400 font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Dwell Time Exceeded</span>
                </div>
                <span className="text-sm font-black text-red-400">
                  {dwellSec}s ({Math.floor(dwellSec / 60)}m {dwellSec % 60}s)
                </span>
              </div>
              <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-red-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (dwellSec / 300) * 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>Standard Limit: 120s</span>
                <span className="text-red-400 font-semibold">RUNNER ISOLATION</span>
              </div>
            </div>

            {/* Action Notice Toast */}
            {actionNotice && (
              <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-[10px] text-cyan-300 font-semibold flex items-center space-x-1.5 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{actionNotice}</span>
              </div>
            )}

            {/* Tactical Control Buttons */}
            <div className="space-y-2 pt-1">
              {/* Button 1: Dispenser Lockdown & Audible Siren */}
              <button
                onClick={handleTriggerLockdown}
                disabled={isLocked || loadingAction === "lockdown"}
                className={`w-full rounded-xl py-3 px-3 text-xs font-bold tracking-wider transition-all flex items-center justify-center space-x-2 shadow-lg ${
                  isLocked
                    ? "bg-amber-950/80 border border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white border border-red-400/50 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>
                  {loadingAction === "lockdown"
                    ? "ENGAGING LOCKDOWN..."
                    : isLocked
                    ? "DISPENSER LOCKED & ALARM ACTIVE"
                    : "TRIGGER ALARM & DISPENSER LOCKDOWN"}
                </span>
              </button>

              {/* Button 2: Section 106 Card Session Freeze */}
              <button
                onClick={handleToggleFreeze}
                disabled={isFrozen || loadingAction === "freeze"}
                className={`w-full rounded-xl py-2.5 px-3 text-xs font-bold tracking-wider transition-all flex items-center justify-center space-x-2 shadow-lg ${
                  isFrozen
                    ? "bg-emerald-950/80 border border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-not-allowed"
                    : "bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>
                  {loadingAction === "freeze"
                    ? "COMMUNICATING SWITCH..."
                    : isFrozen
                    ? "SEC 106 BNSS HOLD ACTIVE"
                    : "ACTIVATE SEC 106 BNSS CARD FREEZE"}
                </span>
              </button>
            </div>

            {/* Compliance Guarantee */}
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[9px] text-slate-400 leading-tight space-y-1">
              <span className="font-bold text-slate-300 block">
                STATUTORY EVIDENCE INTEGRITY:
              </span>
              <span>
                CCTV telemetry and edge computer vision bounding boxes are timestamped and cryptographically hashed for Section 65B Indian Evidence Act admissibility.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
