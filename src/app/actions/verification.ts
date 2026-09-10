"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAuditLog } from "./audit";
import { getNextStage, getVerifierStageInfo, WORKFLOW_STAGES } from "@/lib/constants";
import { resolveClaimTitle } from "@/lib/utils";

// Helper: Check if user is authorized to verify the claim at its current stage
async function checkVerifierAuthorizationForClaim(
  userId: string,
  claim: any
): Promise<{ authorized: boolean; error?: string; verifierStage?: string }> {
  const adminSupabase = createAdminClient();

  const claimant = Array.isArray(claim.faculty) ? claim.faculty[0] : claim.faculty;

  // 1. Check if user is trying to verify their own claim
  if (claimant?.auth_user_id === userId) {
    return { authorized: false, error: "You cannot verify your own research claim." };
  }

  // 2. Fetch user's faculty profile & roles
  const [{ data: facultyProfile }, { data: userRoles }] = await Promise.all([
    adminSupabase
      .from("faculty")
      .select("id, designation, department_id")
      .eq("auth_user_id", userId)
      .maybeSingle(),
    adminSupabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", userId)
      .eq("status", "ACTIVE"),
  ]);

  const roles = (userRoles || [])
    .map((row: any) => (Array.isArray(row.roles) ? row.roles[0]?.name : row.roles?.name))
    .filter(Boolean) as string[];

  if (roles.includes("SUPER_ADMIN")) {
    return { authorized: true, verifierStage: "ALL" };
  }

  const verifierStageInfo = getVerifierStageInfo(facultyProfile?.designation, roles);
  const myStageCode = verifierStageInfo.code;
  const currentClaimStage = claim.current_stage || "HOD_PRINCIPAL";

  if (myStageCode === "NONE") {
    return {
      authorized: false,
      error: "You do not have verifier permissions to verify this claim.",
      verifierStage: "NONE",
    };
  }

  // Check stage match
  if (myStageCode !== currentClaimStage && myStageCode !== "ALL") {
    return {
      authorized: false,
      error: `This claim is currently pending at ${WORKFLOW_STAGES[currentClaimStage]?.title || currentClaimStage} and is not awaiting your verification.`,
      verifierStage: myStageCode,
    };
  }

  // For HOD: Must be in the same department as the claimant
  if (myStageCode === "HOD_PRINCIPAL") {
    const claimantDeptId = claimant?.department_id;
    if (claimantDeptId && facultyProfile?.department_id && claimantDeptId !== facultyProfile.department_id) {
      return {
        authorized: false,
        error: "You can only verify claims from faculty members in your department.",
        verifierStage: myStageCode,
      };
    }
  }

  return { authorized: true, verifierStage: myStageCode };
}

// Create in-app notification
async function createInAppNotification(
  userId: string,
  title: string,
  message: string,
  type: "CLAIM_VERIFIED" | "CLAIM_RETURNED" | "CLAIM_APPROVED",
  claimId: string
) {
  const adminSupabase = createAdminClient();
  await adminSupabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    claim_id: claimId,
  });
}

