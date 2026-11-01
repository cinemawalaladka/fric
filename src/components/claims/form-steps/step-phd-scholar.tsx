"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, User, Building2, Calendar, IndianRupee, ShieldCheck } from "lucide-react";
import type { FacultyProfile } from "@/hooks/use-claim-form";
import { IndianCurrencyInput } from "@/components/ui/indian-currency-input";
import { numberToIndianWords } from "@/lib/currency";

interface Props {
  faculty: FacultyProfile | null;
  departmentName: string;
  schoolName: string;
  details: Record<string, any>;
  onUpdate: (key: string, value: any) => void;
}

export function StepPhDScholar({
  faculty,
  departmentName,
  schoolName,
  details,
  onUpdate,
}: Props) {
  const numericAmount =
    parseFloat(String(details.claimedAmount || "").replace(/[^0-9.]/g, "")) || 0;

  return (
    <div className="animate-slide-up space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
            PhD Scholar Guidance Details
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            PhD Degree Award
          </span>
        </div>
        <p className="text-sm text-slate-500">
          Provide complete details of the PhD scholar whose degree has been officially notified and awarded.
        </p>
      </div>

      {/* ══════════ READ-ONLY FACULTY INFO BANNER ══════════ */}
      <Card className="border border-slate-200/80 bg-slate-50/70 shadow-xs">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Verified Faculty Information (Supervisor / Guide)
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Auto-filled from profile</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Supervisor Name</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                {faculty?.name || "—"}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Designation</span>
              <span className="font-medium text-slate-700 mt-0.5 block">{faculty?.designation || "—"}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">School / Institute</span>
              <span className="font-medium text-slate-700 flex items-center gap-1 mt-0.5">
                <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                {schoolName || "—"}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Department</span>
              <span className="font-medium text-slate-700 mt-0.5 block">{departmentName || "—"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ══════════ SCHOLAR DETAILS CARD ══════════ */}
      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <GraduationCap className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-slate-900 text-base">Scholar & Research Information</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium text-xs">
                PhD Scholar Enrollment ID <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="e.g. PPSU/PHD/2021/045"
                value={details.scholarEnrollmentId || ""}
                onChange={(e) => onUpdate("scholarEnrollmentId", e.target.value)}
                className="bg-slate-50/50 border-slate-200 focus:bg-white text-sm"
              />
              <p className="text-[11px] text-slate-400">Official university registration or enrollment number.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 font-medium text-xs">
                PhD Scholar Full Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Dr. Jane Doe"
                value={details.scholarName || ""}
                onChange={(e) => onUpdate("scholarName", e.target.value)}
                className="bg-slate-50/50 border-slate-200 focus:bg-white text-sm"
              />
              <p className="text-[11px] text-slate-400">Full name as recorded in the PhD degree award notification.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium text-xs">
                School / University <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="e.g. School of Engineering, P P Savani University"
                value={details.school || ""}
                onChange={(e) => onUpdate("school", e.target.value)}
                className="bg-slate-50/50 border-slate-200 focus:bg-white text-sm"
              />
              <p className="text-[11px] text-slate-400">University / School the scholar belongs to.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 font-medium text-xs">
                Scholar Department <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Computer Science & Engineering"
                value={details.department || ""}
                onChange={(e) => onUpdate("department", e.target.value)}
                className="bg-slate-50/50 border-slate-200 focus:bg-white text-sm"
              />
              <p className="text-[11px] text-slate-400">Department under which research was pursued.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 font-medium text-xs">
                Research Discipline / Subject <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Artificial Intelligence / Cloud Computing"
                value={details.discipline || ""}
                onChange={(e) => onUpdate("discipline", e.target.value)}
                className="bg-slate-50/50 border-slate-200 focus:bg-white text-sm"
              />
              <p className="text-[11px] text-slate-400">Core discipline / area of PhD thesis.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium text-xs flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                Notification Date <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="date"
                value={details.notificationDate || ""}
                onChange={(e) => onUpdate("notificationDate", e.target.value)}
                className="bg-slate-50/50 border-slate-200 focus:bg-white text-sm"
              />
              <p className="text-[11px] text-slate-400">Date of official PhD notification / award letter.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 font-medium text-xs flex items-center gap-1.5">
                <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
                Claim Amount (₹) <span className="text-rose-500">*</span>
              </Label>
              <IndianCurrencyInput
                value={details.claimedAmount || ""}
                onValueChange={(val: number) => onUpdate("claimedAmount", val)}
                placeholder="Enter claim incentive amount"
                className="bg-emerald-50/40 border-emerald-200/80 focus:bg-white text-sm font-semibold text-emerald-800"
              />
              {numericAmount > 0 && (
                <p className="text-[11px] font-medium text-emerald-700 capitalize">
                  {numberToIndianWords(numericAmount)}
                </p>
              )}
              <p className="text-[11px] text-slate-400">
                Enter your claimed incentive amount. This will flow through HOD, Committee, and Provost verification.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information note */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 flex items-start gap-2.5">
        <GraduationCap className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-900">PhD Scholar Incentive Claim Note:</span> In the next step, upload the official notification / degree award proof document. The claim amount entered will be verified and approved through the governance workflow.
        </div>
      </div>
    </div>
  );
}
