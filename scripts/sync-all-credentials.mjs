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
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const supabaseClient = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Official credentials list from handbook & seed_demo_users
const CREDENTIALS = [
  // --- Admin ---
  {
    name: "Niraj Shah",
    email: "admin@ppsu.in",
    password: "Admin@PPSU2026!",
    role: "SUPER_ADMIN",
    designation: "Dean SOE / Super Admin",
    dept: "SOE",
  },
  // --- Provost ---
  {
    name: "EAtoVC",
    email: "eatovc@ppsu.in",
    password: "EAtoVC@PPSU2026!",
    role: "PROVOST",
    designation: "Provost / Registrar (Final Sanction & Payout)",
    dept: "SOE",
  },
  // --- Verification Committee ---
  {
    name: "Ramesh Gohil",
    email: "rameshgohil@verifer.1.ppsu.in",
    password: "Rameshgohil@Verifier2026!",
    role: "RESEARCH_COMMITTEE_MEMBER",
    designation: "Committee Member 1 [COMMITTEE_M1]",
    dept: "SOE",
  },
  {
    name: "Aeshish Rana",
    email: "aeshishrana@verifer.2.ppsu.in",
    password: "Aeshishrana@Verifier2026!",
    role: "RESEARCH_COMMITTEE_MEMBER",
    designation: "Committee Member 2 [COMMITTEE_M2]",
    dept: "SOS",
  },
  {
    name: "Rishal Singh",
    email: "rishalsingh@verifer.convenor.ppsu.in",
    password: "Rishalsingh@Verifier2026!",
    role: "GOVERNOR",
    designation: "Research Committee Convenor [GOVERNOR]",
    dept: "SOE",
  },
  // --- School of Engineering (SOE) ---
  {
    name: "Mitul",
    email: "mitul@hod.soe.ppsu.in",
    password: "Mitul@SOE2026!",
    role: "HOD",
    designation: "Head of Department (HOD) - SOE",
    dept: "SOE",
  },
  {
    name: "Raviraj",
    email: "raviraj@soe.ppsu.in",
    password: "Raviraj@SOE2026!",
    role: "FACULTY",
    designation: "Assistant Professor - SOE",
    dept: "SOE",
  },
  {
    name: "Maulika",
    email: "maulika@soe.ppsu.in",
    password: "Maulika@SOE2026!",
    role: "FACULTY",
    designation: "Assistant Professor - SOE",
    dept: "SOE",
  },
  {
    name: "Bhavisha",
    email: "bhavisha@soe.ppsu.in",
    password: "Bhavisha@SOE2026!",
    role: "FACULTY",
    designation: "Assistant Professor - SOE",
    dept: "SOE",
  },
  {
    name: "Deepak",
    email: "deepak@soe.ppsu.in",
    password: "Deepak@SOE2026!",
    role: "FACULTY",
    designation: "Assistant Professor - SOE",
    dept: "SOE",
  },
  {
    name: "Megha",
    email: "megha@soe.ppsu.in",
    password: "Megha@SOE2026!",
    role: "FACULTY",
    designation: "Assistant Professor - SOE",
    dept: "SOE",
  },
  // --- School of Science (SOS) ---
  {
    name: "Neha",
    email: "neha@hod.sos.ppsu.in",
    password: "Neha@SOS2026!",
    role: "HOD",
    designation: "Head of Department (HOD) - SOS",
    dept: "SOS",
  },
  {
    name: "Siddharth",
    email: "siddharth@sos.ppsu.in",
    password: "Siddharth@SOS2026!",
    role: "FACULTY",
    designation: "Assistant Professor - SOS",
    dept: "SOS",
  },
  {
    name: "Rakesh Kumar",
    email: "rakeshkumar@sos.ppsu.in",
    password: "Rakeshkumar@SOS2026!",
    role: "FACULTY",
    designation: "Assistant Professor - SOS",
    dept: "SOS",
  },
  {
    name: "Snkit",
    email: "snkit@sos.ppsu.in",
    password: "Snkit@SOS2026!",
    role: "FACULTY",
    designation: "Assistant Professor - SOS",
    dept: "SOS",
  },
  {
    name: "Sneha",
    email: "sneha@sos.ppsu.in",
    password: "Sneha@SOS2026!",
    role: "FACULTY",
    designation: "Assistant Professor - SOS",
    dept: "SOS",
  },
  {
    name: "Balraj",
    email: "balraj@sos.ppsu.in",
    password: "Balraj@SOS2026!",
    role: "FACULTY",
    designation: "Assistant Professor - SOS",
    dept: "SOS",
  },
];

async function syncAndVerifyAll() {
  console.log("=========================================================");
  console.log("1. FETCHING ALL SUPABASE AUTH USERS");
  console.log("=========================================================");

  const { data: { users }, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 100 });
  if (listErr) {
    console.error("Failed to list users:", listErr);
    process.exit(1);
  }
  console.log(`Found ${users.length} existing users in Supabase Auth.`);

  console.log("\n=========================================================");
  console.log("2. UPDATING PASSWORDS & CLEARING must_change_password");
  console.log("=========================================================");

  for (const cred of CREDENTIALS) {
    const user = users.find((u) => u.email?.toLowerCase() === cred.email.toLowerCase());
    if (!user) {
      console.warn(`User ${cred.email} not found in Supabase Auth. Creating...`);
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: cred.email,
        password: cred.password,
        email_confirm: true,
        user_metadata: {
          name: cred.name,
          designation: cred.designation,
          must_change_password: false,
          email_verified: true,
        },
      });
      if (createErr) {
        console.error(`❌ Failed to create user ${cred.email}:`, createErr.message);
      } else {
        console.log(`✅ Created user ${cred.email}`);
      }
      continue;
    }

    // Update password, confirm email, and set must_change_password = false
    const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: cred.password,
      email_confirm: true,
      user_metadata: {
        ...user.user_metadata,
        name: cred.name,
        designation: cred.designation,
        must_change_password: false,
      },
    });

    if (updErr) {
      console.error(`❌ Failed to update ${cred.email}:`, updErr.message);
    } else {
      console.log(`✅ Updated & Confirmed: ${cred.email} (${cred.name})`);
    }
  }

  console.log("\n=========================================================");
  console.log("3. LIVE LOGIN VERIFICATION FOR ALL 17 ACCOUNTS");
  console.log("=========================================================");

  let passCount = 0;
  let failCount = 0;

  for (const cred of CREDENTIALS) {
    // For admin@ppsu.in, it's also in auth, but test signInWithPassword
    const { data: signInData, error: signInErr } = await supabaseClient.auth.signInWithPassword({
      email: cred.email,
      password: cred.password,
    });

    if (signInErr) {
      console.error(`❌ LOGIN FAILED: ${cred.email} | Error: ${signInErr.message}`);
      failCount++;
    } else {
      console.log(`🎉 LOGIN OK: ${cred.email.padEnd(38)} | ${cred.name.padEnd(15)} | ${cred.role}`);
      passCount++;
      await supabaseClient.auth.signOut();
    }
  }

  console.log("\n=========================================================");
  console.log(`SUMMARY: ${passCount} PASSED, ${failCount} FAILED out of ${CREDENTIALS.length}`);
  console.log("=========================================================");
}

syncAndVerifyAll();

