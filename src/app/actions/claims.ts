"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { type Claim, type ClaimStatus } from "@/types";
import { checkEligibility } from "./eligibility";
import { createAuditLog } from "./audit";
import { calculateIncentive } from "@/lib/claim-form-config";

import { getInitialWorkflowStage } from "@/lib/constants";

async function resolveInitialStageForFaculty(faculty: any, authUserId?: string): Promise<string> {
  const adminSupabase = createAdminClient();
  let roles: string[] = [];
  if (authUserId) {
    const { data: userRoles } = await adminSupabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", authUserId)
      .eq("status", "ACTIVE");

    roles = (userRoles || [])
      .map((row: Record<string, unknown>) => (row.roles as { name?: string } | null)?.name)
      .filter(Boolean) as string[];
  }

  return getInitialWorkflowStage(roles, faculty?.designation);
}

async function userHasAnyRole(userId: string, allowedRoles: string[]) {
  const adminSupabase = createAdminClient();
  const { data } = await adminSupabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", userId)
    .eq("status", "ACTIVE");

  return (data || []).some((row: Record<string, unknown>) => {
    const role = row.roles as { name?: string } | null;
    return !!role?.name && allowedRoles.includes(role.name);
  });
}

// Get active academic year
export async function getActiveAcademicYear() {
  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
    .from("academic_years")
    .select("id, name")
    .eq("is_active", true)
    .single();
  if (error) return null;
  return data;
}

function getClaimTypePrefix(claimTypeCode: string): string {
  const code = (claimTypeCode || "").toUpperCase();
  if (code.includes("PROJECT") || code.includes("GRANT")) return "PRJ";
  if (code.includes("PATENT")) return "PAT";
  if (code.includes("BOOK")) return "BOK";
  if (code.includes("CITATION")) return "CIT";
  if (code.includes("JOURNAL") || code.includes("PAPER") || code.includes("PUBLICATION")) return "PUB";
  return "RES";
}

// Generate unique claim number across all claims globally
async function generateClaimNumber(claimTypeCode: string): Promise<string> {
  const adminSupabase = createAdminClient();
  const year = new Date().getFullYear();
  const typePart = getClaimTypePrefix(claimTypeCode);
  const prefix = `FRIC-${typePart}-${year}-`;
  
  // Find all existing claim numbers across the entire DB
  const { data } = await adminSupabase
    .from("claims")
    .select("claim_number");

  const existingNumbers = new Set(
    (data || [])
      .map((r: any) => (r.claim_number as string)?.trim())
      .filter(Boolean)
  );

  let maxSeq = 0;
  for (const num of existingNumbers) {
    const parts = num.split("-");
    const last = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(last) && last > maxSeq) {
      maxSeq = last;
    }
  }

  let seq = maxSeq + 1;
  let candidate = `${prefix}${String(seq).padStart(4, "0")}`;
  while (existingNumbers.has(candidate)) {
    seq++;
    candidate = `${prefix}${String(seq).padStart(4, "0")}`;
  }

  return candidate;
}

// Get the faculty profile of current user
export async function getMyFacultyProfile() {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await adminSupabase
        .from("faculty")
        .select("*, department:departments(*)")
        .eq("auth_user_id", user.id)
        .single();

      if (!error && data) return data;
    }

    // Fallback for admin_session cookie
    const cookieStore = await cookies();
    if (cookieStore.get("admin_session")?.value) {
      const adminEmail = (process.env.SUPER_ADMIN_EMAIL || "admin@ppsu.in").toLowerCase().trim();
      const { data: adminFac } = await adminSupabase
        .from("faculty")
        .select("*, department:departments(*)")
        .or(`email.eq.${adminEmail},email.eq.admin@demo.ppsu.ac.in,email.eq.admin@ppsu.in`)
        .limit(1)
        .maybeSingle();

      if (adminFac) return adminFac;
    }

    return null;
  } catch {
    return null;
  }
}