export async function verifyClaim(claimId: string, approvedAmount: number, remarks: string) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized." };

    // Get claim details with claimant faculty info & claimant roles
    const { data: claim, error: claimErr } = await adminSupabase
      .from("claims")
      .select(`
        *,
        faculty:faculty!inner(
          id,
          name,
          email,
          auth_user_id,
          designation,
          department_id
        )
      `)
      .eq("id", claimId)
      .single();

    if (claimErr || !claim) return { success: false, error: "Claim not found." };

    if (claim.status === "APPROVED") {
      return { success: false, error: "This claim has already received final approval." };
    }

    // Check authorization for current stage
    const authCheck = await checkVerifierAuthorizationForClaim(user.id, claim);
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error || "Forbidden." };
    }

    const currentStage = claim.current_stage || "HOD_PRINCIPAL";

    const claimant = Array.isArray(claim.faculty) ? claim.faculty[0] : claim.faculty;
    const claimantUserId = claimant?.auth_user_id;

    // Fetch claimant roles to support automatic skip of claimant's own stage
    const { data: claimantRolesData } = await adminSupabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", claimantUserId)
      .eq("status", "ACTIVE");

    const claimantRoles = (claimantRolesData || [])
      .map((row: any) => (Array.isArray(row.roles) ? row.roles[0]?.name : row.roles?.name))
      .filter(Boolean) as string[];

    const isProvost = currentStage === "PROVOST";

    // Strict Authority Rule: Only PROVOST can override the sanctioned payout amount.
    // Non-provost verifiers (HOD, Committee M1, Committee M2, Governor) forward the policy-calculated amount.
    const finalSanctionedAmount = isProvost
      ? (approvedAmount != null && !isNaN(Number(approvedAmount)) ? Number(approvedAmount) : Number(claim.calculated_amount || claim.claimed_amount || 0))
      : Number(claim.calculated_amount || claim.approved_amount || claim.claimed_amount || 0);

    const nextStage = getNextStage(currentStage, claimantRoles, claimant?.designation);
    const isFinalApproval = nextStage === "APPROVED" || currentStage === "PROVOST";

    const newStatus = isFinalApproval ? "APPROVED" : "UNDER_VERIFICATION";
    const resolvedNextStage = isFinalApproval ? "APPROVED" : nextStage;
    const currentStageConfig = WORKFLOW_STAGES[currentStage] || WORKFLOW_STAGES.HOD_PRINCIPAL;
    const nextStageConfig = WORKFLOW_STAGES[resolvedNextStage] || WORKFLOW_STAGES.APPROVED;

    // Update claim status, stage, and approved amount
    const { error: updateErr } = await adminSupabase
      .from("claims")
      .update({
        status: newStatus,
        approved_amount: finalSanctionedAmount,
        current_stage: resolvedNextStage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", claimId);

    if (updateErr) return { success: false, error: updateErr.message };

    // Insert approval history record for this stage
    await adminSupabase.from("claim_approvals").insert({
      claim_id: claimId,
      stage: currentStage,
      approver_id: user.id,
      status: isFinalApproval ? "APPROVED" : "VERIFIED",
      remarks: remarks || null,
      approved_amount: finalSanctionedAmount,
      action_at: new Date().toISOString(),
    });

    // Insert comment if remarks exist
    if (remarks) {
      await adminSupabase.from("claim_comments").insert({
        claim_id: claimId,
        user_id: user.id,
        comment: `[${currentStageConfig.shortName}] ${remarks}`,
        is_internal: false,
      });
    }

    // Send notification to claimant
    if (claimantUserId) {
      if (isFinalApproval) {
        await createInAppNotification(
          claimantUserId,
          "Claim Fully Approved & Sanctioned!",
          `Congratulations! Your claim ${claim.claim_number} has received final Provost Approval for ₹${finalSanctionedAmount.toLocaleString("en-IN")}.`,
          "CLAIM_APPROVED",
          claimId
        );
      } else {
        await createInAppNotification(
          claimantUserId,
          `Claim Approved by ${currentStageConfig.shortName}`,
          `Your claim ${claim.claim_number} was approved by ${currentStageConfig.roleLabel} and moved to ${nextStageConfig.roleLabel}.`,
          "CLAIM_VERIFIED",
          claimId
        );
      }
    }

    // Log audit
    await createAuditLog({
      entityType: "claims",
      entityId: claimId,
      action: isFinalApproval ? "APPROVE" : "VERIFY",
      oldValue: { status: claim.status, stage: currentStage },
      newValue: { status: newStatus, stage: resolvedNextStage, approved_amount: finalSanctionedAmount },
    });

    return {
      success: true,
      nextStage: resolvedNextStage,
      isFinalApproval,
      nextStageLabel: nextStageConfig.roleLabel,
    };
  } catch (err: any) {
    console.error("Verify claim error:", err);
    return { success: false, error: err?.message || "Internal server error" };
  }
}

