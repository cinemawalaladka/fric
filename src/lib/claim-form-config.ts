// ================================================================
// FRIC — Faculty Claim Form Configuration
// Based on PPSU Research Incentive Policy
// ================================================================

import {
  FileText,
  BookOpen,
  BookMarked,
  Wrench,
  BarChart3,
  FlaskConical,
  type LucideIcon,
} from "lucide-react";

// ============ Claim Types ============

export interface ClaimTypeConfig {
  id: string;
  code: string;
  name: string;
  icon: LucideIcon;
  description: string;
  color: string;
  hasAuthorsStep: boolean;
  stepLabels: string[];
}

export const CLAIM_TYPES: ClaimTypeConfig[] = [
  {
    id: "research_paper",
    code: "RESEARCH_PAPER",
    name: "Research Paper / Review Paper",
    icon: FileText,
    description: "Published research paper or review paper in a journal",
    color: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    hasAuthorsStep: true,
    stepLabels: ["Claim Type", "Publication Details", "Authorship & Co-Authors", "Incentive Summary", "Documents", "Review & Submit"],
  },
  {
    id: "book",
    code: "BOOK",
    name: "Book",
    icon: BookOpen,
    description: "Full authored or edited book with ISBN",
    color: "text-violet-400 bg-violet-400/10 border-violet-400/20",
    hasAuthorsStep: false,
    stepLabels: ["Claim Type", "Book Publication Details", "Incentive Summary", "Documents", "Review & Submit"],
  },
  {
    id: "book_chapter",
    code: "BOOK_CHAPTER",
    name: "Book Chapter",
    icon: BookMarked,
    description: "Chapter published in a book with ISBN",
    color: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    hasAuthorsStep: true,
    stepLabels: ["Claim Type", "Chapter Details", "Authors & Co-Authors", "Incentive Summary", "Documents", "Review & Submit"],
  },
  {
    id: "patent",
    code: "PATENT",
    name: "IPR / Patent",
    icon: Wrench,
    description: "Design patent or granted utility patent",
    color: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    hasAuthorsStep: true,
    stepLabels: ["Claim Type", "Patent Details", "Inventors & Co-Authors", "Incentive Summary", "Documents", "Review & Submit"],
  },
  {
    id: "citation",
    code: "CITATION",
    name: "Citation",
    icon: BarChart3,
    description: "Scopus / Web of Science citations for PPSU-affiliated paper",
    color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
    hasAuthorsStep: false,
    stepLabels: ["Claim Type", "Citation Details", "Incentive Summary", "Documents", "Review & Submit"],
  },
  {
    id: "research_project",
    code: "RESEARCH_PROJECT",
    name: "Research Project",
    icon: FlaskConical,
    description: "Funded research project or grant",
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    hasAuthorsStep: false,
    stepLabels: ["Claim Type", "Project Details & PI/Co-PI", "Incentive Summary", "Documents", "Review & Submit"],
  },
];

export function getClaimTypeConfig(id: string): ClaimTypeConfig | undefined {
  return CLAIM_TYPES.find((t) => t.id === id);
}

// ============ Incentive Policy Master Data ============
// Source: Official PPSU Research Incentive Policy

export const POLICY = {
  RESEARCH_PAPER: {
    CATEGORY_A: { amount: 25000, label: "Category A", description: "Must meet ANY TWO of the 4 criteria" },
    CATEGORY_B: { amount: 5000, label: "Category B", description: "Must meet ANY ONE of the criteria" },
    CATEGORY_C: { amount: 3000, label: "Category C", description: "Must meet ANY ONE of the criteria" },
  },
  BOOK: {
    INTERNATIONAL: { amount: 10000, label: "Full Book — International Publisher + ISBN" },
    NATIONAL: { amount: 6000, label: "Full Book — National Publisher + ISBN" },
    STATE: { amount: 3000, label: "Full Book — State Level + ISBN" },
  },
  BOOK_CHAPTER: {
    INTERNATIONAL: { amount: 5000, label: "Book Chapter — International Publisher + ISBN" },
    NATIONAL: { amount: 2000, label: "Book Chapter — National Publisher + ISBN" },
  },
  PATENT: {
    DESIGN: { amount: 5000, label: "Design Patent — Indian Government" },
    UTILITY_GRANTED: { amount: 25000, label: "Utility Patent — Granted by Government Authority" },
  },
  CITATION: {
    RATE_PER_CITATION: 100,
    label: "Scopus Citation — ₹100 per eligible citation",
  },
  RESEARCH_PROJECT: {
    amount: null, // Not confirmed from official PPSU policy
    label: "To be confirmed from official FRIC/PPSU policy",
  },
} as const;

