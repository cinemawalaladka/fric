"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { IndianCurrencyInput } from "@/components/ui/indian-currency-input";
import { ClaimStatusStepper } from "@/components/claims/claim-status-stepper";
import { getClaimDetailsWithHistory, deleteClaim } from "@/app/actions/claims";
import { verifyClaim, returnClaim } from "@/app/actions/verification";
import { getDocumentDownloadUrl } from "@/app/actions/documents";
import { getCurrentUserRoles, getFacultyProfileData } from "@/app/actions/dashboard";
import { DocumentViewerModal, type PreviewableDocument } from "@/components/claims/document-viewer-modal";
import { ClaimPrintModal } from "@/components/claims/claim-print-modal";
import { WORKFLOW_STAGES, getNextStage, getVerifierStageInfo } from "@/lib/constants";
import { resolveClaimTitle, resolveDetailItem } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, RotateCcw, Clock, AlertCircle, FileCheck, ShieldCheck, User, Building2, Calculator, Send, Eye, Download, FileText, Trash2, Lock, Crown, Printer } from "lucide-react";

function formatInr(amount?: number | null) {
  if (amount === undefined || amount === null) return "₹0";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso?: string | null) {
  if (!iso) return "N/A";
  return new Intl.DateTimeFormat("en-IN", { year: "numeric", month: "short", day: "2-digit" }).format(new Date(iso));
}