export async function returnClaim(claimId: string, remarks: string) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized." };

    if (!remarks || !remarks.trim()) {
      return {
        success: false,
        error: "Return remarks are strictly mandatory. Please specify the required corrections or missing documents.",
      };
    }

    // Get claim details
    const { data: claim, error: claimErr } = await adminSupabase
      .from("claims")
      .select(`
        *,
        faculty:faculty!inner(
          id,
          name,
          email,
          auth_user_id,
          designation,
          department_id
        )
      `)
      .eq("id", claimId)
      .single();

    if (claimErr || !claim) return { success: false, error: "Claim not found." };

    // Check authorization for current stage
    const authCheck = await checkVerifierAuthorizationForClaim(user.id, claim);
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error || "Forbidden." };
    }

    const currentStage = claim.current_stage || "HOD_PRINCIPAL";
    const currentStageConfig = WORKFLOW_STAGES[currentStage] || WORKFLOW_STAGES.HOD_PRINCIPAL;

    // Update claim status to RETURNED and stage to FACULTY
    const { error: updateErr } = await adminSupabase
      .from("claims")
      .update({
        status: "RETURNED",
        current_stage: "FACULTY",
        updated_at: new Date().toISOString(),
      })
      .eq("id", claimId);

    if (updateErr) return { success: false, error: updateErr.message };

    // Insert approval record (returned status)
    await adminSupabase.from("claim_approvals").insert({
      claim_id: claimId,
      stage: currentStage,
      approver_id: user.id,
      status: "RETURNED",
      remarks: remarks,
      action_at: new Date().toISOString(),
    });

    // Insert comment
    await adminSupabase.from("claim_comments").insert({
      claim_id: claimId,
      user_id: user.id,
      comment: `[Returned by ${currentStageConfig.shortName}] ${remarks}`,
      is_internal: false,
    });

    // Send notification
    const claimant = Array.isArray(claim.faculty) ? claim.faculty[0] : claim.faculty;
    const claimantUserId = claimant?.auth_user_id;
    if (claimantUserId) {
      await createInAppNotification(
        claimantUserId,
        "Claim Returned for Correction",
        `Your research claim ${claim.claim_number} was returned by ${currentStageConfig.roleLabel}. Remarks: "${remarks}"`,
        "CLAIM_RETURNED",
        claimId
      );
    }

    // Log audit
    await createAuditLog({
      entityType: "claims",
      entityId: claimId,
      action: "RETURN",
      oldValue: { status: claim.status, stage: currentStage },
      newValue: { status: "RETURNED", stage: "FACULTY", remarks },
    });

    return { success: true };
  } catch (err: any) {
    console.error("Return claim error:", err);
    return { success: false, error: err?.message || "Internal server error" };
  }
}

export async function getMyVerifiedClaims() {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized access." };

    const { data, error } = await adminSupabase
      .from("claim_approvals")
      .select(`
        id,
        stage,
        status,
        remarks,
        approved_amount,
        action_at,
        claim:claims!inner(
          id,
          claim_number,
          status,
          current_stage,
          claimed_amount,
          approved_amount,
          submitted_at,
          claim_type:claim_types(name, code),
          faculty:faculty!inner(id, name, email, department:departments(name, code)),
          publications(title),
          books(title, chapter_title),
          patents(title),
          citations(source_title),
          research_projects(title)
        )
      `)
      .eq("approver_id", user.id)
      .in("status", ["VERIFIED", "APPROVED"])
      .order("action_at", { ascending: false });

    if (error) return { success: false, error: error.message };

    const seen = new Set<string>();
    const uniqueList: any[] = [];
    (data || []).forEach((row: any) => {
      if (row.claim && !seen.has(row.claim.id)) {
        seen.add(row.claim.id);
        const claim = row.claim;
        const title = resolveClaimTitle(claim);

        uniqueList.push({
          id: claim.id,
          claimNumber: claim.claim_number,
          type: claim.claim_type?.name || "Claim",
          title,
          faculty: claim.faculty?.name || "Unknown Faculty",
          department: claim.faculty?.department?.code || claim.faculty?.department?.name || "N/A",
          myStageVerified: row.stage,
          currentStage: claim.current_stage,
          status: claim.status,
          approvedAmount: row.approved_amount || claim.approved_amount || 0,
          verifiedAt: row.action_at,
          remarks: row.remarks,
        });
      }
    });

    return { success: true, claims: uniqueList };
  } catch (err: any) {
    return { success: false, error: err?.message || "Internal server error" };
  }
}

