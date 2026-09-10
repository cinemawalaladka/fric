"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Plus, Trash2, Info, Building2, FlaskConical, ShieldCheck, Upload, FileText } from "lucide-react";
import type { CoPIEntry, FacultyProfile } from "@/hooks/use-claim-form";
import { IndianCurrencyInput } from "@/components/ui/indian-currency-input";
import { numberToIndianWords } from "@/lib/currency";

interface Props {
  faculty: FacultyProfile | null;
  departmentName: string;
  schoolName: string;
  details: Record<string, any>;
  onUpdate: (key: string, value: any) => void;
  coPIs: CoPIEntry[];
  onAddCoPI: () => void;
  onUpdateCoPI: (id: string, field: keyof CoPIEntry, value: any) => void;
  onRemoveCoPI: (id: string) => void;
  onSetDocumentFile?: (slotId: string, file: File | null) => void;
  depositProofFile?: File | null;
}

export function StepResearchProject({
  faculty,
  departmentName,
  schoolName,
  details,
  onUpdate,
  coPIs,
  onAddCoPI,
  onUpdateCoPI,
  onRemoveCoPI,
  onSetDocumentFile,
  depositProofFile,
}: Props) {
  return (
    <div className="animate-slide-up space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
            Research Project / Grant Details
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Dedicated Project Form
          </span>
        </div>
        <p className="text-sm text-slate-500">
          Provide complete details of your funded research project or grant for incentive claim evaluation.
        </p>
      </div>

      {/* ══════════ READ-ONLY FACULTY INFO BANNER ══════════ */}
      <Card className="border border-slate-200/80 bg-slate-50/70 shadow-xs">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-emerald-600" /> Logged-In Faculty Master Data (Read-Only)
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

      {/* ══════════ DEDICATED PROJECT FIELDS ══════════ */}
      <Card className="border border-slate-200/80 bg-white shadow-xs">
        <CardContent className="pt-6 space-y-5">
          {/* Research Project Title */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Research Project Title *
            </Label>
            <Input
              placeholder="Enter full sanctioned research project title"
              value={details.title || ""}
              onChange={(e) => onUpdate("title", e.target.value)}
              className="bg-slate-50/50 border-slate-300 focus:bg-white"
            />
          </div>

          {/* Sponsoring Body & Project Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Sponsoring Body / Funding Agency *
              </Label>
              <Input
                placeholder="e.g. DST, SERB, UGC, ICMR, AICTE, Industry Sponsor"
                value={details.sponsoringBody || ""}
                onChange={(e) => onUpdate("sponsoringBody", e.target.value)}
                className="bg-slate-50/50 border-slate-300 focus:bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Project Level *
              </Label>
              <Select
                value={details.projectLevel || "National"}
                onValueChange={(v) => onUpdate("projectLevel", v)}
              >
                <SelectTrigger className="bg-slate-50/50 border-slate-300">
                  <SelectValue placeholder="Select Project Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="International">International Level</SelectItem>
                  <SelectItem value="National">National Level</SelectItem>
                  <SelectItem value="State">State Level</SelectItem>
                  <SelectItem value="Industry">Industry Consultancy / Grant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Approved Project Number & Total Sanctioned Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Approved Project Number / Sanction Reference *
              </Label>
              <Input
                placeholder="e.g. DST/CRG/2026/001234"
                value={details.approvedNumber || details.grantNumber || ""}
                onChange={(e) => {
                  onUpdate("approvedNumber", e.target.value);
                  onUpdate("grantNumber", e.target.value);
                }}
                className="bg-slate-50/50 border-slate-300 focus:bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Total Sanctioned Amount (₹) *
              </Label>
              <IndianCurrencyInput
                placeholder="e.g. 15,00,000"
                value={details.sanctionedAmount || ""}
                onValueChange={(num, formatted) => {
                  onUpdate("sanctionedAmount", num);
                  if (num > 0) {
                    onUpdate("amountInWords", numberToIndianWords(num));
                  }
                }}
                className="bg-slate-50/50 border-slate-300 focus:bg-white"
              />
            </div>
          </div>

          {/* Amount in Words */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Sanctioned Amount in Words (Auto-Generated)
            </Label>
            <Input
              placeholder="e.g. Fifteen Lakh Rupees Only"
              value={details.amountInWords || ""}
              onChange={(e) => onUpdate("amountInWords", e.target.value)}
              className="bg-slate-50/50 border-slate-300 focus:bg-white font-medium text-slate-700"
            />
          </div>

          {/* Project Duration & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Project Start Date
              </Label>
              <Input
                type="date"
                value={details.startDate || ""}
                onChange={(e) => onUpdate("startDate", e.target.value)}
                className="bg-slate-50/50 border-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Project End Date
              </Label>
              <Input
                type="date"
                value={details.endDate || ""}
                onChange={(e) => onUpdate("endDate", e.target.value)}
                className="bg-slate-50/50 border-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Sponsoring Body Address / Details
              </Label>
              <Input
                placeholder="City, State"
                value={details.address || ""}
                onChange={(e) => onUpdate("address", e.target.value)}
                className="bg-slate-50/50 border-slate-300"
              />
            </div>
          </div>

          {/* ══════════ PPSU ACCOUNT DEPOSIT & PROOF ══════════ */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-emerald-600" /> PPSU Account Deposit Details & Verification Proof *
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                Required for Audit & Incentive
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Amount Deposited in PPSU Account */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Amount Deposited in PPSU Account (₹) *
                </Label>
                <IndianCurrencyInput
                  placeholder="e.g. 5,00,000"
                  value={details.depositedAmount || details.amountDepositedInPpsu || ""}
                  onValueChange={(num) => {
                    onUpdate("depositedAmount", num);
                    onUpdate("amountDepositedInPpsu", num);
                  }}
                  className="bg-white border-emerald-300 focus:bg-white font-medium"
                />
              </div>

              {/* Deposit Date */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Deposit Date *
                </Label>
                <Input
                  type="date"
                  value={details.depositDate || ""}
                  onChange={(e) => onUpdate("depositDate", e.target.value)}
                  className="bg-white border-emerald-300 focus:bg-white"
                />
              </div>
            </div>

            {/* Inline PDF Upload */}
            <div className="space-y-2 pt-1 border-t border-emerald-200/50">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                <span>Upload PPSU Account Deposit Proof (PDF) *</span>
                {(depositProofFile || details.depositProofName) && (
                  <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {depositProofFile?.name || details.depositProofName}
                  </span>
                )}
              </Label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  id="ppsu-deposit-proof-input"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file) {
                      if (file.size > 50 * 1024 * 1024) {
                        alert("File size exceeds 50 MB limit.");
                        return;
                      }
                      onUpdate("depositProofName", file.name);
                      onUpdate("depositProofFile", file);
                      if (onSetDocumentFile) {
                        onSetDocumentFile("ppsu_deposit_proof", file);
                      }
                    }
                    e.target.value = "";
                  }}
                />
                <label
                  htmlFor="ppsu-deposit-proof-input"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-emerald-400 bg-white hover:bg-emerald-50/50 cursor-pointer text-xs font-semibold text-emerald-900 transition-colors shadow-xs"
                >
                  <Upload className="h-4 w-4 text-emerald-600" />
                  {depositProofFile || details.depositProofName ? "Replace PDF Proof" : "Choose Bank Deposit / Credit Voucher (PDF)"}
                </label>
                {(depositProofFile || details.depositProofName) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onUpdate("depositProofName", "");
                      onUpdate("depositProofFile", null);
                      if (onSetDocumentFile) {
                        onSetDocumentFile("ppsu_deposit_proof", null);
                      }
                    }}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Official bank credit voucher, NEFT/RTGS transaction receipt, or PPSU Finance Dept confirmation PDF.
              </p>
            </div>
          </div>

          {/* PI / Co-PI Status */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Your Status on Project *
                </Label>
                <Select
                  value={details.piOrCoPi || "PI"}
                  onValueChange={(v) => onUpdate("piOrCoPi", v)}
                >
                  <SelectTrigger className="bg-white border-slate-300">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PI">Principal Investigator (PI)</SelectItem>
                    <SelectItem value="Co-PI">Co-Principal Investigator (Co-PI)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {details.piOrCoPi === "Co-PI" && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Co-PI Number / Position *
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g. 1, 2"
                    value={details.copiNumber || ""}
                    onChange={(e) => onUpdate("copiNumber", e.target.value)}
                    className="bg-white border-slate-300 font-bold"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ══════════ CO-PI INFORMATION LIST ══════════ */}
      <Card className="border border-slate-200/80 bg-white shadow-xs">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Co-Investigator Information (Co-PIs)</p>
              <p className="text-xs text-slate-500">Add all other PIs / Co-PIs involved in this project.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddCoPI}
              className="border-slate-300 hover:border-emerald-600 hover:text-emerald-700 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Co-PI
            </Button>
          </div>

          {coPIs.length === 0 && (
            <div className="text-center py-5 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <p className="text-xs text-slate-500">No Co-PIs added. If you are sole PI, you may proceed.</p>
            </div>
          )}

          {coPIs.map((copi, idx) => (
            <div key={copi.id} className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-xs font-bold text-slate-700">Co-PI #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => onRemoveCoPI(copi.id)}
                  className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Name *</Label>
                  <Input
                    placeholder="Full name"
                    value={copi.name}
                    onChange={(e) => onUpdateCoPI(copi.id, "name", e.target.value)}
                    className="bg-white border-slate-300 h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Institution *</Label>
                  <Input
                    placeholder="e.g. PPSU / External Univ"
                    value={copi.institution}
                    onChange={(e) => onUpdateCoPI(copi.id, "institution", e.target.value)}
                    className="bg-white border-slate-300 h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Department</Label>
                  <Input
                    placeholder="Department name"
                    value={copi.department}
                    onChange={(e) => onUpdateCoPI(copi.id, "department", e.target.value)}
                    className="bg-white border-slate-300 h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Role / Designation</Label>
                  <Input
                    placeholder="e.g. Co-PI / Co-Investigator"
                    value={copi.role}
                    onChange={(e) => onUpdateCoPI(copi.id, "role", e.target.value)}
                    className="bg-white border-slate-300 h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notice */}
      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
        <span>
          Sanction/Approval letter, funding evidence, and budget bifurcation documents will be uploaded in the <strong>Documents Step</strong>. Estimated incentive is calculated based on sanctioned project tier.
        </span>
      </div>
    </div>
  );
}
