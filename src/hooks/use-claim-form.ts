"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getFacultyProfileData } from "@/app/actions/dashboard";
import {
  calculateIncentive,
  getClaimTypeConfig,
  REQUIRED_DOCUMENTS,
  type IncentiveCalculation,
  type DocumentSlotConfig,
} from "@/lib/claim-form-config";

// ============ Types ============

export interface AuthorEntry {
  id: string;
  facultyId?: string;
  name: string;
  affiliation: string;
  institution: string;
  isPpsu: boolean;
  position: string; // e.g., "Position 2 (2nd Author)"
  authorOrder?: number; // 1 to 15
  isFirstAuthor?: boolean;
  isCorrespondingAuthor?: boolean;
}

export interface CoPIEntry {
  id: string;
  name: string;
  institution: string;
  department: string;
  address: string;
  role: string;
}

export interface DocumentSlot {
  slotId: string;
  label: string;
  mandatory: boolean;
  helpText?: string;
  file: File | null;
}

export interface FacultyProfile {
  id?: string;
  name: string;
  email: string;
  employee_id: string;
  designation: string;
  department: {
    name: string;
    school?: { name: string } | { name: string }[] | null;
  } | {
    name: string;
    school?: { name: string } | { name: string }[] | null;
  }[] | null;
  status: string;
}

export interface ClaimFormState {
  // Step 1
  claimType: string | null;

  // Step 2 — Faculty Info (read-only, auto-populated)
  faculty: FacultyProfile | null;
  academicYearName: string;
  facultyLoading: boolean;

  // Step 3 — Claim Details (generic object, keys per claim type)
  details: Record<string, any>;

  // Step 4 — Authors
  authorshipPosition: string; // "first" | "corresponding" | "both" | "other"
  authorNumber?: number | string;
  authors: AuthorEntry[];
  coPIs: CoPIEntry[];

  // Step 5 — Incentive (computed)
  incentivePreview: IncentiveCalculation | null;

  // Step 6 — Documents
  documents: DocumentSlot[];

  // Step 7 — Review
  declarationAccepted: boolean;

  // Navigation
  currentStep: number;
  totalSteps: number;
}

// ============ Hook ============

let idCounter = 0;
function uid(): string {
  return `entry_${Date.now()}_${++idCounter}`;
}

