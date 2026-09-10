"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getVerifierStageInfo } from "@/lib/constants";
import { resolveClaimTitle } from "@/lib/utils";
import { cookies } from "next/headers";

type ClaimRow = {
  id: string;
  claim_number: string;
  status: string;
  current_stage: string | null;
  claimed_amount: number | null;

  calculated_amount: number | null;
  approved_amount: number | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  claim_type?: Relation<{ name: string; code: string }>;
  faculty?: {
    name: string;
    email: string;
    department?: Relation<{ name: string; code: string }>;
  } | null | Array<{
    name: string;
    email: string;
    department?: Relation<{ name: string; code: string }>;
  }>;
  publications?: { title: string }[];
  books?: { title: string; chapter_title: string | null }[];
  patents?: { title: string }[];
  citations?: { source_title: string }[];
  research_projects?: { title: string }[];
};

type Relation<T> = T | T[] | null | undefined;
type DocumentResult = {
  id: string;
  document_type: string;
  file_name: string;
  storage_path?: string;
  mime_type?: string;
  file_size: number | null;
  verification_status: string;
  created_at: string;
  claim?: Relation<{ claim_number: string }>;
};
type AuditResult = {
  action: string;
  entity_type: string;
  created_at: string;
};

function one<T>(value: Relation<T>): T | null {
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

async function verifyAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (session?.value) return true;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const adminSupabase = createAdminClient();
    const { data: userRoles } = await adminSupabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id)
      .eq("status", "ACTIVE");

    const roles = userRoles?.map((ur: Record<string, unknown>) => {
      const role = (Array.isArray(ur.roles) ? ur.roles[0] : ur.roles) as { name: string } | null;
      return role?.name;
    }).filter(Boolean) || [];

    return roles.includes("SUPER_ADMIN");
  } catch {
    return false;
  }
}

export async function getCurrentUserRoles() {
  const cookieStore = await cookies();
  const hasAdminCookie = !!cookieStore.get("admin_session")?.value;

  // 1. If admin session cookie exists, grant Super Admin access immediately
  if (hasAdminCookie) {
    return { success: true, roles: ["SUPER_ADMIN"], isAdminCookie: true };
  }

  // 2. Query live Supabase auth user for DB-assigned roles
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: userRoles, error } = await adminSupabase
        .from("user_roles")
        .select("roles(name)")
        .eq("user_id", user.id)
        .eq("status", "ACTIVE");

      if (!error && userRoles && userRoles.length > 0) {
        const roles = userRoles
          .map((ur: Record<string, unknown>) => {
            const role = (Array.isArray(ur.roles) ? ur.roles[0] : ur.roles) as { name: string } | null;
            return role?.name;
          })
          .filter(Boolean) as string[];

        if (roles.includes("SUPER_ADMIN")) {
          return { success: true, roles: ["SUPER_ADMIN"], isAdminCookie: false };
        }

        if (!roles.includes("FACULTY")) {
          roles.unshift("FACULTY");
        }
        return { success: true, roles, isAdminCookie: false };
      }

      return { success: true, roles: ["FACULTY"], isAdminCookie: false };
    }
  } catch (e) {
    console.error("getCurrentUserRoles error:", e);
  }

  return { success: false, roles: [], isAdminCookie: false };
}

function claimTitle(claim: any): string {
  return resolveClaimTitle(claim);
}

function formatDate(value: string | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function monthKey(value: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(value));
}

const CLAIM_SELECT = `
  id,
  claim_number,
  status,
  current_stage,
  claimed_amount,
  calculated_amount,
  approved_amount,
  submitted_at,
  created_at,
  updated_at,
  faculty_id,
  claim_type:claim_types(name, code),
  faculty:faculty(id, name, email, department_id, department:departments(name, code)),
  publications(title),
  books(title, chapter_title),
  patents(title),
  citations(source_title),
  research_projects(title)
`;

export async function getFacultyDashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized access." };

  const { data: faculty, error: facultyError } = await supabase
    .from("faculty")
    .select("id, name, designation")
    .eq("auth_user_id", user.id)
    .single();

  if (facultyError || !faculty) return { success: false, error: "Faculty profile not found." };

  const { data, error } = await supabase
    .from("claims")
    .select(CLAIM_SELECT)
    .eq("faculty_id", faculty.id)
    .order("updated_at", { ascending: false });

  if (error) return { success: false, error: error.message };

  const claims = ((data || []) as unknown as any[]).map((claim) => ({
    id: claim.id,
    number: claim.claim_number,
    type: one(claim.claim_type)?.name || "Claim",
    title: claimTitle(claim),
    status: claim.status,
    currentStage: claim.current_stage || "HOD_PRINCIPAL",
    claimedAmount: claim.claimed_amount || 0,
    calculatedAmount: claim.calculated_amount || 0,
    approvedAmount: claim.approved_amount || 0,
    date: formatDate(claim.submitted_at || claim.created_at),
  }));

  return { success: true, facultyName: faculty.name || "Dr. Faculty User", claims };
}


