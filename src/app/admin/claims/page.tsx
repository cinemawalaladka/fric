"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardHeader } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileSearch,
  Loader2,
  AlertTriangle,
  Trash2,
  Eye,
  Search,
  IndianRupee,
  Clock,
  CheckCircle2,
  RotateCcw,
  Layers,
  Filter,
  Flame,
  ShieldAlert,
  Printer,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { deleteClaim, getClaimDetailsWithHistory } from "@/app/actions/claims";
import { wipeoutAllClaimsAndDocuments, getAdminAllClaims, seedDemoClaims } from "@/app/actions/admin";
import { resolveClaimTitle } from "@/lib/utils";
import { ClaimPrintModal } from "@/components/claims/claim-print-modal";
import { format } from "date-fns";
import Link from "next/link";

interface Claim {
  id: string;
  claim_number: string;
  status: string;
  current_stage: string | null;
  claimed_amount: string;
  calculated_amount: string;
  approved_amount: string | null;
  submitted_at: string | null;
  created_at: string;
  faculty: {
    name: string;
    email: string;
    designation: string;
    department: {
      name: string;
      code: string;
    } | null;
  } | null;
  claim_type: {
    name: string;
    code: string;
  } | null;
  resolvedTitle?: string;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
  DRAFT: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20", label: "Draft" },
  SUBMITTED: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", label: "Submitted" },
  UNDER_VERIFICATION: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20", label: "In Review" },
  VERIFIED: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", label: "Verified" },
  APPROVED: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20", label: "Approved" },
  RETURNED: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", label: "Returned" },
  REJECTED: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", label: "Rejected" },
};

