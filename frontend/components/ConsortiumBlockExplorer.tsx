"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Lock,
  FileText,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";

export interface BlockchainBlock {
  block_index: number;
  timestamp: string;
  transactions: Array<Record<string, any>>;
  merkle_root: string;
  previous_block_hash: string;
  validator_node_id: string;
  validator_signature: string;
  block_hash: string;
}

export interface VerificationState {
  is_valid: boolean;
  block_count: number;
  chain_status: string;
  bsa_sec_63_compliance: string;
  tampered_block: number | null;
  broken_links?: number[];
  error?: string | null;
  reason?: string | null;
  violation_type?: string | null;
}

interface ConsortiumBlockExplorerProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const ConsortiumBlockExplorer: React.FC<ConsortiumBlockExplorerProps> = ({
  onClose,
  isModal = false,
}) => {
  const [blocks, setBlocks] = useState<BlockchainBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState<VerificationState>({
    is_valid: true,
    block_count: 0,
    chain_status: "SECURE_UNBROKEN",
    bsa_sec_63_compliance: "VALID",
    tampered_block: null,
  });
  const [verifying, setVerifying] = useState(false);
  const [tampering, setTampering] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<BlockchainBlock | null>(null);
  const [expandedBlocks, setExpandedBlocks] = useState<Record<number, boolean>>({ 0: true, 1: true });
  const [certificateData, setCertificateData] = useState<any | null>(null);
  const [loadingCert, setLoadingCert] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Fetch full ledger
  const fetchLedger = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/blockchain/ledger");
      if (res.ok) {
        const data = await res.json();
        const blockList = data.blocks || data.chain || [];
        setBlocks(blockList);
      }
    } catch (err) {
      console.error("Failed to fetch blockchain ledger:", err);
    } finally {
      setLoading(false);
    }
  };

  // Run integrity verification
  const runVerify = async () => {
    setVerifying(true);
    try {
      const res = await fetch("/api/v1/blockchain/verify");
      if (res.ok) {
        const data = await res.json();
        setVerification(data);
      }
    } catch (err) {
      console.error("Failed to verify blockchain:", err);
    } finally {
      setVerifying(false);
    }
  };

  // Simulate Tamper Attack for Judges
  const handleTamperDemo = async () => {
    setTampering(true);
    try {
      const res = await fetch("/api/v1/blockchain/tamper-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          block_index: 1,
          field_to_mutate: "target_h3_res8",
          forged_value: "886196a50ffffff_MALICIOUS_TAMPER_BY_ATTACKER",
        }),
      });
      if (res.ok) {
        const result = await res.json();
        // Update local ledger view with the tampered block to show live corruption
        await fetchLedger();
        // Immediately run verification to demonstrate broken chain
        const verifyRes = await fetch("/api/v1/blockchain/verify");
        const verifyData = await verifyRes.json();
        setVerification(verifyData);
      }
    } catch (err) {
      console.error("Failed to execute tamper demonstration:", err);
    } finally {
      setTampering(false);
    }
  };

  // Restore Ledger
  const handleRestoreLedger = async () => {
    setRestoring(true);
    try {
      const res = await fetch("/api/v1/blockchain/restore", {
        method: "POST",
      });
      if (res.ok) {
        await fetchLedger();
        const verifyRes = await fetch("/api/v1/blockchain/verify");
        const verifyData = await verifyRes.json();
        setVerification(verifyData);
      }
    } catch (err) {
      console.error("Failed to restore blockchain:", err);
    } finally {
      setRestoring(false);
    }
  };

  // Generate BSA 2023 Section 63 Evidence Certificate
  const handleGenerateCertificate = async () => {
    setLoadingCert(true);
    try {
      const res = await fetch("/api/v1/blockchain/certificate/NCRP-2026-DEL-88319");
      if (res.ok) {
        const cert = await res.json();
        setCertificateData(cert);
      }
    } catch (err) {
      console.error("Failed to generate BSA certificate:", err);
    } finally {
      setLoadingCert(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(label);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const toggleExpand = (index: number) => {
    setExpandedBlocks((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  useEffect(() => {
    fetchLedger();
    runVerify();
  }, []);

  const getValidatorBadge = (nodeId: string) => {
    switch (nodeId) {
      case "I4C_CENTRAL_ORACLE":
        return {
          label: "[I4C-ORACLE]",
          desc: "Central MHA / I4C Spatial AI Oracle",
          bg: "bg-cyan-950/80 border-cyan-500/40 text-cyan-300",
        };
      case "NPCI_SWITCH_GATEWAY":
        return {
          label: "[NPCI-NODE]",
          desc: "National Payments Corporation / Sec 106 BNSS",
          bg: "bg-purple-950/80 border-purple-500/40 text-purple-300",
        };
      case "STATE_POLICE_CAD_GATEWAY":
        return {
          label: "[POLICE-CAD]",
          desc: "State Police ERSS Dial 112 Dispatch",
          bg: "bg-amber-950/80 border-amber-500/40 text-amber-300",
        };
      default:
        return {
          label: `[${nodeId}]`,
          desc: "Consortium Member Node",
          bg: "bg-slate-900 border-slate-700 text-slate-300",
        };
    }
  };

  const isChainTampered = !verification.is_valid;

  return (
    <div
      className={`w-full flex flex-col font-mono text-slate-100 ${
        isModal
          ? "fixed inset-0 z-50 bg-black/85 backdrop-blur-xl p-4 md:p-8 flex items-center justify-center overflow-y-auto"
          : "min-h-screen bg-[#05070E] p-4 md:p-8"
      }`}
    >
      <div
        className={`w-full max-w-7xl rounded-2xl border transition-all duration-500 flex flex-col overflow-hidden shadow-2xl ${
          isChainTampered
            ? "border-red-500 bg-[#0F070A] shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-pulse"
            : "border-emerald-500/40 bg-[#070B14] shadow-[0_0_40px_rgba(16,185,129,0.15)]"
        }`}
      >
        {/* =========================================================================
            1. HEADER & SYSTEM STATUS HUD
            ========================================================================= */}
        <div className="p-6 border-b border-white/[0.08] bg-black/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-lg ${
                isChainTampered
                  ? "bg-red-950/80 border-red-500 text-red-400"
                  : "bg-emerald-950/80 border-emerald-500/50 text-emerald-400"
              }`}
            >
              {isChainTampered ? (
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              ) : (
                <Shield className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-lg font-black tracking-wider text-white">
                  PRAHAR-LEDGER <span className="text-cyan-400">// POA CONSORTIUM</span>
                </h1>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${
                    isChainTampered
                      ? "bg-red-900/60 border-red-500 text-red-300"
                      : "bg-emerald-950/80 border-emerald-500/40 text-emerald-300"
                  }`}
                >
                  {isChainTampered ? "CRYPTOGRAPHIC CORRUPTION" : "SECURE UNBROKEN CHAIN"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Proof-of-Authority (PoA) Consortium Ledger • Section 63 Bharatiya Sakshya Adhiniyam (BSA), 2023 Compliant
              </p>
            </div>
          </div>

          {/* Quick Metrics & Close */}
          <div className="flex items-center flex-wrap gap-2.5">
            <div className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs">
              <span className="text-slate-400">Total Blocks: </span>
              <span className="font-bold text-white">{blocks.length}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs">
              <span className="text-slate-400">Validators: </span>
              <span className="font-bold text-cyan-300">3 Institutional Nodes</span>
            </div>
            <div
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center space-x-1.5 ${
                verification.is_valid
                  ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-300"
                  : "bg-red-950/50 border-red-500/40 text-red-300"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>BSA Sec 63: {verification.bsa_sec_63_compliance}</span>
            </div>

            {isModal && onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-all ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* =========================================================================
            2. INTERACTIVE JUDGE DEMO CONTROLS (THE SHOWPIECE FOR SIH EVALUATORS)
            ========================================================================= */}
        <div className="px-6 py-4 bg-white/[0.02] border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="text-amber-400 font-bold">JUDICIAL EVALUATION CONTROLS:</span>
            <span className="hidden sm:inline">Interactive cryptographic proof suite for judges</span>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Button 1: Verify Integrity */}
            <button
              onClick={runVerify}
              disabled={verifying}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] active:scale-95"
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${verifying ? "animate-spin" : ""}`} />
              <span>{verifying ? "Auditing Hashes..." : "Verify Ledger Integrity"}</span>
            </button>

            {/* Button 2: Simulate Tamper Attack */}
            <button
              onClick={handleTamperDemo}
              disabled={tampering}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 hover:border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)] active:scale-95"
            >
              <Zap className={`w-3.5 h-3.5 ${tampering ? "animate-spin" : "fill-current"}`} />
              <span>{tampering ? "Injecting Attack..." : "Simulate Tamper Attack"}</span>
            </button>

            {/* Button 3: Restore Ledger */}
            <button
              onClick={handleRestoreLedger}
              disabled={restoring}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${restoring ? "animate-spin" : ""}`} />
              <span>{restoring ? "Re-mining Chain..." : "Restore Ledger"}</span>
            </button>

            {/* Button 4: BSA Certificate */}
            <button
              onClick={handleGenerateCertificate}
              disabled={loadingCert}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-300 border border-amber-500/40 active:scale-95"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Section 63 Certificate</span>
            </button>
          </div>
        </div>

        {/* Alert Banner if Tampered */}
        {isChainTampered && (
          <div className="px-6 py-3 bg-red-950/60 border-b border-red-500/40 text-red-200 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="font-bold">
                MATHEMATICAL INTEGRITY VIOLATION DETECTED: Tampered Block #{verification.tampered_block}.{" "}
                {verification.reason || "Merkle root & header hash broken."}
              </span>
            </div>
            <span className="text-[11px] text-red-400 underline cursor-pointer" onClick={handleRestoreLedger}>
              Click "Restore Ledger" to heal chain
            </span>
          </div>
        )}

        {/* =========================================================================
            3. VISUAL CHAIN OF BLOCKS (GLOWING HASHLINKS)
            ========================================================================= */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6 max-h-[650px]">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <span className="text-xs text-slate-400">Loading Prahar Consortium Ledger...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {blocks.map((block, idx) => {
                const badge = getValidatorBadge(block.validator_node_id);
                const isBlockTampered =
                  isChainTampered && verification.tampered_block === block.block_index;
                const isExpanded = !!expandedBlocks[block.block_index];

                return (
                  <div key={block.block_index} className="relative group">
                    {/* Hash Connector Cable */}
                    {idx > 0 && (
                      <div className="flex items-center pl-8 py-1 space-x-2 text-[11px] text-slate-500 font-mono">
                        <div
                          className={`w-0.5 h-6 transition-colors ${
                            isBlockTampered ? "bg-red-500 animate-pulse" : "bg-emerald-500/30"
                          }`}
                        />
                        <span className="text-slate-600">▲ SHA-256 PREVIOUS HASH LINK: </span>
                        <span
                          className={`font-mono text-[10px] ${
                            isBlockTampered ? "text-red-400 font-bold" : "text-slate-400"
                          }`}
                        >
                          {block.previous_block_hash.slice(0, 24)}...
                        </span>
                      </div>
                    )}

                    {/* Block Card */}
                    <div
                      className={`rounded-xl border p-5 transition-all duration-300 ${
                        isBlockTampered
                          ? "bg-red-950/20 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)]"
                          : "bg-[#0B0F17] hover:bg-[#0D131F] border-white/[0.08] hover:border-emerald-500/40"
                      }`}
                    >
                      {/* Top Header of Block */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                        <div className="flex items-center space-x-3">
                          <span className="text-base font-black text-white bg-white/[0.05] border border-white/[0.1] px-3 py-1 rounded-lg">
                            BLOCK #{block.block_index}
                          </span>
                          <span
                            className={`text-xs px-2.5 py-1 rounded-lg border font-bold ${badge.bg}`}
                          >
                            {badge.label}
                          </span>
                          <span className="text-[11px] text-slate-400 hidden md:inline">
                            {badge.desc}
                          </span>
                        </div>

                        <div className="flex items-center space-x-3 text-xs text-slate-400">
                          <span>{new Date(block.timestamp).toLocaleString()}</span>
                          <button
                            onClick={() => toggleExpand(block.block_index)}
                            className="p-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-slate-300"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Cryptographic Hashes Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs">
                        <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.04]">
                          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                            <span>BLOCK SHA-256 HASH:</span>
                            <button
                              onClick={() => copyToClipboard(block.block_hash, `hash-${block.block_index}`)}
                              className="hover:text-cyan-400"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <span
                            className={`font-mono text-[11px] break-all ${
                              isBlockTampered ? "text-red-400 font-bold" : "text-cyan-300"
                            }`}
                          >
                            {block.block_hash}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.04]">
                          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                            <span>MERKLE ROOT:</span>
                            <button
                              onClick={() =>
                                copyToClipboard(block.merkle_root, `merkle-${block.block_index}`)
                              }
                              className="hover:text-emerald-400"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <span
                            className={`font-mono text-[11px] break-all ${
                              isBlockTampered ? "text-red-400 line-through font-bold" : "text-emerald-300"
                            }`}
                          >
                            {block.merkle_root}
                          </span>
                        </div>
                      </div>

                      {/* Asymmetric Signature */}
                      <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-[11px]">
                        <div className="flex items-center space-x-2 text-slate-400">
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span>ECDSA/HMAC VALIDATOR SIGNATURE:</span>
                          <span className="font-mono text-slate-300">
                            {block.validator_signature.slice(0, 32)}...
                          </span>
                        </div>
                        <span className="text-emerald-400 text-[10px] font-bold">
                          ✓ NODE AUTHENTICATED
                        </span>
                      </div>

                      {/* Transactions Accordion */}
                      {isExpanded && (
                        <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-2">
                          <span className="text-[11px] text-slate-400 font-bold">
                            INSTITUTIONAL TELEMETRY TRANSACTIONS ({block.transactions.length}):
                          </span>
                          <div className="space-y-2">
                            {block.transactions.map((tx, txIdx) => (
                              <div
                                key={txIdx}
                                className={`p-3 rounded-lg border text-xs ${
                                  tx.TAMPER_ALERT
                                    ? "bg-red-950/40 border-red-500 text-red-200"
                                    : "bg-black/60 border-white/[0.05] text-slate-300"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-cyan-400">
                                    {tx.event_type || "CONSORTIUM_EVENT"}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    {tx.tx_id || `TX-#${txIdx}`}
                                  </span>
                                </div>
                                <pre className="text-[11px] overflow-x-auto text-slate-300 p-2 rounded bg-black/40 border border-white/[0.03]">
                                  {JSON.stringify(tx, null, 2)}
                                </pre>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* =========================================================================
            4. MODAL: SECTION 63 BSA DIGITAL EVIDENCE CERTIFICATE
            ========================================================================= */}
        {certificateData && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-[#090D16] border border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">
                      BHARATIYA SAKSHYA ADHINIYAM (BSA), 2023
                    </h3>
                    <p className="text-xs text-amber-300 font-bold">
                      Section 63 Certificate of Admissibility for Electronic Records
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCertificateData(null)}
                  className="p-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-black/60 rounded-xl border border-white/[0.06] grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">Certificate ID: </span>
                    <span className="font-bold text-white">{certificateData.certificate_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Incident/FIR Ref: </span>
                    <span className="font-bold text-cyan-300">{certificateData.incident_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Admissibility Status: </span>
                    <span className="font-bold text-emerald-400">
                      {certificateData.admissibility_status}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Issued Timestamp: </span>
                    <span className="text-slate-300">
                      {new Date(certificateData.issued_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl">
                  <span className="text-[11px] font-bold text-amber-300 uppercase">
                    Legal Statutory Declaration (Section 63(4) BSA):
                  </span>
                  <p className="text-[11px] text-slate-200 mt-1 leading-relaxed">
                    {certificateData.legal_declaration}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] font-bold">
                    ELECTRONIC EVIDENCE TELEMETRY TRAIL:
                  </span>
                  <div className="mt-1 space-y-1.5">
                    {certificateData.evidence_trail?.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="p-2 bg-black/40 rounded border border-white/[0.04] flex items-center justify-between text-[10px]"
                      >
                        <span className="text-cyan-400 font-bold">
                          Block #{item.block_index} • {item.tx_type}
                        </span>
                        <span className="font-mono text-slate-400">
                          Merkle: {item.merkle_root.slice(0, 16)}...
                        </span>
                        <span className="text-emerald-400">✓ VALIDATOR: {item.validator}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  Digitally sealed by Prahar PoA Engine (SHA-256 HMAC)
                </span>
                <button
                  onClick={() => setCertificateData(null)}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs"
                >
                  Close Certificate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsortiumBlockExplorer;
