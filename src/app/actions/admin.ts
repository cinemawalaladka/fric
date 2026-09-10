"use server";

import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { type UserRole, type FacultyStatus } from "@/types";

import { createClient } from "@/lib/supabase/server";

// Helper to verify if request is from an authenticated admin session or database SUPER_ADMIN user
async function verifyAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (session?.value) return true;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id)
      .eq("status", "ACTIVE");

    const roles = userRoles?.map((ur: Record<string, unknown>) => {
      const role = ur.roles as { name: string } | null;
      return role?.name;
    }).filter(Boolean) || [];

    return roles.includes("SUPER_ADMIN");
  } catch {
    return false;
  }
}

async function getCurrentActorId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

function isWorkflowRole(roleName: UserRole) {
  return ["HOD", "RESEARCH_COMMITTEE_MEMBER", "GOVERNOR", "PROVOST", "RESEARCH_VERIFIER"].includes(roleName);
}

export async function getAdminUsers() {
  if (!(await verifyAdminSession())) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const adminSupabase = createAdminClient();
    
    // Fetch aggregated data from admin_users_view
    const { data: users, error } = await adminSupabase
      .from("admin_users_view")
      .select("*");

    if (error) return { success: false, error: error.message };
    return { success: true, users };
  } catch (err) {
    return { success: false, error: "Internal server error" };
  }
}

export async function assignUserRole(
  userId: string,
  roleName: string,
  verifierStage?: string
) {
  if (!(await verifyAdminSession())) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const adminSupabase = createAdminClient();
    
    // Resolve auth_user_id if faculty_id was provided
    let targetAuthId = userId;
    const { data: facByFacId } = await adminSupabase
      .from("faculty")
      .select("id, auth_user_id, designation")
      .eq("id", userId)
      .maybeSingle();

    if (facByFacId?.auth_user_id) {
      targetAuthId = facByFacId.auth_user_id;
    }

    // Map role names
    let lookupRole = roleName;
    let stage = verifierStage;
    if (roleName === "M1") {
      lookupRole = "RESEARCH_COMMITTEE_MEMBER";
      stage = "COMMITTEE_M1";
    } else if (roleName === "M2") {
      lookupRole = "RESEARCH_COMMITTEE_MEMBER";
      stage = "COMMITTEE_M2";
    } else if (roleName === "HOD") {
      stage = "HOD_PRINCIPAL";
    } else if (roleName === "GOVERNOR") {
      stage = "GOVERNOR";
    } else if (roleName === "PROVOST") {
      stage = "PROVOST";
    }

    // Find role ID
    let { data: role } = await adminSupabase
      .from("roles")
      .select("id")
      .eq("name", lookupRole)
      .maybeSingle();

    if (!role) {
      const { data: directRole } = await adminSupabase
        .from("roles")
        .select("id")
        .eq("name", roleName)
        .maybeSingle();
      role = directRole;
    }

    if (!role) return { success: false, error: `Role ${roleName} not found.` };

    // Insert or update role mapping
    const { error: mapErr } = await adminSupabase
      .from("user_roles")
      .upsert({
        user_id: targetAuthId,
        role_id: role.id,
        status: "ACTIVE",
      }, { onConflict: "user_id,role_id" });

    if (mapErr) return { success: false, error: mapErr.message };

    const actorId = await getCurrentActorId();

    if (actorId) {
      try {
        await adminSupabase.from("role_change_logs").insert({
          target_user_id: targetAuthId,
          role_id: role.id,
          changed_by: actorId,
          action: "ASSIGN",
          new_value: { role: lookupRole, verifierStage: stage || null },
        });
      } catch {}
    }

    // Workflow roles can carry a stage tag for the verification pipeline.
    if (stage) {
      const { data: fac } = await adminSupabase
        .from("faculty")
        .select("id, designation")
        .eq("auth_user_id", targetAuthId)
        .maybeSingle();

      if (fac) {
        const cleanDesignation = (fac.designation || lookupRole.replaceAll("_", " ")).replace(/\s*\[.*?\]/g, "").trim();
        const newDesignation = `${cleanDesignation} [${stage}]`;
        await adminSupabase
          .from("faculty")
          .update({ designation: newDesignation })
          .eq("id", fac.id);
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Internal server error" };
  }
}

export async function removeUserRole(userId: string, roleName: string) {
  if (!(await verifyAdminSession())) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const adminSupabase = createAdminClient();

    let targetAuthId = userId;
    const { data: facByFacId } = await adminSupabase
      .from("faculty")
      .select("id, auth_user_id, designation")
      .eq("id", userId)
      .maybeSingle();

    if (facByFacId?.auth_user_id) {
      targetAuthId = facByFacId.auth_user_id;
    }

    let lookupRole = roleName;
    if (roleName === "M1" || roleName === "M2") {
      lookupRole = "RESEARCH_COMMITTEE_MEMBER";
    }

    // Find role ID
    let { data: role } = await adminSupabase
      .from("roles")
      .select("id")
      .eq("name", lookupRole)
      .maybeSingle();

    if (!role) {
      const { data: directRole } = await adminSupabase
        .from("roles")
        .select("id")
        .eq("name", roleName)
        .maybeSingle();
      role = directRole;
    }

    if (!role) return { success: false, error: "Role not found." };

    // Delete role mapping
    const { error: delErr } = await adminSupabase
      .from("user_roles")
      .delete()
      .eq("user_id", targetAuthId)
      .eq("role_id", role.id);

    if (delErr) return { success: false, error: delErr.message };

    // Clean up designation stage tag
    const { data: fac } = await adminSupabase
      .from("faculty")
      .select("id, designation")
      .eq("auth_user_id", targetAuthId)
      .maybeSingle();

    if (fac && fac.designation) {
      const cleanDesignation = fac.designation.replace(/\s*\[.*?\]/g, "").trim();
      await adminSupabase
        .from("faculty")
        .update({ designation: cleanDesignation || "Faculty Member" })
        .eq("id", fac.id);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Internal server error" };
  }
}

export async function updateFacultyProfile(
  facultyId: string,
  payload: {
    name?: string;
    employee_id?: string;
    designation?: string;
    department_id?: string;
    status?: FacultyStatus;
  }
) {
  if (!(await verifyAdminSession())) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const adminSupabase = createAdminClient();

    const { error } = await adminSupabase
      .from("faculty")
      .update(payload)
      .eq("id", facultyId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: "Internal server error" };
  }
}

