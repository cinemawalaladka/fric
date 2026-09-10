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

async function testAuth() {
  const { data: claims } = await supabase
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
    `);

  console.log("CLAIMS IN DB:", JSON.stringify(claims, null, 2));

  const { data: hodFaculty } = await supabase
    .from("faculty")
    .select("id, auth_user_id, designation, department_id, email")
    .eq("email", "hod.cse@demo.ppsu.ac.in")
    .single();

  console.log("HOD FACULTY:", hodFaculty);

  const { data: hodRoles } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", hodFaculty.auth_user_id)
    .eq("status", "ACTIVE");

  console.log("HOD ROLES:", hodRoles);
}

testAuth();
