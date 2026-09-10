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

async function inspectDb() {
  console.log("=== USERS IN AUTH ===");
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) console.error("Auth users error:", authErr);
  else {
    users.forEach((u) => {
      console.log(`Auth User: ${u.email} | ID: ${u.id}`);
    });
  }

  console.log("\n=== FACULTY TABLE ===");
  const { data: faculties } = await supabase.from("faculty").select("id, auth_user_id, name, email, designation, department_id, status");
  console.log(JSON.stringify(faculties, null, 2));

  console.log("\n=== ROLES TABLE ===");
  const { data: roles } = await supabase.from("roles").select("*");
  console.log(JSON.stringify(roles, null, 2));

  console.log("\n=== USER_ROLES TABLE ===");
  const { data: userRoles } = await supabase.from("user_roles").select("user_id, role_id, status, roles(name)");
  console.log(JSON.stringify(userRoles, null, 2));

  console.log("\n=== CURRENT CLAIMS ===");
  const { data: claims } = await supabase.from("claims").select("id, claim_number, status, current_stage, faculty_id, claimed_amount, created_at");
  console.log(JSON.stringify(claims, null, 2));
}

inspectDb();
