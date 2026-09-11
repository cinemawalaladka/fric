"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  User,
  FileText,
  Users,
  Calculator,
  FolderOpen,
  ShieldCheck,
  Award,
  Sparkles,
  Building2,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import { formatInr, getClaimTypeConfig, type IncentiveCalculation } from "@/lib/claim-form-config";
import { formatIndianNumber } from "@/lib/currency";
import type { FacultyProfile, AuthorEntry, CoPIEntry, DocumentSlot } from "@/hooks/use-claim-form";

interface Props {
  claimType: string;
  faculty: FacultyProfile | null;
  departmentName: string;
  details: Record<string, any>;
  authorshipPosition: string;
  authors: AuthorEntry[];
  coPIs: CoPIEntry[];
  incentive: IncentiveCalculation | null;
  documents: DocumentSlot[];
  declarationAccepted: boolean;
  onSetDeclaration: (v: boolean) => void;
}

function ReviewRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number | undefined | null;
  highlight?: boolean;
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-slate-100 last:border-0 gap-1">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <span
        className={`text-xs sm:text-sm text-left sm:text-right font-medium max-w-full sm:max-w-[65%] break-words ${
          highlight ? "text-[#b91c1c] font-bold" : "text-slate-800"
        }`}
      >
        {String(value)}
      </span>
    </div>
  );
}

