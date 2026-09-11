"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { User, Building2, GraduationCap, School, Info, Sparkles } from "lucide-react";
import type { FacultyProfile } from "@/hooks/use-claim-form";

interface Props {
  claimType: string; // "research_paper" | "book" | "book_chapter" | "patent"
  faculty: FacultyProfile | null;
  departmentName: string;
  schoolName: string;
  details: Record<string, any>;
  onUpdate: (key: string, value: any) => void;
}

export function StepCommonPublicationForm({
  claimType,
  faculty,
  departmentName,
  schoolName,
  details,
  onUpdate,
}: Props) {
  const isPaper = claimType === "research_paper";
  const isBook = claimType === "book";
  const isChapter = claimType === "book_chapter";
  const isPatent = claimType === "patent";

  const recognizedBody = details.recognizedBody || "Scopus";

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
            {isPaper && "Research / Review Paper Details"}
            {isBook && "Book Publication Details"}
            {isChapter && "Book Chapter Details"}
            {isPatent && "IPR & Patent Details"}
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-[#b91c1c] border border-red-200/60">
            Step 2
          </span>
        </div>
        <p className="text-sm text-slate-500">
          Provide complete publication and work details for incentive calculation.
        </p>
      </div>

      {/* ══════════ READ-ONLY FACULTY INFO BANNER ══════════ */}
      <Card className="border border-slate-200/80 bg-slate-50/70 shadow-xs">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-[#b91c1c]" /> Logged-In Faculty Master Data (Read-Only)
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

      {/* ══════════ COMMON FORM FIELDS ══════════ */}
      <Card className="border border-slate-200/80 bg-white shadow-xs">
        <CardContent className="pt-6 space-y-5">
          {/* Level of Publication */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Level of Publication *
            </Label>
            <RadioGroup
              value={details.publicationLevel || "International"}
              onValueChange={(v) => {
                onUpdate("publicationLevel", v);
                if (v !== "International" && isBook) {
                  onUpdate("webLink", "");
                }
              }}
              className="flex items-center gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="International" id="level-intl" />
                <Label htmlFor="level-intl" className="text-sm font-medium cursor-pointer">
                  International
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="National" id="level-nat" />
                <Label htmlFor="level-nat" className="text-sm font-medium cursor-pointer">
                  National
                </Label>
              </div>
              {isBook && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="State" id="level-state" />
                  <Label htmlFor="level-state" className="text-sm font-medium cursor-pointer">
                    State
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Title Fields (2-column layout for Book, separated for others) */}
          {isBook ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title of Publish */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Title of Publish *
                </Label>
                <Input
                  placeholder="e.g. Advanced Quantum Computing Principles"
                  value={details.paperTitle || details.workTitle || details.title || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdate("paperTitle", val);
                    onUpdate("workTitle", val);
                    onUpdate("title", val);
                  }}
                  className="bg-slate-50/50 border-slate-300 focus:bg-white"
                />
              </div>

              {/* Name of Publisher */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Name of Publisher *
                </Label>
                <Input
                  placeholder="e.g. Springer Nature / Oxford University Press / Elsevier"
                  value={details.publisher || details.publisherName || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdate("publisher", val);
                    onUpdate("publisherName", val);
                  }}
                  className="bg-slate-50/50 border-slate-300 focus:bg-white"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title of Journal / Publisher / Publication Container */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  {isPaper ? "Title of Journal *" : isPatent ? "Patent Authority *" : isChapter ? "Title of Book *" : "Title of Journal / Book / Publisher *"}
                </Label>
                <Input
                  placeholder={
                    isPatent
                      ? "e.g. Indian Patent Office (IPO) / Official Gazette"
                      : isChapter
                      ? "e.g. Handbook of Cloud Computing / Springer Nature"
                      : "e.g. IEEE Transactions on Pattern Analysis"
                  }
                  value={
                    isPatent
                      ? details.patentAuthority || details.patentOffice || details.journalTitle || details.journalName || ""
                      : details.journalTitle || details.journalName || details.bookTitle || ""
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdate("journalTitle", val);
                    onUpdate("journalName", val);
                    if (isPatent) {
                      onUpdate("patentAuthority", val);
                      onUpdate("patentOffice", val);
                    }
                    if (isChapter) onUpdate("bookTitle", val);
                  }}
                  className="bg-slate-50/50 border-slate-300 focus:bg-white"
                />
              </div>

              {/* Title of Paper / Work / Chapter / Patent */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  {isPaper && "Title of Research Paper / Review Paper *"}
                  {isChapter && "Title of Chapter *"}
                  {isPatent && "Title of Patent / Innovation *"}
                </Label>
                <Input
                  placeholder={
                    isPaper
                      ? "e.g. Deep Learning Frameworks for Medical Imaging"
                      : isPatent
                      ? "e.g. Smart IoT Sensor System for Agriculture"
                      : "e.g. Advanced Quantum Computing Principles"
                  }
                  value={details.paperTitle || details.workTitle || ""}
                  onChange={(e) => {
                    onUpdate("paperTitle", e.target.value);
                    onUpdate("workTitle", e.target.value);
                    onUpdate("title", e.target.value);
                    if (isChapter) onUpdate("chapterTitle", e.target.value);
                  }}
                  className="bg-slate-50/50 border-slate-300 focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* Relevant Identifier & Recognized Body */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Relevant Identifier */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                {isPaper && "ISSN Number *"}
                {(isBook || isChapter) && "ISBN Number *"}
                {isPatent && "Patent Number / Application Number *"}
              </Label>
              <Input
                placeholder={
                  isPaper
                    ? "e.g. 2169-3536"
                    : isPatent
                    ? "e.g. 202611012345"
                    : "e.g. 978-3-16-148410-0"
                }
                value={
                  isPatent
                    ? details.patentNumber || ""
                    : isBook || isChapter
                    ? details.isbn || ""
                    : details.issn || ""
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (isPatent) onUpdate("patentNumber", val);
                  else if (isBook || isChapter) onUpdate("isbn", val);
                  else onUpdate("issn", val);
                }}
                className="bg-slate-50/50 border-slate-300 focus:bg-white"
              />
            </div>

            {/* Recognized Body or Country Name (for Patent) */}
            {isPatent ? (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Country Name *
                </Label>
                <Input
                  placeholder="e.g. India, United States, United Kingdom"
                  value={details.country || details.countryName || ""}
                  onChange={(e) => {
                    onUpdate("country", e.target.value);
                    onUpdate("countryName", e.target.value);
                  }}
                  className="bg-slate-50/50 border-slate-300 focus:bg-white"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Recognized Body *
                </Label>
                <Select
                  value={recognizedBody}
                  onValueChange={(v) => onUpdate("recognizedBody", v)}
                >
                  <SelectTrigger className="bg-slate-50/50 border-slate-300 w-full">
                    <SelectValue placeholder="Select Recognized Body" />
                  </SelectTrigger>
                  <SelectContent className="min-w-[280px]">
                    <SelectItem value="Scopus">Scopus</SelectItem>
                    <SelectItem value="Web of Science">Web of Science (WoS)</SelectItem>
                    <SelectItem value="Other Body">Other Body</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Additional text input when "Other Body" is selected */}
          {recognizedBody === "Other Body" && !isPatent && (
            <div className="space-y-2 p-3 rounded-xl bg-amber-50/70 border border-amber-200">
              <Label className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                Specify Recognized Body Name *
              </Label>
              <Input
                placeholder="e.g. PubMed, UGC CARE List, IEEE Xplore, Google Scholar"
                value={details.otherRecognizedBody || ""}
                onChange={(e) => onUpdate("otherRecognizedBody", e.target.value)}
                className="bg-white border-amber-300"
              />
            </div>
          )}

          {/* ══════════ BOOK PUBLICATION SPECIFICS ══════════ */}
          {isBook && (
            <div className="space-y-4 pt-2 border-t border-slate-200/80">
              <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
                Book Publication Timeline & Verification
              </p>

              <div className={`grid grid-cols-1 ${details.publicationLevel === "International" ? "sm:grid-cols-2" : "sm:grid-cols-1"} gap-4`}>
                {/* Publication Date */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Publication Date *</Label>
                  <Input
                    type="date"
                    value={details.publicationDate || details.bookPubDate || ""}
                    onChange={(e) => {
                      onUpdate("publicationDate", e.target.value);
                      onUpdate("bookPubDate", e.target.value);
                    }}
                    className="bg-slate-50/50 border-slate-300 focus:bg-white"
                  />
                </div>

                {/* Publish Web Link (Strictly ONLY when International is selected) */}
                {details.publicationLevel === "International" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Publish Web Link * (Book URL)</Label>
                    <Input
                      type="url"
                      placeholder="e.g. https://www.springer.com/gp/book/9783161484100"
                      value={details.webLink || ""}
                      onChange={(e) => onUpdate("webLink", e.target.value)}
                      className="bg-slate-50/50 border-slate-300 focus:bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Policy Incentive Information */}
              <div className="p-3 rounded-lg bg-violet-50 border border-violet-200/60 text-xs text-violet-900 flex items-center justify-between">
                <span>
                  <strong>Policy Incentive:</strong> {details.publicationLevel === "International" ? "International Publisher: ₹10,000" : details.publicationLevel === "State" ? "State Level: ₹3,000" : "National Publisher: ₹6,000"} (Single PPSU author &mdash; 100% share)
                </span>
                <span className="font-extrabold text-violet-700">
                  {details.publicationLevel === "International" ? "₹10,000" : details.publicationLevel === "State" ? "₹3,000" : "₹6,000"}
                </span>
              </div>
            </div>
          )}

          {/* ══════════ DYNAMIC METRIC FIELDS ══════════ */}
          {/* 1. Research Paper Metrics */}
          {isPaper && (
            <div className="space-y-4 pt-2 border-t border-slate-200/80">
              <p className="text-xs font-bold uppercase tracking-wider text-[#b91c1c]">
                Journal Indexing & Impact Metrics (All Fields Required)
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Journal Category */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Journal Category *</Label>
                  <Select
                    value={details.indexing || "Category A"}
                    onValueChange={(v) => onUpdate("indexing", v)}
                  >
                    <SelectTrigger className="bg-slate-50/50 border-slate-300 w-full">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent className="min-w-[300px]">
                      <SelectItem value="Category A">Category A (High Impact SCI)</SelectItem>
                      <SelectItem value="Category B">Category B (SCI / Scopus Q1-Q2)</SelectItem>
                      <SelectItem value="Category C">Category C (Scopus / ABDC)</SelectItem>
                      <SelectItem value="Non-SCI">Non-SCI / Peer Reviewed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quartile */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Quartile *</Label>
                  <Select
                    value={details.quartile || "Q1"}
                    onValueChange={(v) => onUpdate("quartile", v)}
                  >
                    <SelectTrigger className="bg-slate-50/50 border-slate-300 w-full">
                      <SelectValue placeholder="Select Quartile" />
                    </SelectTrigger>
                    <SelectContent className="min-w-[240px]">
                      <SelectItem value="Q1">Q1 (Top 25%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Publication Date */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Publication Date *</Label>
                  <Input
                    type="date"
                    value={details.publicationDate || ""}
                    onChange={(e) => onUpdate("publicationDate", e.target.value)}
                    className="bg-slate-50/50 border-slate-300 focus:bg-white"
                  />
                </div>

                {/* Impact Factor */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Thomson Reuters Impact Factor *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 4.5"
                    value={details.impactFactor || ""}
                    onChange={(e) => onUpdate("impactFactor", e.target.value)}
                    className="bg-slate-50/50 border-slate-300 focus:bg-white"
                  />
                </div>

                {/* Acceptance Rate */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Acceptance Rate (%) *</Label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    placeholder="e.g. 15"
                    value={details.acceptanceRate || ""}
                    onChange={(e) => onUpdate("acceptanceRate", e.target.value)}
                    className="bg-slate-50/50 border-slate-300 focus:bg-white"
                  />
                </div>

                {/* ABDC Category */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">ABDC Category *</Label>
                  <Select
                    value={details.abdcCategory || "None"}
                    onValueChange={(v) => onUpdate("abdcCategory", v)}
                  >
                    <SelectTrigger className="bg-slate-50/50 border-slate-300 w-full">
                      <SelectValue placeholder="Select ABDC" />
                    </SelectTrigger>
                    <SelectContent className="min-w-[240px]">
                      <SelectItem value="A">ABDC - A* / A</SelectItem>
                      <SelectItem value="B">ABDC - B</SelectItem>
                      <SelectItem value="C">ABDC - C</SelectItem>
                      <SelectItem value="D">ABDC - D</SelectItem>
                      <SelectItem value="None">Not ABDC Listed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* DOI */}
                <div className="space-y-1.5 sm:col-span-2 md:col-span-3">
                  <Label className="text-xs font-semibold text-slate-700">DOI (Digital Object Identifier) *</Label>
                  <Input
                    placeholder="e.g. 10.1109/TPAMI.2026.12345"
                    value={details.doi || ""}
                    onChange={(e) => onUpdate("doi", e.target.value)}
                    className="bg-slate-50/50 border-slate-300 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. Patent Specific Metrics */}
          {isPatent && (
            <div className="space-y-4 pt-2 border-t border-slate-200/80">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Patent Status
              </p>

              <div className="max-w-md">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Patent Status *</Label>
                  <Select
                    value={details.patentStatus === "Filed" ? "Granted" : (details.patentStatus || "Granted")}
                    onValueChange={(v) => onUpdate("patentStatus", v)}
                  >
                    <SelectTrigger className="bg-slate-50/50 border-slate-300">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Published">Published</SelectItem>
                      <SelectItem value="Granted">Granted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* 3. Book Chapter specifics */}
          {isChapter && (
            <div className="space-y-4 pt-2 border-t border-slate-200/80">
              <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
                Book Chapter Publication Details & Verification
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Publication Web Link */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Publish Web Link * (Chapter URL)</Label>
                  <Input
                    type="url"
                    placeholder="e.g. https://link.springer.com/chapter/10.1007/..."
                    value={details.webLink || ""}
                    onChange={(e) => onUpdate("webLink", e.target.value)}
                    className="bg-slate-50/50 border-slate-300 focus:bg-white"
                  />
                </div>

                {/* DOI (Digital Object Identifier) */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">DOI (Digital Object Identifier) *</Label>
                  <Input
                    placeholder="e.g. 10.1007/978-3-030-12345-6_12"
                    value={details.doi || ""}
                    onChange={(e) => onUpdate("doi", e.target.value)}
                    className="bg-slate-50/50 border-slate-300 focus:bg-white"
                  />
                </div>

                {/* Chapter Pages */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Chapter Pages</Label>
                  <Input
                    placeholder="e.g. pp. 125-140"
                    value={details.chapterPages || ""}
                    onChange={(e) => onUpdate("chapterPages", e.target.value)}
                    className="bg-slate-50/50 border-slate-300"
                  />
                </div>

                {/* Publication Date */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Publication Date *</Label>
                  <Input
                    type="date"
                    value={details.publicationDate || details.bookPubDate || ""}
                    onChange={(e) => {
                      onUpdate("publicationDate", e.target.value);
                      onUpdate("bookPubDate", e.target.value);
                    }}
                    className="bg-slate-50/50 border-slate-300 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
