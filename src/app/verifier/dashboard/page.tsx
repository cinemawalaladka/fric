"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardHeader, StatCard } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getVerifierDashboardData } from "@/app/actions/dashboard";
import { STAGE_SEQUENCE, WORKFLOW_STAGES, type VerifierStageOption } from "@/lib/constants";
import { FileText, CheckCircle2, RotateCcw, Clock, ArrowRight, Eye, ShieldCheck, Layers, ArrowUpRight, ChevronRight } from "lucide-react";

type VerifierClaim = {
  id: string;
  number: string;
  faculty: string;
  department: string;
  type: string;
  title: string;
  status: string;
  currentStage: string;
  amount: number;
  submitted: string;
};

type Stats = {
  pendingAtMyStage: number;
  pendingTotal: number;
  verified: number;
  returned: number;
  reviewed: number;
};

export default function VerifierDashboardPage() {
  const [claims, setClaims] = useState<VerifierClaim[]>([]);
  const [stats, setStats] = useState<Stats>({ pendingAtMyStage: 0, pendingTotal: 0, verified: 0, returned: 0, reviewed: 0 });
  const [stageInfo, setStageInfo] = useState<VerifierStageOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("MY_STAGE");

  useEffect(() => {
    getVerifierDashboardData().then((res) => {
      if (res.success && res.claims) {
        setClaims((res.claims || []) as VerifierClaim[]);
        setStats((res.stats || { pendingAtMyStage: 0, pendingTotal: 0, verified: 0, returned: 0, reviewed: 0 }) as unknown as Stats);
        setStageInfo((res as any).verifierStageInfo || null);
      }
      setLoading(false);
    });
  }, []);

  const myStageCode = stageInfo?.code || "HOD_PRINCIPAL";

  // Filtered claims based on active tab
  const filteredClaims = useMemo(() => {
    if (activeTab === "MY_STAGE") {
      return myStageCode === "ALL" ? claims : claims.filter((c) => c.currentStage === myStageCode);
    }
    if (activeTab === "ALL_PENDING") return claims;
    return claims.filter((c) => c.currentStage === activeTab);
  }, [claims, activeTab, myStageCode]);

  const statCards = [
    {
      label: `Action Needed (${stageInfo?.shortName || "My Stage"})`,
      value: stats.pendingAtMyStage,
      description: "Claims awaiting your action",
    },
    {
      label: "Total Pending (All Stages)",
      value: stats.pendingTotal,
      description: "In workflow pipeline",
    },
    {
      label: "Verified & Passed Forward",
      value: stats.verified,
      description: "Successfully verified",
    },
    {
      label: "Returned to Faculty",
      value: stats.returned,
      description: "Sent back for revision",
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <DashboardHeader
        title="Verifier Dashboard"
        description="Review and verify multi-stage research incentive claims"
      >
        {stageInfo && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
            <ShieldCheck className="h-4 w-4 text-amber-500" />
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Assigned Role</p>
              <p className="text-xs font-semibold text-foreground">{stageInfo.title}</p>
            </div>
          </div>
        )}
      </DashboardHeader>

      {/* ═══════════ 5-STAGE SEQUENTIAL PIPELINE (PURE SINGLE-LINE STEPPER) ═══════════ */}
      <div className="bg-white border border-slate-200 p-2 sm:p-2.5 overflow-x-auto shadow-xs">
        <div className="flex items-center justify-between min-w-[720px] w-full gap-2">
          {STAGE_SEQUENCE.filter((code) => code !== "APPROVED").map((stageCode, index, arr) => {
            const stage = WORKFLOW_STAGES[stageCode];
            const isMyAssignedStage = myStageCode === "ALL" || myStageCode === stageCode;
            const pendingCount = claims.filter((c) => c.currentStage === stageCode).length;

            return (
              <div key={stageCode} className="flex items-center gap-2 flex-1 last:flex-initial">
                <div
                  className={cn(
                    "flex items-center justify-center gap-2.5 px-4 py-2 border text-xs transition-all w-full",
                    isMyAssignedStage
                      ? "bg-slate-900 text-white border-slate-900 font-semibold shadow-2xs"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  )}
                  title={`${stage.title}: ${stage.description}`}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center text-[11px] font-mono font-bold shrink-0",
                      isMyAssignedStage
                        ? "bg-white text-slate-900"
                        : "bg-slate-200 text-slate-700"
                    )}
                  >
                    {index + 1}
                  </span>

                  <span className="font-semibold truncate">
                    {stage.shortName}
                  </span>
                </div>

                {index < arr.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════ UNIFIED VERIFIER METRIC STRIP (SHARP TABLE BAR, ZERO ICONS) ═══════════ */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="p-4 sm:p-5 flex flex-col justify-center transition-colors hover:bg-slate-50/60"
            >
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                {stat.label}
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                {stat.value}
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 hidden sm:inline-block">
                {stat.description}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════ CLAIMS REQUIRING VERIFICATION DATA TABLE ═══════════ */}
      <div className="bg-white border border-slate-200 overflow-hidden">
        {/* Table Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Claims Requiring Verification
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {stageInfo?.title || "Verification queue"}
            </p>
          </div>

          <Link
            href="/verifier/claims"
            className="text-xs font-semibold text-slate-700 hover:text-slate-950 transition-colors uppercase tracking-wider underline underline-offset-4"
          >
            View Full List
          </Link>
        </div>

        {/* Stage Filter Tabs Strip */}
        <div className="flex flex-wrap items-center gap-1.5 px-6 py-2.5 border-b border-slate-200 bg-slate-50/40">
          <button
            onClick={() => setActiveTab("MY_STAGE")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold transition-colors border cursor-pointer",
              activeTab === "MY_STAGE"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
            )}
          >
            Action Needed at My Stage ({stats.pendingAtMyStage})
          </button>

          <button
            onClick={() => setActiveTab("ALL_PENDING")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors border cursor-pointer",
              activeTab === "ALL_PENDING"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
            )}
          >
            All Pending Stages ({stats.pendingTotal})
          </button>

          {STAGE_SEQUENCE.filter((code) => code !== "APPROVED").map((stgCode) => {
            const stgInfo = WORKFLOW_STAGES[stgCode];
            const count = claims.filter((c) => c.currentStage === stgCode).length;
            if (count === 0) return null;

            return (
              <button
                key={stgCode}
                onClick={() => setActiveTab(stgCode)}
                className={cn(
                  "px-2.5 py-1.5 text-xs font-medium transition-colors border cursor-pointer flex items-center gap-1.5",
                  activeTab === stgCode
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                )}
              >
                <span>{stgInfo?.shortName || stgCode}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-200/60 text-slate-700">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Loading verification claims...
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="py-14 text-center text-slate-500">
            <p className="text-sm font-medium text-slate-800">
              No Claims Pending at This Selection
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === "MY_STAGE"
                ? `All claims for ${stageInfo?.shortName || "your stage"} have been processed!`
                : "No claims found for the selected stage filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90">
                  <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    CLAIM ID
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    FACULTY / DEPT
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    RESEARCH TITLE
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    SUBMITTED ON
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    STAGE
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase text-right">
                    INCENTIVE
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase text-right">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredClaims.map((claim) => {
                  const stgConfig =
                    WORKFLOW_STAGES[claim.currentStage] || WORKFLOW_STAGES.HOD_PRINCIPAL;
                  const isMyCurrentStage =
                    myStageCode === "ALL" || claim.currentStage === myStageCode;

                  return (
                    <tr
                      key={claim.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* CLAIM ID */}
                      <td className="px-6 py-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {claim.number}
                      </td>

                      {/* FACULTY / DEPT */}
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-semibold text-slate-900 block truncate max-w-[200px]">
                            {claim.faculty}
                          </span>
                          <span className="text-xs text-slate-500 truncate block max-w-[200px] mt-0.5">
                            {claim.department}
                          </span>
                        </div>
                      </td>

                      {/* RESEARCH TITLE */}
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-semibold text-slate-900 block truncate max-w-[240px]">
                            {claim.title}
                          </span>
                          <span className="text-xs text-slate-500 truncate block max-w-[240px] mt-0.5">
                            {claim.type}
                          </span>
                        </div>
                      </td>

                      {/* SUBMITTED ON */}
                      <td className="px-6 py-4 text-slate-600 text-xs font-medium whitespace-nowrap">
                        {claim.submitted}
                      </td>

                      {/* STAGE */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 text-xs font-semibold border",
                            isMyCurrentStage
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-100 text-slate-800 border-slate-200"
                          )}
                        >
                          {stgConfig.shortName}
                        </span>
                      </td>

                      {/* INCENTIVE AMOUNT */}
                      <td className="px-6 py-4 text-right font-bold text-slate-900 font-mono">
                        ₹{claim.amount.toLocaleString("en-IN")}
                      </td>

                      {/* ACTION */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Link
                          href={`/verifier/claims/${claim.id}`}
                          className={cn(
                            "inline-flex items-center px-3.5 py-1.5 text-xs font-semibold transition-colors border",
                            isMyCurrentStage
                              ? "bg-slate-900 hover:bg-slate-800 text-white border-slate-900 shadow-2xs"
                              : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                          )}
                        >
                          {isMyCurrentStage ? "Review & Verify" : "View Details"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
