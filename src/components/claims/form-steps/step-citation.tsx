"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Info, BarChart3 } from "lucide-react";
import type { FacultyProfile } from "@/hooks/use-claim-form";

interface Props {
  faculty: FacultyProfile | null;
  departmentName: string;
  schoolName: string;
  details: Record<string, any>;
  onUpdate: (key: string, value: any) => void;
}

export function StepCitation({
  faculty,
  departmentName,
  schoolName,
  details,
  onUpdate,
}: Props) {
  const eligibleCitations = parseInt(details.eligibleCitations || details.citationCount || "0") || 0;
  const proposedIncentive = eligibleCitations * 100;
  const citationDb = details.citationDb || details.recognizedBody || "Scopus";

  return (
    <div className="animate-slide-up space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
            Citation Impact Details
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
            Citation Claim Form
          </span>
        </div>
        <p className="text-sm text-slate-500">
          Claim incentives for verified Scopus / Web of Science citations on your PPSU-affiliated papers.
        </p>
      </div>

      {/* ══════════ READ-ONLY FACULTY INFO BANNER ══════════ */}
      <Card className="border border-slate-200/80 bg-slate-50/70 shadow-xs">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-cyan-600" /> Logged-In Faculty Master Data (Read-Only)
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
              Verified Profile
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-white border border-slate-200/60">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Faculty Name</p>
              <p className="font-bold text-slate-800 truncate mt-0.5">{faculty?.name || "—"}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200/60">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Designation</p>
              <p className="font-bold text-slate-800 truncate mt-0.5">{faculty?.designation || "—"}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200/60">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">School</p>
              <p className="font-bold text-slate-800 truncate mt-0.5">{schoolName || "School of Engineering"}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200/60">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Department</p>
              <p className="font-bold text-slate-800 truncate mt-0.5">{departmentName || "CSE"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ══════════ CITATION SPECIFIC FIELDS ══════════ */}
      <Card className="border border-slate-200/80 bg-white shadow-xs">
        <CardContent className="pt-6 space-y-5">
          {/* Paper Title */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Title of Paper Receiving Citations *
            </Label>
            <Input
              placeholder="Full title of your PPSU-affiliated paper"
              value={details.paperTitle || details.workTitle || details.title || ""}
              onChange={(e) => {
                onUpdate("paperTitle", e.target.value);
                onUpdate("workTitle", e.target.value);
                onUpdate("title", e.target.value);
              }}
              className="bg-slate-50/50 border-slate-300 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Journal Name */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Journal Name *
              </Label>
              <Input
                placeholder="e.g. IEEE Access / Nature Communications"
                value={details.journalTitle || details.journalName || ""}
                onChange={(e) => {
                  onUpdate("journalTitle", e.target.value);
                  onUpdate("journalName", e.target.value);
                }}
                className="bg-slate-50/50 border-slate-300 focus:bg-white"
              />
            </div>

            {/* Citation Database */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Citation Database *
              </Label>
              <Select
                value={citationDb}
                onValueChange={(v) => {
                  onUpdate("citationDb", v);
                  onUpdate("recognizedBody", v);
                }}
              >
                <SelectTrigger className="bg-slate-50/50 border-slate-300">
                  <SelectValue placeholder="Select Citation Database" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Scopus">Scopus</SelectItem>
                  <SelectItem value="Web of Science">Web of Science</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                DOI / Handle
              </Label>
              <Input
                placeholder="e.g. 10.1109/ACCESS.2026.123456"
                value={details.doi || ""}
                onChange={(e) => onUpdate("doi", e.target.value)}
                className="bg-slate-50/50 border-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                ISSN
              </Label>
              <Input
                placeholder="e.g. 2169-3536"
                value={details.issn || ""}
                onChange={(e) => onUpdate("issn", e.target.value)}
                className="bg-slate-50/50 border-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Publication Year
              </Label>
              <Input
                type="number"
                placeholder="e.g. 2024"
                value={details.pubYear || ""}
                onChange={(e) => onUpdate("pubYear", e.target.value)}
                className="bg-slate-50/50 border-slate-300"
              />
            </div>
          </div>

          {/* Scopus ID & Annual Citation Metrics */}
          <div className="p-4 rounded-xl bg-cyan-50/60 border border-cyan-200 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-800 flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-cyan-600" /> Scopus Profile & Calendar Year Metrics
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Scopus ID */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Scopus ID *
                </Label>
                <Input
                  placeholder="e.g. 57201234567"
                  value={details.scopusId || ""}
                  onChange={(e) => onUpdate("scopusId", e.target.value)}
                  className="bg-white border-cyan-300 focus:bg-white font-mono text-xs"
                />
              </div>

              {/* Total Citations in Last Calendar Year (Scopus) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Total Citations in Last Calendar Year (Scopus) *
                </Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g. 45"
                  value={details.totalCitationsLastYear || ""}
                  onChange={(e) => onUpdate("totalCitationsLastYear", e.target.value)}
                  className="bg-white border-cyan-300 focus:bg-white"
                />
              </div>

              {/* Total Citations in Last Calendar Year having PPSU Affiliation */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Total Citations in Last Calendar Year Having PPSU Affiliation *
                </Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g. 30"
                  value={details.ppsuCitationsLastYear || ""}
                  onChange={(e) => onUpdate("ppsuCitationsLastYear", e.target.value)}
                  className="bg-white border-cyan-300 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Verification Profile Link */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Scopus / Web of Science Profile or Paper URL *
            </Label>
            <Input
              placeholder="Direct URL link to Scopus record or Web of Science paper page"
              value={details.scopusLink || details.verificationUrl || ""}
              onChange={(e) => {
                onUpdate("scopusLink", e.target.value);
                onUpdate("verificationUrl", e.target.value);
              }}
              className="bg-slate-50/50 border-slate-300 focus:bg-white"
            />
          </div>

          {/* Number of Eligible Citations */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Number of Eligible Citations Claimed *
            </Label>
            <Input
              type="number"
              min="1"
              placeholder="e.g. 25"
              value={details.eligibleCitations || details.citationCount || ""}
              onChange={(e) => {
                onUpdate("eligibleCitations", e.target.value);
                onUpdate("citationCount", e.target.value);
              }}
              className="bg-slate-50/50 border-slate-300 focus:bg-white font-bold text-sm"
            />
          </div>

          {/* Live Calculation Display */}
          {eligibleCitations > 0 && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Citations</p>
                  <p className="text-lg font-extrabold text-slate-900">{eligibleCitations}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Policy Rate</p>
                  <p className="text-lg font-extrabold text-slate-900">₹100 / citation</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Estimated Amount</p>
                  <p className="text-lg font-extrabold text-emerald-700">
                    ₹{proposedIncentive.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200 text-xs text-cyan-900 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-cyan-600 mt-0.5 shrink-0" />
        <span>
          Scopus Citation Screenshot, Faculty Scopus Screenshot, and Total Scopus PPSU Affiliation Publication Proof must be uploaded in the <strong>Documents Step</strong>. Final count will be verified by the Research Committee.
        </span>
      </div>
    </div>
  );
}