// ============ Incentive Calculation ============

export interface CriterionCheck {
  label: string;
  met: boolean;
  detail?: string;
}

export interface IncentiveCalculation {
  claimType: string;
  criteriaChecks: CriterionCheck[];
  applicableCategory: string | null;
  policyIncentive: number | null;
  ppsuFacultyCount: number;
  distributionRule: string;
  facultyShare: number | null;
  authorEligible: boolean;
  authorWarning: string | null;
  policyNote: string | null;
}

import { formatIndianNumber } from "@/lib/currency";

export function calculateIncentive(
  claimTypeId: string,
  formData: Record<string, any>,
  ppsuFacultyCount: number,
  authorshipPosition?: string
): IncentiveCalculation {
  const normalizedType = (claimTypeId || "").toLowerCase().replace("-", "_");

  const result: IncentiveCalculation = {
    claimType: normalizedType,
    criteriaChecks: [],
    applicableCategory: null,
    policyIncentive: null,
    ppsuFacultyCount: Math.max(ppsuFacultyCount || 1, 1),
    distributionRule: (ppsuFacultyCount || 1) > 1
      ? `Divided Equally Among ${ppsuFacultyCount} PPSU Faculty`
      : "Single PPSU Faculty (100% Share — Not Divided)",
    facultyShare: null,
    authorEligible: true,
    authorWarning: null,
    policyNote: null,
  };

  // Author eligibility check (for paper/book/chapter/patent)
  if (authorshipPosition === "other") {
    result.authorEligible = false;
    result.authorWarning =
      "PPSU policy requires the claimant to be First Author or Corresponding Author. 'Other' position may be reviewed by the research committee.";
  }

  switch (normalizedType) {
    case "research_paper":
    case "journal_publication":
      return calculateResearchPaperIncentive(result, formData);
    case "book":
      return calculateBookIncentive(result, formData);
    case "book_chapter":
      return calculateBookChapterIncentive(result, formData);
    case "patent":
      return calculatePatentIncentive(result, formData);
    case "citation":
      return calculateCitationIncentive(result, formData);
    case "research_project":
      return calculateResearchProjectIncentive(result, formData);
    default:
      return calculateResearchPaperIncentive(result, formData);
  }
}

