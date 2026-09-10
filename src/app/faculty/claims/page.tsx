"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFacultyDashboardData } from "@/app/actions/dashboard";
import { deleteClaim, getClaimDetailsWithHistory } from "@/app/actions/claims";
import { WORKFLOW_STAGES } from "@/lib/constants";
import { ClaimPrintModal } from "@/components/claims/claim-print-modal";
import {
  FileText,
  Search,
  Filter,
  ChevronRight,
  Plus,
  Sparkles,
  BookOpen,
  BookMarked,
  Wrench,
  BarChart3,
  FlaskConical,
  XCircle,
  Trash2,
  Printer,
  Edit3,
} from "lucide-react";

type FacultyClaim = {
  id: string;
  number: string;
  type: string;
  title: string;
  status: string;
  claimedAmount: number;
  calculatedAmount: number;
  approvedAmount: number;
  date: string;
  currentStage?: string;
};

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-700 border-slate-200" },
  SUBMITTED: { label: "Submitted", className: "bg-blue-50 text-blue-700 border-blue-200" },
  UNDER_VERIFICATION: {
    label: "Under Verification",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  VERIFIED: { label: "Verified", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  RETURNED: { label: "Returned", className: "bg-rose-50 text-[#b91c1c] border-red-200" },
  RESUBMITTED: { label: "Resubmitted", className: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  APPROVED: { label: "Approved", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

function getCategoryIcon(typeStr: string) {
  const lower = (typeStr || "").toLowerCase();
  if (lower.includes("paper")) return FileText;
  if (lower.includes("book chapter")) return BookMarked;
  if (lower.includes("book")) return BookOpen;
  if (lower.includes("patent")) return Wrench;
  if (lower.includes("citation")) return BarChart3;
  if (lower.includes("project") || lower.includes("grant")) return FlaskConical;
  return FileText;
}

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function FacultyClaimsPage() {
  const [claims, setClaims] = useState<FacultyClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Print Sanction Modal State
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedPrintClaim, setSelectedPrintClaim] = useState<any>(null);
  const [loadingPrintClaim, setLoadingPrintClaim] = useState(false);

  const handlePrintClaim = async (e: React.MouseEvent, claimId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setLoadingPrintClaim(true);
    try {
      const res = await getClaimDetailsWithHistory(claimId);
      if (res.success && res.claim) {
        setSelectedPrintClaim(res.claim);
        setPrintModalOpen(true);
      } else {
        alert(res.error || "Failed to load claim details for printing.");
      }
    } catch {
      alert("Error loading claim details.");
    } finally {
      setLoadingPrintClaim(false);
    }
  };

  useEffect(() => {
    getFacultyDashboardData().then((res) => {
      if (res.success) setClaims((res.claims || []) as FacultyClaim[]);
      setLoading(false);
    });
  }, []);

  const handleDeleteClaim = async (e: React.MouseEvent, claimId: string, claimNum: string) => {
    e.preventDefault();
    e.stopPropagation();
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

  const claimTypes = useMemo(
    () => Array.from(new Set(claims.map((claim) => claim.type))).sort(),
    [claims]
  );

  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      const term = search.toLowerCase();
      const matchesSearch =
        (claim.title || "").toLowerCase().includes(term) ||
        (claim.number || "").toLowerCase().includes(term);
      const matchesStatus = statusFilter === "ALL" || claim.status === statusFilter;
      const matchesType = typeFilter === "ALL" || claim.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [claims, search, statusFilter, typeFilter]);

  const hasActiveFilters = search !== "" || statusFilter !== "ALL" || typeFilter !== "ALL";

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* ═══════════ TOP HEADER ═══════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
              My Claims
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-[#b91c1c] border border-red-200">
              <Sparkles className="w-3 h-3 mr-1" /> Research Incentive Portal
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            View, track, and manage all your research incentive claim submissions
          </p>
        </div>

        <Link
          href="/faculty/new-claim"
          className={cn(
            buttonVariants({}),
            "bg-[#b91c1c] hover:bg-[#991b1b] text-white font-bold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center shrink-0"
          )}
        >
          <Plus className="mr-2 h-4 w-4 stroke-[3]" />
          New Claim
        </Link>
      </div>

      {/* ═══════════ SEARCH & FILTER BAR ═══════════ */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by Claim ID or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-slate-50 border-slate-200/80 rounded-xl focus:bg-white text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "ALL")}>
            <SelectTrigger className="w-full sm:w-52 h-11 bg-slate-50 border-slate-200/80 rounded-xl text-sm font-medium text-slate-700">
              <Filter className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {Object.entries(STATUS_MAP).map(([key, val]) => (
                <SelectItem key={key} value={key}>
                  {val.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val || "ALL")}>
            <SelectTrigger className="w-full sm:w-48 h-11 bg-slate-50 border-slate-200/80 rounded-xl text-sm font-medium text-slate-700">
              <SelectValue placeholder="All Claim Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Claim Types</SelectItem>
              {claimTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters Clear Indicator */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Showing <strong className="text-slate-900">{filteredClaims.length}</strong> of{" "}
              {claims.length} claims
            </span>
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setTypeFilter("ALL");
              }}
              className="text-[#b91c1c] font-semibold hover:underline"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* ═══════════ CLAIMS LIST CONTAINER ═══════════ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Submitted Claims</h2>
            <p className="text-xs text-slate-500">
              {loading
                ? "Loading claims..."
                : `${filteredClaims.length} Claim${filteredClaims.length !== 1 ? "s" : ""} found`}
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-16 text-slate-400 font-mono text-sm space-y-2">
              <p className="animate-pulse">Loading your research claims...</p>
            </div>
          ) : filteredClaims.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-4 text-slate-400">
                <FileText className="h-8 w-8 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Claims Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                {hasActiveFilters
                  ? "No research claims match your search filters. Try clearing filters to view all submissions."
                  : "You haven't submitted any research incentive claims yet."}
              </p>
              {!hasActiveFilters && (
                <Link
                  href="/faculty/new-claim"
                  className={cn(
                    buttonVariants({}),
                    "bg-[#b91c1c] hover:bg-[#991b1b] text-white font-bold px-5 py-2.5 rounded-xl shadow-md inline-flex items-center"
                  )}
                >
                  <Plus className="mr-2 h-4 w-4 stroke-[3]" />
                  Create First Claim
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClaims.map((claim) => {
                const status = STATUS_MAP[claim.status] || STATUS_MAP.DRAFT;
                const stageInfo =
                  WORKFLOW_STAGES[claim.currentStage || ""] || WORKFLOW_STAGES.HOD_PRINCIPAL;
                const TypeIcon = getCategoryIcon(claim.type);

                return (
                  <Link
                    key={claim.id}
                    href={`/faculty/claims/${claim.id}`}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-white hover:bg-slate-50/80 hover:border-slate-300 hover:shadow-md transition-all duration-200 group"
                  >
                    {/* Left Meta Info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#b91c1c] border border-red-200/60 shrink-0 group-hover:scale-105 transition-transform">
                        <TypeIcon className="h-5 w-5 stroke-[2.2]" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-extrabold text-[#b91c1c]">
                            {claim.number}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {claim.type}
                          </span>
                          {claim.date && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-xs text-slate-500 font-mono">
                                {claim.date}
                              </span>
                            </>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#b91c1c] transition-colors truncate">
                          {claim.title || "Untitled Research Claim"}
                        </h3>
                      </div>
                    </div>

                    {/* Right Side: Status, Amount & Action Link */}
                    <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                      {/* Amount & Workflow Stage */}
                      <div className="text-left md:text-right">
                        <p className="text-base font-extrabold text-slate-900 font-mono tracking-tight">
                          {formatInr(claim.claimedAmount || 0)}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {claim.status === "APPROVED"
                            ? "Sanctioned"
                            : `Pending: ${stageInfo?.shortName || "Verification"}`}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "px-3 py-1 text-xs font-bold rounded-full border shadow-2xs",
                            status.className
                          )}
                        >
                          {status.label}
                        </Badge>

                        {/* Actions: Print (Approved/Verified only), Edit (Returned only), Details & Delete */}
                        <div className="flex items-center gap-2">
                          {(claim.status === "APPROVED" || claim.status === "VERIFIED") && (
                            <button
                              type="button"
                              onClick={(e) => handlePrintClaim(e, claim.id)}
                              disabled={loadingPrintClaim}
                              className="p-1.5 rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 transition-colors flex items-center gap-1 text-xs font-semibold"
                              title="Print Official Sanction Order (PDF)"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline text-[11px]">Print</span>
                            </button>
                          )}

                          {claim.status === "RETURNED" && (
                            <Link
                              href={`/faculty/claims/${claim.id}/edit`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg border bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 transition-colors flex items-center gap-1 text-xs font-semibold"
                              title="Edit & Resubmit Claim"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline text-[11px]">Edit & Resubmit</span>
                            </Link>
                          )}

                          <div className="inline-flex items-center text-xs font-bold text-[#b91c1c] group-hover:translate-x-0.5 transition-transform">
                            Details <ChevronRight className="w-4 h-4 ml-0.5 stroke-[2.5]" />
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteClaim(e, claim.id, claim.number)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                            title="Delete Claim"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ClaimPrintModal
        open={printModalOpen}
        onOpenChange={setPrintModalOpen}
        claim={selectedPrintClaim}
      />
    </div>
  );
}