export function StepReview({
  claimType,
  faculty,
  departmentName,
  details,
  authorshipPosition,
  authors,
  coPIs,
  incentive,
  documents,
  declarationAccepted,
  onSetDeclaration,
}: Props) {
  const config = getClaimTypeConfig(claimType);
  const uploadedDocs = documents.filter((d) => d.file);
  const hasIncentive = incentive?.policyIncentive != null && incentive.policyIncentive > 0;
  const ppsuAuthors = authors.filter((a) => a.isPpsu);

  // Extract common titles and properties with all fallback aliases
  const workTitle =
    claimType === "citation"
      ? (details.scopusId ? `Faculty Citation Impact (Scopus ID: ${details.scopusId})` : "Faculty Citation Impact")
      : (details.paperTitle ||
        details.workTitle ||
        details.title ||
        details.chapterTitle ||
        details.patentTitle ||
        "Untitled Work");

  const containerTitle =
    details.journalTitle ||
    details.journalName ||
    details.publisher ||
    details.bookTitle ||
    details.patentOffice ||
    "—";

  const identifier =
    details.issn ||
    details.isbn ||
    details.patentNumber ||
    details.approvedNumber ||
    details.grantNumber ||
    details.doi ||
    "—";

  // Build detail rows according to claim type
  const detailRows: { label: string; value: any; highlight?: boolean }[] = [];

  const addRow = (label: string, value: any, highlight = false) => {
    if (value !== undefined && value !== null && value !== "" && value !== "None") {
      detailRows.push({ label, value, highlight });
    }
  };

  if (claimType === "book") {
    addRow("Title of Publish", workTitle, true);
    addRow("Name of Publisher", details.publisher || details.publisherName);
    addRow("Publication Level", details.publicationLevel || details.publisherType);
    if (details.recognizedBody) addRow("Recognized Body", details.recognizedBody);
    if (details.recognizedBody === "Other Body" && details.otherRecognizedBody) addRow("Specified Body", details.otherRecognizedBody);
    addRow("ISBN Number", identifier);
    addRow("DOI", details.doi);
    if (details.webLink) addRow("Publish Web Link", details.webLink);
    addRow("Publication Date", details.publicationDate || details.bookPubDate);
  } else if (claimType === "book_chapter") {
    addRow("Title of Chapter", details.chapterTitle || workTitle, true);
    addRow("Title of Book", details.bookTitle || containerTitle);
    addRow("Publication Level", details.publicationLevel || details.publisherType);
    addRow("Recognized Body", details.recognizedBody);
    if (details.recognizedBody === "Other Body" && details.otherRecognizedBody) addRow("Specified Body", details.otherRecognizedBody);
    addRow("ISBN Number", identifier);
    addRow("DOI", details.doi);
    if (details.webLink) addRow("Publish Web Link", details.webLink);
    addRow("Publication Date", details.publicationDate || details.bookPubDate);
    addRow("Chapter Pages", details.chapterPages);
  } else if (claimType === "patent") {
    addRow("Title of Patent / Innovation", workTitle, true);
    addRow("Patent Authority", containerTitle);
    addRow("Country Name", details.country || details.countryName);
    addRow("Patent Status", details.patentStatus);
    addRow("Patent Number / Application No.", identifier);
    addRow("Filing / Grant Date", details.publicationDate || details.grantDate || details.filingDate);
  } else if (claimType === "citation") {
    addRow("Scopus ID", details.scopusId, true);
    addRow("Total Citations in Last Calendar Year (Scopus)", details.totalCitationsLastYear);
    addRow("Total Citations in Last Calendar Year Having PPSU Affiliation", details.ppsuCitationsLastYear);
    addRow("Number of Eligible Citations Claimed", details.eligibleCitations || details.citationCount, true);
    addRow("Scopus / Profile URL", details.scopusLink || details.verificationUrl);
  } else if (claimType === "research_project") {
    addRow("Research Project Title", workTitle, true);
    addRow("Sponsoring Body / Funding Agency", details.sponsoringBody);
    addRow("Project Level", details.projectLevel);
    addRow("Sanction Reference / Grant Number", details.approvedNumber || details.grantNumber);
    if (details.sanctionedAmount) {
      addRow("Total Sanctioned Amount", `₹${formatIndianNumber(details.sanctionedAmount)}`, true);
    }
    if (details.amountInWords) addRow("Sanctioned Amount in Words", details.amountInWords);
    if (details.depositedAmount) {
      addRow("Amount Deposited in PPSU Account", `₹${formatIndianNumber(details.depositedAmount)}`, true);
    }
    if (details.depositDate) addRow("PPSU Deposit Date", details.depositDate);
    if (details.depositProofName || details.depositProofUrl) {
      addRow("PPSU Deposit Proof (PDF)", details.depositProofName || "Uploaded");
    }
    if (details.startDate || details.endDate) {
      addRow("Project Duration", `${details.startDate || "Start"} to ${details.endDate || "Ongoing"}`);
    }
    if (details.piOrCoPi) addRow("Status on Project", details.piOrCoPi);
    if (details.sponsoringAddress) addRow("Sponsoring Body Address", details.sponsoringAddress);
  } else {
    addRow("Title of Work / Publication", workTitle, true);
    addRow("Journal / Publisher / Authority", containerTitle);
    addRow("Publication Level", details.publicationLevel || details.publisherType);
    if (details.recognizedBody) addRow("Recognized Body", details.recognizedBody);
    if (details.recognizedBody === "Other Body" && details.otherRecognizedBody) addRow("Specified Body", details.otherRecognizedBody);
    addRow("ISSN / ISBN / Grant No.", identifier);
    addRow("DOI", details.doi);
    if (details.webLink) addRow("Publish Web Link", details.webLink);
    addRow("Publication Date", details.publicationDate || details.bookPubDate);
    addRow("Volume / Issue / Pages", details.volume || details.chapterPages || details.pageRange);
    addRow("Journal Category / Indexing", details.indexing);
    addRow("Quartile", details.quartile);
    addRow("Impact Factor", details.impactFactor);
    addRow("Acceptance Rate", details.acceptanceRate ? `${details.acceptanceRate}%` : null);
    addRow("ABDC Category", details.abdcCategory);
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
            Review & Submit Claim
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-[#b91c1c] border border-red-200/60">
            Final Step
          </span>
        </div>
        <p className="text-sm text-slate-500">
          Carefully review all publication details, authors, incentive calculations, and attached documents before final submission.
        </p>
      </div>

      {/* ══════════ TOP HERO SUMMARY PREVIEW CARD ══════════ */}
      <Card className="border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-md overflow-hidden relative">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-48 h-48 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
        <CardContent className="p-5 sm:p-6 space-y-4 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs font-bold uppercase tracking-wider">
                {config?.name || claimType}
              </Badge>
              <Badge className="bg-slate-700/50 text-slate-300 border-slate-600 text-xs">
                {details.publicationLevel || "PPSU Claim"}
              </Badge>
            </div>
            <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
              <FolderOpen className="h-3.5 w-3.5 text-emerald-400" />
              {uploadedDocs.length} Document(s) Attached
            </span>
          </div>

          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
              {claimType === "citation" ? "Citation Claim" : "Title of Work"}
            </p>
            <h3 className="text-base sm:text-lg font-bold text-white mt-0.5 leading-snug line-clamp-2">
              {workTitle}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Category
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-200 mt-0.5 truncate">
                {incentive?.applicableCategory || "Standard Policy"}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Policy Incentive
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-200 mt-0.5">
                {formatInr(incentive?.policyIncentive)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
              <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block">
                Your Estimated Share
              </span>
              <p className="text-sm sm:text-base font-extrabold text-emerald-400 mt-0.5">
                {formatInr(incentive?.facultyShare)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ══════════ DETAILED SECTIONS ══════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Faculty Information */}
        <Card className="border border-slate-200/80 bg-white shadow-xs">
          <CardHeader className="py-3 px-4 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
              <User className="h-4 w-4 text-[#b91c1c]" /> Faculty Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-0.5">
            <ReviewRow label="Full Name" value={faculty?.name} />
            <ReviewRow label="Employee ID" value={faculty?.employee_id} />
            <ReviewRow label="Department" value={departmentName} />
            <ReviewRow label="Designation" value={faculty?.designation} />
            <ReviewRow label="Email" value={faculty?.email} />
          </CardContent>
        </Card>

        {/* 2. Publication & Work Details */}
        <Card className="border border-slate-200/80 bg-white shadow-xs">
          <CardHeader className="py-3 px-4 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#b91c1c]" /> Work & Publication Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-0.5 max-h-80 overflow-y-auto">
            {detailRows.map((row) => (
              <ReviewRow key={row.label} label={row.label} value={row.value} highlight={row.highlight} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ══════════ AUTHORSHIP & CO-AUTHORS ══════════ */}
      {config?.hasAuthorsStep && (
        <Card className="border border-slate-200/80 bg-white shadow-xs">
          <CardHeader className="py-3 px-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
            <CardTitle className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#b91c1c]" />
              {claimType === "patent" ? "Inventors & Co-Inventors" : "Authorship & Co-Authors"}
            </CardTitle>
            <Badge variant="outline" className="text-[11px] font-semibold">
              {authors.length + 1} Total ({ppsuAuthors.length + 1} PPSU)
            </Badge>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/80 p-3 rounded-lg border border-slate-200/60">
              <div>
                <span className="text-slate-500 font-semibold">Your Authorship Role:</span>{" "}
                <span className="font-bold text-slate-800">
                  {authorshipPosition === "first"
                    ? "First Author"
                    : authorshipPosition === "corresponding"
                    ? "Corresponding Author"
                    : authorshipPosition === "both"
                    ? "First & Corresponding Author"
                    : "Co-Author / Other"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">PPSU Sharing Rule:</span>{" "}
                <span className="font-bold text-slate-800">
                  {incentive?.distributionRule || "Equal Distribution"}
                </span>
              </div>
            </div>

            {authors.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Co-Author Entries ({authors.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {authors.map((a, i) => (
                    <div
                      key={a.id}
                      className="p-2.5 rounded-lg border border-slate-200/80 bg-white text-xs flex items-center justify-between"
                    >
                      <div className="truncate pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-800">
                            {a.authorOrder ? `Position #${a.authorOrder}` : `#${i + 1}`}: {a.name || "Co-Author"}
                          </span>
                          {a.isFirstAuthor && (
                            <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-1 rounded">
                              1st Author
                            </span>
                          )}
                          {a.isCorrespondingAuthor && (
                            <span className="text-[9px] font-bold bg-purple-100 text-purple-900 px-1 rounded">
                              Corr.
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {a.institution || "Institution N/A"} {a.affiliation ? `• ${a.affiliation}` : ""}
                        </p>
                      </div>
                      {a.isPpsu ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] shrink-0 font-bold">
                          PPSU Faculty
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-slate-500 shrink-0">
                          External
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ══════════ ATTACHED SUPPORTING DOCUMENTS ══════════ */}
      <Card className="border border-slate-200/80 bg-white shadow-xs">
        <CardHeader className="py-3 px-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
          <CardTitle className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-[#b91c1c]" /> Attached Supporting Documents
          </CardTitle>
          <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs">
            {uploadedDocs.length} of {documents.length} slots uploaded
          </Badge>
        </CardHeader>
        <CardContent className="p-4">
          {uploadedDocs.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-center">
              <p className="text-xs text-amber-800 font-medium">
                ⚠️ No documents have been attached yet. Please attach required proofs in Step 4.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {uploadedDocs.map((doc) => (
                <div
                  key={doc.slotId}
                  className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-red-100/60 border border-red-200/60 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-[#b91c1c]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{doc.label}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {doc.file?.name} ({(doc.file!.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] shrink-0">
                    Ready
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ══════════ APPLICANT DECLARATION ══════════ */}
      <Card className="border border-red-200/80 bg-red-50/30 shadow-xs">
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#b91c1c]" />
            <span className="text-sm font-bold text-slate-900">Applicant Declaration & Undertaking *</span>
          </div>
          <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-red-200/60">
            <Checkbox
              id="declaration"
              checked={declarationAccepted}
              onCheckedChange={(v) => onSetDeclaration(!!v)}
              className="mt-0.5 accent-[#b91c1c] data-[state=checked]:bg-[#b91c1c] data-[state=checked]:border-[#b91c1c]"
            />
            <Label htmlFor="declaration" className="text-xs leading-relaxed cursor-pointer font-medium text-slate-700">
              I hereby declare that all information and attached documentation provided in this research incentive claim are accurate, complete, and genuine. I understand that false claims will lead to immediate cancellation, recovery, and institutional disciplinary action.
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