function calculateResearchPaperIncentive(
  result: IncentiveCalculation,
  formData: Record<string, any>
): IncentiveCalculation {
  const indexing = formData.indexing || "";
  const recognizedBody = formData.recognizedBody || "Scopus";
  const sciListed =
    formData.sciListed === "yes" ||
    recognizedBody === "Web of Science" ||
    indexing === "Category A" ||
    indexing === "Category B";
  const isScopus =
    recognizedBody === "Scopus" ||
    indexing === "Scopus" ||
    indexing === "Category C" ||
    formData.indexedIn === "Scopus" ||
    (Array.isArray(formData.indexedIn) && formData.indexedIn.includes("Scopus"));
  const quartile = formData.quartile || "Q1";
  const acceptanceRate = parseFloat(formData.acceptanceRate) || 0;
  const impactFactor = parseFloat(formData.impactFactor) || 0;
  const abdcCategory = formData.abdcCategory || "None";

  // Direct category selection overrides
  if (indexing === "Category A") {
    result.applicableCategory = "Category A (High Impact SCI)";
    result.policyIncentive = POLICY.RESEARCH_PAPER.CATEGORY_A.amount;
    result.criteriaChecks = [
      { label: "Category A Selected", met: true, detail: `Quartile: ${quartile}, IF: ${impactFactor > 0 ? impactFactor : "N/A"}` },
      { label: "High Impact Journal Criteria", met: true, detail: `Recognized Body: ${recognizedBody}` },
    ];
    result.facultyShare = Math.round(result.policyIncentive / result.ppsuFacultyCount);
    return result;
  }

  if (indexing === "Category B") {
    result.applicableCategory = "Category B (SCI / Scopus Q1-Q2)";
    result.policyIncentive = POLICY.RESEARCH_PAPER.CATEGORY_B.amount;
    result.criteriaChecks = [
      { label: "Category B Selected", met: true, detail: `Quartile: ${quartile}, IF: ${impactFactor > 0 ? impactFactor : "N/A"}` },
      { label: "SCI / Scopus Journal", met: true, detail: `Recognized Body: ${recognizedBody}` },
    ];
    result.facultyShare = Math.round(result.policyIncentive / result.ppsuFacultyCount);
    return result;
  }

  if (indexing === "Category C") {
    result.applicableCategory = "Category C (Scopus / ABDC)";
    result.policyIncentive = POLICY.RESEARCH_PAPER.CATEGORY_C.amount;
    result.criteriaChecks = [
      { label: "Category C Selected", met: true, detail: `Recognized Body: ${recognizedBody}` },
    ];
    result.facultyShare = Math.round(result.policyIncentive / result.ppsuFacultyCount);
    return result;
  }

  // --- Category A Criteria (need ANY TWO) ---
  const catACriteria: CriterionCheck[] = [
    {
      label: "SCI listed journal in Q1 quartile",
      met: (sciListed || isScopus) && quartile === "Q1",
      detail: `Indexing: ${recognizedBody}, Quartile: ${quartile}`,
    },
    {
      label: "Acceptance rate less than 15%",
      met: acceptanceRate > 0 && acceptanceRate < 15,
      detail: `Acceptance Rate: ${acceptanceRate > 0 ? acceptanceRate + "%" : "Not provided"}`,
    },
    {
      label: "Thomson Reuters Impact Factor greater than 8.0",
      met: impactFactor > 8.0,
      detail: `Impact Factor: ${impactFactor > 0 ? impactFactor.toString() : "Not provided"}`,
    },
    {
      label: "ABDC-A category",
      met: abdcCategory === "A",
      detail: `ABDC: ${abdcCategory}`,
    },
  ];
  const catAMet = catACriteria.filter((c) => c.met).length;

  // --- Category B Criteria (need ANY ONE) ---
  const catBCriteria: CriterionCheck[] = [
    {
      label: "SCI listed journal in Q1 or Q2 quartile",
      met: (sciListed || isScopus) && (quartile === "Q1" || quartile === "Q2"),
      detail: `Indexing: ${recognizedBody}, Quartile: ${quartile}`,
    },
    {
      label: "Acceptance rate between 16% and 40%",
      met: acceptanceRate >= 16 && acceptanceRate <= 40,
      detail: `Acceptance Rate: ${acceptanceRate > 0 ? acceptanceRate + "%" : "Not provided"}`,
    },
    {
      label: "Thomson Reuters Impact Factor between 2.0 and 8.0",
      met: impactFactor >= 2.0 && impactFactor <= 8.0,
      detail: `Impact Factor: ${impactFactor > 0 ? impactFactor.toString() : "Not provided"}`,
    },
    {
      label: "ABDC-B category",
      met: abdcCategory === "B",
      detail: `ABDC: ${abdcCategory}`,
    },
  ];
  const catBMet = catBCriteria.filter((c) => c.met).length;

  // --- Category C Criteria (need ANY ONE) ---
  const catCCriteria: CriterionCheck[] = [
    {
      label: "SCI listed journal in Q2 or Q3 quartile",
      met: (sciListed || isScopus) && (quartile === "Q2" || quartile === "Q3"),
      detail: `Indexing: ${recognizedBody}, Quartile: ${quartile}`,
    },
    {
      label: "Thomson Reuters Impact Factor less than 2.0",
      met: impactFactor > 0 && impactFactor < 2.0,
      detail: `Impact Factor: ${impactFactor > 0 ? impactFactor.toString() : "Not provided"}`,
    },
    {
      label: "Journal indexed in Scopus / WoS",
      met: isScopus || recognizedBody === "Scopus" || recognizedBody === "Web of Science" || recognizedBody === "Other Body",
      detail: `Recognized Body: ${recognizedBody}`,
    },
    {
      label: "ABDC-C or D category",
      met: abdcCategory === "C" || abdcCategory === "D",
      detail: `ABDC: ${abdcCategory}`,
    },
  ];
  const catCMet = catCCriteria.filter((c) => c.met).length;

  // Determine category (highest first)
  if (catAMet >= 2) {
    result.applicableCategory = "Category A (High Impact SCI)";
    result.policyIncentive = POLICY.RESEARCH_PAPER.CATEGORY_A.amount;
    result.criteriaChecks = catACriteria;
  } else if (catBMet >= 1) {
    result.applicableCategory = "Category B (SCI / Scopus Q1-Q2)";
    result.policyIncentive = POLICY.RESEARCH_PAPER.CATEGORY_B.amount;
    result.criteriaChecks = catBCriteria;
  } else if (catCMet >= 1 || isScopus || recognizedBody === "Scopus" || recognizedBody === "Web of Science") {
    result.applicableCategory = "Category C (Scopus / ABDC)";
    result.policyIncentive = POLICY.RESEARCH_PAPER.CATEGORY_C.amount;
    result.criteriaChecks = catCCriteria;
  } else {
    result.applicableCategory = "Standard Policy Claim";
    result.policyIncentive = 3000;
    result.criteriaChecks = [...catACriteria, ...catBCriteria, ...catCCriteria];
  }

  if (result.policyIncentive !== null) {
    result.facultyShare = Math.round(result.policyIncentive / result.ppsuFacultyCount);
  }

  return result;
}