export async function getMyReturnedClaims() {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized access." };

    const { data, error } = await adminSupabase
      .from("claim_approvals")
      .select(`
        id,
        stage,
        status,
        remarks,
        action_at,
        claim:claims!inner(
          id,
          claim_number,
          status,
          current_stage,
          claimed_amount,
          submitted_at,
          claim_type:claim_types(name, code),
          faculty:faculty!inner(id, name, email, department:departments(name, code)),
          publications(title),
          books(title, chapter_title),
          patents(title),
          citations(source_title),
          research_projects(title)
        )
      `)
      .eq("approver_id", user.id)
      .eq("status", "RETURNED")
      .order("action_at", { ascending: false });

    if (error) return { success: false, error: error.message };

    const seen = new Set<string>();
    const uniqueList: any[] = [];
    (data || []).forEach((row: any) => {
      if (row.claim && !seen.has(row.claim.id)) {
        seen.add(row.claim.id);
        const claim = row.claim;
        const title = resolveClaimTitle(claim);

        uniqueList.push({
          id: claim.id,
          claimNumber: claim.claim_number,
          type: claim.claim_type?.name || "Claim",
          title,
          faculty: claim.faculty?.name || "Unknown Faculty",
          department: claim.faculty?.department?.code || claim.faculty?.department?.name || "N/A",
          returnedAtStage: row.stage,
          currentStage: claim.current_stage,
          status: claim.status,
          claimedAmount: claim.claimed_amount || 0,
          returnedAt: row.action_at,
          remarks: row.remarks,
        });
      }
    });

    return { success: true, claims: uniqueList };
  } catch (err: any) {
    return { success: false, error: err?.message || "Internal server error" };
  }
}