export function useClaimForm(initialClaimData?: any) {
  const [state, setState] = useState<ClaimFormState>({
    claimType: null,
    faculty: null,
    academicYearName: "",
    facultyLoading: true,
    details: {},
    authorshipPosition: "first",
    authorNumber: 1,
    authors: [],
    coPIs: [],
    incentivePreview: null,
    documents: [],
    declarationAccepted: false,
    currentStep: 1,
    totalSteps: 6,
  });

  // ---- Auto-populate faculty info ----
  useEffect(() => {
    getFacultyProfileData().then((res) => {
      if (res.success && res.profile) {
        setState((s) => ({
          ...s,
          faculty: res.profile as FacultyProfile,
          facultyLoading: false,
        }));
      } else {
        setState((s) => ({ ...s, facultyLoading: false }));
      }
    });
  }, []);

  // ---- Initialize from existing claim if editing ----
  useEffect(() => {
    if (!initialClaimData) return;
    const typeCode = initialClaimData.claim_type?.code || "";
    let formTypeId = typeCode.toLowerCase();
    if (formTypeId === "journal_publication") formTypeId = "research_paper";

    const pubAuthors = initialClaimData.publications?.[0]?.publication_authors;
    let initialAuthors: AuthorEntry[] = [];
    let initialPosition = "first";
    let initialAuthorNumber = 1;

    if (Array.isArray(pubAuthors) && pubAuthors.length > 0) {
      const sorted = [...pubAuthors].sort((a, b) => (a.author_order || 0) - (b.author_order || 0));
      const claimantEntry = sorted.find((a) => a.faculty_id === initialClaimData.faculty_id) || sorted[0];
      if (claimantEntry) {
        if (claimantEntry.is_first_author && claimantEntry.is_corresponding_author) initialPosition = "both";
        else if (claimantEntry.is_first_author) initialPosition = "first";
        else if (claimantEntry.is_corresponding_author) initialPosition = "corresponding";
        else {
          initialPosition = "other";
          initialAuthorNumber = claimantEntry.author_order || claimantEntry.author_number || 2;
        }
      }

      const coAuthorEntries = sorted.filter((a) => a !== claimantEntry);
      initialAuthors = coAuthorEntries.map((ca, idx) => ({
        id: uid(),
        facultyId: ca.faculty_id || undefined,
        name: ca.author_name || "",
        affiliation: ca.affiliation || "",
        institution: ca.institution || (ca.is_ppsu_faculty ? "PPSU" : ""),
        isPpsu: !!ca.is_ppsu_faculty,
        position: `Position ${ca.author_order || idx + 2}`,
        authorOrder: ca.author_order || idx + 2,
        isFirstAuthor: !!ca.is_first_author,
        isCorrespondingAuthor: !!ca.is_corresponding_author,
      }));
    }

    setState((s) => ({
      ...s,
      claimType: formTypeId,
      authors: initialAuthors.length > 0 ? initialAuthors : s.authors,
      authorshipPosition: initialPosition,
      authorNumber: initialAuthorNumber,
      details: {
        ...(initialClaimData.publications?.[0] || {}),
        ...(initialClaimData.books?.[0] || {}),
        ...(initialClaimData.patents?.[0] || {}),
        ...(initialClaimData.citations?.[0] || {}),
        ...(initialClaimData.research_projects?.[0] || {}),
        paperTitle: initialClaimData.publications?.[0]?.work_title || initialClaimData.publications?.[0]?.title || initialClaimData.books?.[0]?.title || "",
        journalTitle: initialClaimData.publications?.[0]?.journal_name || initialClaimData.publications?.[0]?.title || initialClaimData.books?.[0]?.publisher || "",
        workTitle: initialClaimData.publications?.[0]?.work_title || initialClaimData.books?.[0]?.work_title || initialClaimData.books?.[0]?.title || initialClaimData.patents?.[0]?.title || "",
        title: initialClaimData.publications?.[0]?.title || initialClaimData.books?.[0]?.title || "",
        recognizedBody: initialClaimData.publications?.[0]?.recognized_body || initialClaimData.books?.[0]?.recognized_body || initialClaimData.citations?.[0]?.citation_database || "Scopus",
        otherRecognizedBody: initialClaimData.publications?.[0]?.other_recognized_body || initialClaimData.books?.[0]?.other_recognized_body,
        publicationLevel: initialClaimData.publications?.[0]?.publication_level || initialClaimData.books?.[0]?.publication_level || initialClaimData.patents?.[0]?.publication_level || "International",
        publicationDate: initialClaimData.publications?.[0]?.publication_date || initialClaimData.books?.[0]?.publication_date || initialClaimData.patents?.[0]?.publication_date || "",
        webLink: initialClaimData.books?.[0]?.web_link || initialClaimData.book_chapters?.[0]?.web_link || "",
        impactFactor: initialClaimData.publications?.[0]?.impact_factor ?? "",
        acceptanceRate: initialClaimData.publications?.[0]?.acceptance_rate ?? "",
        abdcCategory: initialClaimData.publications?.[0]?.abdc_category || "None",
        doi: initialClaimData.publications?.[0]?.doi || initialClaimData.book_chapters?.[0]?.doi || initialClaimData.books?.[0]?.doi || "",
        country: initialClaimData.patents?.[0]?.country || "",
        countryName: initialClaimData.patents?.[0]?.country || "",
        patentStatus: initialClaimData.patents?.[0]?.patent_status || "Granted",
        patentType: initialClaimData.patents?.[0]?.patent_type || "Utility",
        patentOffice: initialClaimData.patents?.[0]?.patent_office || "Indian Patent Office",
        patentNumber: initialClaimData.patents?.[0]?.patent_number || "",
        chapterPages: initialClaimData.books?.[0]?.chapter_pages || initialClaimData.book_chapters?.[0]?.chapter_pages || "",
        chapterTitle: initialClaimData.books?.[0]?.chapter_title || initialClaimData.book_chapters?.[0]?.chapter_title || "",
        bookTitle: initialClaimData.books?.[0]?.title || initialClaimData.book_chapters?.[0]?.book_title || "",
        scopusId: initialClaimData.citations?.[0]?.scopus_id || "",
        totalCitationsLastYear: initialClaimData.citations?.[0]?.total_citations_last_calendar_year ?? "",
        ppsuCitationsLastYear: initialClaimData.citations?.[0]?.total_ppsu_citations_last_calendar_year ?? "",
        depositedAmount: initialClaimData.research_projects?.[0]?.amount_deposited_in_ppsu ?? "",
        depositDate: initialClaimData.research_projects?.[0]?.deposit_date || "",
        depositProofUrl: initialClaimData.research_projects?.[0]?.deposit_proof_url || "",
      },
    }));
  }, [initialClaimData]);

  // ---- Set total steps when claim type changes ----
  useEffect(() => {
    if (!state.claimType) return;
    const config = getClaimTypeConfig(state.claimType);
    if (config) {
      const totalSteps = config.stepLabels.length;
      const docConfigs = REQUIRED_DOCUMENTS[state.claimType] || [];
      const docSlots: DocumentSlot[] = docConfigs.map((dc) => ({
        slotId: dc.slotId,
        label: dc.label,
        mandatory: dc.mandatory,
        helpText: dc.helpText,
        file: null,
      }));

      setState((s) => ({
        ...s,
        totalSteps,
        documents: docSlots,
      }));
    }
  }, [state.claimType]);

  // ---- Recalculate incentive whenever relevant data changes ----
  const recalculate = useCallback(() => {
    if (!state.claimType) return;

    const ppsuCount = state.authors.filter((a) => a.isPpsu).length + 1;
    const result = calculateIncentive(
      state.claimType,
      state.details,
      ppsuCount,
      state.authorshipPosition
    );
    setState((s) => ({ ...s, incentivePreview: result }));
  }, [state.claimType, state.details, state.authors, state.authorshipPosition]);

  useEffect(() => {
    recalculate();
  }, [recalculate]);

  // ---- Setters ----
  const setClaimType = useCallback((type: string) => {
    setState((s) => ({
      ...s,
      claimType: type,
      details: {},
      authors: [],
      coPIs: [],
      authorshipPosition: "first",
      authorNumber: 1,
      declarationAccepted: false,
      currentStep: 1,
    }));
  }, []);

  const updateDetail = useCallback((key: string, value: any) => {
    setState((s) => ({
      ...s,
      details: { ...s.details, [key]: value },
    }));
  }, []);

  const setAuthorshipPosition = useCallback((position: string) => {
    setState((s) => ({ ...s, authorshipPosition: position }));
  }, []);

  const setAuthorNumber = useCallback((num: number | string) => {
    setState((s) => ({ ...s, authorNumber: num }));
  }, []);

  const addAuthor = useCallback(() => {
    setState((s) => {
      const nextOrder = Math.min(s.authors.length + 2, 15);
      return {
        ...s,
        authors: [
          ...s.authors,
          {
            id: uid(),
            name: "",
            affiliation: "",
            institution: "",
            isPpsu: false,
            position: `Position ${nextOrder}`,
            authorOrder: nextOrder,
            isFirstAuthor: false,
            isCorrespondingAuthor: false,
          },
        ],
      };
    });
  }, []);

  const updateAuthor = useCallback((id: string, field: keyof AuthorEntry, value: any) => {
    setState((s) => ({
      ...s,
      authors: s.authors.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    }));
  }, []);

  const removeAuthor = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      authors: s.authors.filter((a) => a.id !== id),
    }));
  }, []);

  const addCoPI = useCallback(() => {
    setState((s) => ({
      ...s,
      coPIs: [
        ...s.coPIs,
        { id: uid(), name: "", institution: "", department: "", address: "", role: "Co-PI" },
      ],
    }));
  }, []);

  const updateCoPI = useCallback((id: string, field: keyof CoPIEntry, value: any) => {
    setState((s) => ({
      ...s,
      coPIs: s.coPIs.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    }));
  }, []);

  const removeCoPI = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      coPIs: s.coPIs.filter((c) => c.id !== id),
    }));
  }, []);

  const setDocumentFile = useCallback((slotId: string, file: File | null) => {
    setState((s) => ({
      ...s,
      documents: s.documents.map((d) => (d.slotId === slotId ? { ...d, file } : d)),
    }));
  }, []);

  const setDeclaration = useCallback((accepted: boolean) => {
    setState((s) => ({ ...s, declarationAccepted: accepted }));
  }, []);

  // ---- Step Navigation ----
  const goToStep = useCallback((step: number) => {
    setState((s) => ({
      ...s,
      currentStep: Math.max(1, Math.min(step, s.totalSteps)),
    }));
  }, []);

  const nextStep = useCallback(() => {
    setState((s) => ({
      ...s,
      currentStep: Math.min(s.currentStep + 1, s.totalSteps),
    }));
  }, []);

  const prevStep = useCallback(() => {
    setState((s) => ({
      ...s,
      currentStep: Math.max(s.currentStep - 1, 1),
    }));
  }, []);

  // ---- Step Labels (dynamic) ----
  const stepLabels = useMemo(() => {
    if (!state.claimType) return ["Claim Type"];
    const config = getClaimTypeConfig(state.claimType);
    return config?.stepLabels || ["Claim Type"];
  }, [state.claimType]);

  const hasAuthorsStep = useMemo(() => {
    if (!state.claimType) return false;
    const config = getClaimTypeConfig(state.claimType);
    return config?.hasAuthorsStep ?? false;
  }, [state.claimType]);

  const currentStepKey = useMemo((): string => {
    if (!state.claimType) return "claim_type";
    const step = state.currentStep;
    if (step === 1) return "claim_type";
    if (step === 2) return "details";
    if (hasAuthorsStep) {
      if (step === 3) return "authors";
      if (step === 4) return "incentive";
      if (step === 5) return "documents";
      if (step === 6) return "review";
    } else {
      if (step === 3) return "incentive";
      if (step === 4) return "documents";
      if (step === 5) return "review";
    }
    return "review";
  }, [state.claimType, state.currentStep, hasAuthorsStep]);

  // Validation check
  const canAdvance = useMemo((): boolean => {
    const step = currentStepKey;
    switch (step) {
      case "claim_type":
        return !!state.claimType;
      case "details": {
        if (!state.details.workTitle && !state.details.title && !state.details.paperTitle) return false;
        if (state.details.recognizedBody === "Other Body" && !state.details.otherRecognizedBody) return false;

        // Strict mandatory check for Research / Review Paper
        if (state.claimType === "research_paper") {
          const d = state.details;
          if (!d.journalTitle && !d.journalName) return false;
          if (!d.paperTitle && !d.workTitle && !d.title) return false;
          if (!d.issn || !String(d.issn).trim()) return false;
          if (!d.recognizedBody || !String(d.recognizedBody).trim()) return false;
          if (!d.indexing || !String(d.indexing).trim()) return false;
          if (!d.quartile || !String(d.quartile).trim()) return false;
          if (d.impactFactor === undefined || d.impactFactor === null || String(d.impactFactor).trim() === "") return false;
          if (d.acceptanceRate === undefined || d.acceptanceRate === null || String(d.acceptanceRate).trim() === "") return false;
          if (!d.abdcCategory || !String(d.abdcCategory).trim()) return false;
          if (!d.doi || !String(d.doi).trim()) return false;
          if (!d.publicationDate || !String(d.publicationDate).trim()) return false;
        }

        // Strict mandatory check for Book
        if (state.claimType === "book") {
          const d = state.details;
          if (!d.paperTitle && !d.workTitle && !d.title) return false;
          if (!d.isbn || !String(d.isbn).trim()) return false;
          if (!d.recognizedBody || !String(d.recognizedBody).trim()) return false;
          if (!d.publicationDate && !d.bookPubDate) return false;
          // If International level is selected, webLink is strictly mandatory
          if (d.publicationLevel === "International") {
            if (!d.webLink || !String(d.webLink).trim()) return false;
          }
        }

        // Strict mandatory check for Book Chapter
        if (state.claimType === "book_chapter") {
          const d = state.details;
          if (!d.journalTitle && !d.bookTitle) return false;
          if (!d.paperTitle && !d.chapterTitle && !d.workTitle && !d.title) return false;
          if (!d.isbn || !String(d.isbn).trim()) return false;
          if (!d.recognizedBody || !String(d.recognizedBody).trim()) return false;
          if (!d.publicationDate && !d.bookPubDate) return false;
          if (!d.doi || !String(d.doi).trim()) return false;
          if (!d.webLink || !String(d.webLink).trim()) return false;
        }

        // Strict mandatory check for Patent / IPR
        if (state.claimType === "patent") {
          const d = state.details;
          if (!d.journalTitle && !d.journalName && !d.patentAuthority) return false;
          if (!d.paperTitle && !d.workTitle && !d.title) return false;
          if (!d.patentNumber || !String(d.patentNumber).trim()) return false;
          if (!d.country && !d.countryName) return false;
          if (!d.patentStatus || !String(d.patentStatus).trim()) return false;
        }

        // Strict mandatory check for Citation
        if (state.claimType === "citation") {
          const d = state.details;
          if (!d.paperTitle && !d.workTitle && !d.title) return false;
          if (!d.journalTitle && !d.journalName) return false;
          if (!d.scopusId || !String(d.scopusId).trim()) return false;
          if (d.totalCitationsLastYear === undefined || d.totalCitationsLastYear === null || String(d.totalCitationsLastYear).trim() === "") return false;
          if (d.ppsuCitationsLastYear === undefined || d.ppsuCitationsLastYear === null || String(d.ppsuCitationsLastYear).trim() === "") return false;
          if (!d.scopusLink && !d.verificationUrl) return false;
          if (!d.eligibleCitations && !d.citationCount) return false;
        }

        // Strict mandatory check for Research Project
        if (state.claimType === "research_project") {
          const d = state.details;
          if (!d.title && !d.paperTitle && !d.workTitle) return false;
          if (!d.sponsoringBody && !d.fundingAgency) return false;
          if (!d.approvedNumber && !d.grantNumber) return false;
          if (!d.sanctionedAmount) return false;
          if (!d.depositedAmount && !d.amountDepositedInPpsu) return false;
          if (!d.depositDate) return false;
          const depositProofAttached = !!d.depositProofFile || !!d.depositProofName || state.documents.some((doc) => doc.slotId === "ppsu_deposit_proof" && doc.file !== null);
          if (!depositProofAttached) return false;
        }

        return true;
      }
      case "authors": {
        if (state.authorshipPosition === "other" && (!state.authorNumber || Number(state.authorNumber) <= 0)) {
          return false;
        }
        return true;
      }
      case "incentive":
        return true;
      case "documents": {
        const mandatorySlots = state.documents.filter((d) => d.mandatory);
        return mandatorySlots.every((d) => d.file !== null);
      }
      case "review":
        return state.declarationAccepted;
      default:
        return true;
    }
  }, [currentStepKey, state.claimType, state.details, state.authorshipPosition, state.authorNumber, state.documents, state.declarationAccepted]);

  const departmentName = useMemo(() => {
    if (!state.faculty?.department) return "—";
    if (Array.isArray(state.faculty.department)) {
      return state.faculty.department[0]?.name || "—";
    }
    return state.faculty.department.name || "—";
  }, [state.faculty]);

  const schoolName = useMemo(() => {
    if (!state.faculty?.department) return "—";
    const deptObj = Array.isArray(state.faculty.department) ? state.faculty.department[0] : state.faculty.department;
    if (!deptObj?.school) return "—";
    if (Array.isArray(deptObj.school)) {
      return deptObj.school[0]?.name || "—";
    }
    return deptObj.school.name || "—";
  }, [state.faculty]);

  return {
    state,
    stepLabels,
    currentStepKey,
    hasAuthorsStep,
    canAdvance,
    departmentName,
    schoolName,
    setClaimType,
    updateDetail,
    setAuthorshipPosition,
    setAuthorNumber,
    addAuthor,
    updateAuthor,
    removeAuthor,
    addCoPI,
    updateCoPI,
    removeCoPI,
    setDocumentFile,
    setDeclaration,
    goToStep,
    nextStep,
    prevStep,
  };
}
