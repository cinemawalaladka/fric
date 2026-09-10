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

const DEMO_USERS = [
  { email: "faculty@demo.ppsu.ac.in", password: "Faculty@Demo2026!" },
  { email: "hod.cse@demo.ppsu.ac.in", password: "Verifier@Demo2026!" },
  { email: "m1@demo.ppsu.ac.in", password: "Verifier@Demo2026!" },
  { email: "m2@demo.ppsu.ac.in", password: "Verifier@Demo2026!" },
  { email: "governor@demo.ppsu.ac.in", password: "Verifier@Demo2026!" },
  { email: "provost@demo.ppsu.ac.in", password: "Verifier@Demo2026!" },
  { email: "admin@demo.ppsu.ac.in", password: "PPSUAdmin@Demo2026!" },
];

async function updatePasswordsAndVerify() {
  console.log("🔐 Synchronizing all demo user passwords in Supabase Auth...");

  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("List users error:", error);
    process.exit(1);
  }

  for (const demo of DEMO_USERS) {
    const user = users.find((u) => u.email === demo.email);
    if (user) {
      const { error: updErr } = await supabase.auth.admin.updateUserById(user.id, {
        password: demo.password,
        email_confirm: true,
      });
      if (updErr) {
        console.error(`❌ Failed to update password for ${demo.email}:`, updErr.message);
      } else {
        console.log(`✅ Password set for ${demo.email}`);
      }
    } else {
      console.log(`Creating user ${demo.email}...`);
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: demo.email,
        password: demo.password,
        email_confirm: true,
      });
      if (createErr) console.error(`Failed to create ${demo.email}:`, createErr.message);
      else console.log(`Created ${demo.email} with ID ${newUser.user.id}`);
    }
  }

  console.log("🎉 All demo accounts synced successfully!");
}

updatePasswordsAndVerify();