export async function getVerifierReportsData() {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized access." };

    // Fetch user's faculty profile & roles
    const [{ data: facultyProfile }, { data: userRoles }] = await Promise.all([
      adminSupabase
        .from("faculty")
        .select("id, designation, department_id")
        .eq("auth_user_id", user.id)
        .maybeSingle(),
      adminSupabase
        .from("user_roles")
        .select("roles(name)")
        .eq("user_id", user.id)
        .eq("status", "ACTIVE"),
    ]);

    const roles = (userRoles || [])
      .map((row: any) => (Array.isArray(row.roles) ? row.roles[0]?.name : row.roles?.name))
      .filter(Boolean) as string[];

    const isSuperAdmin = roles.includes("SUPER_ADMIN");
    const verifierStageInfo = getVerifierStageInfo(facultyProfile?.designation, roles);

    // Fetch all claims with relational data
    const [
      { data: claims, error: cErr },
      { data: departments, error: dErr },
      { data: claimTypes, error: ctErr },
    ] = await Promise.all([
      adminSupabase
        .from("claims")
        .select(`
          id,
          claim_number,
          status,
          current_stage,
          claimed_amount,
          calculated_amount,
          approved_amount,
          created_at,
          submitted_at,
          claim_type:claim_types(id, name, code),
          faculty:faculty(
            id,
            name,
            email,
            department:departments(
              id,
              name,
              code,
              school:schools(id, name, code)
            )
          ),
          publications(title),
          books(title, chapter_title),
          patents(title),
          citations(source_title),
          research_projects(title)
        `)
        .order("created_at", { ascending: false }),
      adminSupabase.from("departments").select("id, name, code, school:schools(id, name, code)"),
      adminSupabase.from("claim_types").select("id, name, code"),
    ]);

    if (cErr) return { success: false, error: cErr.message };

    const allClaims = claims || [];

    // Filter claims if HOD: show claims within their department or all claims if institutional
    const filteredClaims = allClaims.filter((c: any) => {
      if (isSuperAdmin || verifierStageInfo.code === "ALL" || !verifierStageInfo.code) return true;
      if (verifierStageInfo.code === "HOD_PRINCIPAL" && facultyProfile?.department_id) {
        const claimantDeptId = Array.isArray(c.faculty) ? c.faculty[0]?.department?.id : c.faculty?.department?.id;
        return claimantDeptId === facultyProfile.department_id;
      }
      return true;
    });

    let totalClaimed = 0;
    let totalApproved = 0;
    let totalVerified = 0;
    let totalPendingAtMyStage = 0;
    let totalPending = 0;
    let totalReturned = 0;

    const myStage = verifierStageInfo.code;

    const claimsList = filteredClaims.map((c: any) => {
      const claimant = Array.isArray(c.faculty) ? c.faculty[0] : c.faculty;
      const dept = Array.isArray(claimant?.department) ? claimant?.department[0] : claimant?.department;
      const school = Array.isArray(dept?.school) ? dept?.school[0] : dept?.school;
      const cType = Array.isArray(c.claim_type) ? c.claim_type[0] : c.claim_type;
      const title = resolveClaimTitle(c);

      const claimed = parseFloat(c.claimed_amount) || 0;
      const approved = parseFloat(c.approved_amount) || 0;

      totalClaimed += claimed;
      if (c.status === "APPROVED") {
        totalApproved += (approved || claimed);
        totalVerified++;
      } else if (c.status === "VERIFIED") {
        totalVerified++;
      }

      if (["SUBMITTED", "UNDER_VERIFICATION", "RESUBMITTED"].includes(c.status)) {
        totalPending++;
        if (myStage === "ALL" || c.current_stage === myStage) {
          totalPendingAtMyStage++;
        }
      }

      if (c.status === "RETURNED") {
        totalReturned++;
      }

      return {
        id: c.id,
        claim_number: c.claim_number,
        title,
        status: c.status,
        current_stage: c.current_stage || "HOD_PRINCIPAL",
        claimed_amount: claimed,
        approved_amount: approved,
        submitted_at: c.submitted_at ? new Date(c.submitted_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "N/A",
        created_at: c.created_at ? new Date(c.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "N/A",
        raw_date: c.submitted_at || c.created_at,
        claim_type: cType?.name || "General Claim",
        type_code: cType?.code || "GEN",
        faculty_name: claimant?.name || "Unknown Faculty",
        faculty_email: claimant?.email || "N/A",
        department_name: dept?.name || "Unassigned",
        department_code: dept?.code || "N/A",
        department_id: dept?.id || null,
        school_name: school?.name || "PPSU",
      };
    });

    // Department-wise stats
    const deptStatsMap = new Map<string, any>();
    (departments || []).forEach((d: any) => {
      const sch = Array.isArray(d.school) ? d.school[0] : d.school;
      deptStatsMap.set(d.id, {
        id: d.id,
        name: d.name,
        code: d.code,
        schoolName: sch?.name || "PPSU",
        totalClaims: 0,
        claimedAmount: 0,
        approvedAmount: 0,
      });
    });

    claimsList.forEach((c: any) => {
      if (c.department_id && deptStatsMap.has(c.department_id)) {
        const item = deptStatsMap.get(c.department_id);
        item.totalClaims += 1;
        item.claimedAmount += c.claimed_amount;
        item.approvedAmount += c.approved_amount;
      }
    });

    const departmentStats = Array.from(deptStatsMap.values()).filter((d) => d.totalClaims > 0);

    // Claim type stats
    const typeStatsMap = new Map<string, { name: string; count: number; amount: number }>();
    (claimTypes || []).forEach((t: any) => {
      typeStatsMap.set(t.name, { name: t.name, count: 0, amount: 0 });
    });

    claimsList.forEach((c: any) => {
      const typeName = c.claim_type;
      if (typeStatsMap.has(typeName)) {
        const item = typeStatsMap.get(typeName)!;
        item.count += 1;
        item.amount += c.approved_amount || c.claimed_amount;
      } else {
        typeStatsMap.set(typeName, { name: typeName, count: 1, amount: c.approved_amount || c.claimed_amount });
      }
    });

    const claimTypeStats = Array.from(typeStatsMap.values()).filter((t) => t.count > 0);

    // Stage pipeline stats
    const stageStats: Record<string, number> = {
      HOD_PRINCIPAL: 0,
      COMMITTEE_M1: 0,
      COMMITTEE_M2: 0,
      GOVERNOR: 0,
      PROVOST: 0,
      APPROVED: 0,
      RETURNED: 0,
    };

    claimsList.forEach((c: any) => {
      if (c.status === "APPROVED") {
        stageStats.APPROVED = (stageStats.APPROVED || 0) + 1;
      } else if (c.status === "RETURNED") {
        stageStats.RETURNED = (stageStats.RETURNED || 0) + 1;
      } else if (c.current_stage && stageStats[c.current_stage] !== undefined) {
        stageStats[c.current_stage] += 1;
      }
    });

    const approvalRate = filteredClaims.length > 0
      ? Math.round((totalVerified / filteredClaims.length) * 100)
      : 0;

    return {
      success: true,
      verifierStageInfo,
      summary: {
        totalClaims: filteredClaims.length,
        totalClaimed,
        totalApproved,
        totalPending,
        totalPendingAtMyStage,
        totalVerified,
        totalReturned,
        approvalRate,
      },
      departmentStats,
      claimTypeStats,
      stageStats,
      claimsList,
      departments: departments || [],
      claimTypes: claimTypes || [],
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "Internal server error" };
  }
}

