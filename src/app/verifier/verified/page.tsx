"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Clock, Eye, Search, FileCheck, Printer } from "lucide-react";
import { getMyVerifiedClaims } from "@/app/actions/verification";
import { getClaimDetailsWithHistory } from "@/app/actions/claims";
import { ClaimPrintModal } from "@/components/claims/claim-print-modal";
import { WORKFLOW_STAGES } from "@/lib/constants";

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso?: string | null) {
  if (!iso) return "N/A";
  return new Intl.DateTimeFormat("en-IN", { year: "numeric", month: "short", day: "2-digit" }).format(new Date(iso));
}

export default function VerifiedClaimsPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Print Sanction Modal State
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
        alert(res.error || "Failed to load claim details for printing.");
      }
    } catch {
      alert("Error loading claim details.");
    } finally {
      setLoadingPrintClaim(false);
    }
  };

  useEffect(() => {
    getMyVerifiedClaims().then((res) => {
      if (res.success) setClaims(res.claims || []);
      setLoading(false);
    });
  }, []);

  const filtered = claims.filter((claim) => {
    const term = search.toLowerCase();
    return (
      claim.title.toLowerCase().includes(term) ||
      claim.faculty.toLowerCase().includes(term) ||
      claim.claimNumber.toLowerCase().includes(term)
    );
  });

  return (
    <div className="animate-fade-in space-y-6">
      <DashboardHeader
        title="Verified Claims History"
        description="Review all claims that you have verified and passed to the next workflow stage"
      />

      <Card className="glass-card border-border/40">
        <CardContent className="pt-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, faculty name, or claim number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-input/50 border-border/50"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {loading ? "Loading verified history..." : `${filtered.length} Claims Verified by You`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Fetching verified claims...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-2">
              <CheckCircle2 className="h-10 w-10 mx-auto text-muted-foreground/30" />
              <p className="text-sm font-semibold">No verified claims found.</p>
              <p className="text-xs text-muted-foreground">Claims you review and approve will be logged here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((claim) => {
                const stageCfg = WORKFLOW_STAGES[claim.myStageVerified] || { shortName: claim.myStageVerified };
                const currentStageCfg = WORKFLOW_STAGES[claim.currentStage] || { shortName: claim.currentStage };
                const isApproved = claim.currentStage === "APPROVED" || claim.status === "APPROVED";

                return (
                  <div
                    key={claim.id}
                    className="p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-accent/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-primary">{claim.claimNumber}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {claim.type}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          Verified at {stageCfg.shortName}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20">
                          Current: {currentStageCfg.shortName}
                        </Badge>
                      </div>

                      <h4 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {claim.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Faculty: <strong className="text-foreground">{claim.faculty}</strong></span>
                        <span>Dept: <strong className="text-foreground">{claim.department}</strong></span>
                        <span>Verified on: {formatDate(claim.verifiedAt)}</span>
                        <span>Amount: <strong className="text-emerald-400">{formatInr(claim.approvedAmount)}</strong></span>
                      </div>

                      {claim.remarks && (
                        <p className="text-xs text-muted-foreground/90 italic bg-muted/30 p-2 rounded-lg border border-border/30">
                          &quot;{claim.remarks}&quot;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Button
                        onClick={() => handlePrintClaim(claim.id)}
                        disabled={loadingPrintClaim}
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 px-2.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-semibold gap-1"
                        title="Print Official Sanction Order (PDF)"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Print Sanction</span>
                      </Button>
                      <Link href={`/verifier/claims/${claim.id}`}>
                        <Button variant="outline" size="sm" className="text-xs h-8 px-3">
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ClaimPrintModal
        open={printModalOpen}
        onOpenChange={setPrintModalOpen}
        claim={selectedPrintClaim}
      />
    </div>
  );
}