function calculateBookIncentive(
  result: IncentiveCalculation,
  formData: Record<string, any>
): IncentiveCalculation {
  const publisherType = formData.publisherType || formData.publicationLevel || "International";
  const isbn = formData.isbn || "";

  result.criteriaChecks = [
    { label: "ISBN provided", met: isbn.trim().length > 0, detail: isbn || "Provided" },
    { label: "Publication level", met: true, detail: publisherType || "International" },
  ];

  if (publisherType === "International") {
    result.applicableCategory = POLICY.BOOK.INTERNATIONAL.label;
    result.policyIncentive = POLICY.BOOK.INTERNATIONAL.amount;
  } else if (publisherType === "State") {
    result.applicableCategory = POLICY.BOOK.STATE.label;
    result.policyIncentive = POLICY.BOOK.STATE.amount;
  } else {
    result.applicableCategory = POLICY.BOOK.NATIONAL.label;
    result.policyIncentive = POLICY.BOOK.NATIONAL.amount;
  }

  // Co-authors are not applicable for book claims; claimant gets 100% share
  result.ppsuFacultyCount = 1;
  result.distributionRule = "Single PPSU Faculty (100% Share — Not Divided)";
  result.facultyShare = result.policyIncentive;
  return result;
}

function calculateBookChapterIncentive(
  result: IncentiveCalculation,
  formData: Record<string, any>
): IncentiveCalculation {
  const publisherType = formData.publisherType || formData.publicationLevel || "International";
  const isbn = formData.isbn || "";

  result.criteriaChecks = [
    { label: "ISBN provided", met: isbn.trim().length > 0, detail: isbn || "Provided" },
    { label: "Publisher level", met: true, detail: publisherType || "International" },
  ];

  if (publisherType === "International") {
    result.applicableCategory = POLICY.BOOK_CHAPTER.INTERNATIONAL.label;
    result.policyIncentive = POLICY.BOOK_CHAPTER.INTERNATIONAL.amount;
  } else {
    result.applicableCategory = POLICY.BOOK_CHAPTER.NATIONAL.label;
    result.policyIncentive = POLICY.BOOK_CHAPTER.NATIONAL.amount;
  }

  if (result.policyIncentive !== null) {
    result.facultyShare = Math.round(result.policyIncentive / result.ppsuFacultyCount);
  }
  return result;
}

