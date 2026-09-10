"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RotateCcw, Eye, Search } from "lucide-react";
import { getMyReturnedClaims } from "@/app/actions/verification";
import { WORKFLOW_STAGES } from "@/lib/constants";

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso?: string | null) {
  if (!iso) return "N/A";
  return new Intl.DateTimeFormat("en-IN", { year: "numeric", month: "short", day: "2-digit" }).format(new Date(iso));
}

export default function ReturnedClaimsPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getMyReturnedClaims().then((res) => {
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
        title="Returned Claims"
        description="Claims that you returned to faculty for clarification or correction"
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
            {loading ? "Loading returned history..." : `${filtered.length} Claims Returned by You`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Fetching returned claims...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-2">
              <RotateCcw className="h-10 w-10 mx-auto text-muted-foreground/30" />
              <p className="text-sm font-semibold">No returned claims found.</p>
              <p className="text-xs text-muted-foreground">Claims you return with revision remarks will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((claim) => {
                const stageCfg = WORKFLOW_STAGES[claim.returnedAtStage] || { shortName: claim.returnedAtStage };

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
                        <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-400 border-orange-500/20">
                          Returned by {stageCfg.shortName}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
                          Status: {claim.status}
                        </Badge>
                      </div>

                      <h4 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {claim.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Faculty: <strong className="text-foreground">{claim.faculty}</strong></span>
                        <span>Dept: <strong className="text-foreground">{claim.department}</strong></span>
                        <span>Returned on: {formatDate(claim.returnedAt)}</span>
                        <span>Claimed: <strong className="text-foreground">{formatInr(claim.claimedAmount)}</strong></span>
                      </div>

                      {claim.remarks && (
                        <p className="text-xs text-orange-300/90 italic bg-orange-500/10 p-2.5 rounded-lg border border-orange-500/20">
                          Return Note: &quot;{claim.remarks}&quot;
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 self-end sm:self-center">
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
    </div>
  );
}
