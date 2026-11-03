import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const sb = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function setupDatabaseAndWorkflow() {
  console.log("=================================================================");
  console.log("🛠️ FIXING DATABASE SETUP & WORKFLOW INTEGRITY");
  console.log("=================================================================\n");

  // 1. Ensure Schools (SOE & SOS)
  console.log("1. Ensuring Schools (SOE and SOS) exist in `schools`...");
  const { data: existingSchools } = await sb.from("schools").select("*");
  const schoolMap = new Map();
  (existingSchools || []).forEach((s) => schoolMap.set(s.code, s.id));

  // SOE School
  let soeSchoolId = schoolMap.get("SOE") || schoolMap.get("SET");
  if (!schoolMap.has("SOE")) {
    if (schoolMap.has("SET")) {
      await sb.from("schools").update({ code: "SOE", name: "School of Engineering" }).eq("id", schoolMap.get("SET"));
      soeSchoolId = schoolMap.get("SET");
      console.log("   ✅ Updated SET school code to SOE:", soeSchoolId);
    } else {
      const { data: newSchool, error } = await sb
        .from("schools")
        .insert({ name: "School of Engineering", code: "SOE", is_active: true })
        .select()
        .single();
      if (!error && newSchool) {
        soeSchoolId = newSchool.id;
        console.log("   ✅ Created SOE School:", soeSchoolId);
      }
    }
  } else {
    console.log("   ✅ SOE School exists:", soeSchoolId);
  }

  // SOS School
  let sosSchoolId = schoolMap.get("SOS");
  if (!sosSchoolId) {
    const { data: newSchool, error } = await sb
      .from("schools")
      .insert({ name: "School of Science", code: "SOS", is_active: true })
      .select()
      .single();
    if (!error && newSchool) {
      sosSchoolId = newSchool.id;
      console.log("   ✅ Created SOS School:", sosSchoolId);
    }
  } else {
    console.log("   ✅ SOS School exists:", sosSchoolId);
  }

  // 2. Ensure Departments (SOE & SOS)
  console.log("\n2. Ensuring Departments (SOE and SOS) exist in `departments`...");
  const { data: existingDepts } = await sb.from("departments").select("*");
  const deptMap = new Map();
  (existingDepts || []).forEach((d) => deptMap.set(d.code, d.id));

  // Fetch Auth Users for HODs
  const { data: authUsers } = await sb.auth.admin.listUsers();
  const mitulAuth = authUsers.users.find((u) => u.email?.toLowerCase() === "mitul@hod.soe.ppsu.in");
  const nehaAuth = authUsers.users.find((u) => u.email?.toLowerCase() === "neha@hod.sos.ppsu.in");

  let soeDeptId = deptMap.get("SOE");
  if (!soeDeptId) {
    const { data: newDept, error } = await sb
      .from("departments")
      .insert({
        name: "School of Engineering",
        code: "SOE",
        school_id: soeSchoolId,
        hod_user_id: mitulAuth?.id || null,
        is_active: true,
      })
      .select()
      .single();
    if (!error && newDept) {
      soeDeptId = newDept.id;
      console.log("   ✅ Created SOE Department:", soeDeptId);
    }
  } else {
    await sb.from("departments").update({
      name: "School of Engineering",
      school_id: soeSchoolId,
      hod_user_id: mitulAuth?.id || null,
    }).eq("id", soeDeptId);
    console.log("   ✅ Updated SOE Department with Mitul as HOD:", soeDeptId);
  }

  let sosDeptId = deptMap.get("SOS");
  if (!sosDeptId) {
    const { data: newDept, error } = await sb
      .from("departments")
      .insert({
        name: "School of Science",
        code: "SOS",
        school_id: sosSchoolId,
        hod_user_id: nehaAuth?.id || null,
        is_active: true,
      })
      .select()
      .single();
    if (!error && newDept) {
      sosDeptId = newDept.id;
      console.log("   ✅ Created SOS Department:", sosDeptId);
    }
  } else {
    await sb.from("departments").update({
      name: "School of Science",
      school_id: sosSchoolId,
      hod_user_id: nehaAuth?.id || null,
    }).eq("id", sosDeptId);
    console.log("   ✅ Updated SOS Department with Neha as HOD:", sosDeptId);
  }

  // 3. Link Faculty to their proper Departments
  console.log("\n3. Linking all 17 Faculty to their respective Departments (SOE / SOS)...");
  const SOE_EMAILS = [
    "admin@ppsu.in",
    "eatovc@ppsu.in",
    "mitul@hod.soe.ppsu.in",
    "raviraj@soe.ppsu.in",
    "maulika@soe.ppsu.in",
    "bhavisha@soe.ppsu.in",
    "deepak@soe.ppsu.in",
    "megha@soe.ppsu.in",
    "rameshgohil@verifer.1.ppsu.in",
    "rishalsingh@verifer.convenor.ppsu.in",
  ];

  const SOS_EMAILS = [
    "neha@hod.sos.ppsu.in",
    "siddharth@sos.ppsu.in",
    "rakeshkumar@sos.ppsu.in",
    "snkit@sos.ppsu.in",
    "sneha@sos.ppsu.in",
    "balraj@sos.ppsu.in",
    "aeshishrana@verifer.2.ppsu.in",
  ];

  for (const email of SOE_EMAILS) {
    const { error } = await sb
      .from("faculty")
      .update({ department_id: soeDeptId })
      .ilike("email", email);
    if (!error) console.log(`   ✅ Linked ${email.padEnd(38)} -> Department: SOE`);
    else console.error(`   ❌ Failed to link ${email}:`, error.message);
  }

  for (const email of SOS_EMAILS) {
    const { error } = await sb
      .from("faculty")
      .update({ department_id: sosDeptId })
      .ilike("email", email);
    if (!error) console.log(`   ✅ Linked ${email.padEnd(38)} -> Department: SOS`);
    else console.error(`   ❌ Failed to link ${email}:`, error.message);
  }

  // 4. Ensure Research Committee & Committee Members
  console.log("\n4. Ensuring Research Committee & Committee Members...");
  const { data: acadYear } = await sb.from("academic_years").select("id, name").eq("is_active", true).single();
  if (acadYear) {
    let committeeId = null;
    const { data: existingComm } = await sb
      .from("research_committees")
      .select("id")
      .eq("academic_year_id", acadYear.id)
      .maybeSingle();

    if (existingComm) {
      committeeId = existingComm.id;
      console.log("   ✅ Research Committee exists:", committeeId);
    } else {
      const { data: newComm, error: commErr } = await sb
        .from("research_committees")
        .insert({
          name: "PPSU Research Committee 2026-27",
          academic_year_id: acadYear.id,
          is_active: true,
        })
        .select()
        .single();
      if (!commErr && newComm) {
        committeeId = newComm.id;
        console.log("   ✅ Created Research Committee:", committeeId);
      }
    }

    if (committeeId) {
      const rameshAuth = authUsers.users.find((u) => u.email?.toLowerCase() === "rameshgohil@verifer.1.ppsu.in");
      const aeshishAuth = authUsers.users.find((u) => u.email?.toLowerCase() === "aeshishrana@verifer.2.ppsu.in");
      const rishalAuth = authUsers.users.find((u) => u.email?.toLowerCase() === "rishalsingh@verifer.convenor.ppsu.in");

      const committeeMembers = [
        { committee_id: committeeId, user_id: rameshAuth?.id, position: "MEMBER_1", is_active: true },
        { committee_id: committeeId, user_id: aeshishAuth?.id, position: "MEMBER_2", is_active: true },
        { committee_id: committeeId, user_id: rishalAuth?.id, position: "GOVERNOR", is_active: true },
      ].filter((m) => !!m.user_id);

      for (const m of committeeMembers) {
        await sb.from("committee_members").upsert(m, { onConflict: "committee_id,position" });
        console.log(`   ✅ Committee Member Bound: Position ${m.position} -> User ${m.user_id}`);
      }
    }
  }

  console.log("\n=================================================================");
  console.log("🎉 DATABASE SETUP & WORKFLOW RELATIONSHIPS FULLY CONFIGURED!");
  console.log("=================================================================\n");
}

setupDatabaseAndWorkflow().catch(console.error);