export async function getDepartments() {
  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("departments")
      .select("id, name, code")
      .order("name", { ascending: true });

    if (error) return { success: false, error: error.message };
    return { success: true, departments: data };
  } catch (err) {
    return { success: false, error: "Internal server error" };
  }
}

export async function createClaimType(name: string, code: string, description: string) {
  if (!(await verifyAdminSession())) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("claim_types")
      .insert({ name, code, description })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, claimType: data };
  } catch (err) {
    return { success: false, error: "Internal server error" };
  }
}

export async function getClaimTypes() {
  if (!(await verifyAdminSession())) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("claim_types")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) return { success: false, error: error.message };
    return { success: true, claimTypes: data };
  } catch {
    return { success: false, error: "Internal server error" };
  }
}

export async function getIncentiveRules() {
  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("incentive_rules")
      .select(`
        *,
        claim_type:claim_types(name, code)
      `);
    if (error) return { success: false, error: error.message };
    return { success: true, rules: data };
  } catch (err) {
    return { success: false, error: "Internal server error" };
  }
}

export async function getAdminAuditLogs() {
  if (!(await verifyAdminSession())) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const adminSupabase = createAdminClient();
    const { data: logs, error } = await adminSupabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) return { success: false, error: error.message };

    // Fetch faculty, users, and claims to resolve actor and entity context
    const [{ data: facultyList }, { data: userList }, { data: claimsList }] = await Promise.all([
      adminSupabase.from("faculty").select("id, auth_user_id, name, email, designation"),
      adminSupabase.from("users").select("id, email, role"),
      adminSupabase.from("claims").select("id, claim_number, status, current_stage, faculty:faculty(name)"),
    ]);

    const facMap = new Map<string, { name: string; email: string; designation: string }>();
    (facultyList || []).forEach((f: any) => {
      if (f.auth_user_id) {
        facMap.set(f.auth_user_id, { name: f.name, email: f.email, designation: f.designation });
      }
      if (f.id) {
        facMap.set(f.id, { name: f.name, email: f.email, designation: f.designation });
      }
    });

    const userMap = new Map<string, { email: string; role: string }>();
    (userList || []).forEach((u: any) => {
      userMap.set(u.id, { email: u.email, role: u.role });
    });

    const claimMap = new Map<string, { claim_number: string; claimantName: string; status: string }>();
    (claimsList || []).forEach((c: any) => {
      claimMap.set(c.id, {
        claim_number: c.claim_number,
        claimantName: Array.isArray(c.faculty) ? c.faculty[0]?.name : c.faculty?.name || "Faculty",
        status: c.status,
      });
    });

    const enhancedLogs = (logs || []).map((log: any) => {
      const fac = log.user_id ? facMap.get(log.user_id) : null;
      const usr = log.user_id ? userMap.get(log.user_id) : null;

      const actorName = fac?.name || (usr?.email ? usr.email.split("@")[0] : "System Administrator");
      const actorEmail = fac?.email || usr?.email || "admin@ppsu.in";
      const actorDesignation = fac?.designation || (usr?.role ? usr.role.replace(/_/g, " ") : "Administrator");

      // Extract context from old_value and new_value
      const oldVal = log.old_value || {};
      const newVal = log.new_value || {};

      // Match associated claim
      const claimId = log.entity_type === "claims" ? log.entity_id : (newVal.claim_id || oldVal.claim_id || null);
      const claimInfo = claimId ? claimMap.get(claimId) : null;
      const claimNumber = newVal.claim_number || oldVal.claim_number || claimInfo?.claim_number || (claimId ? `ID:${claimId.slice(0, 8)}` : null);

      // Generate human-friendly narrative
      let activityNarrative = "";
      let eventCategory = "General";

      if (log.entity_type === "claims") {
        eventCategory = "Claim Workflow";
        if (log.action === "VERIFY") {
          const toStage = newVal.stage || newVal.current_stage || "Next Stage";
          const fromStage = oldVal.stage || oldVal.current_stage || "";
          const amt = newVal.approved_amount || newVal.calculated_amount;
          activityNarrative = `${actorName} reviewed Claim #${claimNumber || ""}${fromStage ? ` from ${fromStage}` : ""} and promoted to stage [${toStage}]${amt ? ` (Incentive: ₹${Number(amt).toLocaleString("en-IN")})` : ""}`;
        } else if (log.action === "SUBMIT") {
          const amt = newVal.estimated_amount || newVal.claimed_amount;
          activityNarrative = `${actorName} submitted new Research Claim #${claimNumber || ""}${amt ? ` claiming ₹${Number(amt).toLocaleString("en-IN")}` : ""}`;
        } else if (log.action === "RETURN") {
          activityNarrative = `${actorName} returned Claim #${claimNumber || ""} back to claimant for clarification/revision`;
        } else if (log.action === "APPROVE") {
          const amt = newVal.approved_amount || newVal.calculated_amount;
          activityNarrative = `${actorName} granted Final Provost Sanction for Claim #${claimNumber || ""}${amt ? ` (Approved Amount: ₹${Number(amt).toLocaleString("en-IN")})` : ""}`;
        } else {
          activityNarrative = `${actorName} performed ${log.action} on Claim #${claimNumber || log.entity_id?.slice(0, 8) || ""}`;
        }
      } else if (log.entity_type === "claim_documents") {
        eventCategory = "Document Attachment";
        const fileName = newVal.file_name || oldVal.file_name || "attachment";
        if (log.action === "CREATE") {
          activityNarrative = `${actorName} uploaded document file "${fileName}"${claimNumber ? ` for Claim #${claimNumber}` : ""}`;
        } else if (log.action === "DELETE") {
          activityNarrative = `${actorName} deleted document "${fileName}"${claimNumber ? ` from Claim #${claimNumber}` : ""}`;
        } else {
          activityNarrative = `${actorName} updated document "${fileName}"`;
        }
      } else if (log.entity_type === "user_roles") {
        eventCategory = "Role Security";
        const role = newVal.role || oldVal.role || "Role";
        activityNarrative = `${actorName} modified user role assignment: [${role}] for user ID ${log.entity_id?.slice(0, 8) || ""}`;
      } else if (log.entity_type === "academic_years") {
        eventCategory = "Academic Year";
        const yrName = newVal.name || oldVal.name || "Academic Year";
        activityNarrative = `${actorName} ${log.action === "CREATE" ? "created" : "updated"} Academic Period [${yrName}]${newVal.is_active ? " (Active)" : ""}`;
      } else if (log.entity_type === "system_settings") {
        eventCategory = "System Settings";
        activityNarrative = `${actorName} modified system policy ceilings and institutional configuration`;
      } else {
        activityNarrative = `${actorName} performed ${log.action} on ${log.entity_type.replace(/_/g, " ")}`;
      }

      return {
        ...log,
        actorName,
        actorEmail,
        actorDesignation,
        claimNumber,
        activityNarrative,
        eventCategory,
      };
    });

    return { success: true, logs: enhancedLogs };
  } catch (err: any) {
    return { success: false, error: err?.message || "Internal server error" };
  }
}

