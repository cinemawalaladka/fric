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

async function fixDesignationsAndRoles() {
  console.log("🛠️ Normalizing designations and roles in database...");

  // Update designations
  const updates = [
    { email: "faculty@demo.ppsu.ac.in", designation: "Assistant Professor" },
    { email: "hod.cse@demo.ppsu.ac.in", designation: "Head of Department [HOD_PRINCIPAL]" },
    { email: "m1@demo.ppsu.ac.in", designation: "Research Committee Member 1 [COMMITTEE_M1]" },
    { email: "m2@demo.ppsu.ac.in", designation: "Research Committee Member 2 [COMMITTEE_M2]" },
    { email: "governor@demo.ppsu.ac.in", designation: "Research Governor [GOVERNOR]" },
    { email: "provost@demo.ppsu.ac.in", designation: "Provost [PROVOST]" },
    { email: "admin@demo.ppsu.ac.in", designation: "System Super Admin [ALL]" },
  ];

  for (const u of updates) {
    const { error } = await supabase
      .from("faculty")
      .update({ designation: u.designation })
      .eq("email", u.email);

    if (error) console.error(`Error updating designation for ${u.email}:`, error.message);
    else console.log(`✅ Updated designation for ${u.email} -> "${u.designation}"`);
  }

  console.log("✨ All faculty designations normalized!");
}

fixDesignationsAndRoles();