export default function VerifierClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const claimId = resolvedParams.id;
  const router = useRouter();

  const [claim, setClaim] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProvostUser, setIsProvostUser] = useState(false);

  // Document Viewer State
  const [previewDoc, setPreviewDoc] = useState<PreviewableDocument | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  // Print Sanction Modal State
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Form State
  const [approvedAmount, setApprovedAmount] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchClaimData = async () => {
    const [res, rolesRes, profileRes] = await Promise.all([
      getClaimDetailsWithHistory(claimId),
      getCurrentUserRoles(),
      getFacultyProfileData(),
    ]);

    if (res.success) {
      setClaim(res.claim);
      setApprovedAmount(String(res.claim.approved_amount || res.claim.calculated_amount || res.claim.claimed_amount || 0));
    } else {
      setError(res.error || "Failed to load claim details.");
    }

    const roles = rolesRes.success ? (rolesRes.roles || []) : [];
    const desig = profileRes.success ? (profileRes.profile?.designation || "") : "";
    const email = profileRes.success ? (profileRes.profile?.email || "").toLowerCase() : "";
    const stageInfo = getVerifierStageInfo(desig, roles);
    const isProv = stageInfo.code === "PROVOST" || 
                   stageInfo.code === "ALL" || 
                   roles.includes("PROVOST") || 
                   roles.includes("SUPER_ADMIN") || 
                   desig.toUpperCase().includes("PROVOST") || 
                   email.includes("eatovc") || 
                   email.includes("provost");
    setIsProvostUser(isProv);

    setLoading(false);
  };

  useEffect(() => {
    fetchClaimData();
  }, [claimId]);

  const handleApprove = async () => {
    if (!approvedAmount || isNaN(Number(approvedAmount))) {
      alert("Please enter a valid approved amount.");
      return;
    }

    setSubmitting(true);
    setActionSuccessMsg(null);

    const amountNum = Number(approvedAmount);
    const res = await verifyClaim(claimId, amountNum, remarks);

    if (res.success) {
      const isFinal = res.isFinalApproval;
      const nextStageConfig = WORKFLOW_STAGES[res.nextStage || "APPROVED"];
      setActionSuccessMsg(
        isFinal
          ? "Claim has received final Provost Approval & Payout Sanction! You can now print or save the official Sanction Order PDF."
          : `Claim approved and advanced to ${nextStageConfig?.roleLabel || res.nextStage}.`
      );
      setRemarks("");
      await fetchClaimData();
      if (isFinal) {
        // Open print preview directly for Provost convenience
        setPrintModalOpen(true);
      }
    } else {
      alert(res.error || "Verification failed.");
    }
    setSubmitting(false);
  };

  const handleReturn = async () => {
    if (!remarks.trim()) {
      alert("Please provide return remarks explaining what corrections are required.");
      return;
    }

    setSubmitting(true);
    setActionSuccessMsg(null);

    const res = await returnClaim(claimId, remarks);

    if (res.success) {
      setActionSuccessMsg("Claim returned to Faculty for corrections.");
      setRemarks("");
      await fetchClaimData();
    } else {
      alert(res.error || "Failed to return claim.");
    }
    setSubmitting(false);
  };

  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete claim ${claim?.claim_number || ""}? This will permanently remove the claim, documents, and approvals.`)) {
      return;
    }
    setDeleting(true);
    const res = await deleteClaim(claimId);
    if (res.success) {
      alert("Claim deleted successfully.");
      router.push("/verifier/claims");
    } else {
      alert(res.error || "Failed to delete claim.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <Clock className="h-10 w-10 text-muted-foreground animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Loading claim review workspace...</p>
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Claim Not Found</h3>
        <p className="text-sm text-muted-foreground mb-6">{error || "The requested claim could not be found."}</p>
        <Link href="/verifier/claims" className={buttonVariants({ variant: "outline" })}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Pending Claims
        </Link>
      </div>
    );
  }

  const currentStageCode = claim.current_stage || "HOD_PRINCIPAL";
  const currentStageConfig = WORKFLOW_STAGES[currentStageCode] || WORKFLOW_STAGES.HOD_PRINCIPAL;
  const nextStageCode = getNextStage(currentStageCode);
  const nextStageConfig = WORKFLOW_STAGES[nextStageCode] || WORKFLOW_STAGES.APPROVED;
  const isFinalStep = nextStageCode === "APPROVED";
  const isFullyApproved = claim.status === "APPROVED";
  const isReturned = claim.status === "RETURNED";

  // Only Provost and Super Admin can print from the verifier portal
  const canProvostPrint = isProvostUser || currentStageCode === "PROVOST" || isFullyApproved;

  const detailItem = resolveDetailItem(claim);
  const claimDisplayTitle = resolveClaimTitle(claim);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <Link href="/verifier/claims" className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Verification List
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-muted-foreground">{claim.claim_number}</span>
              <Badge variant="outline" className={`text-[10px] ${isFullyApproved ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                {claim.status}
              </Badge>
              <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                {isFullyApproved ? "Final Sanction Complete" : `Current Stage: ${currentStageConfig.roleLabel}`}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{claimDisplayTitle}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Faculty: <strong className="text-foreground">{claim.faculty?.name}</strong> ({claim.faculty?.department?.name || "N/A"})
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            {canProvostPrint && (
              <Button
                onClick={() => setPrintModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1.5 shadow-md shadow-emerald-900/20"
              >
                <Printer className="h-4 w-4" />
                Print Sanction Order (PDF)
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs font-semibold"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              {deleting ? "Deleting..." : "Delete Claim"}
            </Button>
          </div>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">{actionSuccessMsg}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => setPrintModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1.5 h-8 shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save PDF Now
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setActionSuccessMsg(null)} className="h-8 text-xs text-emerald-400 hover:bg-emerald-500/20">
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Multi-Stage Stepper View */}
      <Card className="glass-card border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Approval Stage Progression</CardTitle>
          <CardDescription>
            Visual status tracking across all verification levels.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <ClaimStatusStepper
            currentStage={claim.current_stage}
            status={claim.status}
            approvals={claim.claim_approvals || []}
            approvedAmount={claim.approved_amount}
            onPrint={() => setPrintModalOpen(true)}
            canPrint={canProvostPrint}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verification Action Panel (1 Col) */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="glass-card border-amber-500/30 bg-amber-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-amber-400">
                <ShieldCheck className="h-5 w-5" /> Stage Verification Action
              </CardTitle>
              <CardDescription className="text-xs">
                You are verifying at: <strong>{currentStageConfig.title}</strong>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {isFullyApproved ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center space-y-3">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-400" />
                  <div>
                    <p className="text-sm font-bold">Fully Approved & Sanctioned!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">This claim has passed all verification stages.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                    <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold block">Sanctioned Amount</span>
                    <span className="text-xl font-extrabold font-mono text-emerald-400">{formatInr(claim.approved_amount)}</span>
                  </div>
                  {canProvostPrint && (
                    <Button
                      onClick={() => setPrintModalOpen(true)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-2 py-2.5 shadow-md shadow-emerald-900/20"
                    >
                      <Printer className="h-4 w-4" />
                      Print Official Sanction Order (PDF)
                    </Button>
                  )}
                </div>
              ) : isReturned ? (
                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-center">
                  <RotateCcw className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm font-bold">Currently Returned to Faculty</p>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting faculty resubmission.</p>
                </div>
              ) : (
                <>
                  {/* Sanction Amount Input - Only PROVOST can edit, others view locked policy amount */}
                  {currentStageCode === "PROVOST" ? (
                    <div className="space-y-1.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      <label className="text-xs font-semibold text-emerald-400 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold">
                          <Crown className="h-3.5 w-3.5" /> Provost Final Sanction Amount (₹)
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Policy: {formatInr(claim.calculated_amount || claim.claimed_amount)}
                        </span>
                      </label>
                      <div className="relative">
                        <IndianCurrencyInput
                          value={approvedAmount}
                          onValueChange={(num) => setApprovedAmount(String(num))}
                          className="bg-background/80 border-emerald-500/40 text-emerald-400 font-bold text-base focus-visible:ring-emerald-500"
                          placeholder="e.g. 25,000"
                        />
                      </div>
                      <p className="text-[10px] text-emerald-400/90 leading-tight">
                        Provost Executive Authority: You have permission to adjust or approve the final sanctioned payout amount.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                        <span>Calculated Incentive (₹)</span>
                        <span className="text-[10px] text-amber-500 font-medium flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Locked (Provost Authority)
                        </span>
                      </label>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/40">
                        <span className="text-base font-bold font-mono text-foreground">
                          {formatInr(claim.calculated_amount || claim.claimed_amount)}
                        </span>
                        <Badge variant="outline" className="text-[10px] bg-background/50 text-muted-foreground">
                          Policy Calculated
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        Incentive amount is locked based on institutional policy rules. Only the Provost can modify or override the sanction amount at the final approval stage.
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Verification Remarks / Notes</label>
                    <Textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Add remarks or feedback for next stage / faculty..."
                      rows={3}
                      className="bg-input/50 border-border/50 text-xs"
                    />
                  </div>

                  <div className="pt-2 space-y-2">
                    <Button
                      onClick={handleApprove}
                      disabled={submitting}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {submitting
                        ? "Processing..."
                        : isFinalStep
                        ? "Final Approve & Sanction Payout"
                        : `Approve & Forward to ${nextStageConfig.shortName}`}
                    </Button>

                    <Button
                      onClick={handleReturn}
                      disabled={submitting}
                      variant="outline"
                      className="w-full border-orange-500/40 text-orange-400 hover:bg-orange-500/10 font-medium flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Return to Faculty for Revision
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Claim Research Details (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Claim Metadata & Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/20 border border-border/30">
                <div>
                  <span className="text-xs text-muted-foreground block">Faculty Member</span>
                  <span className="font-semibold text-foreground">{claim.faculty?.name}</span>
                  <span className="text-xs text-muted-foreground block">{claim.faculty?.email}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Department</span>
                  <span className="font-semibold text-foreground">{claim.faculty?.department?.name || "N/A"}</span>
                  <span className="text-xs text-muted-foreground block">Code: {claim.faculty?.department?.code || "N/A"}</span>
                </div>
              </div>

              {/* Research details */}
              {(() => {
                const pubItem = Array.isArray(claim.publications) ? claim.publications[0] : claim.publications;
                const bookItem = Array.isArray(claim.books) ? claim.books[0] : claim.books;
                const citationItem = Array.isArray(claim.citations) ? claim.citations[0] : claim.citations;
                return (
                  <>
                    {pubItem && (
                      <div className="space-y-3 pt-3 border-t border-border/40">
                        <div>
                          <span className="text-xs text-muted-foreground block">Publication Title</span>
                          <span className="font-semibold text-primary">{pubItem.title}</span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">Journal Name</span>
                          <span>{pubItem.journal_name}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <span className="text-xs text-muted-foreground block">Indexing</span>
                            <span className="font-medium">{pubItem.indexing || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">Quartile</span>
                            <span className="font-medium">{pubItem.quartile || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">Impact Factor</span>
                            <span className="font-medium">{pubItem.impact_factor || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {bookItem && (
                      <div className="space-y-3 pt-3 border-t border-border/40">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="text-xs text-muted-foreground block">Title of Publish</span>
                            <span className="font-semibold text-primary">{bookItem.title}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">Name of Publisher</span>
                            <span className="font-semibold text-foreground">{bookItem.publisher || "N/A"}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <span className="text-xs text-muted-foreground block">ISBN Number</span>
                            <span className="font-medium">{bookItem.isbn || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">Level</span>
                            <span className="font-medium">{bookItem.publication_level || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">Recognized Body</span>
                            <span className="font-medium">{bookItem.recognized_body || (bookItem.scopus_indexed ? "Scopus" : "N/A")}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block">Publication Date</span>
                            <span className="font-medium">{bookItem.publication_date || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {citationItem && (
                      <div className="space-y-3 pt-3 border-t border-border/40">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="text-xs text-muted-foreground block">Scopus ID</span>
                            <span className="font-semibold font-mono text-primary">{citationItem.scopus_id || "—"}</span>
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
                                className="text-xs text-blue-500 hover:underline truncate block"
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

          {/* Attached Files */}
          <Card className="glass-card border-border/40">
            <CardHeader className="pb-3 border-b border-border/20">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-primary" />
                  Verification Documents
                </span>
                <span className="text-xs text-muted-foreground font-semibold">
                  {claim.claim_documents?.length || 0} Attached
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {!claim.claim_documents || claim.claim_documents.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs italic">No supporting documents attached to this claim.</p>
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