export async function getRoles() {
  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("roles")
      .select("*")
      .order("name", { ascending: true });

    if (error) return { success: false, error: error.message };
    return { success: true, roles: data };
  } catch (err) {
    return { success: false, error: "Internal server error" };
  }
}

export async function getPermissions() {
  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("permissions")
      .select("*")
      .order("name", { ascending: true });

    if (error) return { success: false, error: error.message };
    return { success: true, permissions: data };
  } catch (err) {
    return { success: false, error: "Internal server error" };
  }
}

export async function getRolePermissions(roleId: string) {
  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("role_permissions")
      .select("permission_id")
      .eq("role_id", roleId);

    if (error) return { success: false, error: error.message };
    return { success: true, permissionIds: (data || []).map((rp) => rp.permission_id) };
  } catch (err) {
    return { success: false, error: "Internal server error" };
  }
}

export async function toggleRolePermission(roleId: string, permissionId: string, enable: boolean) {
  if (!(await verifyAdminSession())) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const adminSupabase = createAdminClient();

    if (enable) {
      const { error } = await adminSupabase
        .from("role_permissions")
        .upsert({ role_id: roleId, permission_id: permissionId }, { onConflict: "role_id,permission_id" });

      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await adminSupabase
        .from("role_permissions")
        .delete()
        .eq("role_id", roleId)
        .eq("permission_id", permissionId);

      if (error) return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: "Internal server error" };
  }
}

