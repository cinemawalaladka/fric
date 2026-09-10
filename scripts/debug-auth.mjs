import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        process.env[key] = val;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const VERIFIER_STAGE_OPTIONS = [
  { code: "HOD_PRINCIPAL" },
  { code: "COMMITTEE_M1" },
  { code: "COMMITTEE_M2" },
  { code: "GOVERNOR" },
  { code: "PROVOST" },
  { code: "ALL" },
];

function getVerifierStageInfo(designation, roles = []) {
  const cleanDesig = (designation || "").toUpperCase();
  const normalizedRoles = roles.map((r) => r.toUpperCase());

  if (normalizedRoles.includes("SUPER_ADMIN") || cleanDesig.includes("ALL") || cleanDesig.includes("GLOBAL")) {
    return VERIFIER_STAGE_OPTIONS[5]; // ALL
  }
  if (normalizedRoles.includes("PROVOST") || cleanDesig.includes("PROVOST")) {
    return VERIFIER_STAGE_OPTIONS[4]; // PROVOST
  }
  if (normalizedRoles.includes("GOVERNOR") || cleanDesig.includes("GOVERNOR")) {
    return VERIFIER_STAGE_OPTIONS[3]; // GOVERNOR
  }
  if (cleanDesig.includes("COMMITTEE_M2") || cleanDesig.includes("M2")) {
    return VERIFIER_STAGE_OPTIONS[2]; // COMMITTEE_M2
  }
  if (
    normalizedRoles.includes("RESEARCH_COMMITTEE_MEMBER") ||
    cleanDesig.includes("COMMITTEE_M1") ||
    cleanDesig.includes("M1")
  ) {
    return VERIFIER_STAGE_OPTIONS[1]; // COMMITTEE_M1
  }
  if (normalizedRoles.includes("HOD") || cleanDesig.includes("HOD") || cleanDesig.includes("HEAD")) {
    return VERIFIER_STAGE_OPTIONS[0]; // HOD_PRINCIPAL
  }

  return VERIFIER_STAGE_OPTIONS[0];
}

async function run() {
  const { data: claim } = await supabase
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
    .eq("id", "5d0dad1f-13c5-4fa5-89e9-093e202aa3dd")
    .single();

  const userId = "535457c0-2b46-4195-9e29-25ef6c6e6df2"; // HOD Auth User ID

  console.log("Claim faculty:", claim.faculty);

  // 1. Check self claim
  console.log("Self claim check:", claim.faculty?.auth_user_id === userId);

  // 2. Fetch profile & roles
  const [{ data: facultyProfile }, { data: userRoles }] = await Promise.all([
    supabase
      .from("faculty")
      .select("id, designation, department_id")
      .eq("auth_user_id", userId)
      .maybeSingle(),
    supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", userId)
      .eq("status", "ACTIVE"),
  ]);

  console.log("Faculty profile:", facultyProfile);
  console.log("Raw user roles:", JSON.stringify(userRoles, null, 2));

  const roles = (userRoles || [])
    .map((row) => row.roles?.name)
    .filter(Boolean);

  console.log("Roles mapped:", roles);

  const verifierStageInfo = getVerifierStageInfo(facultyProfile?.designation, roles);
  console.log("Verifier Stage Info:", verifierStageInfo);

  const myStageCode = verifierStageInfo.code;
  const currentClaimStage = claim.current_stage || "HOD_PRINCIPAL";

  console.log("myStageCode:", myStageCode, "| currentClaimStage:", currentClaimStage);
  console.log("Stage match:", myStageCode === currentClaimStage);

  const claimantDeptId = claim.faculty?.department_id;
  console.log("claimantDeptId:", claimantDeptId, "| facultyProfile.department_id:", facultyProfile?.department_id);
  console.log("Dept match:", claimantDeptId === facultyProfile?.department_id);
}

run();