function calculatePatentIncentive(
  result: IncentiveCalculation,
  formData: Record<string, any>
): IncentiveCalculation {
  const patentType = formData.patentType || "Utility";
  const patentStatus = formData.patentStatus || "Granted";

  result.criteriaChecks = [
    { label: "Patent type", met: true, detail: patentType },
    { label: "Patent status", met: true, detail: patentStatus },
  ];

  if (patentType === "Design") {
    result.applicableCategory = POLICY.PATENT.DESIGN.label;
    result.policyIncentive = POLICY.PATENT.DESIGN.amount;
  } else if (patentType === "Utility" && (patentStatus === "Granted" || !patentStatus)) {
    result.applicableCategory = POLICY.PATENT.UTILITY_GRANTED.label;
    result.policyIncentive = POLICY.PATENT.UTILITY_GRANTED.amount;
  } else {
    result.applicableCategory = "Utility Patent (Filed / Published)";
    result.policyIncentive = 5000;
    result.policyNote =
      "Utility patent full policy incentive of ₹25,000 applies upon Grant. Interim status noted as " + patentStatus + ".";
  }

  if (result.policyIncentive !== null) {
    result.facultyShare = Math.round(result.policyIncentive / result.ppsuFacultyCount);
  }
  return result;
}

function calculateCitationIncentive(
  result: IncentiveCalculation,
  formData: Record<string, any>
): IncentiveCalculation {
  const eligibleCitations = parseInt(formData.eligibleCitations || formData.citationCount) || 0;

  result.criteriaChecks = [
    {
      label: "Eligible Scopus citations",
      met: eligibleCitations > 0,
      detail: `${eligibleCitations} citation(s)`,
    },
  ];

  if (eligibleCitations > 0) {
    result.applicableCategory = POLICY.CITATION.label;
    result.policyIncentive = eligibleCitations * POLICY.CITATION.RATE_PER_CITATION;
    result.facultyShare = result.policyIncentive; // Citations: no PPSU split
    result.distributionRule = "Per-citation rate (no split)";
  } else {
    result.applicableCategory = "Citation Incentive (₹100 / citation)";
    result.policyIncentive = 0;
    result.facultyShare = 0;
    result.policyNote = "Enter the number of eligible Scopus citations.";
  }

  return result;
}

function calculateResearchProjectIncentive(
  result: IncentiveCalculation,
  formData: Record<string, any>
): IncentiveCalculation {
  const sanctionedAmount =
    parseFloat(String(formData.sanctionedAmount).replace(/[^0-9.]/g, "")) || 0;
  const projectLevel = formData.projectLevel || "National";

  result.criteriaChecks = [
    {
      label: "Project Title",
      met: !!(formData.title || formData.workTitle),
      detail: formData.title || formData.workTitle || "Provided",
    },
    {
      label: "Sanctioned Grant Amount",
      met: sanctionedAmount > 0,
      detail: sanctionedAmount > 0 ? `₹${formatIndianNumber(sanctionedAmount)}` : "Not entered",
    },
    {
      label: "Project Level",
      met: true,
      detail: projectLevel,
    },
  ];

  result.applicableCategory = `Funded Research Project (${projectLevel})`;
  result.policyIncentive = sanctionedAmount;
  result.facultyShare = sanctionedAmount;
  result.distributionRule = "Project Grant Allocation";
  result.policyNote =
    "Research project grant incentive will be sanctioned upon committee verification.";

  return result;
}

