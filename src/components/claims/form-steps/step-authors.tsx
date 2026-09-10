"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Users, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { AuthorEntry } from "@/hooks/use-claim-form";
import { getFacultyList } from "@/app/actions/dashboard";

interface Props {
  claimType: string;
  authorshipPosition: string;
  onSetAuthorshipPosition: (position: string) => void;
  authorNumber?: number | string;
  onSetAuthorNumber?: (num: number | string) => void;
  authors: AuthorEntry[];
  onAddAuthor: () => void;
  onUpdateAuthor: (id: string, field: keyof AuthorEntry, value: any) => void;
  onRemoveAuthor: (id: string) => void;
}

export function StepAuthors({
  claimType,
  authorshipPosition,
  onSetAuthorshipPosition,
  authorNumber = 1,
  onSetAuthorNumber,
  authors,
  onAddAuthor,
  onUpdateAuthor,
  onRemoveAuthor,
}: Props) {
  const isPatent = claimType === "patent";
  const entityLabel = isPatent ? "Inventor" : "Author";
  const entityLabelPlural = isPatent ? "Inventors" : "Authors / Co-Authors";

  const [isFirstAuthor, setIsFirstAuthor] = useState<boolean>(
    authorshipPosition === "first" || authorshipPosition === "both"
  );
  const [isCorrespondingAuthor, setIsCorrespondingAuthor] = useState<boolean>(
    authorshipPosition === "corresponding" || authorshipPosition === "both"
  );
  const [ppsuFacultyMaster, setPpsuFacultyMaster] = useState<any[]>([]);

  // Sync state when radio changes
  const handleRoleChange = (first: boolean, corresponding: boolean) => {
    setIsFirstAuthor(first);
    setIsCorrespondingAuthor(corresponding);

    if (first && corresponding) {
      onSetAuthorshipPosition("both");
    } else if (first) {
      onSetAuthorshipPosition("first");
    } else if (corresponding) {
      onSetAuthorshipPosition("corresponding");
    } else {
      onSetAuthorshipPosition("other");
    }
  };

  // Fetch faculty list for PPSU selection
  useEffect(() => {
    getFacultyList().then((res) => {
      if (res.success && res.faculty) {
        setPpsuFacultyMaster(res.faculty);
      }
    });
  }, []);

  const ppsuCount = authors.filter((a) => a.isPpsu).length;
  const isNeither = !isFirstAuthor && !isCorrespondingAuthor;

  return (
    <div className="animate-slide-up space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
            {entityLabelPlural} & Authorship Structure
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-[#b91c1c] border border-red-200/60">
            Step 3
          </span>
        </div>
        <p className="text-sm text-slate-500">
          Specify your authorship role and add all eligible co-{entityLabel.toLowerCase()}s for incentive sharing.
        </p>
      </div>

      {/* ══════════ AUTHORSHIP POSITION QUESTIONS ══════════ */}
      {!isPatent && (
        <Card className="border border-slate-200/80 bg-white shadow-xs">
          <CardContent className="pt-6 space-y-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[#b91c1c]">
              Applicant Authorship Status
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Question 1: Are you First Author? */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <Label className="text-xs font-bold text-slate-800">
                  Are you the First Author? *
                </Label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="isFirstAuthor"
                      checked={isFirstAuthor}
                      onChange={() => handleRoleChange(true, isCorrespondingAuthor)}
                      className="accent-[#b91c1c] h-4 w-4"
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="isFirstAuthor"
                      checked={!isFirstAuthor}
                      onChange={() => handleRoleChange(false, isCorrespondingAuthor)}
                      className="accent-[#b91c1c] h-4 w-4"
                    />
                    No
                  </label>
                </div>
              </div>

              {/* Question 2: Are you Corresponding Author? */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <Label className="text-xs font-bold text-slate-800">
                  Are you the Corresponding Author? *
                </Label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="isCorrespondingAuthor"
                      checked={isCorrespondingAuthor}
                      onChange={() => handleRoleChange(isFirstAuthor, true)}
                      className="accent-[#b91c1c] h-4 w-4"
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="isCorrespondingAuthor"
                      checked={!isCorrespondingAuthor}
                      onChange={() => handleRoleChange(isFirstAuthor, false)}
                      className="accent-[#b91c1c] h-4 w-4"
                    />
                    No
                  </label>
                </div>
              </div>
            </div>

            {/* MANDATORY AUTHOR NUMBER WHEN NEITHER FIRST NOR CORRESPONDING */}
            {isNeither && (
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300 space-y-2 animate-fadeIn">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  Mandatory Author Position Specification
                </div>
                <p className="text-xs text-amber-800">
                  Since you are neither First Author nor Corresponding Author, you must specify your exact Author Order / Position Number.
                </p>
                <div className="pt-1 max-w-xs space-y-1">
                  <Label className="text-xs font-bold text-slate-800">
                    Author Position Number * (e.g. 2, 3, 4)
                  </Label>
                  <Input
                    type="number"
                    min="2"
                    placeholder="Enter author position number"
                    value={authorNumber}
                    onChange={(e) => onSetAuthorNumber && onSetAuthorNumber(e.target.value)}
                    className="bg-white border-amber-400 focus:ring-amber-500 font-bold"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ══════════ CO-AUTHORS LIST ══════════ */}
      <Card className="border border-slate-200/80 bg-white shadow-xs">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
            <div>
              <p className="text-sm font-bold text-slate-900">
                Co-{entityLabelPlural}
              </p>
              <p className="text-xs text-slate-500">
                Add other eligible authors/inventors on this publication for incentive distribution.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddAuthor}
              className="border-slate-300 hover:border-[#b91c1c] hover:text-[#b91c1c] text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Co-{entityLabel} ({authors.length})
            </Button>
          </div>

          {authors.length === 0 && (
            <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <p className="text-xs text-slate-500">
                No co-{entityLabel.toLowerCase()}s added yet. Click &quot;Add Co-{entityLabel} (+)&quot; if there are co-authors on this work.
              </p>
            </div>
          )}

          {authors.map((author, idx) => (
            <div
              key={author.id}
              className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3 relative group"
            >
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-xs font-bold text-slate-700">
                  Co-{entityLabel} #{idx + 1}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {author.isFirstAuthor && (
                    <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] px-1.5 font-bold">
                      1st Author
                    </Badge>
                  )}
                  {author.isCorrespondingAuthor && (
                    <Badge className="bg-purple-100 text-purple-900 border-purple-300 text-[10px] px-1.5 font-bold">
                      Corr. Author
                    </Badge>
                  )}
                  {author.isPpsu ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] px-2 font-bold">
                      PPSU Faculty
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-500 text-[10px] px-1.5">
                      External
                    </Badge>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveAuthor(author.id)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Master Data Select for PPSU Faculty */}
              {ppsuFacultyMaster.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-600">
                    Select PPSU Faculty (from Master Data)
                  </Label>
                  <Select
                    onValueChange={(val) => {
                      const selected = ppsuFacultyMaster.find((f) => f.id === val);
                      if (selected) {
                        onUpdateAuthor(author.id, "name", selected.name);
                        onUpdateAuthor(author.id, "affiliation", selected.designation || "Faculty");
                        onUpdateAuthor(author.id, "institution", "PPSU");
                        onUpdateAuthor(author.id, "isPpsu", true);
                        onUpdateAuthor(author.id, "facultyId", selected.id);
                      }
                    }}
                  >
                    <SelectTrigger className="bg-white border-slate-300 text-xs h-8">
                      <SelectValue placeholder="-- Select from PPSU Faculty Master --" />
                    </SelectTrigger>
                    <SelectContent>
                      {ppsuFacultyMaster.map((fac) => (
                        <SelectItem key={fac.id} value={fac.id} className="text-xs">
                          {fac.name} ({fac.department?.name || "PPSU"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Full Name *</Label>
                  <Input
                    placeholder="Author full name"
                    value={author.name}
                    onChange={(e) => onUpdateAuthor(author.id, "name", e.target.value)}
                    className="bg-white border-slate-300 h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Designation / Role</Label>
                  <Input
                    placeholder="e.g. Assistant Professor"
                    value={author.affiliation}
                    onChange={(e) => onUpdateAuthor(author.id, "affiliation", e.target.value)}
                    className="bg-white border-slate-300 h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Institution / Affiliation *</Label>
                  <Input
                    placeholder="e.g. PPSU / IIT Bombay"
                    value={author.institution}
                    onChange={(e) => onUpdateAuthor(author.id, "institution", e.target.value)}
                    className="bg-white border-slate-300 h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Position / Order * (1 to 15)</Label>
                  <Select
                    value={String(author.authorOrder || idx + 2)}
                    onValueChange={(val) => {
                      if (!val) return;
                      const num = parseInt(val, 10);
                      onUpdateAuthor(author.id, "authorOrder", num);
                      onUpdateAuthor(author.id, "position", `Position ${num}`);
                    }}
                  >
                    <SelectTrigger className="bg-white border-slate-300 h-8 text-xs w-full">
                      <SelectValue placeholder="Select Position" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {Array.from({ length: 15 }, (_, i) => i + 1).map((pos) => (
                        <SelectItem key={pos} value={String(pos)} className="text-xs">
                          Position {pos} ({pos === 1 ? "1st" : pos === 2 ? "2nd" : pos === 3 ? "3rd" : `${pos}th`} Author)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Roles & Affiliation Options */}
              <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`first-auth-${author.id}`}
                    checked={!!author.isFirstAuthor}
                    onCheckedChange={(v) => onUpdateAuthor(author.id, "isFirstAuthor", !!v)}
                  />
                  <Label htmlFor={`first-auth-${author.id}`} className="text-xs font-medium cursor-pointer text-slate-700">
                    First Author
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`corr-auth-${author.id}`}
                    checked={!!author.isCorrespondingAuthor}
                    onCheckedChange={(v) => onUpdateAuthor(author.id, "isCorrespondingAuthor", !!v)}
                  />
                  <Label htmlFor={`corr-auth-${author.id}`} className="text-xs font-medium cursor-pointer text-slate-700">
                    Corresponding Author
                  </Label>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <Checkbox
                    id={`ppsu-check-${author.id}`}
                    checked={author.isPpsu}
                    onCheckedChange={(v) => onUpdateAuthor(author.id, "isPpsu", !!v)}
                  />
                  <Label htmlFor={`ppsu-check-${author.id}`} className="text-xs font-semibold cursor-pointer text-emerald-800">
                    Eligible PPSU Faculty member (Divides Incentive)
                  </Label>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ══════════ PPSU SHARE BREAKDOWN SUMMARY ══════════ */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-red-50/70 via-slate-50 to-red-50/70 border border-red-200 text-xs text-slate-700 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            <Users className="h-4 w-4 text-[#b91c1c]" /> PPSU Incentive Division Policy:
          </span>
          <span className="font-extrabold text-[#b91c1c]">
            {ppsuCount > 0 ? `${ppsuCount + 1} Eligible PPSU Faculty` : "Single PPSU Faculty (You)"}
          </span>
        </div>
        <p className="text-slate-600 leading-relaxed">
          {ppsuCount > 0 ? (
            <>
              <strong>Incentive Divided:</strong> You have <strong>{ppsuCount}</strong> co-author(s) marked as PPSU Faculty. The incentive will be split equally among all <strong>{ppsuCount + 1}</strong> PPSU faculty members. External non-PPSU authors do not divide your incentive.
            </>
          ) : (
            <>
              <strong>100% Share to You:</strong> None of the co-authors are PPSU Faculty. As per university policy, the full eligible incentive amount will <strong>NOT</strong> be divided and belongs 100% to you.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
