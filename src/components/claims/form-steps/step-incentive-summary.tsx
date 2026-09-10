"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  Calculator,
  Users,
  AlertTriangle,
  Info,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { formatInr, getClaimTypeConfig, type IncentiveCalculation } from "@/lib/claim-form-config";

interface Props {
  incentive: IncentiveCalculation | null;
  claimType: string;
}

export function StepIncentiveSummary({ incentive, claimType }: Props) {
  const config = getClaimTypeConfig(claimType);

  if (!incentive) {
    return (
      <div className="animate-slide-up">
        <Card className="border border-slate-200 bg-white shadow-xs">
          <CardContent className="pt-6 text-center py-12">
            <Calculator className="h-8 w-8 text-slate-400 mx-auto mb-3 animate-pulse" />
            <p className="text-sm text-slate-600 font-medium">
              Evaluating eligibility and calculating incentive based on your publication details...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasIncentive = incentive.policyIncentive !== null && incentive.policyIncentive > 0;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Step Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
            Eligibility & Incentive Calculation
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-[#b91c1c] border border-red-200/60">
            PPSU Policy Engine
          </span>
        </div>
        <p className="text-sm text-slate-500">
          Evaluated in real-time according to PPSU Research & Incentive Policy Guidelines.
        </p>
      </div>

      {/* ══════════ HERO STATUS BANNER ══════════ */}
      <Card className="border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <CardContent className="p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200/60">
            <div className="flex items-center gap-3.5">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl border ${
                  hasIncentive
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-600"
                }`}
              >
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  Evaluation Status
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-base sm:text-lg font-bold text-slate-900">
                    {hasIncentive ? "Policy Eligible" : "Pending Evaluation"}
                  </span>
                  {hasIncentive ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-bold">
                      ✓ Verified Tier
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs font-bold">
                      Committee Review
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Claim Type
              </p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {config?.name || claimType}
              </p>
            </div>
          </div>

          {/* ══════════ INCENTIVE NUMBERS CARDS ══════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category / Tier */}
            <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200 space-y-1">
              <div className="flex items-center gap-2 text-slate-500">
                <TrendingUp className="h-4 w-4 text-[#b91c1c]" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Applicable Category / Tier
                </span>
              </div>
              <p className="text-base sm:text-lg font-extrabold text-slate-900 pt-1">
                {incentive.applicableCategory || "Standard Policy Level"}
              </p>
            </div>

            {/* Total Policy Incentive */}
            <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200 space-y-1">
              <div className="flex items-center gap-2 text-slate-500">
                <Calculator className="h-4 w-4 text-[#b91c1c]" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Total Policy Amount
                </span>
              </div>
              <p className="text-2xl font-extrabold text-[#b91c1c] pt-1">
                {formatInr(incentive.policyIncentive)}
              </p>
            </div>
          </div>

          {/* ══════════ PPSU DISTRIBUTION BREAKDOWN ══════════ */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-red-50/60 via-slate-50 to-red-50/60 border border-red-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-red-200/60 pb-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                <Users className="h-4 w-4 text-[#b91c1c]" /> PPSU Incentive Distribution Model
              </span>
              <span className="text-[11px] font-semibold text-[#b91c1c]">
                {incentive.distributionRule}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
                <p className="text-[10px] text-slate-400 font-bold uppercase">PPSU Faculty</p>
                <p className="text-base sm:text-lg font-extrabold text-slate-800 mt-0.5">
                  {incentive.ppsuFacultyCount}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Share Ratio</p>
                <p className="text-xs sm:text-sm font-bold text-slate-700 mt-1">
                  1 / {incentive.ppsuFacultyCount}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-[10px] text-emerald-800 font-bold uppercase">Your Share</p>
                <p className="text-base sm:text-lg font-extrabold text-emerald-700 mt-0.5">
                  {formatInr(incentive.facultyShare)}
                </p>
              </div>
            </div>
          </div>

          {/* ══════════ CRITERIA EVALUATION LIST ══════════ */}
          {incentive.criteriaChecks.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Detailed Policy Criteria Evaluation
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {incentive.criteriaChecks.map((check, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs ${
                      check.met
                        ? "bg-emerald-50/50 border-emerald-200 text-slate-800"
                        : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    {check.met ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className={`font-semibold ${check.met ? "text-slate-900" : "text-slate-600"}`}>
                        {check.label}
                      </p>
                      {check.detail && (
                        <p className="text-[10px] text-slate-500 mt-0.5">{check.detail}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Author Role Warning */}
          {incentive.authorWarning && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <span>{incentive.authorWarning}</span>
            </div>
          )}

          {/* Policy Notes */}
          {incentive.policyNote && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <span>{incentive.policyNote}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disclaimers & Advice */}
      <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
        <ShieldCheck className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
        <span>
          <strong>Note:</strong> All proposed incentive calculations are provisional and subject to multi-stage verification by your Head of Department (HOD), University Research Committee, and Provost.
        </span>
      </div>
    </div>
  );
}