export async function createClaim(
  claimTypeCodeInput: string,
  details: Record<string, any>,
  status: ClaimStatus = "DRAFT"
) {
  try {
    const adminSupabase = createAdminClient();
    const faculty = await getMyFacultyProfile();
    const acadYear = await getActiveAcademicYear();

    if (!faculty) return { success: false, error: "Faculty profile not found." };
    if (!acadYear) return { success: false, error: "No active academic year found." };

    // Check system maintenance mode & submission window
    const { data: sysSettings } = await adminSupabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["maintenance_mode", "allow_submissions"]);

    const sMap: Record<string, string> = {};
    (sysSettings || []).forEach((row: any) => {
      sMap[row.key] = typeof row.value === "object" ? JSON.stringify(row.value) : String(row.value);
    });

    if (sMap.maintenance_mode === "true" || sMap.maintenance_mode === "1") {
      return {
        success: false,
        error: "System Maintenance Mode is currently ACTIVE. New claim submissions and edits are temporarily disabled.",
      };
    }

    if (sMap.allow_submissions === "false" || sMap.allow_submissions === "0") {
      return {
        success: false,
        error: "Claim submission window is currently closed by the university administration.",
      };
    }

    // Standardize claim type code
    let claimTypeCode = claimTypeCodeInput.toUpperCase();
    if (claimTypeCode === "RESEARCH_PAPER") claimTypeCode = "JOURNAL_PUBLICATION";

    // Fetch claim type ID
    let { data: claimType, error: typeErr } = await adminSupabase
      .from("claim_types")
      .select("id, code")
      .eq("code", claimTypeCode)
      .maybeSingle();

    if (!claimType) {
      // Fallback try RESEARCH_PAPER if JOURNAL_PUBLICATION missing
      const { data: altType } = await adminSupabase
        .from("claim_types")
        .select("id, code")
        .eq("code", "RESEARCH_PAPER")
        .maybeSingle();
      claimType = altType;
    }

    if (typeErr || !claimType) return { success: false, error: "Invalid claim type." };

    // Calculate eligibility / estimated incentive
    const ppsuCount = (Array.isArray(details.authors) ? details.authors.filter((a: any) => a.isPpsu).length : 0) + 1;
    const serverCalc = calculateIncentive(
      claimTypeCode.toLowerCase(),
      details,
      ppsuCount,
      details.authorshipPosition
    );

    const estimatedAmount = (details.estimatedAmount !== undefined && details.estimatedAmount !== null)
      ? Number(details.estimatedAmount)
      : (serverCalc.facultyShare ?? serverCalc.policyIncentive ?? 0);

    const calculationSnapshot = details.calculationSnapshot || serverCalc;

    // Generate claim number with collision retry resilience
    let claimNumber = await generateClaimNumber(claimTypeCode);
    const initialStage = status === "SUBMITTED" ? await resolveInitialStageForFaculty(faculty, faculty.auth_user_id) : "FACULTY";

    let claim: any = null;
    let claimErr: any = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      if (attempt > 0) {
        const typePart = getClaimTypePrefix(claimTypeCode);
        const year = new Date().getFullYear();
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        claimNumber = `FRIC-${typePart}-${year}-${String(Date.now()).slice(-4)}${randomSuffix}`;
      }

      const { data: insertedClaim, error: insertError } = await adminSupabase
        .from("claims")
        .insert({
          claim_number: claimNumber,
          faculty_id: faculty.id,
          claim_type_id: claimType.id,
          academic_year_id: acadYear.id,
          status: status,
          current_stage: initialStage,
          claimed_amount: estimatedAmount,
          calculated_amount: estimatedAmount,
          submitted_at: status === "SUBMITTED" ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (!insertError && insertedClaim) {
        claim = insertedClaim;
        claimErr = null;
        break;
      }

      claimErr = insertError;
      console.warn(`Claim insert attempt ${attempt} with claim_number ${claimNumber} failed:`, insertError?.message);
    }

    if (claimErr || !claim) {
      console.error("Claim insertion error:", claimErr);
      return { success: false, error: claimErr?.message || "Failed to create claim record." };
    }

    // Insert detail records based on claim type
    let detailErr: any = null;
    if (claimTypeCode === "JOURNAL_PUBLICATION" || claimTypeCode === "RESEARCH_PAPER") {
      const indexingVal = details.recognizedBody === "Other Body" && details.otherRecognizedBody
        ? details.otherRecognizedBody
        : (details.indexing || details.recognizedBody || "Scopus");

      const { data: pubData, error: pubErr } = await adminSupabase
        .from("publications")
        .insert({
          claim_id: claim.id,
          title: details.paperTitle || details.workTitle || details.title || details.journalTitle || "Publication Title",
          journal_name: details.journalTitle || details.journalName || details.title,
          issn: details.issn,
          publication_date: details.publicationDate || null,
          indexing: indexingVal,
          quartile: details.quartile,
          impact_factor: details.impactFactor ? Number(details.impactFactor) : null,
          acceptance_rate: details.acceptanceRate ? Number(details.acceptanceRate) : null,
          abdc_category: details.abdcCategory,
          doi: details.doi,
        })
        .select()
        .single();

      detailErr = pubErr;

      // Insert Authors
      if (pubData && !pubErr && (details.authors || details.authorshipPosition)) {
        const isFirst = details.authorshipPosition === "first" || details.authorshipPosition === "both";
        const isCorr = details.authorshipPosition === "corresponding" || details.authorshipPosition === "both";
        const claimantOrder = isFirst ? 1 : (details.authorNumber ? Number(details.authorNumber) : 1);

        // Claimant as Author
        const authorEntries = [
          {
            publication_id: pubData.id,
            faculty_id: faculty.id,
            author_name: faculty.name,
            author_order: claimantOrder,
            author_number: claimantOrder,
            is_first_author: isFirst,
            is_corresponding_author: isCorr,
            is_ppsu_faculty: true,
            affiliation: faculty.designation || "Faculty",
            institution: "PPSU",
          },
        ];

        // Co-authors (with position up to 15, isFirstAuthor, isCorrespondingAuthor)
        if (Array.isArray(details.authors)) {
          details.authors.forEach((auth: any, idx: number) => {
            const assignedOrder = auth.authorOrder ? Number(auth.authorOrder) : (idx + 2);
            authorEntries.push({
              publication_id: pubData.id,
              faculty_id: auth.facultyId || null,
              author_name: auth.name || `Co-Author ${idx + 1}`,
              author_order: assignedOrder,
              author_number: assignedOrder,
              is_first_author: !!auth.isFirstAuthor,
              is_corresponding_author: !!auth.isCorrespondingAuthor,
              is_ppsu_faculty: !!auth.isPpsu,
              affiliation: auth.affiliation || null,
              institution: auth.institution || (auth.isPpsu ? "PPSU" : null),
            });
          });
        }

        const { error: authErr } = await adminSupabase.from("publication_authors").insert(authorEntries);
        if (authErr && !detailErr) detailErr = authErr;
      }
    } else if (claimTypeCode === "PATENT") {
      const { error } = await adminSupabase.from("patents").insert({
        claim_id: claim.id,
        title: details.paperTitle || details.workTitle || details.title || "Patent Title",
        patent_number: details.patentNumber,
        filing_date: details.filingDate || null,
        grant_date: details.grantDate || details.publicationDate || null,
        publication_date: details.publicationDate || details.grantDate || details.filingDate || null,
        patent_office: details.patentOffice || details.journalTitle || "Indian Patent Office",
        patent_type: details.patentType || "Utility",
        patent_status: details.patentStatus || "Granted",
        country: details.country || details.countryName || null,
        publication_level: details.publicationLevel || "National",
        inventors: details.inventors || null,
      });
      detailErr = error;
    } else if (claimTypeCode === "BOOK" || claimTypeCode === "BOOK_CHAPTER") {
      const { error } = await adminSupabase.from("books").insert({
        claim_id: claim.id,
        title: details.workTitle || details.paperTitle || details.title || "Book Title",
        work_title: details.workTitle || details.title || details.paperTitle || null,
        publisher: details.publisher || details.journalTitle || null,
        isbn: details.isbn || null,
        publication_date: details.publicationDate || details.bookPubDate || null,
        book_type: claimTypeCode === "BOOK_CHAPTER" ? "CHAPTER" : (details.bookType || "AUTHORED"),
        chapter_title: details.chapterTitle || null,
        scopus_indexed: details.recognizedBody === "Scopus" || !!details.scopusIndexed,
        publication_level: details.publicationLevel || "International",
        recognized_body: details.recognizedBody || null,
        other_recognized_body: details.otherRecognizedBody || null,
        web_link: details.webLink || null,
        doi: details.doi || null,
      });
      detailErr = error;

      if (claimTypeCode === "BOOK_CHAPTER") {
        await adminSupabase.from("book_chapters").insert({
          claim_id: claim.id,
          chapter_title: details.chapterTitle || details.paperTitle || details.workTitle || "Chapter Title",
          book_title: details.bookTitle || details.journalTitle || details.publisher || "Book Title",
          publisher: details.publisher || details.journalTitle || null,
          isbn: details.isbn || null,
          publication_date: details.publicationDate || details.bookPubDate || null,
          chapter_pages: details.chapterPages || null,
          doi: details.doi || null,
          web_link: details.webLink || null,
          publication_level: details.publicationLevel || "International",
          recognized_body: details.recognizedBody || null,
          other_recognized_body: details.otherRecognizedBody || null,
        });
      }
    } else if (claimTypeCode === "CITATION") {
      const { error } = await adminSupabase.from("citations").insert({
        claim_id: claim.id,
        source_title: details.paperTitle || details.workTitle || details.title || "Paper Title",
        citation_database: details.citationDb || details.recognizedBody || "Scopus",
        citation_count: Number(details.eligibleCitations || details.citationCount || 0),
        h_index: details.hIndex ? Number(details.hIndex) : null,
        i10_index: details.i10Index ? Number(details.i10Index) : null,
        verification_url: details.scopusLink || details.verificationUrl,
        scopus_id: details.scopusId || null,
        total_citations_last_calendar_year: details.totalCitationsLastYear ? Number(details.totalCitationsLastYear) : null,
        total_ppsu_citations_last_calendar_year: details.ppsuCitationsLastYear ? Number(details.ppsuCitationsLastYear) : null,
        journal_name: details.journalTitle || details.journalName || null,
        doi: details.doi || null,
        issn: details.issn || null,
        publication_year: details.pubYear || details.publicationYear ? Number(details.pubYear || details.publicationYear) : null,
      });
      detailErr = error;
    } else if (claimTypeCode === "RESEARCH_PROJECT") {
      const { data: projData, error: projErr } = await adminSupabase
        .from("research_projects")
        .insert({
          claim_id: claim.id,
          title: details.title || details.projectTitle || details.paperTitle || details.workTitle || "Research Project Title",
          funding_agency: details.sponsoringBody || details.fundingAgency,
          sanctioned_amount: Number(details.sanctionedAmount || 0),
          grant_number: details.approvedNumber || details.grantNumber,
          project_start_date: details.startDate || details.projectStart || null,
          project_end_date: details.endDate || details.projectEnd || null,
          project_status: details.projectStatus || "ONGOING",
          amount_deposited_in_ppsu: details.depositedAmount ? Number(details.depositedAmount) : (details.amountDepositedInPpsu ? Number(details.amountDepositedInPpsu) : null),
          deposit_date: details.depositDate || null,
          deposit_proof_url: details.depositProofUrl || details.depositProofName || null,
        })
        .select()
        .single();
      detailErr = projErr;

      // Insert Co-PIs into project_members
      if (projData && !projErr && Array.isArray(details.coPIs)) {
        const coPiMembers = details.coPIs.map((c: any) => ({
          project_id: projData.id,
          faculty_id: c.facultyId || null,
          member_name: c.name,
          role: c.role || "Co-PI",
          is_pi: false,
        }));

        // Add claimant as PI/Co-PI member
        coPiMembers.unshift({
          project_id: projData.id,
          faculty_id: faculty.id,
          member_name: faculty.name,
          role: details.piOrCoPi || "PI",
          is_pi: details.piOrCoPi === "PI",
        });

        const { error: memErr } = await adminSupabase.from("project_members").insert(coPiMembers);
        if (memErr && !detailErr) detailErr = memErr;
      }
    }

    if (detailErr) {
      console.error("Detail insertion error for", claimTypeCode, ":", detailErr);
    }

    // Write audit log
    await createAuditLog({
      entityType: "claims",
      entityId: claim.id,
      action: status === "SUBMITTED" ? "SUBMIT" : "CREATE",
      newValue: {
        claim_number: claimNumber,
        status,
        current_stage: initialStage,
        estimated_amount: estimatedAmount,
        calculation_snapshot: calculationSnapshot,
      },
    });

    return { success: true, claimId: claim.id, claimNumber: claim.claim_number };
  } catch (err: any) {
    console.error("Create claim error:", err);
    return { success: false, error: err?.message || "Internal server error" };
  }
}