function formatInr(amount: number | string | null) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Wipeout Modal States
  const [isWipeoutOpen, setIsWipeoutOpen] = useState(false);
  const [wipeoutConfirmText, setWipeoutConfirmText] = useState("");
  const [wipingOut, setWipingOut] = useState(false);
  const [wipeoutSuccessMsg, setWipeoutSuccessMsg] = useState<string | null>(null);

  // Print Modal States
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedPrintClaim, setSelectedPrintClaim] = useState<any>(null);
  const [loadingPrintClaim, setLoadingPrintClaim] = useState(false);

  const handlePrintClaim = async (claimId: string) => {
    setLoadingPrintClaim(true);
    try {
      const res = await getClaimDetailsWithHistory(claimId);
      if (res.success && res.claim) {
        setSelectedPrintClaim(res.claim);
        setPrintModalOpen(true);
      } else {
        alert(res.error || "Failed to fetch claim details for printing.");
      }
    } catch {
      alert("Error loading claim details.");
    } finally {
      setLoadingPrintClaim(false);
    }
  };

  const fetchClaims = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminAllClaims();

      if (!res.success) {
        setError(res.error || "Failed to load claims from database.");
      } else {
        const enriched = ((res.claims || []) as any[]).map((c: any) => ({
          ...c,
          resolvedTitle: resolveClaimTitle(c),
        }));
        setClaims(enriched);
      }
    } catch {
      setError("An unexpected error occurred while fetching claims.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClaim = async (claimId: string, claimNum: string) => {
    if (!confirm(`Are you sure you want to permanently delete claim ${claimNum}? This will remove all associated documents, calculation snapshots, and approval trails.`)) {
      return;
    }
    const res = await deleteClaim(claimId);
    if (res.success) {
      setClaims((prev) => prev.filter((c) => c.id !== claimId));
    } else {
      alert(res.error || "Failed to delete claim.");
    }
  };

  const handleCompleteWipeout = async () => {
    if (wipeoutConfirmText !== "WIPEOUT") {
      alert("Please type WIPEOUT to confirm database purge.");
      return;
    }

    setWipingOut(true);
    try {
      const res = await wipeoutAllClaimsAndDocuments();
      if (res.success) {
        setIsWipeoutOpen(false);
        setWipeoutConfirmText("");
        setClaims([]);
        setWipeoutSuccessMsg(
          `Database Cleaned: Successfully purged ${res.deletedClaimsCount} claims and ${res.deletedDocsCount} documents from the system.`
        );
        setTimeout(() => setWipeoutSuccessMsg(null), 6000);
      } else {
        alert(res.error || "Wipeout failed.");
      }
    } catch {
      alert("An unexpected error occurred during system wipeout.");
    } finally {
      setWipingOut(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const filteredClaims = useMemo(() => {
    return claims.filter((c) => {
      const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        c.claim_number.toLowerCase().includes(q) ||
        (c.resolvedTitle && c.resolvedTitle.toLowerCase().includes(q)) ||
        (c.faculty?.name && c.faculty.name.toLowerCase().includes(q)) ||
        (c.faculty?.email && c.faculty.email.toLowerCase().includes(q)) ||
        (c.claim_type?.name && c.claim_type.name.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [claims, statusFilter, search]);

  const metrics = useMemo(() => {
    let totalClaimed = 0;
    let totalApproved = 0;
    let pendingCount = 0;
    let approvedCount = 0;

    claims.forEach((c) => {
      const cl = parseFloat(c.claimed_amount) || 0;
      const ap = parseFloat(c.approved_amount || "0") || 0;
      totalClaimed += cl;
      if (c.status === "APPROVED") {
        totalApproved += (ap || cl);
        approvedCount++;
      }
      if (["SUBMITTED", "UNDER_VERIFICATION", "RESUBMITTED"].includes(c.status)) {
        pendingCount++;
      }
    });

    return { totalCount: claims.length, totalClaimed, totalApproved, pendingCount, approvedCount };
  }, [claims]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Institutional Claims Governance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Comprehensive audit, oversight, and status tracking for all faculty research claims
          </p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            setWipeoutConfirmText("");
            setIsWipeoutOpen(true);
          }}
          className="gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white shadow-xs rounded-none"
        >
          <Flame className="h-3.5 w-3.5" />
          Complete Wipeout
        </Button>
      </div>

      {/* Wipeout Success Alert */}
      {wipeoutSuccessMsg && (
        <div className="border border-emerald-300 bg-emerald-50 text-emerald-800 p-4 flex items-center gap-3 text-xs font-semibold">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <p>{wipeoutSuccessMsg}</p>
        </div>
      )}

      {/* ═══════════ UNIFIED KPI METRIC STRIP (SHARP TABLE BAR) ═══════════ */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          <div className="p-4 sm:p-5 flex flex-col justify-center hover:bg-slate-50/60 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Claims</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight mt-1">
              {metrics.totalCount}
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5">Across all university faculties</span>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-center hover:bg-slate-50/60 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">In Review Pipeline</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight mt-1">
              {metrics.pendingCount}
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5">Awaiting committee/provost action</span>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-center hover:bg-slate-50/60 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sanctioned Payout</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight mt-1">
              {formatInr(metrics.totalApproved)}
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5">{metrics.approvedCount} approved claims</span>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-center hover:bg-slate-50/60 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Claimed</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight mt-1">
              {formatInr(metrics.totalClaimed)}
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5">Gross requested incentive sum</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar (Sharp Toolbar) */}
      <div className="bg-white border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search claim #, title, claimant name, or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50/50 border-slate-200 text-xs h-9 rounded-none"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mr-1">Status:</span>
            {["ALL", "SUBMITTED", "UNDER_VERIFICATION", "VERIFIED", "APPROVED", "RETURNED", "DRAFT"].map((st) => {
              const isSelected = statusFilter === st;
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-xs font-semibold transition-colors border ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {st === "UNDER_VERIFICATION" ? "In Review" : st}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="border border-red-200 bg-red-50 p-4 flex items-center justify-between text-xs text-red-700 font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchClaims} className="h-7 text-xs border-red-300 text-red-800 rounded-none">
            Retry
          </Button>
        </div>
      )}

      {/* Claims Table (Sharp Data Table) */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Claim Records
          </h3>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchClaims}
              className="h-7 text-xs border-slate-200 text-slate-700 rounded-none gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Refresh
            </Button>
            <span className="text-xs font-mono font-semibold text-slate-500">
              Showing {filteredClaims.length} of {claims.length} claims
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-slate-600 mb-2" />
            <p className="text-xs font-medium">Loading system claims...</p>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="text-center py-16 text-slate-400 space-y-3">
            <FileSearch className="h-8 w-8 mx-auto opacity-40 text-slate-400" />
            <p className="text-xs font-medium">
              {claims.length === 0
                ? "No claims currently in the database."
                : "No claims match your filter criteria."}
            </p>
            {claims.length === 0 && (
              <Button
                onClick={async () => {
                  setLoading(true);
                  const res = await seedDemoClaims();
                  if (res.success) {
                    await fetchClaims();
                  } else {
                    alert(res.error || "Failed to generate sample claims.");
                    setLoading(false);
                  }
                }}
                className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-none shadow-xs"
              >
                Generate Demo Claims Across Pipeline
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Claim ID</th>
                  <th className="py-3 px-4">Faculty / Dept</th>
                  <th className="py-3 px-4">Research Title</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4 text-center">Status / Stage</th>
                  <th className="py-3 px-4 text-right">Claimed</th>
                  <th className="py-3 px-4 text-right">Approved</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClaims.map((claim) => {
                  const stCfg = STATUS_CONFIG[claim.status] || STATUS_CONFIG.DRAFT;
                  return (
                    <tr key={claim.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {claim.claim_number}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{claim.faculty?.name || "Faculty"}</span>
                          <span className="text-[11px] text-slate-500">{claim.faculty?.department?.name || claim.faculty?.email}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900 truncate" title={claim.resolvedTitle}>
                            {claim.resolvedTitle}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                            {claim.claim_type?.name || "Research Output"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                        {claim.submitted_at ? format(new Date(claim.submitted_at), "dd MMM yyyy") : format(new Date(claim.created_at), "dd MMM yyyy")}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${stCfg.bg} ${stCfg.text} ${stCfg.border}`}>
                          {stCfg.label}
                        </span>
                        {claim.current_stage && claim.status !== "APPROVED" && (
                          <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                            @{claim.current_stage}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatInr(claim.claimed_amount)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {claim.approved_amount ? (
                          <span className="text-emerald-600">{formatInr(claim.approved_amount)}</span>
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        {claim.status === "APPROVED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintClaim(claim.id)}
                            disabled={loadingPrintClaim}
                            className="h-7 px-2 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-none gap-1"
                            title="Print Official Sanction Order"
                          >
                            <Printer className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="hidden sm:inline text-[10px] font-bold">Print</span>
                          </Button>
                        )}
                        <Link href={`/verifier/claims/${claim.id}`}>
                          <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs border-slate-200 text-slate-700 hover:bg-slate-100 rounded-none">
                            Review
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClaim(claim.id, claim.claim_number)}
                          className="h-7 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50 rounded-none"
                          title="Delete Claim"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Complete Wipeout Danger Modal */}
      <Dialog open={isWipeoutOpen} onOpenChange={setIsWipeoutOpen}>
        <DialogContent className="max-w-md border-red-500/40">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-500">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <DialogTitle className="text-base text-red-500">Complete Database Wipeout</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground pt-2 leading-relaxed">
              This action is <strong className="text-destructive font-semibold">permanent and irreversible</strong>. It will completely purge:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs bg-red-500/5 p-3.5 rounded-lg border border-red-500/20 text-muted-foreground">
            <ul className="list-disc list-inside space-y-1 text-foreground">
              <li>All research claims & calculation snapshots</li>
              <li>All uploaded documents & files from cloud storage</li>
              <li>All verifier approvals, stage movements & comments</li>
              <li>All research publication, project, patent, book & citation records</li>
            </ul>
            <p className="text-[11px] text-red-400 font-medium pt-1">
              Faculty user accounts and institutional settings will be preserved.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-foreground">
              Type <span className="font-mono text-red-500">WIPEOUT</span> to confirm:
            </label>
            <Input
              placeholder="WIPEOUT"
              value={wipeoutConfirmText}
              onChange={(e) => setWipeoutConfirmText(e.target.value.toUpperCase())}
              className="font-mono text-center tracking-widest text-sm border-red-500/40 focus-visible:ring-red-500"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsWipeoutOpen(false)}
              disabled={wipingOut}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleCompleteWipeout}
              disabled={wipingOut || wipeoutConfirmText !== "WIPEOUT"}
              className="bg-red-600 hover:bg-red-700 gap-1.5"
            >
              {wipingOut ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Purging Entire Database...
                </>
              ) : (
                <>
                  <Flame className="h-3.5 w-3.5" />
                  Confirm Permanent Wipeout
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ClaimPrintModal
        open={printModalOpen}
        onOpenChange={setPrintModalOpen}
        claim={selectedPrintClaim}
      />
    </div>
  );
}
