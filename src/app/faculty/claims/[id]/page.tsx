"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClaimStatusStepper } from "@/components/claims/claim-status-stepper";
import { getClaimDetailsWithHistory, submitClaim, deleteClaim } from "@/app/actions/claims";
import { getDocumentDownloadUrl } from "@/app/actions/documents";
import { DocumentViewerModal, type PreviewableDocument } from "@/components/claims/document-viewer-modal";
import { ClaimPrintModal } from "@/components/claims/claim-print-modal";
import { WORKFLOW_STAGES } from "@/lib/constants";
import { resolveClaimTitle, resolveDetailItem } from "@/lib/utils";
import { ArrowLeft, FileText, CheckCircle2, Clock, RotateCcw, AlertCircle, FileCheck, Send, ShieldAlert, Award, Calculator, Eye, Download, Trash2, Printer, Edit3 } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-slate-400/10 text-slate-400 border-slate-400/20" },
  SUBMITTED: { label: "Submitted", className: "bg-blue-400/10 text-blue-400 border-blue-400/20" },
  UNDER_VERIFICATION: { label: "Under Verification", className: "bg-amber-400/10 text-amber-400 border-amber-400/20" },
  VERIFIED: { label: "Verified", className: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" },
  RETURNED: { label: "Returned for Correction", className: "bg-orange-400/10 text-orange-400 border-orange-400/20" },
  RESUBMITTED: { label: "Resubmitted", className: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20" },
  REJECTED: { label: "Rejected", className: "bg-red-400/10 text-red-400 border-red-400/20" },
  APPROVED: { label: "Approved & Sanctioned", className: "bg-green-400/10 text-green-400 border-green-400/20" },
};

function formatInr(amount?: number | null) {
  if (amount === undefined || amount === null) return "₹0";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso?: string | null) {
  if (!iso) return "N/A";
  return new Intl.DateTimeFormat("en-IN", { year: "numeric", month: "short", day: "2-digit" }).format(new Date(iso));
}

export default function FacultyClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const claimId = resolvedParams.id;
  const router = useRouter();

  const [claim, setClaim] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Document Viewer State
  const [previewDoc, setPreviewDoc] = useState<PreviewableDocument | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  // Print Sanction Modal State
  const [printModalOpen, setPrintModalOpen] = useState(false);

  useEffect(() => {
    getClaimDetailsWithHistory(claimId).then((res) => {
      if (res.success) {
        setClaim(res.claim);
      } else {
        setError(res.error || "Failed to load claim details.");
      }
      setLoading(false);
    });
  }, [claimId]);

  const handleResubmit = async () => {
    setSubmitting(true);
    const res = await submitClaim(claimId);
    if (res.success) {
      // Reload
      const updated = await getClaimDetailsWithHistory(claimId);
      if (updated.success) setClaim(updated.claim);
    } else {
      alert(res.error || "Failed to resubmit claim");
    }
    setSubmitting(false);
  };

  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete claim ${claim?.claim_number || ""}? This will permanently remove the claim, documents, and records.`)) {
      return;
    }
    setDeleting(true);
    const res = await deleteClaim(claimId);
    if (res.success) {
      alert("Claim deleted successfully.");
      router.push("/faculty/claims");
    } else {
      alert(res.error || "Failed to delete claim.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <Clock className="h-10 w-10 text-muted-foreground animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Loading claim details & verification status...</p>
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Claim Not Found</h3>
        <p className="text-sm text-muted-foreground mb-6">{error || "The requested claim could not be found."}</p>
        <Link href="/faculty/claims" className={buttonVariants({ variant: "outline" })}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to My Claims
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_MAP[claim.status] || STATUS_MAP.DRAFT;
  const stageConfig = WORKFLOW_STAGES[claim.current_stage] || WORKFLOW_STAGES.HOD_PRINCIPAL;
  const isReturned = claim.status === "RETURNED";
  const isApproved = claim.status === "APPROVED" || claim.status === "VERIFIED" || claim.current_stage === "APPROVED";

  const detailItem = resolveDetailItem(claim);
  const claimDisplayTitle = resolveClaimTitle(claim);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <Link href="/faculty/claims" className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to My Claims
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-muted-foreground">{claim.claim_number}</span>
              <Badge variant="outline" className={`text-[10px] ${statusConfig.className}`}>{statusConfig.label}</Badge>
              <Badge variant="secondary" className="text-[10px]">
                {isApproved ? "Sanction Completed" : `Pending: ${stageConfig.roleLabel}`}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{claimDisplayTitle}</h1>
          </div>

          <div className="flex items-center gap-2">
            {isApproved && (
              <Button
                onClick={() => setPrintModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-md shadow-emerald-900/20"
              >
                <Printer className="h-4 w-4" />
                Print Sanction Order (PDF)
              </Button>
            )}
            {isReturned && (
              <>
                <Link href={`/faculty/claims/${claim.id}/edit`}>
                  <Button className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs gap-1.5 shadow-md shadow-amber-900/20">
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit & Resubmit Claim
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResubmit}
                  disabled={submitting}
                  className="border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-semibold text-xs gap-1.5"
                  title={`Resubmit back to ${(claim.claim_approvals || []).slice().reverse().find((a: any) => a.status === "RETURNED")?.stage || "Verifier"}`}
                >
                  <Send className="h-3.5 w-3.5" />
                  {submitting ? "Resubmitting..." : "Quick Resubmit"}
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-600 text-xs font-semibold"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              {deleting ? "Deleting..." : "Delete Claim"}
            </Button>
          </div>
        </div>
      </div>

      {/* Multi-Stage Verification Stepper */}
      <Card className="glass-card border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Verification Stage Status</span>
            <span className="text-xs text-muted-foreground font-normal">
              Current Stage: <strong className="text-amber-400 font-semibold">{stageConfig.roleLabel}</strong>
            </span>
          </CardTitle>
          <CardDescription>
            Live approval flow across Principal/HOD, Research Convener, Registrar, and Provost.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <ClaimStatusStepper
            currentStage={claim.current_stage}
            status={claim.status}
            approvals={claim.claim_approvals || []}
            approvedAmount={claim.approved_amount}
            onPrint={() => setPrintModalOpen(true)}
            canPrint={isApproved}
          />
        </CardContent>
      </Card>

      {/* Grid Layout: Claim Details + Approval Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incentive Calculation Breakdown Card */}
          <Card className="glass-card border-border/40">
            <CardHeader className="pb-3 border-b border-border/30">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-[#b91c1c]" />
                  Incentive Calculation
                </span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                  Preserved Calculation
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Top Stat Bifurcation */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <div>
                  <span className="text-[11px] text-muted-foreground block font-medium">Applicable Category</span>
                  <span className="text-sm font-extrabold text-foreground">
                    {claim.calculation_snapshot?.applicableCategory || "Standard Policy Category"}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block font-medium">Base Policy Incentive</span>
                  <span className="text-sm font-bold text-foreground">
                    {claim.calculation_snapshot?.policyIncentive
                      ? formatInr(claim.calculation_snapshot.policyIncentive)
                      : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block font-medium">Author Sharing</span>
                  <span className="text-xs font-semibold text-foreground block truncate">
                    {claim.calculation_snapshot?.ppsuFacultyCount
                      ? `${claim.calculation_snapshot.ppsuFacultyCount} PPSU Faculty (${claim.calculation_snapshot.distributionRule || "Shared"})`
                      : "Single Faculty"}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#b91c1c] block uppercase tracking-wider">Estimated Incentive</span>
                  <span className="text-lg font-extrabold text-[#b91c1c] font-mono">
                    {formatInr(claim.calculated_amount || claim.claimed_amount)}
                  </span>
                </div>
              </div>

              {/* Criteria Checks List if Available */}
              {Array.isArray(claim.calculation_snapshot?.criteriaChecks) && claim.calculation_snapshot.criteriaChecks.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-semibold text-muted-foreground block">Relevant Criteria Evaluated:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {claim.calculation_snapshot.criteriaChecks.map((check: any, idx: number) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                          check.met
                            ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300"
                            : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <div className={`h-2 w-2 rounded-full shrink-0 ${check.met ? "bg-emerald-500" : "bg-slate-300"}`} />
                          <span className="truncate font-medium">{check.label}</span>
                        </div>
                        <span className="font-mono text-[10px] shrink-0 opacity-80">{check.detail || (check.met ? "Met" : "Not met")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approval & Sanction Status Card */}
          <Card className="glass-card border-border/40">
            <CardHeader className="pb-3 border-b border-border/30">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-600" />
                  Approval Payout Status
                </span>
                <Badge variant="outline" className={`text-[10px] ${statusConfig.className}`}>
                  {statusConfig.label}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Final Approved Amount</span>
                  <span className={`text-xl font-extrabold font-mono tracking-tight mt-0.5 block ${isApproved ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400 font-sans text-base"}`}>
                    {isApproved ? formatInr(claim.approved_amount) : "Pending / Not yet approved"}
                  </span>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-xs text-muted-foreground block font-medium">Current Review Stage</span>
                  <span className="text-xs font-bold text-foreground">
                    {isApproved ? "Sanction Completed" : stageConfig.roleLabel}
                  </span>
                </div>
              </div>

              {isApproved && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                    Official sanction order is ready. You can print or download the official PDF certificate.
                  </div>
                  <Button
                    onClick={() => setPrintModalOpen(true)}
                    size="sm"
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 h-8 shrink-0 shadow-xs"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print Sanction Order (PDF)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Research Information */}
          <Card className="glass-card border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Research Claim Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground block">Claim Type</span>
                  <span className="font-semibold">{claim.claim_type?.name || "Research Claim"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Submission Date</span>
                  <span>{formatDate(claim.submitted_at || claim.created_at)}</span>
                </div>
              </div>

              {/* Publication / Book / Citation info */}
              {(() => {
                const pubItem = Array.isArray(claim.publications) ? claim.publications[0] : claim.publications;
                const bookItem = Array.isArray(claim.books) ? claim.books[0] : claim.books;
                const citationItem = Array.isArray(claim.citations) ? claim.citations[0] : claim.citations;
                return (
                  <>
                    {pubItem && (
                      <div className="space-y-3 pt-3 border-t border-border/40">
                        <div>
                          <span className="text-xs text-muted-foreground block">Journal Name</span>
                          <span className="font-medium">{pubItem.journal_name}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <span className="text-xs text-muted-foreground block">Indexing</span>
                            <span>{pubItem.indexing || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">Quartile</span>
                            <span>{pubItem.quartile || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">Impact Factor</span>
                            <span>{pubItem.impact_factor || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {bookItem && (
                      <div className="space-y-3 pt-3 border-t border-border/40">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="text-xs text-muted-foreground block">Title of Publish</span>
                            <span className="font-semibold text-foreground">{bookItem.title}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">Name of Publisher</span>
                            <span className="font-semibold text-foreground">{bookItem.publisher || "—"}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <span className="text-xs text-muted-foreground block">ISBN Number</span>
                            <span className="font-medium">{bookItem.isbn || "—"}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">Level</span>
                            <span className="font-medium">{bookItem.publication_level || "—"}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">Recognized Body</span>
                            <span className="font-medium">{bookItem.recognized_body || (bookItem.scopus_indexed ? "Scopus" : "—")}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">Publication Date</span>
                            <span className="font-medium">{bookItem.publication_date || "—"}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {citationItem && (
                      <div className="space-y-3 pt-3 border-t border-border/40">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="text-xs text-muted-foreground block">Scopus ID</span>
                            <span className="font-semibold font-mono text-foreground">{citationItem.scopus_id || "—"}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">Eligible Citations Claimed</span>
                            <span className="font-bold text-[#b91c1c] font-mono text-base">{citationItem.citation_count || 0}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div>
                            <span className="text-xs text-muted-foreground block">Total Citations (Last Year)</span>
                            <span className="font-medium">{citationItem.total_citations_last_calendar_year ?? "—"}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">PPSU Citations (Last Year)</span>
                            <span className="font-medium">{citationItem.total_ppsu_citations_last_calendar_year ?? "—"}</span>
                          </div>
                          {citationItem.verification_url && (
                            <div className="col-span-2 sm:col-span-1">
                              <span className="text-xs text-muted-foreground block">Profile URL</span>
                              <a
                                href={citationItem.verification_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline truncate block"
                              >
                                View Scopus Profile
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>

          {/* Supporting Documents */}
          <Card className="glass-card border-border/40">
            <CardHeader className="pb-3 border-b border-border/20">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-primary" />
                  Uploaded Documents
                </span>
                <span className="text-xs text-muted-foreground font-semibold">
                  {claim.claim_documents?.length || 0} File(s)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {!claim.claim_documents || claim.claim_documents.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs italic">No documents attached.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {claim.claim_documents.map((doc: any) => {
                    const fileSizeMb = doc.file_size
                      ? (doc.file_size / (1024 * 1024)).toFixed(2)
                      : null;

                    return (
                      <div
                        key={doc.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 hover:border-primary/30 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">
                              {doc.file_name}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {doc.document_type}
                              </span>
                              {fileSizeMb && <span>• {fileSizeMb} MB</span>}
                              <span>• {formatDate(doc.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase font-bold py-0.5 ${
                              doc.verification_status === "VERIFIED"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                : doc.verification_status === "REJECTED"
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {doc.verification_status || "PENDING"}
                          </Badge>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPreviewDoc(doc);
                              setViewerOpen(true);
                            }}
                            className="h-8 px-2.5 text-xs font-semibold border-slate-200 dark:border-slate-700 hover:bg-primary/5 hover:text-primary flex items-center gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (doc.storage_path) {
                                const res = await getDocumentDownloadUrl(doc.storage_path);
                                if (res.success && res.signedUrl) {
                                  const a = document.createElement("a");
                                  a.href = res.signedUrl;
                                  a.download = doc.file_name;
                                  a.target = "_blank";
                                  a.rel = "noopener noreferrer";
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                } else {
                                  alert(res.error || "Failed to download document.");
                                }
                              }
                            }}
                            className="h-8 px-2.5 text-xs font-semibold border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                            title="Download document"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Audit Log / Approvals Timeline (1 Col) */}
        <div className="space-y-6">
          <Card className="glass-card border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Approval History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!claim.claim_approvals || claim.claim_approvals.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-4">
                  No verification actions recorded yet. Your claim is currently awaiting Principal / HOD review.
                </p>
              ) : (
                <div className="relative border-l border-border/40 ml-3 space-y-6 py-2">
                  {claim.claim_approvals.map((app: any) => {
                    const stg = WORKFLOW_STAGES[app.stage] || WORKFLOW_STAGES.HOD_PRINCIPAL;
                    const isApprovedAction = app.status === "VERIFIED" || app.status === "APPROVED";
                    const isReturnedAction = app.status === "RETURNED";

                    return (
                      <div key={app.id} className="relative pl-6">
                        <div
                          className={`absolute -left-2 top-0.5 h-4 w-4 rounded-full border flex items-center justify-center ${
                            isApprovedAction
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                              : isReturnedAction
                              ? "bg-orange-500/20 border-orange-500 text-orange-400"
                              : "bg-muted border-border"
                          }`}
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-current" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-foreground">{stg.roleLabel}</span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${
                                isApprovedAction ? "bg-emerald-500/10 text-emerald-400" : "bg-orange-500/10 text-orange-400"
                              }`}
                            >
                              {app.status}
                            </Badge>
                          </div>

                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                            {formatDate(app.action_at)}
                          </p>

                          {app.approver?.name && (
                            <p className="text-xs text-muted-foreground mt-1">
                              By: <span className="font-medium text-foreground">{app.approver.name}</span>
                            </p>
                          )}

                          {app.remarks && (
                            <div className="mt-2 p-2 rounded bg-muted/40 text-xs text-muted-foreground italic border border-border/30">
                              &quot;{app.remarks}&quot;
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <DocumentViewerModal
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        document={previewDoc}
      />

      <ClaimPrintModal
        open={printModalOpen}
        onOpenChange={setPrintModalOpen}
        claim={claim}
      />
    </div>
  );
}