// Update existing claim details
export async function updateClaim(
  claimId: string,
  claimTypeCodeInput: string,
  details: Record<string, any>,
  status: ClaimStatus = "DRAFT"
) {
  try {
    const adminSupabase = createAdminClient();
    const faculty = await getMyFacultyProfile();
    if (!faculty) return { success: false, error: "Faculty profile not found." };

    const { data: existingClaim, error: existErr } = await adminSupabase
      .from("claims")
      .select("*, claim_type:claim_types(*)")
      .eq("id", claimId)
      .single();

    if (existErr || !existingClaim) return { success: false, error: "Claim not found." };

    let claimTypeCode = claimTypeCodeInput.toUpperCase();
    if (claimTypeCode === "RESEARCH_PAPER") claimTypeCode = "JOURNAL_PUBLICATION";

    const ppsuCount = (Array.isArray(details.authors) ? details.authors.filter((a: any) => a.isPpsu).length : 0) + 1;
    const serverCalc = calculateIncentive(
      claimTypeCode.toLowerCase(),
      details,
      ppsuCount,
      details.authorshipPosition
    );

    const estimatedAmount = (details.estimatedAmount !== undefined && details.estimatedAmount !== null)
      ? Number(details.estimatedAmount)
      : (serverCalc.facultyShare ?? serverCalc.policyIncentive ?? 0);

    const calculationSnapshot = details.calculationSnapshot || serverCalc;

    let targetStage = status === "SUBMITTED" ? await resolveInitialStageForFaculty(faculty, faculty?.auth_user_id) : (existingClaim.current_stage || "FACULTY");

    if (existingClaim.status === "RETURNED" && status === "SUBMITTED") {
      // Look up the stage that returned this claim
      const { data: lastReturn } = await adminSupabase
        .from("claim_approvals")
        .select("stage")
        .eq("claim_id", claimId)
        .eq("status", "RETURNED")
        .order("action_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastReturn?.stage) {
        targetStage = lastReturn.stage;
      }
    }

    const newStatus = existingClaim.status === "RETURNED" && status === "SUBMITTED" ? "RESUBMITTED" : status;

    const { error: updateErr } = await adminSupabase
      .from("claims")
      .update({
        status: newStatus,
        current_stage: targetStage,
        claimed_amount: estimatedAmount,
        calculated_amount: estimatedAmount,
        submitted_at: status === "SUBMITTED" ? new Date().toISOString() : existingClaim.submitted_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", claimId);

    if (updateErr) return { success: false, error: updateErr.message };

    // Update child table records
    if (claimTypeCode === "JOURNAL_PUBLICATION" || claimTypeCode === "RESEARCH_PAPER") {
      const indexingVal = details.recognizedBody === "Other Body" && details.otherRecognizedBody
        ? details.otherRecognizedBody
        : (details.indexing || details.recognizedBody || "Scopus");

      const { data: pubData } = await adminSupabase
        .from("publications")
        .upsert({
          claim_id: claimId,
          title: details.paperTitle || details.workTitle || details.title || details.journalTitle || "Publication Title",
          journal_name: details.journalTitle || details.journalName || details.title,
          issn: details.issn,
          publication_date: details.publicationDate || null,
          indexing: indexingVal,
          quartile: details.quartile,
          impact_factor: details.impactFactor ? Number(details.impactFactor) : null,
          acceptance_rate: details.acceptanceRate ? Number(details.acceptanceRate) : null,
          abdc_category: details.abdcCategory,
          doi: details.doi,
        })
        .select()
        .single();

      if (pubData && (details.authors || details.authorshipPosition)) {
        await adminSupabase.from("publication_authors").delete().eq("publication_id", pubData.id);

        const isFirst = details.authorshipPosition === "first" || details.authorshipPosition === "both";
        const isCorr = details.authorshipPosition === "corresponding" || details.authorshipPosition === "both";
        const claimantOrder = isFirst ? 1 : (details.authorNumber ? Number(details.authorNumber) : 1);

        const authorEntries = [
          {
            publication_id: pubData.id,
            faculty_id: faculty.id,
            author_name: faculty.name,
            author_order: claimantOrder,
            author_number: claimantOrder,
            is_first_author: isFirst,
            is_corresponding_author: isCorr,
            is_ppsu_faculty: true,
            affiliation: faculty.designation || "Faculty",
            institution: "PPSU",
          },
        ];

        if (Array.isArray(details.authors)) {
          details.authors.forEach((auth: any, idx: number) => {
            const assignedOrder = auth.authorOrder ? Number(auth.authorOrder) : (idx + 2);
            authorEntries.push({
              publication_id: pubData.id,
              faculty_id: auth.facultyId || null,
              author_name: auth.name || `Co-Author ${idx + 1}`,
              author_order: assignedOrder,
              author_number: assignedOrder,
              is_first_author: !!auth.isFirstAuthor,
              is_corresponding_author: !!auth.isCorrespondingAuthor,
              is_ppsu_faculty: !!auth.isPpsu,
              affiliation: auth.affiliation || null,
              institution: auth.institution || (auth.isPpsu ? "PPSU" : null),
            });
          });
        }

        await adminSupabase.from("publication_authors").insert(authorEntries);
      }
    } else if (claimTypeCode === "PATENT") {
      await adminSupabase.from("patents").upsert({
        claim_id: claimId,
        title: details.paperTitle || details.workTitle || details.title || "Patent Title",
        patent_number: details.patentNumber,
        filing_date: details.filingDate || null,
        grant_date: details.grantDate || details.publicationDate || null,
        publication_date: details.publicationDate || details.grantDate || details.filingDate || null,
        patent_office: details.patentOffice || details.journalTitle || "Indian Patent Office",
        patent_type: details.patentType || "Utility",
        patent_status: details.patentStatus || "Granted",
        country: details.country || details.countryName || null,
        publication_level: details.publicationLevel || "National",
        inventors: details.inventors || null,
      });
    } else if (claimTypeCode === "BOOK" || claimTypeCode === "BOOK_CHAPTER") {
      await adminSupabase.from("books").upsert({
        claim_id: claimId,
        title: details.workTitle || details.paperTitle || details.title || "Book Title",
        work_title: details.workTitle || details.title || details.paperTitle || null,
        publisher: details.publisher || details.journalTitle || null,
        isbn: details.isbn || null,
        publication_date: details.publicationDate || details.bookPubDate || null,
        book_type: claimTypeCode === "BOOK_CHAPTER" ? "CHAPTER" : (details.bookType || "AUTHORED"),
        chapter_title: details.chapterTitle || null,
        scopus_indexed: details.recognizedBody === "Scopus" || !!details.scopusIndexed,
        publication_level: details.publicationLevel || "International",
        recognized_body: details.recognizedBody || null,
        other_recognized_body: details.otherRecognizedBody || null,
        web_link: details.webLink || null,
        doi: details.doi || null,
      });

      if (claimTypeCode === "BOOK_CHAPTER") {
        await adminSupabase.from("book_chapters").upsert({
          claim_id: claimId,
          chapter_title: details.chapterTitle || details.paperTitle || details.workTitle || "Chapter Title",
          book_title: details.bookTitle || details.journalTitle || details.publisher || "Book Title",
          publisher: details.publisher || details.journalTitle || null,
          isbn: details.isbn || null,
          publication_date: details.publicationDate || details.bookPubDate || null,
          chapter_pages: details.chapterPages || null,
          doi: details.doi || null,
          web_link: details.webLink || null,
          publication_level: details.publicationLevel || "International",
          recognized_body: details.recognizedBody || null,
          other_recognized_body: details.otherRecognizedBody || null,
        });
      }
    } else if (claimTypeCode === "CITATION") {
      await adminSupabase.from("citations").upsert({
        claim_id: claimId,
        source_title: details.paperTitle || details.workTitle || details.title || "Paper Title",
        citation_database: details.citationDb || details.recognizedBody || "Scopus",
        citation_count: Number(details.eligibleCitations || details.citationCount || 0),
        h_index: details.hIndex ? Number(details.hIndex) : null,
        i10_index: details.i10Index ? Number(details.i10Index) : null,
        verification_url: details.scopusLink || details.verificationUrl,
        scopus_id: details.scopusId || null,
        total_citations_last_calendar_year: details.totalCitationsLastYear ? Number(details.totalCitationsLastYear) : null,
        total_ppsu_citations_last_calendar_year: details.ppsuCitationsLastYear ? Number(details.ppsuCitationsLastYear) : null,
        journal_name: details.journalTitle || details.journalName || null,
        doi: details.doi || null,
        issn: details.issn || null,
        publication_year: details.pubYear || details.publicationYear ? Number(details.pubYear || details.publicationYear) : null,
      });
    } else if (claimTypeCode === "RESEARCH_PROJECT") {
      const { data: projData } = await adminSupabase
        .from("research_projects")
        .upsert({
          claim_id: claimId,
          title: details.title || details.projectTitle || details.paperTitle || details.workTitle || "Research Project Title",
          funding_agency: details.sponsoringBody || details.fundingAgency,
          grant_number: details.approvedNumber || details.grantNumber,
          sanctioned_amount: Number(details.sanctionedAmount || 0),
          project_start_date: details.startDate || details.projectStart || null,
          project_end_date: details.endDate || details.projectEnd || null,
          project_status: details.projectStatus || "ONGOING",
          amount_deposited_in_ppsu: details.depositedAmount ? Number(details.depositedAmount) : (details.amountDepositedInPpsu ? Number(details.amountDepositedInPpsu) : null),
          deposit_date: details.depositDate || null,
          deposit_proof_url: details.depositProofUrl || details.depositProofName || null,
        })
        .select()
        .single();

      if (projData && Array.isArray(details.coPIs)) {
        await adminSupabase.from("project_members").delete().eq("project_id", projData.id);

        const coPiMembers = details.coPIs.map((c: any) => ({
          project_id: projData.id,
          faculty_id: c.facultyId || null,
          member_name: c.name,
          role: c.role || "Co-PI",
          is_pi: false,
        }));

        coPiMembers.unshift({
          project_id: projData.id,
          faculty_id: faculty.id,
          member_name: faculty.name,
          role: details.piOrCoPi || "PI",
          is_pi: details.piOrCoPi === "PI",
        });

        await adminSupabase.from("project_members").insert(coPiMembers);
      }
    }

    // Write audit log
    await createAuditLog({
      entityType: "claims",
      entityId: claimId,
      action: status === "SUBMITTED" ? "RESUBMIT" : "UPDATE",
      oldValue: { status: existingClaim.status },
      newValue: {
        status: newStatus,
        current_stage: targetStage,
        estimated_amount: estimatedAmount,
        calculation_snapshot: calculationSnapshot,
      },
    });

    return { success: true, claimId, claimNumber: existingClaim.claim_number };
  } catch (err) {
    console.error("Update claim error:", err);
    return { success: false, error: "Internal server error" };
  }
}

export async function submitClaim(claimId: string) {
  try {
    const adminSupabase = createAdminClient();
    const { data: claim, error: getErr } = await adminSupabase
      .from("claims")
      .select("status")
      .eq("id", claimId)
      .single();

    if (getErr || !claim) return { success: false, error: "Claim not found." };
    if (claim.status !== "DRAFT" && claim.status !== "RETURNED") {
      return { success: false, error: "Only Draft or Returned claims can be submitted." };
    }

    const newStatus = claim.status === "RETURNED" ? "RESUBMITTED" : "SUBMITTED";
    const faculty = await getMyFacultyProfile();
    let targetStage = await resolveInitialStageForFaculty(faculty, faculty?.auth_user_id);

    if (claim.status === "RETURNED") {
      const { data: lastReturn } = await adminSupabase
        .from("claim_approvals")
        .select("stage")
        .eq("claim_id", claimId)
        .eq("status", "RETURNED")
        .order("action_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastReturn?.stage) {
        targetStage = lastReturn.stage;
      }
    }

    const { error: updateErr } = await adminSupabase
      .from("claims")
      .update({
        status: newStatus,
        current_stage: targetStage,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", claimId);

    if (updateErr) return { success: false, error: updateErr.message };

    // Log audit
    await createAuditLog({
      entityType: "claims",
      entityId: claimId,
      action: "SUBMIT",
      oldValue: { status: claim.status },
      newValue: { status: newStatus, current_stage: targetStage },
    });

    return { success: true, targetStage };
  } catch (err) {
    console.error("Submit claim error:", err);
    return { success: false, error: "Internal server error" };
  }
}

export async function getClaimDetailsWithHistory(claimId: string) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized access." };

    const { data: accessClaim, error: accessErr } = await adminSupabase
      .from("claims")
      .select("faculty:faculty(auth_user_id)")
      .eq("id", claimId)
      .single();

    if (accessErr || !accessClaim) return { success: false, error: "Claim not found." };

    const facultyRelation = accessClaim.faculty as { auth_user_id?: string } | { auth_user_id?: string }[] | null;
    const ownerId = Array.isArray(facultyRelation) ? facultyRelation[0]?.auth_user_id : facultyRelation?.auth_user_id;
    const canViewAsVerifier = await userHasAnyRole(user.id, [
      "HOD",
      "RESEARCH_COMMITTEE_MEMBER",
      "GOVERNOR",
      "PROVOST",
      "RESEARCH_VERIFIER",
      "SUPER_ADMIN",
    ]);

    if (ownerId !== user.id && !canViewAsVerifier) {
      return { success: false, error: "Forbidden." };
    }

    const { data: claim, error } = await adminSupabase
      .from("claims")
      .select(`
        *,
        claim_type:claim_types(*),
        faculty:faculty(*, department:departments(*)),
        publications(*, publication_authors(*)),
        books(*),
        book_chapters(*),
        patents(*),
        citations(*),
        research_projects(*),
        claim_documents(*),
        claim_approvals(*, approver:users(id, email, faculty(name, email, designation))),
        claim_comments(*)
      `)
      .eq("id", claimId)
      .single();

    if (error || !claim) {
      return { success: false, error: error?.message || "Claim not found." };
    }

    if (claim.claim_approvals) {
      claim.claim_approvals = claim.claim_approvals.map((app: any) => {
        const userObj = app.approver;
        const facObj = Array.isArray(userObj?.faculty) ? userObj.faculty[0] : userObj?.faculty;
        return {
          ...app,
          approver: {
            name: facObj?.name || userObj?.email || "Verifier",
            designation: facObj?.designation,
          },
        };
      });
    }

    const pubObj = Array.isArray(claim.publications) ? claim.publications[0] : claim.publications;
    const bookObj = Array.isArray(claim.books) ? claim.books[0] : claim.books;
    const patentObj = Array.isArray(claim.patents) ? claim.patents[0] : claim.patents;
    const citationObj = Array.isArray(claim.citations) ? claim.citations[0] : claim.citations;
    const projectObj = Array.isArray(claim.research_projects) ? claim.research_projects[0] : claim.research_projects;

    let calcSnapshot = claim.calculation_snapshot;
    if (!calcSnapshot) {
      const ppsuCount = (pubObj?.publication_authors?.filter((a: any) => a.is_ppsu_faculty).length || 0) + 1;
      const position = pubObj?.publication_authors?.find((a: any) => a.faculty_id === claim.faculty_id)?.is_first_author
        ? "first"
        : "other";

      const detailObj = {
        ...(pubObj || {}),
        ...(bookObj || {}),
        ...(patentObj || {}),
        ...(citationObj || {}),
        ...(projectObj || {}),
        sciListed: pubObj?.indexing === "SCI" || pubObj?.indexing === "Scopus" ? "yes" : "no",
        indexedIn: pubObj?.indexing,
        publisherType: bookObj?.publication_level || "International",
        isbn: bookObj?.isbn,
        patentType: patentObj?.patent_type,
        patentStatus: patentObj?.grant_date ? "Granted" : "Filed",
        eligibleCitations: citationObj?.citation_count,
        sanctionedAmount: projectObj?.sanctioned_amount,
      };

      calcSnapshot = calculateIncentive(
        (claim.claim_type?.code || "").toLowerCase(),
        detailObj,
        ppsuCount,
        position
      );
      if (calcSnapshot && claim.calculated_amount != null) {
        calcSnapshot.facultyShare = Number(claim.calculated_amount);
      }
    }

    claim.calculation_snapshot = calcSnapshot;

    return { success: true, claim };
  } catch (err) {
    console.error("Get claim details error:", err);
    return { success: false, error: "Failed to fetch claim details" };
  }
}

// Complete claim deletion with full cascading cleanup of storage & child records
export async function deleteClaim(claimId: string) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized access." };

    // 1. Fetch claim to verify existence and authorization
    const { data: claim, error: getErr } = await adminSupabase
      .from("claims")
      .select("id, claim_number, status, faculty_id, faculty:faculty(auth_user_id)")
      .eq("id", claimId)
      .single();

    if (getErr || !claim) return { success: false, error: "Claim not found." };

    const facultyObj = Array.isArray(claim.faculty) ? claim.faculty[0] : claim.faculty;
    const isOwner = facultyObj?.auth_user_id === user.id;
    const isVerifierOrAdmin = await userHasAnyRole(user.id, [
      "HOD",
      "RESEARCH_COMMITTEE_MEMBER",
      "GOVERNOR",
      "PROVOST",
      "RESEARCH_VERIFIER",
      "SUPER_ADMIN",
    ]);

    if (!isOwner && !isVerifierOrAdmin) {
      return { success: false, error: "You are not authorized to delete this claim." };
    }

    // 2. Delete storage files attached to this claim
    try {
      const { data: storageFiles } = await adminSupabase.storage
        .from("claim-documents")
        .list(claimId);

      if (storageFiles && storageFiles.length > 0) {
        const filePaths = storageFiles.map((f) => `${claimId}/${f.name}`);
        await adminSupabase.storage.from("claim-documents").remove(filePaths);
      }
    } catch (storageErr) {
      console.warn("Storage files delete warning:", storageErr);
    }

    // 3. Delete dependent child records
    await Promise.all([
      adminSupabase.from("claim_documents").delete().eq("claim_id", claimId),
      adminSupabase.from("claim_approvals").delete().eq("claim_id", claimId),
      adminSupabase.from("claim_comments").delete().eq("claim_id", claimId),
      adminSupabase.from("publications").delete().eq("claim_id", claimId),
      adminSupabase.from("books").delete().eq("claim_id", claimId),
      adminSupabase.from("patents").delete().eq("claim_id", claimId),
      adminSupabase.from("citations").delete().eq("claim_id", claimId),
      adminSupabase.from("research_projects").delete().eq("claim_id", claimId),
      adminSupabase.from("notifications").delete().eq("claim_id", claimId),
      adminSupabase.from("audit_logs").delete().eq("entity_id", claimId),
    ]);

    // 4. Delete claim record
    const { error: delErr } = await adminSupabase.from("claims").delete().eq("id", claimId);
    if (delErr) return { success: false, error: delErr.message };

    // 5. Write audit log
    await createAuditLog({
      entityType: "claims",
      entityId: claimId,
      action: "DELETE",
      oldValue: { claim_number: claim.claim_number, status: claim.status },
    });

    return { success: true };
  } catch (err: any) {
    console.error("Delete claim error:", err);
    return { success: false, error: err?.message || "Internal server error" };
  }
}
