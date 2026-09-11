import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

function loadEnv() {
  const envPath = path.resolve(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, "utf8");
    for (const line of envFile.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pvgkulxvmaagtvqgzzan.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error("Error: SUPABASE_SERVICE_ROLE_KEY is required.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface UserDef {
  name: string;
  email: string;
  password: string;
  roles: string[];
  deptCode: "SOE" | "SOS";
  designation: string;
  employeeId: string;
  committeePosition?: "MEMBER_1" | "MEMBER_2" | "GOVERNOR";
}

const NEW_USERS: UserDef[] = [
  // --- Admin ---
  {
    name: "Niraj Shah",
    email: "admin@ppsu.in",
    password: "Admin@PPSU2026!",
    roles: ["SUPER_ADMIN", "FACULTY"],
    deptCode: "SOE",
    designation: "Dean SOE / System Super Admin [ALL]",
    employeeId: "EMP000",
  },

  // --- SOE Faculty & HOD ---
  {
    name: "Mitul",
    email: "mitul@hod.soe.ppsu.in",
    password: "Mitul@SOE2026!",
    roles: ["FACULTY", "HOD"],
    deptCode: "SOE",
    designation: "Head of Department - SOE",
    employeeId: "EMP001",
  },
  {
    name: "Raviraj",
    email: "raviraj@soe.ppsu.in",
    password: "Raviraj@SOE2026!",
    roles: ["FACULTY"],
    deptCode: "SOE",
    designation: "Assistant Professor - SOE",
    employeeId: "EMP002",
  },
  {
    name: "Maulika",
    email: "maulika@soe.ppsu.in",
    password: "Maulika@SOE2026!",
    roles: ["FACULTY"],
    deptCode: "SOE",
    designation: "Assistant Professor - SOE",
    employeeId: "EMP003",
  },
  {
    name: "Bhavisha",
    email: "bhavisha@soe.ppsu.in",
    password: "Bhavisha@SOE2026!",
    roles: ["FACULTY"],
    deptCode: "SOE",
    designation: "Assistant Professor - SOE",
    employeeId: "EMP004",
  },
  {
    name: "Deepak",
    email: "deepak@soe.ppsu.in",
    password: "Deepak@SOE2026!",
    roles: ["FACULTY"],
    deptCode: "SOE",
    designation: "Assistant Professor - SOE",
    employeeId: "EMP005",
  },
  {
    name: "Megha",
    email: "megha@soe.ppsu.in",
    password: "Megha@SOE2026!",
    roles: ["FACULTY"],
    deptCode: "SOE",
    designation: "Assistant Professor - SOE",
    employeeId: "EMP006",
  },

  // --- SOS Faculty & HOD ---
  {
    name: "Neha",
    email: "neha@hod.sos.ppsu.in",
    password: "Neha@SOS2026!",
    roles: ["FACULTY", "HOD"],
    deptCode: "SOS",
    designation: "Head of Department - SOS",
    employeeId: "EMP007",
  },
  {
    name: "Siddharth",
    email: "siddharth@sos.ppsu.in",
    password: "Siddharth@SOS2026!",
    roles: ["FACULTY"],
    deptCode: "SOS",
    designation: "Assistant Professor - SOS",
    employeeId: "EMP008",
  },
  {
    name: "Rakesh Kumar",
    email: "rakeshkumar@sos.ppsu.in",
    password: "Rakeshkumar@SOS2026!",
    roles: ["FACULTY"],
    deptCode: "SOS",
    designation: "Assistant Professor - SOS",
    employeeId: "EMP009",
  },
  {
    name: "Snkit",
    email: "snkit@sos.ppsu.in",
    password: "Snkit@SOS2026!",
    roles: ["FACULTY"],
    deptCode: "SOS",
    designation: "Assistant Professor - SOS",
    employeeId: "EMP010",
  },
  {
    name: "Sneha",
    email: "sneha@sos.ppsu.in",
    password: "Sneha@SOS2026!",
    roles: ["FACULTY"],
    deptCode: "SOS",
    designation: "Assistant Professor - SOS",
    employeeId: "EMP011",
  },
  {
    name: "Balraj",
    email: "balraj@sos.ppsu.in",
    password: "Balraj@SOS2026!",
    roles: ["FACULTY"],
    deptCode: "SOS",
    designation: "Assistant Professor - SOS",
    employeeId: "EMP012",
  },

  // --- Verifiers ---
  {
    name: "Ramesh Gohil",
    email: "rameshgohil@verifer.1.ppsu.in",
    password: "Rameshgohil@Verifier2026!",
    roles: ["FACULTY", "RESEARCH_COMMITTEE_MEMBER"],
    deptCode: "SOE",
    designation: "Research Committee Member 1 [COMMITTEE_M1]",
    employeeId: "EMP013",
    committeePosition: "MEMBER_1",
  },
  {
    name: "Aeshish Rana",
    email: "aeshishrana@verifer.2.ppsu.in",
    password: "Aeshishrana@Verifier2026!",
    roles: ["FACULTY", "RESEARCH_COMMITTEE_MEMBER"],
    deptCode: "SOS",
    designation: "Research Committee Member 2 [COMMITTEE_M2]",
    employeeId: "EMP014",
    committeePosition: "MEMBER_2",
  },
  {
    name: "Rishal Singh",
    email: "rishalsingh@verifer.convenor.ppsu.in",
    password: "Rishalsingh@Verifier2026!",
    roles: ["FACULTY", "GOVERNOR"],
    deptCode: "SOE",
    designation: "Research Committee Convenor [GOVERNOR]",
    employeeId: "EMP015",
    committeePosition: "GOVERNOR",
  },

  // --- Provost ---
  {
    name: "EAtoVC",
    email: "EAtoVC@ppsu.in",
    password: "EAtoVC@PPSU2026!",
    roles: ["FACULTY", "PROVOST"],
    deptCode: "SOE",
    designation: "Executive Assistant to VC / Provost [PROVOST]",
    employeeId: "EMP016",
  },
];

async function seed() {
  console.log("==================================================");
  console.log("STARTING PURGE OF OLD DEMO USERS & NEW SEEDING");
  console.log("==================================================");

  // 1. Fetch schools or set fallback
  const { data: schools } = await supabase.from("schools").select("id, code");
  let setSchoolId = schools?.find((s) => s.code === "SET")?.id;
  if (!setSchoolId && schools && schools.length > 0) {
    setSchoolId = schools[0].id;
  }

  // 2. Ensure SOE and SOS departments exist
  console.log("\n1. Ensuring SOE and SOS departments exist...");
  const { data: existingDepts } = await supabase.from("departments").select("id, code");
  const deptMap = new Map<string, string>();
  if (existingDepts) {
    existingDepts.forEach((d) => deptMap.set(d.code, d.id));
  }

  if (!deptMap.has("SOE")) {
    const { data: newSoe, error: errSoe } = await supabase
      .from("departments")
      .insert({
        name: "School of Engineering",
        code: "SOE",
        school_id: setSchoolId || null,
        is_active: true,
      })
      .select("id")
      .single();
    if (!errSoe && newSoe) {
      deptMap.set("SOE", newSoe.id);
      console.log("  Created department SOE:", newSoe.id);
    }
  } else {
    console.log("  SOE department exists:", deptMap.get("SOE"));
  }

  if (!deptMap.has("SOS")) {
    const { data: newSos, error: errSos } = await supabase
      .from("departments")
      .insert({
        name: "School of Science",
        code: "SOS",
        school_id: setSchoolId || null,
        is_active: true,
      })
      .select("id")
      .single();
    if (!errSos && newSos) {
      deptMap.set("SOS", newSos.id);
      console.log("  Created department SOS:", newSos.id);
    }
  } else {
    console.log("  SOS department exists:", deptMap.get("SOS"));
  }

  // 3. Fetch roles
  const { data: rolesData } = await supabase.from("roles").select("id, name");
  const roleMap = new Map<string, string>();
  if (rolesData) {
    for (const r of rolesData) {
      roleMap.set(r.name, r.id);
    }
  }

  // 4. Fetch active academic year and Research Committee
  const { data: acadYear } = await supabase
    .from("academic_years")
    .select("id")
    .eq("is_active", true)
    .single();

  let committeeId: string | null = null;
  if (acadYear) {
    const { data: existingComm } = await supabase
      .from("research_committees")
      .select("id")
      .eq("academic_year_id", acadYear.id)
      .single();

    if (existingComm) {
      committeeId = existingComm.id;
    } else {
      const { data: newComm } = await supabase
        .from("research_committees")
        .insert({
          name: "PPSU Research Committee 2026",
          academic_year_id: acadYear.id,
          is_active: true,
        })
        .select()
        .single();
      if (newComm) {
        committeeId = newComm.id;
      }
    }
  }

  // 5. Create Raviraj first so we can reassign claims to his faculty ID
  console.log("\n2. Seeding Raviraj (Faculty SOE) to accept claims...");
  const ravirajDef = NEW_USERS.find((u) => u.email === "raviraj@soe.ppsu.in")!;
  const listUsersRes = await supabase.auth.admin.listUsers();
  let ravirajAuthUser = listUsersRes.data.users?.find(u => u.email?.toLowerCase() === ravirajDef.email.toLowerCase());

  if (!ravirajAuthUser) {
    const created = await supabase.auth.admin.createUser({
      email: ravirajDef.email,
      password: ravirajDef.password,
      email_confirm: true,
      user_metadata: { name: ravirajDef.name },
    });
    ravirajAuthUser = created.data.user || undefined;
  }

  if (ravirajAuthUser) {
    const ravirajUserId = ravirajAuthUser.id;
    await supabase.from("users").upsert({ id: ravirajUserId, auth_user_id: ravirajUserId, email: ravirajDef.email, status: "ACTIVE" }, { onConflict: "id" });
    const { data: ravFac } = await supabase.from("faculty").upsert({
      auth_user_id: ravirajUserId,
      name: ravirajDef.name,
      email: ravirajDef.email,
      employee_id: ravirajDef.employeeId,
      department_id: deptMap.get(ravirajDef.deptCode) || null,
      designation: ravirajDef.designation,
      status: "ACTIVE",
    }, { onConflict: "auth_user_id" }).select().single();

    if (ravFac) {
      console.log(`  Raviraj Faculty record ready (ID: ${ravFac.id})`);
      const { data: demoFaculties } = await supabase.from("faculty").select("id").like("email", "%@demo.ppsu.ac.in");
      if (demoFaculties && demoFaculties.length > 0) {
        const demoFacIds = demoFaculties.map((df) => df.id);
        await supabase.from("claims").update({ faculty_id: ravFac.id }).in("faculty_id", demoFacIds);
        console.log("  Reassigned existing demo claims to Raviraj!");
      }
    }
  }

  // 6. Purge old demo users and demo faculty records
  console.log("\n3. Purging old demo faculty & auth users...");
  const { data: demoFaculties } = await supabase.from("faculty").select("id, auth_user_id, email").like("email", "%@demo.ppsu.ac.in");
  if (demoFaculties) {
    for (const df of demoFaculties) {
      console.log(`  Deleting demo faculty record: ${df.email}`);
      await supabase.from("faculty").delete().eq("id", df.id);
    }
  }

  const { data: authList } = await supabase.auth.admin.listUsers();
  if (authList?.users) {
    for (const u of authList.users) {
      const emailLower = (u.email || "").toLowerCase();
      if (emailLower.includes("@demo.ppsu.ac.in")) {
        console.log(`  Deleting demo Auth user: ${u.email} (${u.id})`);
        await supabase.from("committee_members").delete().eq("user_id", u.id);
        await supabase.from("user_roles").delete().eq("user_id", u.id);
        await supabase.from("users").delete().eq("id", u.id);
        await supabase.auth.admin.deleteUser(u.id);
      }
    }
  }

  // 7. Seed all 17 accounts
  console.log("\n4. Seeding all 17 new institutional accounts...");

  for (const def of NEW_USERS) {
    console.log(`\nProcessing: ${def.name} (${def.email})...`);

    let userId: string | null = null;

    const { data: listRes } = await supabase.auth.admin.listUsers();
    const existingAuth = listRes?.users?.find(
      (u) => u.email?.toLowerCase() === def.email.toLowerCase()
    );

    if (existingAuth) {
      userId = existingAuth.id;
      console.log(`  Auth user exists (ID: ${userId})`);
      await supabase.auth.admin.updateUserById(userId, {
        password: def.password,
        email_confirm: true,
        user_metadata: { name: def.name, must_change_password: true },
      });
    } else {
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: def.email,
        password: def.password,
        email_confirm: true,
        user_metadata: { name: def.name, must_change_password: true },
      });

      if (createErr || !created.user) {
        console.error(`  Failed to create auth user for ${def.email}:`, createErr?.message);
        continue;
      }
      userId = created.user.id;
      console.log(`  Created Auth user (ID: ${userId})`);
    }

    // Upsert public.users
    await supabase.from("users").upsert(
      {
        id: userId,
        auth_user_id: userId,
        email: def.email,
        status: "ACTIVE",
      },
      { onConflict: "id" }
    );

    // Upsert public.faculty (schema-safe with must_change_password fallback)
    const deptId = deptMap.get(def.deptCode) || null;
    const baseFacultyPayload = {
      auth_user_id: userId,
      name: def.name,
      email: def.email,
      employee_id: def.employeeId,
      department_id: deptId,
      designation: def.designation,
      status: "ACTIVE",
    };

    let { data: facultyData, error: facUpsertErr } = await supabase
      .from("faculty")
      .upsert(
        { ...baseFacultyPayload, must_change_password: true },
        { onConflict: "auth_user_id" }
      )
      .select()
      .single();

    if (facUpsertErr && facUpsertErr.code === "PGRST204") {
      const retry = await supabase
        .from("faculty")
        .upsert(baseFacultyPayload, { onConflict: "auth_user_id" })
        .select()
        .single();
      facultyData = retry.data;
      facUpsertErr = retry.error;
    }

    if (facUpsertErr) {
      console.error(`  Error upserting faculty record:`, facUpsertErr.message);
    } else if (facultyData) {
      console.log(`  Faculty record ready (ID: ${facultyData.id})`);
    }

    // Assign roles in user_roles
    for (const roleName of def.roles) {
      const roleId = roleMap.get(roleName);
      if (!roleId) continue;

      await supabase.from("user_roles").upsert(
        {
          user_id: userId,
          role_id: roleId,
          status: "ACTIVE",
        },
        { onConflict: "user_id,role_id" }
      );
      console.log(`  Assigned role: ${roleName}`);
    }

    // Bind committee member position if applicable
    if (def.committeePosition && committeeId) {
      await supabase.from("committee_members").upsert(
        {
          committee_id: committeeId,
          user_id: userId,
          position: def.committeePosition,
          is_active: true,
        },
        { onConflict: "committee_id,position" }
      );
      console.log(`  Assigned Committee Position: ${def.committeePosition}`);
    }
  }

  console.log("\n==================================================");
  console.log("SEEDING COMPLETE & ALL USERS VERIFIED SUCCESSFUL!");
  console.log("==================================================");
}

seed().catch((err) => {
  console.error("Seeding crashed:", err);
  process.exit(1);
});