export async function getFacultyDocumentsData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized access." };

  const { data, error } = await supabase
    .from("claim_documents")
    .select(`
      id,
      document_type,
      file_name,
      storage_path,
      mime_type,
      file_size,
      verification_status,
      created_at,
      claim:claims!inner(claim_number, faculty:faculty!inner(auth_user_id))
    `)
    .eq("claim.faculty.auth_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    documents: ((data || []) as unknown as DocumentResult[]).map((doc) => ({
      id: doc.id,
      name: doc.file_name,
      type: doc.document_type,
      claim: one(doc.claim)?.claim_number || "",
      size: doc.file_size ? `${(doc.file_size / (1024 * 1024)).toFixed(2)} MB` : "0 MB",
      file_size: doc.file_size || 0,
      storage_path: doc.storage_path,
      mime_type: doc.mime_type,
      status: doc.verification_status,
      uploadedAt: formatDate(doc.created_at),
    })),
  };
}

export async function getFacultyProfileData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized access." };

  const { data, error } = await supabase
    .from("faculty")
    .select("id, employee_id, name, email, designation, status, created_at, department:departments(name, school:schools(name))")
    .eq("auth_user_id", user.id)
    .single();

  if (error) return { success: false, error: error.message };

  // Fetch lifetime research claim statistics
  const { data: claimsData } = await supabase
    .from("claims")
    .select("status, approved_amount, claimed_amount, calculated_amount")
    .eq("faculty_id", data.id);

  const claims = claimsData || [];
  const totalClaims = claims.length;
  const approvedClaims = claims.filter((c) => c.status === "APPROVED").length;
  const totalApprovedAmount = claims
    .filter((c) => c.status === "APPROVED")
    .reduce((sum, c) => sum + (c.approved_amount || 0), 0);

  return {
    success: true,
    profile: data,
    stats: {
      totalClaims,
      approvedClaims,
      totalApprovedAmount,
    },
  };
}

export async function getFacultyList() {
  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("faculty")
      .select("id, name, email, employee_id, designation, department:departments(name)")
      .eq("status", "ACTIVE")
      .order("name", { ascending: true });

    if (error) return { success: false, faculty: [] };
    return { success: true, faculty: data || [] };
  } catch {
    return { success: false, faculty: [] };
  }
}

export async function getVerifierDashboardData() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const pendingStatuses = ["SUBMITTED", "UNDER_VERIFICATION", "RESUBMITTED"];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized access." };

  const [{ data: profile }, rolesRes] = await Promise.all([
    supabase
      .from("faculty")
      .select("id, designation, department_id")
      .eq("auth_user_id", user.id)
      .maybeSingle(),
    getCurrentUserRoles(),
  ]);

  const roles = rolesRes.success ? rolesRes.roles || [] : [];
  const verifierStageInfo = getVerifierStageInfo(profile?.designation, roles);
  const myStageCode = verifierStageInfo.code;

  if (myStageCode === "NONE") {
    return { success: false, error: "Unauthorized access. No verifier role assigned." };
  }

  let query = adminSupabase
    .from("claims")
    .select(CLAIM_SELECT)
    .in("status", pendingStatuses);

  // If not Super Admin (ALL), restrict strictly to claims pending at this specific stage
  if (myStageCode !== "ALL") {
    query = query.eq("current_stage", myStageCode);
  }

  const { data, error } = await query.order("submitted_at", { ascending: false });

  if (error) return { success: false, error: error.message };

  let rawClaims = (data || []) as unknown as (ClaimRow & { faculty_id?: string; faculty?: any })[];

  // 1. Exclude self-submitted claims (Verifier cannot verify their own claim)
  if (profile?.id) {
    rawClaims = rawClaims.filter((c) => c.faculty_id !== profile.id);
  }

  // 2. For HOD: Strictly filter to claims from the HOD's own department
  if (myStageCode === "HOD_PRINCIPAL" && profile?.department_id) {
    rawClaims = rawClaims.filter((c) => {
      const claimantDeptId = one(c.faculty)?.department_id;
      return claimantDeptId === profile.department_id;
    });
  }

  const allPendingClaims = rawClaims.map((claim) => ({
    id: claim.id,
    number: claim.claim_number,
    faculty: one(claim.faculty)?.name || "Unknown faculty",
    department: one(one(claim.faculty)?.department)?.code || one(one(claim.faculty)?.department)?.name || "NA",
    type: one(claim.claim_type)?.name || "Claim",
    title: claimTitle(claim),
    status: claim.status,
    currentStage: claim.current_stage || "HOD_PRINCIPAL",
    amount: claim.claimed_amount || 0,
    submitted: formatDate(claim.submitted_at || claim.created_at),
  }));

  // Count verified and returned claims for this specific verifier
  const [verifiedRes, returnedRes] = await Promise.all([
    adminSupabase
      .from("claim_approvals")
      .select("id", { count: "exact", head: true })
      .eq("approver_id", user.id)
      .in("status", ["VERIFIED", "APPROVED"]),
    adminSupabase
      .from("claim_approvals")
      .select("id", { count: "exact", head: true })
      .eq("approver_id", user.id)
      .eq("status", "RETURNED"),
  ]);

  const verifiedCount = verifiedRes.count || 0;
  const returnedCount = returnedRes.count || 0;

  return {
    success: true,
    claims: allPendingClaims,
    stats: {
      pendingAtMyStage: allPendingClaims.length,
      pendingTotal: allPendingClaims.length,
      verified: verifiedCount,
      returned: returnedCount,
      reviewed: verifiedCount + returnedCount,
    },
    verifierStageInfo,
  };
}