// ============ Required Documents Per Claim Type ============

export interface DocumentSlotConfig {
  slotId: string;
  label: string;
  mandatory: boolean;
  helpText?: string;
}

export const REQUIRED_DOCUMENTS: Record<string, DocumentSlotConfig[]> = {
  research_paper: [
    { slotId: "full_publication", label: "Full-length Publication (PDF)", mandatory: true },
    { slotId: "indexing_proof", label: "Journal Indexing Proof (Scopus / WoS)", mandatory: true },
    { slotId: "quartile_proof", label: "Journal Quartile Proof", mandatory: true, helpText: "Upload official proof of journal quartile ranking" },
    { slotId: "impact_factor_proof", label: "Impact Factor Proof", mandatory: true, helpText: "Upload official proof of Thomson Reuters Impact Factor" },
    { slotId: "acceptance_rate_proof", label: "Acceptance Rate Proof", mandatory: true, helpText: "Upload acceptance rate notification or proof" },
    { slotId: "abdc_proof", label: "ABDC Classification Proof", mandatory: true, helpText: "Upload ABDC classification ranking proof" },
    { slotId: "library_certificate", label: "PPSU Library Submission Certificate", mandatory: true },
    { slotId: "other_docs", label: "Other Supporting Documents", mandatory: false },
  ],
  book: [
    { slotId: "book_proof", label: "Full Book / Publication Proof", mandatory: true },
    { slotId: "isbn_proof", label: "ISBN Proof", mandatory: true },
    { slotId: "publisher_proof", label: "Publisher Proof", mandatory: true },
    { slotId: "library_certificate", label: "PPSU Library Submission Certificate", mandatory: true },
    { slotId: "other_docs", label: "Other Supporting Documents", mandatory: false },
  ],
  book_chapter: [
    { slotId: "chapter_proof", label: "Book Chapter Full Text / Proof", mandatory: true },
    { slotId: "isbn_proof", label: "ISBN Proof", mandatory: true },
    { slotId: "publisher_proof", label: "Publisher Proof", mandatory: true },
    { slotId: "library_certificate", label: "PPSU Library Submission Certificate", mandatory: true },
    { slotId: "other_docs", label: "Other Supporting Documents", mandatory: false },
  ],
  patent: [
    { slotId: "patent_certificate", label: "Patent Certificate / Grant Proof", mandatory: true },
    { slotId: "application_proof", label: "Patent Application with Details", mandatory: true },
    { slotId: "authority_proof", label: "Government Authority Proof", mandatory: true, helpText: "Official government patent office proof" },
    { slotId: "inventor_proof", label: "Inventor Proof", mandatory: true },
    { slotId: "other_docs", label: "Other Supporting Documents", mandatory: false },
  ],
  citation: [
    { slotId: "scopus_evidence", label: "Scopus Citation Screenshot / Evidence", mandatory: true },
    { slotId: "faculty_scopus_screenshot", label: "Faculty Scopus Screenshot", mandatory: true },
    { slotId: "total_scopus_ppsu_proof", label: "Total Scopus PPSU Affiliation Publication Proof", mandatory: true },
    { slotId: "other_docs", label: "Other Supporting Documents", mandatory: false },
  ],
  research_project: [
    { slotId: "sanction_letter", label: "Sanctioned Project Letter", mandatory: true },
    { slotId: "budget_bifurcation", label: "Detailed Budget Bifurcation", mandatory: true },
    { slotId: "approval_proof", label: "Project Approval / Sanction Proof", mandatory: true },
    { slotId: "ppsu_deposit_proof", label: "PPSU Account Deposit Proof (PDF)", mandatory: true },
    { slotId: "other_docs", label: "Other Supporting Documents", mandatory: false },
  ],
};

// ============ Helpers ============

export function formatInr(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getStepCount(claimTypeId: string): number {
  const config = getClaimTypeConfig(claimTypeId);
  return config?.stepLabels.length || 7;
}
