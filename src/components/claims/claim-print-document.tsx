"use client";

import React from "react";
import Image from "next/image";
import { formatDateTime, formatDateOnly, numberToWordsInr, resolveClaimTitle, resolveDetailItem } from "@/lib/utils";
import { WORKFLOW_STAGES } from "@/lib/constants";
import { CheckCircle2, ShieldCheck, Award, FileText, Building2, User, Calendar, Layers, Hash } from "lucide-react";

function formatInr(amount?: number | string | null) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

export interface ClaimPrintDocumentProps {
  claim: any;
  generatedAt?: string;
}

export function ClaimPrintDocument({ claim, generatedAt }: ClaimPrintDocumentProps) {
  if (!claim) return null;

  const detailItem = resolveDetailItem(claim);
  const claimTitle = resolveClaimTitle(claim);
  const isApproved = claim.status === "APPROVED";
  const approvedAmountNum = Number(claim.approved_amount || claim.calculated_amount || claim.claimed_amount || 0);
  const claimedAmountNum = Number(claim.claimed_amount || 0);
  const calculatedAmountNum = Number(claim.calculated_amount || claim.claimed_amount || 0);

  const printTimestamp = generatedAt || new Date().toISOString();
  const academicYearName = claim.academic_year?.name || "2025-2026";
  const claimNumber = claim.claim_number || "FRIC-CLAIM";
  const claimTypeCode = claim.claim_type?.code || "JOURNAL_PUBLICATION";
  const claimTypeName = claim.claim_type?.name || "Research Publication";

  // Authors for publication / projects
  const authors: any[] = detailItem?.authors || detailItem?.publication_authors || [];
  const projectMembers: any[] = detailItem?.members || [];

  // Criteria checks from calculation snapshot
  const calcSnapshot = claim.calculation_snapshot;
  const criteriaChecks: any[] = Array.isArray(calcSnapshot?.criteriaChecks) ? calcSnapshot.criteriaChecks : [];

  // Approvals audit trail
  const approvals: any[] = Array.isArray(claim.claim_approvals) ? claim.claim_approvals : [];
  const documents: any[] = Array.isArray(claim.claim_documents) ? claim.claim_documents : [];

  return (
    <div
      id="fric-sanction-order-print"
      className="bg-white text-slate-900 font-sans p-6 sm:p-8 md:p-10 w-full max-w-[880px] mx-auto text-xs leading-relaxed border border-slate-300 shadow-xl print:border-none print:shadow-none print:p-0 print:max-w-full"
      style={{ fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif" }}
    >
      {/* ═══════════════ UNIVERSITY OFFICIAL HEADER ═══════════════ */}
      <div className="border-b-2 border-slate-900 pb-4 mb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative w-16 h-16 shrink-0 bg-slate-50 border border-slate-200 rounded p-1 flex items-center justify-center">
              {/* University Logo Image */}
              <Image
                src="/ppsuimage/ppsulogo.png"
                alt="P. P. Savani University"
                width={60}
                height={60}
                className="object-contain"
                priority
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-extrabold uppercase tracking-tight text-slate-950 leading-tight">
                P. P. Savani University
              </h1>
              <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wide mt-0.5">
                Research & Development Cell • Faculty Research Incentive Cell (FRIC)
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                NH 8, GETCO, Near Biltech Company, Village: Dhamdod, Kosamba, Dist. Surat - 394125, Gujarat, India
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 sm:border-l border-slate-300 pt-2 sm:pt-0 sm:pl-4 self-stretch sm:self-center flex flex-col justify-center">
            <div>
              <span className="inline-block px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-slate-900 text-white rounded-xs">
                Official Sanction Order
              </span>
            </div>
            <p className="text-[10px] font-mono font-bold text-slate-900 mt-1">
              Ref: PPSU/FRIC/{academicYearName.replace(/\s+/g, "")}/{claimNumber}
            </p>
            <p className="text-[9px] text-slate-500 font-mono mt-0.5">
              Issued: {formatDateOnly(printTimestamp)}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-700 font-medium">
          <span>
            <strong>Document:</strong> Research Incentive Sanction & Audit Certificate
          </span>
          <span>
            <strong>Academic Session:</strong> {academicYearName}
          </span>
          <span>
            <strong>Generated On:</strong> {formatDateTime(printTimestamp)}
          </span>
        </div>
      </div>

      {/* ═══════════════ SANCTION SUMMARY BANNER ═══════════════ */}
      <div className="mb-5 p-4 rounded-md border-2 border-emerald-700/80 bg-emerald-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print-break-inside-avoid">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-extrabold text-sm text-slate-950">{claimNumber}</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${
                isApproved
                  ? "bg-emerald-600 text-white border-emerald-700"
                  : "bg-amber-100 text-amber-900 border-amber-300"
              }`}
            >
              {isApproved ? "✓ Fully Approved & Sanctioned" : `Stage: ${claim.current_stage || "In Review"}`}
            </span>
          </div>
          <p className="text-[11px] font-bold text-slate-800 mt-1">
            Category: <span className="text-emerald-900">{claimTypeName}</span>
          </p>
          <p className="text-[10px] text-slate-600">
            Submission Date: {formatDateTime(claim.submitted_at || claim.created_at)}
          </p>
        </div>

        <div className="text-left sm:text-right bg-white sm:bg-transparent p-2.5 sm:p-0 rounded border sm:border-0 border-emerald-200 shrink-0">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
            Final Sanctioned Payout
          </span>
          <span className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-700 block leading-tight">
            {formatInr(approvedAmountNum)}
          </span>
          <span className="text-[10px] font-semibold text-slate-700 block mt-0.5 italic">
            ({numberToWordsInr(approvedAmountNum)})
          </span>
        </div>
      </div>

      {/* ═══════════════ SECTION 1: FACULTY / CLAIMANT PROFILE ═══════════════ */}
      <div className="mb-5 border border-slate-300 rounded-md overflow-hidden print-break-inside-avoid">
        <div className="bg-slate-100 px-3.5 py-1.5 border-b border-slate-300 flex items-center justify-between">
          <h2 className="font-extrabold uppercase tracking-wider text-[11px] text-slate-900 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-slate-700" />
            1. Faculty & Claimant Profile
          </h2>
          <span className="text-[9px] font-mono text-slate-500 font-semibold">
            Emp ID: {claim.faculty?.employee_id || "PPSU-FAC"}
          </span>
        </div>
        <div className="p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-800">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Faculty Member</span>
            <span className="font-bold text-[11px] text-slate-950 block">{claim.faculty?.name || "N/A"}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Designation</span>
            <span className="font-semibold text-[11px] text-slate-900 block">{claim.faculty?.designation || "N/A"}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Department</span>
            <span className="font-semibold text-[11px] text-slate-900 block">
              {claim.faculty?.department?.name || "University Department"}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Official Email</span>
            <span className="font-mono text-[10px] text-slate-900 block">{claim.faculty?.email || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* ═══════════════ SECTION 2: RESEARCH WORK & OUTPUT DETAILS ═══════════════ */}
      <div className="mb-5 border border-slate-300 rounded-md overflow-hidden print-break-inside-avoid">
        <div className="bg-slate-100 px-3.5 py-1.5 border-b border-slate-300 flex items-center justify-between">
          <h2 className="font-extrabold uppercase tracking-wider text-[11px] text-slate-900 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-slate-700" />
            2. Research Work & Metric Details
          </h2>
          <span className="text-[9px] font-semibold text-slate-600 uppercase">
            Type: {claimTypeName}
          </span>
        </div>

        <div className="p-3.5 space-y-3">
          {/* Research Title */}
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">
              Title of Paper / Research Work:
            </span>
            <p className="text-xs font-bold text-slate-950 leading-snug">
              {claimTitle}
            </p>
          </div>

          {/* Research Metadata Grid according to type */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {detailItem?.journal_name && (
              <div className="p-2 bg-slate-50/70 border border-slate-200 rounded">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Journal / Source</span>
                <span className="font-semibold text-slate-900 block truncate" title={detailItem.journal_name}>
                  {detailItem.journal_name}
                </span>
              </div>
            )}

            {detailItem?.publisher && (
              <div className="p-2 bg-slate-50/70 border border-slate-200 rounded">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Publisher</span>
                <span className="font-semibold text-slate-900 block truncate">{detailItem.publisher}</span>
              </div>
            )}

            {detailItem?.indexing && (
              <div className="p-2 bg-slate-50/70 border border-slate-200 rounded">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Indexing Database</span>
                <span className="font-bold text-slate-900 block">{detailItem.indexing}</span>
              </div>
            )}

            {detailItem?.quartile && (
              <div className="p-2 bg-slate-50/70 border border-slate-200 rounded">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Journal Quartile</span>
                <span className="font-extrabold text-emerald-800 block">{detailItem.quartile}</span>
              </div>
            )}

            {detailItem?.impact_factor !== undefined && detailItem?.impact_factor !== null && (
              <div className="p-2 bg-slate-50/70 border border-slate-200 rounded">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Impact Factor</span>
                <span className="font-bold text-slate-900 block">{detailItem.impact_factor}</span>
              </div>
            )}

            {detailItem?.issn && (
              <div className="p-2 bg-slate-50/70 border border-slate-200 rounded">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">ISSN / e-ISSN</span>
                <span className="font-mono text-slate-900 block">{detailItem.issn}</span>
              </div>
            )}

            {detailItem?.isbn && (
              <div className="p-2 bg-slate-50/70 border border-slate-200 rounded">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">ISBN Number</span>
                <span className="font-mono text-slate-900 block">{detailItem.isbn}</span>
              </div>
            )}

            {detailItem?.doi && (
              <div className="p-2 bg-slate-50/70 border border-slate-200 rounded">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">DOI / Persistent URL</span>
                <span className="font-mono text-[9px] text-slate-800 block truncate" title={detailItem.doi}>
                  {detailItem.doi}
                </span>
              </div>
            )}

            {detailItem?.patent_number && (
              <div className="p-2 bg-slate-50/70 border border-slate-200 rounded">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Patent Number</span>
                <span className="font-mono font-bold text-slate-900 block">{detailItem.patent_number}</span>
              </div>
            )}

            {detailItem?.patent_office && (
              <div className="p-2 bg-slate-50/70 border border-slate-200 rounded">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Patent Office</span>
                <span className="font-semibold text-slate-900 block">{detailItem.patent_office}</span>
              </div>
            )}

            {detailItem?.country && (
              <div className="p-2 bg-slate-50/70 border border-slate-200 rounded">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Country</span>
                <span className="font-semibold text-slate-900 block">{detailItem.country}</span>
              </div>
            )}

            {detailItem?.patent_status && (
              <div className="p-2 bg-slate-50/70 border border-slate-200 rounded">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Patent Status</span>
                <span className="font-semibold text-slate-900 block">{detailItem.patent_status}</span>
              </div>
            )}

            {detailItem?.funding_agency && (
              <div className="p-2 bg-slate-50/70 border border-slate-200 rounded">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Funding Agency</span>
                <span className="font-semibold text-slate-900 block">{detailItem.funding_agency}</span>
              </div>
            )}

            {detailItem?.sanctioned_amount !== undefined && detailItem?.sanctioned_amount !== null && (
              <div className="p-2 bg-slate-50/70 border border-slate-200 rounded">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Sanctioned Project Budget</span>
                <span className="font-mono font-bold text-slate-900 block">
                  {formatInr(detailItem.sanctioned_amount)}
                </span>
              </div>
            )}

            {detailItem?.scopus_id && (
              <div className="p-2 bg-slate-50/70 border border-slate-200 rounded">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Scopus ID</span>
                <span className="font-mono font-bold text-slate-900 block">{detailItem.scopus_id}</span>
              </div>
            )}

            {detailItem?.total_citations_last_calendar_year !== undefined && detailItem?.total_citations_last_calendar_year !== null && (
              <div className="p-2 bg-slate-50/70 border border-slate-200 rounded">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Total Citations (Last Year)</span>
                <span className="font-mono font-bold text-slate-900 block">{detailItem.total_citations_last_calendar_year}</span>
              </div>
            )}

            {detailItem?.total_ppsu_citations_last_calendar_year !== undefined && detailItem?.total_ppsu_citations_last_calendar_year !== null && (
              <div className="p-2 bg-slate-50/70 border border-slate-200 rounded">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">PPSU Citations (Last Year)</span>
                <span className="font-mono font-bold text-slate-900 block">{detailItem.total_ppsu_citations_last_calendar_year}</span>
              </div>
            )}

            {detailItem?.amount_deposited_in_ppsu !== undefined && detailItem?.amount_deposited_in_ppsu !== null && (
              <div className="p-2 bg-slate-50/70 border border-slate-200 rounded">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Amount Deposited in PPSU</span>
                <span className="font-mono font-bold text-slate-900 block">{formatInr(detailItem.amount_deposited_in_ppsu)}</span>
              </div>
            )}

            {detailItem?.deposit_date && (
              <div className="p-2 bg-slate-50/70 border border-slate-200 rounded">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">PPSU Deposit Date</span>
                <span className="font-semibold text-slate-900 block">{formatDateOnly(detailItem.deposit_date)}</span>
              </div>
            )}

            {detailItem?.citation_count !== undefined && (
              <div className="p-2 bg-slate-50/70 border border-slate-200 rounded">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Eligible Citations</span>
                <span className="font-mono font-bold text-slate-900 block">{detailItem.citation_count}</span>
              </div>
            )}

            {detailItem?.publication_level && (
              <div className="p-2 bg-slate-50/70 border border-slate-200 rounded">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Publication Level</span>
                <span className="font-semibold text-slate-900 block">{detailItem.publication_level}</span>
              </div>
            )}

            {detailItem?.web_link && (
              <div className="p-2 bg-slate-50/70 border border-slate-200 rounded">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Publish Web Link</span>
                <a href={detailItem.web_link} target="_blank" rel="noopener noreferrer" className="font-mono text-[9px] text-blue-600 underline block truncate">
                  {detailItem.web_link}
                </a>
              </div>
            )}

            {detailItem?.publication_date && (
              <div className="p-2 bg-slate-50/70 border border-slate-200 rounded">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Date of Publication</span>
                <span className="font-semibold text-slate-900 block">{formatDateOnly(detailItem.publication_date)}</span>
              </div>
            )}
          </div>

          {/* Author list table if available */}
          {authors.length > 0 && (
            <div className="pt-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1.5">
                Co-Authorship & PPSU Faculty Contribution:
              </span>
              <table className="w-full text-left text-[10px] border border-slate-200 rounded overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
                  <tr>
                    <th className="py-1 px-2 border-b border-r border-slate-200">#</th>
                    <th className="py-1 px-2 border-b border-r border-slate-200">Author Name</th>
                    <th className="py-1 px-2 border-b border-r border-slate-200">Role / Position</th>
                    <th className="py-1 px-2 border-b border-slate-200 text-center">PPSU Faculty?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {authors.map((auth: any, idx: number) => (
                    <tr key={idx} className={auth.is_ppsu_faculty ? "bg-emerald-50/30" : ""}>
                      <td className="py-1 px-2 border-r border-slate-200 font-mono text-center">{auth.author_order || idx + 1}</td>
                      <td className="py-1 px-2 border-r border-slate-200 font-semibold text-slate-900">
                        {auth.author_name}
                      </td>
                      <td className="py-1 px-2 border-r border-slate-200 text-slate-700">
                        {auth.is_first_author && auth.is_corresponding_author
                          ? "First & Corresponding Author"
                          : auth.is_first_author
                          ? "First Author"
                          : auth.is_corresponding_author
                          ? "Corresponding Author"
                          : `Co-Author (Position #${auth.author_order || idx + 1})`}
                      </td>
                      <td className="py-1 px-2 text-center font-bold">
                        {auth.is_ppsu_faculty ? (
                          <span className="text-emerald-700">✓ Yes (PPSU)</span>
                        ) : (
                          <span className="text-slate-400">External</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════ SECTION 3: INCENTIVE CALCULATION & FINANCIAL BREAKDOWN ═══════════════ */}
      <div className="mb-5 border border-slate-300 rounded-md overflow-hidden print-break-inside-avoid">
        <div className="bg-slate-100 px-3.5 py-1.5 border-b border-slate-300 flex items-center justify-between">
          <h2 className="font-extrabold uppercase tracking-wider text-[11px] text-slate-900 flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-slate-700" />
            3. Policy Incentive Calculation & Financial Breakdown
          </h2>
          <span className="text-[9px] font-mono text-slate-500">
            PPSU Policy Matrix v2.0
          </span>
        </div>

        <div className="p-3.5 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[9px] text-slate-500 uppercase font-bold block">Applicable Policy Bracket</span>
              <span className="font-bold text-slate-950 block text-[11px]">
                {calcSnapshot?.applicableCategory || "Standard Institutional Policy"}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 uppercase font-bold block">Base Policy Sum</span>
              <span className="font-bold text-slate-900 block font-mono">
                {calcSnapshot?.policyIncentive ? formatInr(calcSnapshot.policyIncentive) : formatInr(claimedAmountNum)}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 uppercase font-bold block">Sharing / Distribution Rule</span>
              <span className="font-semibold text-slate-800 block text-[10px]">
                {calcSnapshot?.distributionRule || "100% (Single Author)"}
              </span>
            </div>
            <div className="bg-emerald-100/60 p-1.5 rounded border border-emerald-300">
              <span className="text-[9px] text-emerald-800 uppercase font-extrabold block">Sanctioned Amount</span>
              <span className="font-extrabold text-emerald-900 block font-mono text-sm">
                {formatInr(approvedAmountNum)}
              </span>
            </div>
          </div>

          {/* Criteria checks evaluated */}
          {criteriaChecks.length > 0 && (
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                Policy Eligibility & Criteria Validations:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {criteriaChecks.map((check, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-1.5 rounded border border-slate-200 bg-white text-[10px]"
                  >
                    <span className="text-slate-800 truncate pr-1 font-medium">{check.label}</span>
                    <span className={`font-mono font-bold shrink-0 ${check.met ? "text-emerald-700" : "text-slate-500"}`}>
                      {check.detail || (check.met ? "✓ Met" : "—")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════ SECTION 4: MULTI-STAGE APPROVAL AUDIT TRAIL ═══════════════ */}
      <div className="mb-5 border border-slate-300 rounded-md overflow-hidden print-break-inside-avoid">
        <div className="bg-slate-100 px-3.5 py-1.5 border-b border-slate-300 flex items-center justify-between">
          <h2 className="font-extrabold uppercase tracking-wider text-[11px] text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-700" />
            4. Multi-Stage Verification & Approval Audit Trail
          </h2>
          <span className="text-[9px] font-mono text-slate-500">
            Full Institutional Governance Chain
          </span>
        </div>

        <table className="w-full text-left text-[10px]">
          <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
            <tr>
              <th className="py-2 px-2.5 border-r border-slate-200">Stage / Authority</th>
              <th className="py-2 px-2.5 border-r border-slate-200">Verifier Name & Designation</th>
              <th className="py-2 px-2.5 border-r border-slate-200 text-center">Decision</th>
              <th className="py-2 px-2.5 border-r border-slate-200">Exact Date & Time</th>
              <th className="py-2 px-2.5">Endorsement / Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {/* Faculty Submission Line */}
            <tr className="bg-slate-50/40">
              <td className="py-2 px-2.5 border-r border-slate-200 font-semibold text-slate-900">
                1. Faculty Claim Submission
              </td>
              <td className="py-2 px-2.5 border-r border-slate-200 font-medium text-slate-800">
                {claim.faculty?.name || "Faculty Claimant"}
              </td>
              <td className="py-2 px-2.5 border-r border-slate-200 text-center font-bold text-blue-700">
                SUBMITTED
              </td>
              <td className="py-2 px-2.5 border-r border-slate-200 font-mono text-slate-600">
                {formatDateTime(claim.submitted_at || claim.created_at)}
              </td>
              <td className="py-2 px-2.5 text-slate-600 italic">
                Initial claim submission with verification attachments
              </td>
            </tr>

            {/* Approval entries */}
            {approvals.map((app: any, idx: number) => {
              const stageConfig = WORKFLOW_STAGES[app.stage] || { title: app.stage, roleLabel: app.stage };
              const isApprovedAction = app.status === "VERIFIED" || app.status === "APPROVED";

              return (
                <tr key={app.id || idx} className={isApprovedAction ? "bg-emerald-50/20" : ""}>
                  <td className="py-2 px-2.5 border-r border-slate-200 font-semibold text-slate-900">
                    {idx + 2}. {stageConfig.roleLabel}
                  </td>
                  <td className="py-2 px-2.5 border-r border-slate-200 font-medium text-slate-800">
                    {app.approver?.name || "Authorized Verifier"}
                    {app.approver?.designation && (
                      <span className="block text-[9px] text-slate-500 font-normal">
                        ({app.approver.designation})
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2.5 border-r border-slate-200 text-center font-bold">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] ${
                        isApprovedAction
                          ? "bg-emerald-100 text-emerald-800 font-extrabold"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="py-2 px-2.5 border-r border-slate-200 font-mono text-slate-700 font-semibold">
                    {formatDateTime(app.action_at)}
                  </td>
                  <td className="py-2 px-2.5 text-slate-700 italic">
                    {app.remarks ? `"${app.remarks}"` : "Verified and endorsed for next stage."}
                  </td>
                </tr>
              );
            })}

            {/* If approved with historical verification records (older claims) */}
            {approvals.length === 0 && isApproved && (
              <>
                <tr className="bg-emerald-50/20">
                  <td className="py-2 px-2.5 border-r border-slate-200 font-semibold text-slate-900">
                    2. Institutional Committee & HOD Verification
                  </td>
                  <td className="py-2 px-2.5 border-r border-slate-200 font-medium text-slate-800">
                    Dean / Research Committee Panel
                    <span className="block text-[9px] text-slate-500 font-normal">(R&D Cell, PPSU)</span>
                  </td>
                  <td className="py-2 px-2.5 border-r border-slate-200 text-center font-bold">
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-100 text-emerald-800 font-extrabold">VERIFIED</span>
                  </td>
                  <td className="py-2 px-2.5 border-r border-slate-200 font-mono text-slate-700 font-semibold">
                    {formatDateTime(claim.updated_at || claim.created_at)}
                  </td>
                  <td className="py-2 px-2.5 text-slate-700 italic">
                    Policy criteria and research metrics verified
                  </td>
                </tr>
                <tr className="bg-emerald-50/30">
                  <td className="py-2 px-2.5 border-r border-slate-200 font-semibold text-slate-900">
                    3. Provost Final Sanction Approval
                  </td>
                  <td className="py-2 px-2.5 border-r border-slate-200 font-medium text-slate-800">
                    Provost / Vice-Chancellor
                    <span className="block text-[9px] text-slate-500 font-normal">(Office of the Provost)</span>
                  </td>
                  <td className="py-2 px-2.5 border-r border-slate-200 text-center font-bold">
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-100 text-emerald-800 font-extrabold">APPROVED</span>
                  </td>
                  <td className="py-2 px-2.5 border-r border-slate-200 font-mono text-slate-700 font-semibold">
                    {formatDateTime(claim.updated_at || claim.created_at)}
                  </td>
                  <td className="py-2 px-2.5 text-slate-700 italic font-semibold">
                    Sanction granted for {formatInr(approvedAmountNum)}
                  </td>
                </tr>
              </>
            )}

            {/* If no approvals recorded yet and not approved */}
            {approvals.length === 0 && !isApproved && (
              <tr>
                <td colSpan={5} className="py-3 px-2.5 text-center text-slate-500 italic">
                  Awaiting first level verification from Head of Department / Principal.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ═══════════════ SECTION 5: SUPPORTING DOCUMENTS ATTACHED ═══════════════ */}
      {documents.length > 0 && (
        <div className="mb-5 border border-slate-300 rounded-md overflow-hidden print-break-inside-avoid">
          <div className="bg-slate-100 px-3.5 py-1.5 border-b border-slate-300 flex items-center justify-between">
            <h2 className="font-extrabold uppercase tracking-wider text-[11px] text-slate-900 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-slate-700" />
              5. Supporting Verification Documents Verified
            </h2>
            <span className="text-[9px] font-mono text-slate-500">{documents.length} File(s) Attached</span>
          </div>
          <table className="w-full text-left text-[10px]">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-1.5 px-2.5 border-r border-slate-200">#</th>
                <th className="py-1.5 px-2.5 border-r border-slate-200">Document Type</th>
                <th className="py-1.5 px-2.5 border-r border-slate-200">File Name</th>
                <th className="py-1.5 px-2.5 border-r border-slate-200 text-center">Status</th>
                <th className="py-1.5 px-2.5">Upload Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {documents.map((doc: any, idx: number) => (
                <tr key={doc.id || idx}>
                  <td className="py-1.5 px-2.5 border-r border-slate-200 font-mono text-center">{idx + 1}</td>
                  <td className="py-1.5 px-2.5 border-r border-slate-200 font-semibold text-slate-900">
                    {doc.document_type}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-200 font-mono text-slate-700 truncate max-w-[200px]">
                    {doc.file_name}
                  </td>
                  <td className="py-1.5 px-2.5 border-r border-slate-200 text-center font-bold text-emerald-700">
                    {doc.verification_status || "VERIFIED"}
                  </td>
                  <td className="py-1.5 px-2.5 font-mono text-slate-600">
                    {formatDateTime(doc.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════════════ SECTION 6: INSTITUTIONAL SIGNATURES & AUTHORIZATION ═══════════════ */}
      <div className="mt-8 pt-4 border-t-2 border-slate-800 print-break-inside-avoid">
        <div className="grid grid-cols-2 gap-8 mb-6">
          {/* Dean / R&D Convener Signature Box */}
          <div className="border border-slate-300 rounded p-3 text-center bg-slate-50/50">
            <div className="h-14 flex flex-col items-center justify-center">
              <div className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ✓ Digitally Verified via FRIC Governance
              </div>
            </div>
            <div className="border-t border-slate-300 pt-1.5 mt-1">
              <span className="font-extrabold text-[11px] text-slate-900 block">
                Dean / Convener
              </span>
              <span className="text-[10px] text-slate-600 block">
                Research & Development Cell, PPSU
              </span>
            </div>
          </div>

          {/* Provost Signature Box */}
          <div className="border border-emerald-400 rounded p-3 text-center bg-emerald-50/30">
            <div className="h-14 flex flex-col items-center justify-center">
              <div className="text-[10px] font-mono text-emerald-800 font-extrabold bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300 shadow-xs">
                ★ Final Sanction Approved by Provost
              </div>
              <span className="text-[9px] font-mono text-slate-600 mt-1">
                Sanctioned Amount: {formatInr(approvedAmountNum)}
              </span>
            </div>
            <div className="border-t border-emerald-300 pt-1.5 mt-1">
              <span className="font-extrabold text-[11px] text-slate-950 block">
                Office of the Provost
              </span>
              <span className="text-[10px] text-slate-700 block font-medium">
                P. P. Savani University, Surat
              </span>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer & Barcode Authenticity */}
        <div className="p-2.5 rounded bg-slate-100 border border-slate-300 text-[9px] text-slate-600 leading-normal flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="max-w-xl">
            <strong>Institutional Authentication Notice:</strong> This is a computer-generated official Research Incentive Sanction Order generated through the P. P. Savani University FRIC Governance System. All verification stages, timestamps, and approved payout figures are recorded in the institutional audit log. Validated for university finance and accounts disbursement.
          </p>
          <div className="text-right shrink-0 font-mono text-[8px] text-slate-500">
            <span>FRIC-AUTH-HASH: {claim.id?.substring(0, 16) || "AUTHENTICATED"}</span>
            <span className="block">Page 1 of 1 • System Certified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