export async function getAdminDashboardData() {
  if (!(await verifyAdminSession())) return { success: false, error: "Unauthorized access." };

  const adminSupabase = createAdminClient();
  const [
    usersResult,
    facultyResult,
    claimsResult,
    pendingResult,
    verifiedResult,
    returnedResult,
    claimRowsResult,
    auditResult,
  ] = await Promise.all([
    adminSupabase.from("admin_users_view").select("faculty_id", { count: "exact", head: true }),
    adminSupabase.from("admin_users_view").select("faculty_id", { count: "exact", head: true }).contains("roles", ["FACULTY"]),
    adminSupabase.from("claims").select("id", { count: "exact", head: true }),
    adminSupabase.from("claims").select("id", { count: "exact", head: true }).in("status", ["SUBMITTED", "UNDER_VERIFICATION", "RESUBMITTED"]),
    adminSupabase.from("claims").select("id", { count: "exact", head: true }).eq("status", "VERIFIED"),
    adminSupabase.from("claims").select("id", { count: "exact", head: true }).eq("status", "RETURNED"),
    adminSupabase.from("claims").select(CLAIM_SELECT).order("created_at", { ascending: false }),
    adminSupabase.from("audit_logs").select("action, entity_type, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  if (claimRowsResult.error) return { success: false, error: claimRowsResult.error.message };

  const claimRows = (claimRowsResult.data || []) as unknown as ClaimRow[];
  const totalClaimed = claimRows.reduce((sum, claim) => sum + (claim.claimed_amount || 0), 0);
  const totalApproved = claimRows
    .filter((claim) => claim.status === "APPROVED")
    .reduce((sum, claim) => sum + (claim.approved_amount || 0), 0);

  const monthlyMap = new Map<string, { month: string; claims: number; amount: number }>();
  const typeMap = new Map<string, number>();

  claimRows.forEach((claim) => {
    const key = monthKey(claim.created_at);
    const monthly = monthlyMap.get(key) || { month: key, claims: 0, amount: 0 };
    monthly.claims += 1;
    monthly.amount += claim.claimed_amount || 0;
    monthlyMap.set(key, monthly);

    const type = one(claim.claim_type)?.name || "Claim";
    typeMap.set(type, (typeMap.get(type) || 0) + 1);
  });

  return {
    success: true,
    stats: {
      totalUsers: usersResult.count || 0,
      activeFaculty: facultyResult.count || 0,
      totalClaims: claimsResult.count || 0,
      pending: pendingResult.count || 0,
      verified: verifiedResult.count || 0,
      returned: returnedResult.count || 0,
      totalClaimed,
      totalApproved,
    },
    monthly: Array.from(monthlyMap.values()).slice(-6),
    claimTypes: Array.from(typeMap.entries()).map(([name, value], index) => ({
      name,
      value,
      color: ["#60a5fa", "#f59e0b", "#a78bfa", "#34d399", "#f472b6"][index % 5],
    })),
    activity: ((auditResult.data || []) as AuditResult[]).map((log) => ({
      action: log.action,
      detail: `${log.action} on ${log.entity_type}`,
      time: formatDate(log.created_at),
      type: log.action === "VERIFY" ? "success" : log.action === "RETURN" ? "alert" : "info",
    })),
  };
}

export async function getSystemMaintenanceStatus() {
  try {
    const adminSupabase = createAdminClient();
    const { data } = await adminSupabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["maintenance_mode", "allow_submissions", "portal_title"]);

    const map: Record<string, string> = {
      maintenance_mode: "false",
      allow_submissions: "true",
      portal_title: "Faculty Research Incentive Cell (FRIC)",
    };

    (data || []).forEach((row: any) => {
      if (row.key) {
        map[row.key] = typeof row.value === "object" ? JSON.stringify(row.value) : String(row.value);
      }
    });

    const isMaintenance = map.maintenance_mode === "true" || map.maintenance_mode === "1";
    const allowSubmissions = map.allow_submissions === "true" || map.allow_submissions === "1";

    return {
      success: true,
      maintenanceMode: isMaintenance,
      allowSubmissions: allowSubmissions,
      portalTitle: map.portal_title || "Faculty Research Incentive Cell (FRIC)",
    };
  } catch {
    return { success: false, maintenanceMode: false, allowSubmissions: true };
  }
}