// ============ Documents Management Actions ============

export async function getAdminDocumentTypes() {
  if (!(await verifyAdminSession())) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("document_types")
      .select("*")
      .order("name", { ascending: true });

    if (error) return { success: false, error: error.message };
    return { success: true, documentTypes: data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Internal server error" };
  }
}

export async function createDocumentType(payload: {
  name: string;
  code: string;
  description?: string;
  allowed_extensions?: string;
  max_size_mb?: number;
  is_required?: boolean;
}) {
  if (!(await verifyAdminSession())) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("document_types")
      .insert({
        name: payload.name,
        code: payload.code.toUpperCase().replace(/\s+/g, "_"),
        description: payload.description || "",
        allowed_mime_types: payload.allowed_extensions
          ? payload.allowed_extensions.split(",").map((s) => s.trim())
          : ["application/pdf", "image/png", "image/jpeg"],
        max_file_size_bytes: (payload.max_size_mb || 10) * 1024 * 1024,
        is_required: payload.is_required ?? false,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, documentType: data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Internal server error" };
  }
}

export async function updateDocumentType(
  id: string,
  payload: {
    name?: string;
    description?: string;
    is_required?: boolean;
    max_size_mb?: number;
  }
) {
  if (!(await verifyAdminSession())) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const adminSupabase = createAdminClient();
    const updates: Record<string, any> = {};
    if (payload.name !== undefined) updates.name = payload.name;
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.is_required !== undefined) updates.is_required = payload.is_required;
    if (payload.max_size_mb !== undefined) updates.max_file_size_bytes = payload.max_size_mb * 1024 * 1024;

    const { error } = await adminSupabase
      .from("document_types")
      .update(updates)
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Internal server error" };
  }
}

export async function deleteDocumentType(id: string) {
  if (!(await verifyAdminSession())) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("document_types")
      .delete()
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Internal server error" };
  }
}

export async function getAdminDocumentsOverview() {
  if (!(await verifyAdminSession())) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const adminSupabase = createAdminClient();
    const [
      { count: totalDocuments },
      { data: recentDocs, error: rdErr },
      { data: docTypes, error: dtErr }
    ] = await Promise.all([
      adminSupabase.from("claim_documents").select("*", { count: "exact", head: true }),
      adminSupabase
        .from("claim_documents")
        .select(`
          id,
          file_name,
          file_size_bytes,
          file_path,
          mime_type,
          created_at,
          claim:claims(claim_number, faculty:faculty(name, email))
        `)
        .order("created_at", { ascending: false })
        .limit(20),
      adminSupabase.from("document_types").select("*"),
    ]);

    return {
      success: true,
      totalDocuments: totalDocuments || 0,
      recentDocuments: recentDocs || [],
      documentTypes: docTypes || [],
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "Internal server error" };
  }
}

// ============ System Reports & Analytics Actions ============

