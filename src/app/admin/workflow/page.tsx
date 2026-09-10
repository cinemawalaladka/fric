"use client";

import { DashboardHeader } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WORKFLOW_STAGES, STAGE_SEQUENCE } from "@/lib/constants";
import { ArrowRight, Building2, BookOpen, GraduationCap, ShieldCheck, Award, GitBranch, Layers, Users } from "lucide-react";

const STAGE_ICONS: Record<string, any> = {
  FACULTY: GraduationCap,
  HOD_PRINCIPAL: Building2,
  COMMITTEE_M1: BookOpen,
  COMMITTEE_M2: Users,
  GOVERNOR: ShieldCheck,
  PROVOST: ShieldCheck,
  APPROVED: Award,
};

export default function AdminWorkflowPage() {
  const steps = [
    { num: "0", title: "Faculty", subtitle: "Claim Draft & Submission", code: "FACULTY" },
    { num: "1", title: "HOD", subtitle: "Department Verification", code: "HOD_PRINCIPAL" },
    { num: "2", title: "M1", subtitle: "Committee Scrutiny 1", code: "COMMITTEE_M1" },
    { num: "3", title: "M2", subtitle: "Committee Scrutiny 2", code: "COMMITTEE_M2" },
    { num: "4", title: "Governor", subtitle: "Research Governance", code: "GOVERNOR" },
    { num: "5", title: "Provost", subtitle: "Final Sanction & Modification", code: "PROVOST" },
  ];

  const stageTableData = [
    {
      stage: "Stage 1",
      role: "Head of Department (HOD)",
      code: "HOD_PRINCIPAL",
      mandate: "First-level departmental verification confirming faculty affiliation, journal relevance, and initial endorsement.",
      action: "Endorse / Return for Revision",
    },
    {
      stage: "Stage 2",
      role: "Research Committee Member 1 (M1)",
      code: "COMMITTEE_M1",
      mandate: "Technical scrutiny, Scopus/WoS database indexing validation, author position verification, and score audit.",
      action: "Verify / Return / Forward",
    },
    {
      stage: "Stage 3",
      role: "Research Committee Member 2 (M2)",
      code: "COMMITTEE_M2",
      mandate: "Second-tier committee consensus, quartile ranking verification, and policy compliance verification.",
      action: "Verify / Return / Forward",
    },
    {
      stage: "Stage 4",
      role: "Research Governor",
      code: "GOVERNOR",
      mandate: "Institutional research governance review, policy cross-check, and recommendation before provost sanction.",
      action: "Verify / Return / Forward",
    },
    {
      stage: "Stage 5",
      role: "University Provost",
      code: "PROVOST",
      mandate: "Final executive approval authority with statutory permissions to modify approved incentive amounts and sanction payouts.",
      action: "Final Sanction & Approve / Return",
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Verification Workflow Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Sequential 5-stage university approval sequence for research incentive claims
          </p>
        </div>
      </div>

      {/* Single-Line Sequential Workflow Bar */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            5-Stage Sequential Pipeline
          </h3>
          <span className="text-xs font-mono font-semibold text-slate-500">
            Faculty → HOD → M1 → M2 → Governor → Provost
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {steps.map((step) => (
            <div key={step.code} className="p-4 sm:p-5 flex flex-col justify-between hover:bg-slate-50/60 transition-colors">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                  {step.num === "0" ? "START" : `STAGE ${step.num}`}
                </span>
                <p className="text-base font-extrabold text-slate-900 mt-0.5 tracking-tight">
                  {step.title}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  {step.subtitle}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100">
                <span className="font-mono text-[10px] text-slate-400 font-semibold">
                  @{step.code}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stage Details Matrix Data Table */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Stage Verification Controls & Responsibilities
          </h3>
          <span className="text-xs font-mono font-semibold text-slate-500">
            5 Verification Tiers
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Verifier Role</th>
                <th className="py-3 px-4">Database Code</th>
                <th className="py-3 px-4">Verification Mandate & Scope</th>
                <th className="py-3 px-4 text-right">Permitted Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stageTableData.map((row) => (
                <tr key={row.code} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {row.stage}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                    {row.role}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                    <span className="bg-slate-100 px-2 py-0.5 border border-slate-200 text-[11px]">
                      {row.code}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-md leading-relaxed">
                    {row.mandate}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-slate-900 whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 text-[11px] bg-slate-100 border border-slate-200">
                      {row.action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
