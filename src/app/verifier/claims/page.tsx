"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Eye, Clock, Layers, ShieldCheck, CheckCircle2, Trash2 } from "lucide-react";
import { getVerifierDashboardData } from "@/app/actions/dashboard";
import { deleteClaim } from "@/app/actions/claims";
import { STAGE_SEQUENCE, WORKFLOW_STAGES, type VerifierStageOption } from "@/lib/constants";

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

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  SUBMITTED: { label: "Submitted", className: "bg-blue-400/10 text-blue-400 border-blue-400/20" },
  UNDER_VERIFICATION: { label: "Under Verification", className: "bg-amber-400/10 text-amber-400 border-amber-400/20" },
  RESUBMITTED: { label: "Resubmitted", className: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20" },
  VERIFIED: { label: "Verified Stage", className: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" },
};

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export default function VerifierClaimsPage() {
  const [claims, setClaims] = useState<VerifierClaim[]>([]);
  const [stageInfo, setStageInfo] = useState<VerifierStageOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [stageFilter, setStageFilter] = useState("ALL");

  useEffect(() => {
    getVerifierDashboardData().then((res) => {
      if (res.success) {
        setClaims((res.claims || []) as VerifierClaim[]);
        setStageInfo(res.verifierStageInfo || null);
      }
      setLoading(false);
    });
  }, []);

  const handleDeleteClaim = async (claimId: string, claimNum: string) => {
    if (!confirm(`Are you sure you want to delete claim ${claimNum}? This action cannot be undone.`)) {
      return;
    }
    const res = await deleteClaim(claimId);
    if (res.success) {
      setClaims((prev) => prev.filter((c) => c.id !== claimId));
    } else {
      alert(res.error || "Failed to delete claim.");
    }
  };

  const isSuperAdmin = stageInfo?.code === "ALL";
  const claimTypes = useMemo(() => Array.from(new Set(claims.map((claim) => claim.type))).sort(), [claims]);

  const filtered = claims.filter((claim) => {
    const term = search.toLowerCase();
    const match =
      claim.title.toLowerCase().includes(term) ||
      claim.faculty.toLowerCase().includes(term) ||
      claim.number.toLowerCase().includes(term);
    const typeMatch = typeFilter === "ALL" || claim.type === typeFilter;
    const stageMatch = !isSuperAdmin || stageFilter === "ALL" || claim.currentStage === stageFilter;
    return match && typeMatch && stageMatch;
  });

  return (
    <div className="animate-fade-in space-y-6">
      <DashboardHeader
        title="Claims for Verification"
        description="Review and verify multi-stage research incentive claims"
      >
        {stageInfo && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-xl shadow-xs">
            <ShieldCheck className="h-4 w-4 text-amber-500" />
            <div>
              <p className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Active Verification Stage</p>
              <p className="text-xs font-semibold text-foreground">{stageInfo.title}</p>
            </div>
          </div>
        )}
      </DashboardHeader>

      {/* Stage filter pills - Only visible for Super Admin with global access */}
      {isSuperAdmin && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStageFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              stageFilter === "ALL"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/40 hover:bg-accent border-border/50 text-muted-foreground"
            }`}
          >
            <Layers className="h-3.5 w-3.5" /> All Stages ({claims.length})
          </button>

          {STAGE_SEQUENCE.filter((code) => code !== "APPROVED").map((stgCode) => {
            const stgInfo = WORKFLOW_STAGES[stgCode];
            const count = claims.filter((c) => c.currentStage === stgCode).length;
            const isActive = stageFilter === stgCode;

            return (
              <button
                key={stgCode}
                onClick={() => setStageFilter(stgCode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                    : "bg-muted/40 hover:bg-accent border-border/50 text-muted-foreground"
                }`}
              >
                <span>{stgInfo?.shortName || stgCode}</span>
                <span className="bg-background/60 px-1.5 py-0.2 rounded text-[10px] font-mono">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="glass-card border-border/40">
        <CardContent className="pt-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, faculty name, or claim number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-input/50 border-border/50"
              />
            </div>
            <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val || "ALL")}>
              <SelectTrigger className="w-full sm:w-48 bg-input/50 border-border/50">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Claim Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                {claimTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Claims Table / List */}
      {/* Claims Data Table */}
      <div className="bg-white border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              {loading
                ? "Loading claims..."
                : `${filtered.length} Claim${filtered.length !== 1 ? "s" : ""} Awaiting Verification`}
            </h3>
            {stageInfo && !isSuperAdmin && (
              <p className="text-xs text-slate-500 mt-0.5">
                Showing only claims pending at {stageInfo.shortName}
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-sm text-slate-500">
            Fetching pending claims...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14 text-slate-500 space-y-1">
            <p className="text-sm font-medium text-slate-800">
              No claims pending at your verification stage.
            </p>
            <p className="text-xs text-slate-400">
              {isSuperAdmin
                ? "All workflow queues are clear."
                : `Any new claims forwarded to ${stageInfo?.shortName || "your stage"} will appear here.`}
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
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((claim) => {
                  const stageCfg =
                    WORKFLOW_STAGES[claim.currentStage] || WORKFLOW_STAGES.HOD_PRINCIPAL;

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
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold border bg-slate-100 text-slate-800 border-slate-200">
                          {stageCfg.shortName}
                        </span>
                      </td>

                      {/* INCENTIVE AMOUNT */}
                      <td className="px-6 py-4 text-right font-bold text-slate-900 font-mono">
                        {formatInr(claim.amount)}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <Link
                            href={`/verifier/claims/${claim.id}`}
                            className="inline-flex items-center px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold border border-slate-900 transition-colors shadow-2xs"
                          >
                            Review & Verify
                          </Link>
                          {isSuperAdmin && (
                            <button
                              onClick={() =>
                                handleDeleteClaim(claim.id, claim.number)
                              }
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-200 cursor-pointer"
                              title="Delete Claim"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
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