export async function getAdminReportsData() {
  if (!(await verifyAdminSession())) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const adminSupabase = createAdminClient();

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
          claim_type:claim_types(name, code),
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
          )
        `),
      adminSupabase.from("departments").select("id, name, code, school:schools(id, name, code)"),
      adminSupabase.from("claim_types").select("id, name, code"),
    ]);

    if (cErr) return { success: false, error: cErr.message };

    const allClaims = claims || [];

    // 1. Overview Totals
    let totalClaimed = 0;
    let totalApproved = 0;
    let totalVerified = 0;
    let totalPending = 0;
    let totalReturned = 0;

    allClaims.forEach((c: any) => {
      const claimed = parseFloat(c.claimed_amount) || 0;
      const approved = parseFloat(c.approved_amount) || 0;
      totalClaimed += claimed;
      if (c.status === "APPROVED") totalApproved += (approved || claimed);
      if (c.status === "VERIFIED") totalVerified++;
      if (["SUBMITTED", "UNDER_VERIFICATION", "RESUBMITTED"].includes(c.status)) totalPending++;
      if (c.status === "RETURNED") totalReturned++;
    });

    // 2. Department-wise Breakdown
    const deptMap = new Map<string, { name: string; code: string; schoolName: string; totalClaims: number; claimedAmount: number; approvedAmount: number }>();
    (departments || []).forEach((d: any) => {
      deptMap.set(d.id, {
        name: d.name,
        code: d.code,
        schoolName: d.school?.name || "General",
        totalClaims: 0,
        claimedAmount: 0,
        approvedAmount: 0,
      });
    });

    allClaims.forEach((c: any) => {
      const deptId = c.faculty?.department?.id;
      if (deptId && deptMap.has(deptId)) {
        const item = deptMap.get(deptId)!;
        item.totalClaims++;
        item.claimedAmount += parseFloat(c.claimed_amount) || 0;
        if (c.status === "APPROVED") {
          item.approvedAmount += parseFloat(c.approved_amount) || parseFloat(c.claimed_amount) || 0;
        }
      }
    });

    const departmentStats = Array.from(deptMap.values()).filter((d) => d.totalClaims > 0 || true);

    // 3. Claim Type Breakdown
    const typeMap = new Map<string, { name: string; code: string; count: number; totalAmount: number }>();
    (claimTypes || []).forEach((ct: any) => {
      typeMap.set(ct.code, { name: ct.name, code: ct.code, count: 0, totalAmount: 0 });
    });

    allClaims.forEach((c: any) => {
      const code = c.claim_type?.code || "OTHER";
      if (!typeMap.has(code)) {
        typeMap.set(code, { name: c.claim_type?.name || code, code, count: 0, totalAmount: 0 });
      }
      const item = typeMap.get(code)!;
      item.count++;
      item.totalAmount += parseFloat(c.claimed_amount) || 0;
    });

    const claimTypeStats = Array.from(typeMap.values());

    // 4. Status Breakdown
    const statusCounts: Record<string, number> = {
      SUBMITTED: 0,
      UNDER_VERIFICATION: 0,
      VERIFIED: 0,
      APPROVED: 0,
      RETURNED: 0,
      DRAFT: 0,
      REJECTED: 0,
    };
    allClaims.forEach((c: any) => {
      if (statusCounts[c.status] !== undefined) {
        statusCounts[c.status]++;
      }
    });

    return {
      success: true,
      summary: {
        totalClaims: allClaims.length,
        totalClaimed,
        totalApproved,
        totalPending,
        totalVerified,
        totalReturned,
        approvalRate: allClaims.length > 0 ? Math.round((statusCounts.APPROVED / allClaims.length) * 100) : 0,
      },
      departmentStats,
      claimTypeStats,
      statusCounts,
      claimsList: allClaims,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "Internal server error" };
  }
}

// ============ System Settings Actions ============

export async function getSystemSettings() {
  if (!(await verifyAdminSession())) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("system_settings")
      .select("*");

    if (error) return { success: false, error: error.message };

    const settingsMap: Record<string, any> = {
      university_name: "P P Savani University",
      portal_title: "Faculty Research Incentive Cell (FRIC)",
      support_email: "research@ppsu.ac.in",
      max_incentive_cap_per_year: "150000",
      auto_reminder_days: "3",
      require_doi_verification: "true",
      allow_submissions: "true",
      maintenance_mode: "false",
    };

    (data || []).forEach((row: any) => {
      if (row.key) {
        settingsMap[row.key] = typeof row.value === "object" ? JSON.stringify(row.value) : String(row.value);
      }
    });

    return { success: true, settings: settingsMap };
  } catch (err: any) {
    return { success: false, error: err?.message || "Internal server error" };
  }
}

export async function updateSystemSettings(settings: Record<string, any>) {
  if (!(await verifyAdminSession())) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const adminSupabase = createAdminClient();
    const actorId = await getCurrentActorId();

    for (const [key, value] of Object.entries(settings)) {
      await adminSupabase
        .from("system_settings")
        .upsert(
          { key, value: typeof value === "string" ? value : JSON.stringify(value), updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );
    }

    if (actorId) {
      try {
        await adminSupabase.from("audit_logs").insert({
          user_id: actorId,
          entity_type: "system_settings",
          action: "UPDATE",
          new_value: settings,
        });
      } catch {}
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Internal server error" };
  }
}

// ============ Academic Years Actions ============

export async function getAdminAcademicYears() {
  if (!(await verifyAdminSession())) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("academic_years")
      .select("*")
      .order("name", { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, academicYears: data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Internal server error" };
  }
}

export async function setActiveAcademicYear(id: string) {
  if (!(await verifyAdminSession())) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const adminSupabase = createAdminClient();
    const actorId = await getCurrentActorId();

    // 1. Deactivate all
    await adminSupabase
      .from("academic_years")
      .update({ is_active: false })
      .neq("id", id);

    // 2. Activate selected
    const { data: activated, error } = await adminSupabase
      .from("academic_years")
      .update({ is_active: true })
      .eq("id", id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    if (activated) {
      await adminSupabase.from("audit_logs").insert({
        user_id: actorId,
        entity_type: "academic_years",
        entity_id: id,
        action: "UPDATE",
        new_value: { name: activated.name, is_active: true },
      });
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Internal server error" };
  }
}

export async function createAcademicYear(payload: {
  name: string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
}) {
  if (!(await verifyAdminSession())) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const adminSupabase = createAdminClient();
    const actorId = await getCurrentActorId();

    if (payload.is_active) {
      await adminSupabase
        .from("academic_years")
        .update({ is_active: false })
        .eq("is_active", true);
    }

    const { data, error } = await adminSupabase
      .from("academic_years")
      .insert({
        name: payload.name,
        start_date: payload.start_date,
        end_date: payload.end_date,
        is_active: payload.is_active || false,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    await adminSupabase.from("audit_logs").insert({
      user_id: actorId,
      entity_type: "academic_years",
      entity_id: data.id,
      action: "CREATE",
      new_value: { name: data.name, is_active: data.is_active },
    });

    return { success: true, academicYear: data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Internal server error" };
  }
}

export async function updateAcademicYear(
  id: string,
  payload: {
    name?: string;
    start_date?: string;
    end_date?: string;
    is_active?: boolean;
  }
) {
  if (!(await verifyAdminSession())) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const adminSupabase = createAdminClient();
    const actorId = await getCurrentActorId();

    if (payload.is_active) {
      await adminSupabase
        .from("academic_years")
        .update({ is_active: false })
        .neq("id", id);
    }

    const { error } = await adminSupabase
      .from("academic_years")
      .update(payload)
      .eq("id", id);

    if (error) return { success: false, error: error.message };

    await adminSupabase.from("audit_logs").insert({
      user_id: actorId,
      entity_type: "academic_years",
      entity_id: id,
      action: "UPDATE",
      new_value: payload,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Internal server error" };
  }
}

export async function deleteAcademicYear(id: string) {
  if (!(await verifyAdminSession())) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("academic_years")
      .delete()
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Internal server error" };
  }
}

// ============ Complete System Wipeout Action ============

export async function wipeoutAllClaimsAndDocuments() {
  if (!(await verifyAdminSession())) {
    return { success: false, error: "Unauthorized access. Super Admin credentials required." };
  }

  try {
    const adminSupabase = createAdminClient();
    const actorId = await getCurrentActorId();

    // 1. Get counts before purge
    const [
      { count: claimsCount },
      { count: docsCount }
    ] = await Promise.all([
      adminSupabase.from("claims").select("*", { count: "exact", head: true }),
      adminSupabase.from("claim_documents").select("*", { count: "exact", head: true }),
    ]);

    // 2. Clean all storage files in "claim-documents" bucket
    try {
      const { data: rootItems } = await adminSupabase.storage
        .from("claim-documents")
        .list("", { limit: 1000 });

      if (rootItems && rootItems.length > 0) {
        for (const item of rootItems) {
          const { data: subFiles } = await adminSupabase.storage
            .from("claim-documents")
            .list(item.name, { limit: 1000 });

          if (subFiles && subFiles.length > 0) {
            const filePaths = subFiles.map((sf) => `${item.name}/${sf.name}`);
            await adminSupabase.storage.from("claim-documents").remove(filePaths);
          }
          await adminSupabase.storage.from("claim-documents").remove([item.name]);
        }
      }
    } catch (storageErr) {
      console.warn("Storage wipeout cleanup warning:", storageErr);
    }

    // 3. Purge all child records across all 14 claim-dependent tables
    await Promise.all([
      adminSupabase.from("claim_documents").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      adminSupabase.from("claim_approvals").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      adminSupabase.from("document_verifications").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      adminSupabase.from("claim_comments").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      adminSupabase.from("claim_history").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      adminSupabase.from("publication_authors").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      adminSupabase.from("publications").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      adminSupabase.from("project_members").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      adminSupabase.from("research_projects").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      adminSupabase.from("patents").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      adminSupabase.from("book_chapters").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      adminSupabase.from("books").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      adminSupabase.from("citations").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      adminSupabase.from("notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
    ]);

    // 4. Delete all claims
    const { error: claimsDelErr } = await adminSupabase
      .from("claims")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (claimsDelErr) {
      return { success: false, error: claimsDelErr.message };
    }

    // 5. Record an audit log entry
    await adminSupabase.from("audit_logs").insert({
      user_id: actorId,
      entity_type: "claims",
      action: "DELETE",
      old_value: {
        purgedClaimsCount: claimsCount || 0,
        purgedDocumentsCount: docsCount || 0,
        scope: "COMPLETE_SYSTEM_WIPEOUT",
      },
      new_value: {
        status: "PURGED",
        message: "Complete database wipeout executed by System Administrator",
      },
    });

    return {
      success: true,
      deletedClaimsCount: claimsCount || 0,
      deletedDocsCount: docsCount || 0,
    };
  } catch (err: any) {
    console.error("Wipeout error:", err);
    return { success: false, error: err?.message || "Internal server error during database wipeout." };
  }
}

export async function getAdminAllClaims() {
  if (!(await verifyAdminSession())) {
    return { success: false, error: "Unauthorized access. Admin session required." };
  }

  try {
    const adminSupabase = createAdminClient();
    const { data, error: fetchErr } = await adminSupabase
      .from("claims")
      .select(`
        id,
        claim_number,
        status,
        current_stage,
        claimed_amount,
        calculated_amount,
        approved_amount,
        submitted_at,
        created_at,
        faculty:faculty(name, email, designation, department:departments(name, code)),
        claim_type:claim_types(name, code),
        publications(title, journal_name),
        research_projects(title, funding_agency),
        patents(title, patent_number),
        books(title, publisher),
        book_chapters(chapter_title, book_title),
        citations(source_title)
      `)
      .order("created_at", { ascending: false });

    if (fetchErr) return { success: false, error: fetchErr.message };
    return { success: true, claims: data || [] };
  } catch (err: any) {
    return { success: false, error: err?.message || "Internal server error" };
  }
}

export async function seedDemoClaims() {
  if (!(await verifyAdminSession())) {
    return { success: false, error: "Unauthorized access. Super Admin credentials required." };
  }

  try {
    const adminSupabase = createAdminClient();

    // 1. Fetch available faculty & active academic year
    const [{ data: facultyList }, { data: acadYear }, { data: claimTypes }] = await Promise.all([
      adminSupabase.from("faculty").select("id, name, email").order("created_at", { ascending: true }),
      adminSupabase.from("academic_years").select("id").eq("is_active", true).maybeSingle(),
      adminSupabase.from("claim_types").select("id, code, name"),
    ]);

    if (!facultyList || facultyList.length === 0) {
      return { success: false, error: "No faculty accounts found to attach claims." };
    }

    const typeMap: Record<string, string> = {};
    (claimTypes || []).forEach((ct) => {
      typeMap[ct.code] = ct.id;
    });

    const defaultTypeId = claimTypes?.[0]?.id;
    const journalTypeId = typeMap["JOURNAL_PUBLICATION"] || typeMap["RESEARCH_PAPER"] || defaultTypeId;
    const patentTypeId = typeMap["PATENT"] || defaultTypeId;
    const bookTypeId = typeMap["BOOK_PUBLICATION"] || typeMap["BOOK"] || defaultTypeId;
    const projectTypeId = typeMap["RESEARCH_PROJECT"] || defaultTypeId;

    const sampleDefinitions = [
      {
        claim_number: `FRIC-JP-${new Date().getFullYear()}-0101`,
        faculty_id: facultyList[0].id,
        claim_type_id: journalTypeId,
        academic_year_id: acadYear?.id || null,
        status: "UNDER_VERIFICATION",
        current_stage: "HOD_PRINCIPAL",
        claimed_amount: 45000,
        calculated_amount: 45000,
        approved_amount: null,
        submitted_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        title: "Deep Learning for Biomedical Image Segmentation in Healthcare 4.0",
        type: "journal",
      },
      {
        claim_number: `FRIC-JP-${new Date().getFullYear()}-0102`,
        faculty_id: facultyList[1 % facultyList.length].id,
        claim_type_id: journalTypeId,
        academic_year_id: acadYear?.id || null,
        status: "UNDER_VERIFICATION",
        current_stage: "COMMITTEE_M1",
        claimed_amount: 60000,
        calculated_amount: 60000,
        approved_amount: null,
        submitted_at: new Date(Date.now() - 4 * 86400000).toISOString(),
        title: "Sustainable Nanocomposite Materials for High-Performance Energy Storage",
        type: "journal",
      },
      {
        claim_number: `FRIC-PAT-${new Date().getFullYear()}-0103`,
        faculty_id: facultyList[2 % facultyList.length].id,
        claim_type_id: patentTypeId,
        academic_year_id: acadYear?.id || null,
        status: "UNDER_VERIFICATION",
        current_stage: "COMMITTEE_M2",
        claimed_amount: 25000,
        calculated_amount: 25000,
        approved_amount: null,
        submitted_at: new Date(Date.now() - 6 * 86400000).toISOString(),
        title: "Edge-AI Powered IoT Architecture for Precision Smart Agriculture",
        type: "patent",
      },
      {
        claim_number: `FRIC-BK-${new Date().getFullYear()}-0104`,
        faculty_id: facultyList[3 % facultyList.length].id,
        claim_type_id: bookTypeId,
        academic_year_id: acadYear?.id || null,
        status: "UNDER_VERIFICATION",
        current_stage: "GOVERNOR",
        claimed_amount: 30000,
        calculated_amount: 30000,
        approved_amount: null,
        submitted_at: new Date(Date.now() - 8 * 86400000).toISOString(),
        title: "Next-Generation Blockchain Frameworks in Supply Chain Logistics",
        type: "book",
      },
      {
        claim_number: `FRIC-RP-${new Date().getFullYear()}-0105`,
        faculty_id: facultyList[4 % facultyList.length].id,
        claim_type_id: projectTypeId,
        academic_year_id: acadYear?.id || null,
        status: "VERIFIED",
        current_stage: "PROVOST",
        claimed_amount: 50000,
        calculated_amount: 50000,
        approved_amount: 50000,
        submitted_at: new Date(Date.now() - 10 * 86400000).toISOString(),
        title: "Quantum Machine Learning Algorithms for Large-Scale Molecular Dynamics",
        type: "project",
      },
      {
        claim_number: `FRIC-JP-${new Date().getFullYear()}-0106`,
        faculty_id: facultyList[0].id,
        claim_type_id: journalTypeId,
        academic_year_id: acadYear?.id || null,
        status: "APPROVED",
        current_stage: "APPROVED",
        claimed_amount: 35000,
        calculated_amount: 35000,
        approved_amount: 35000,
        submitted_at: new Date(Date.now() - 15 * 86400000).toISOString(),
        title: "Advanced Machine Vision for Autonomous Vehicular Navigation Systems",
        type: "journal",
      },
    ];

    let createdCount = 0;

    for (const item of sampleDefinitions) {
      // Upsert or insert claim
      const { data: insertedClaim, error: claimErr } = await adminSupabase
        .from("claims")
        .insert({
          claim_number: item.claim_number,
          faculty_id: item.faculty_id,
          claim_type_id: item.claim_type_id,
          academic_year_id: item.academic_year_id,
          status: item.status,
          current_stage: item.current_stage,
          claimed_amount: item.claimed_amount,
          calculated_amount: item.calculated_amount,
          approved_amount: item.approved_amount,
          submitted_at: item.submitted_at,
        })
        .select()
        .single();

      if (!claimErr && insertedClaim) {
        createdCount++;

        // Add child research record
        if (item.type === "journal") {
          await adminSupabase.from("publications").insert({
            claim_id: insertedClaim.id,
            title: item.title,
            journal_name: "IEEE Transactions on Pattern Analysis and Machine Intelligence",
            publication_year: new Date().getFullYear(),
            indexing_type: "SCI_SCOPUS",
            quartile: "Q1",
            impact_factor: 8.5,
          });
        } else if (item.type === "patent") {
          await adminSupabase.from("patents").insert({
            claim_id: insertedClaim.id,
            title: item.title,
            patent_number: "IN20261109842A",
            filing_date: new Date().toISOString().split("T")[0],
            status: "FILED",
            patent_type: "INDIAN_INVENTION",
          });
        } else if (item.type === "book") {
          await adminSupabase.from("books").insert({
            claim_id: insertedClaim.id,
            title: item.title,
            publisher: "Springer Nature International",
            isbn: "978-3-030-91234-5",
            publication_year: new Date().getFullYear(),
          });
        } else if (item.type === "project") {
          await adminSupabase.from("research_projects").insert({
            claim_id: insertedClaim.id,
            title: item.title,
            funding_agency: "Science and Engineering Research Board (SERB)",
            sanctioned_amount: 2500000,
            project_duration: "3 Years",
          });
        }
      }
    }

    return { success: true, count: createdCount };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to seed demo claims." };
  }
}
