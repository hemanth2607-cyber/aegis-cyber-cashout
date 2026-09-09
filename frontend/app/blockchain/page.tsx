// frontend/app/blockchain/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ConsortiumBlockExplorer from "../../components/ConsortiumBlockExplorer";

export default function BlockchainPage() {
  return (
    <div className="min-h-screen bg-[#05070E] flex flex-col">
      {/* Mini Breadcrumb Navigation Bar */}
      <div className="h-12 border-b border-white/[0.08] bg-[#070B14] px-6 flex items-center justify-between text-xs font-mono">
        <Link
          href="/dashboard"
          className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tactical Cashout Console</span>
        </Link>
        <span className="text-slate-400">
          PERVEKKALA // SIH26184 CONSORTIUM BLOCKCHAIN NETWORK
        </span>
      </div>

      <div className="flex-1">
        <ConsortiumBlockExplorer isModal={false} />
      </div>
    </div>
  );
}
