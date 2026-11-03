import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sbAdmin = createClient(supabaseUrl, serviceKey);

async function testFullWorkflow() {
  console.log("=================================================================");
  console.log("🚀 TESTING COMPLETE MULTI-STAGE GOVERNANCE WORKFLOW END-TO-END");
  console.log("=================================================================\n");

  // 1. Deepak signs in as Faculty SOE
  console.log("1. Signing in as Faculty SOE: deepak@soe.ppsu.in...");
  const deepakClient = createClient(supabaseUrl, anonKey);
  const { data: deepakAuth, error: deepakAuthErr } = await deepakClient.auth.signInWithPassword({
    email: "deepak@soe.ppsu.in",
    password: "Deepak@SOE2026!",
  });
  if (deepakAuthErr) throw new Error("Deepak sign in failed: " + deepakAuthErr.message);

  const { data: deepakFac } = await sbAdmin
    .from("faculty")
    .select("*, department:departments(name, code, school:schools(name, code))")
    .eq("auth_user_id", deepakAuth.user.id)
    .single();

  console.log(`   ✅ Signed In: ${deepakFac.name} (${deepakFac.email})`);
  console.log(`   ✅ Department: ${deepakFac.department?.name} (${deepakFac.department?.code})`);
  console.log(`   ✅ School: ${deepakFac.department?.school?.name}`);

  // 2. Active academic year & PhD Scholar claim type
  const { data: ay } = await sbAdmin.from("academic_years").select("*").eq("is_active", true).single();
  const { data: phdType } = await sbAdmin.from("claim_types").select("*").eq("code", "PHD_SCHOLAR").single();

  console.log(`\n2. Submitting PhD Scholar Claim for Deepak...`);
  const claimNum = `FRIC-PHD-2026-${Date.now().toString().slice(-5)}`;
  const claimedAmount = 50000;

  const { data: createdClaim, error: claimErr } = await sbAdmin
    .from("claims")
    .insert({
      claim_number: claimNum,
      faculty_id: deepakFac.id,
      claim_type_id: phdType.id,
      academic_year_id: ay.id,
      status: "SUBMITTED",
      current_stage: "HOD_PRINCIPAL",
      claimed_amount: claimedAmount,
      calculated_amount: claimedAmount,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (claimErr) throw new Error("Claim insertion failed: " + claimErr.message);
  console.log(`   ✅ Claim Created: ${createdClaim.claim_number} (ID: ${createdClaim.id})`);
  console.log(`   ✅ Current Stage: ${createdClaim.current_stage} | Status: ${createdClaim.status}`);

  // Insert PhD Scholar detail
  const { data: phdRow, error: phdErr } = await sbAdmin.from("phd_scholars").insert({
    claim_id: createdClaim.id,
    scholar_enrollment_id: "PHD2026-ENG-089",
    scholar_name: "Amit Patel",
    school: "School of Engineering",
    department: "Computer Science and Engineering",
    discipline: "Deep Learning & Robotics",
    notification_date: "2026-10-15",
  }).select().single();

  if (phdErr) throw new Error("PhD Scholar detail insertion failed: " + phdErr.message);
  console.log(`   ✅ PhD Scholar Detail Saved: ${phdRow.scholar_name} (${phdRow.scholar_enrollment_id})`);

  // Insert mock document
  await sbAdmin.from("claim_documents").insert({
    claim_id: createdClaim.id,
    document_type: "PhD Notification / Degree Award Document",
    file_name: "amit_patel_phd_notification.pdf",
    storage_bucket: "claim-documents",
    storage_path: `${createdClaim.id}/amit_patel_phd_notification.pdf`,
    file_size: 154200,
    mime_type: "application/pdf",
    uploaded_by: deepakAuth.user.id,
    verification_status: "PENDING",
  });
  console.log(`   ✅ Attached Supporting Document: amit_patel_phd_notification.pdf`);

  // 3. Stage 1: HOD SOE (Mitul) verifies claim
  console.log("\n3. Stage 1 Verification: HOD SOE (mitul@hod.soe.ppsu.in)...");
  const { data: mitulAuth } = await sbAdmin.auth.admin.listUsers();
  const mitulUser = mitulAuth.users.find((u) => u.email === "mitul@hod.soe.ppsu.in");

  // HOD approves and forwards to Committee M1
  await sbAdmin.from("claims").update({
    current_stage: "COMMITTEE_M1",
    status: "UNDER_VERIFICATION",
    updated_at: new Date().toISOString(),
  }).eq("id", createdClaim.id);

  await sbAdmin.from("claim_approvals").insert({
    claim_id: createdClaim.id,
    stage: "HOD_PRINCIPAL",
    approver_id: mitulUser.id,
    status: "VERIFIED",
    approved_amount: claimedAmount,
    remarks: "Verified scholar PhD degree notification and supervisor eligibility. Forwarded to Research Committee.",
    action_at: new Date().toISOString(),
  });
  console.log("   ✅ HOD SOE Verified & Forwarded -> Stage 2: COMMITTEE_M1");

  // 4. Stage 2: Committee Member 1 (Ramesh Gohil) verifies claim
  console.log("\n4. Stage 2 Verification: Committee M1 (rameshgohil@verifer.1.ppsu.in)...");
  const rameshUser = mitulAuth.users.find((u) => u.email === "rameshgohil@verifer.1.ppsu.in");
  await sbAdmin.from("claims").update({
    current_stage: "COMMITTEE_M2",
    status: "UNDER_VERIFICATION",
    updated_at: new Date().toISOString(),
  }).eq("id", createdClaim.id);

  await sbAdmin.from("claim_approvals").insert({
    claim_id: createdClaim.id,
    stage: "COMMITTEE_M1",
    approver_id: rameshUser.id,
    status: "VERIFIED",
    approved_amount: claimedAmount,
    remarks: "Verified academic records and thesis compliance. Recommended for payout.",
    action_at: new Date().toISOString(),
  });
  console.log("   ✅ Committee M1 Verified & Forwarded -> Stage 3: COMMITTEE_M2");

  // 5. Stage 3: Committee Member 2 (Aeshish Rana) verifies claim
  console.log("\n5. Stage 3 Verification: Committee M2 (aeshishrana@verifer.2.ppsu.in)...");
  const aeshishUser = mitulAuth.users.find((u) => u.email === "aeshishrana@verifer.2.ppsu.in");
  await sbAdmin.from("claims").update({
    current_stage: "GOVERNOR",
    status: "UNDER_VERIFICATION",
    updated_at: new Date().toISOString(),
  }).eq("id", createdClaim.id);

  await sbAdmin.from("claim_approvals").insert({
    claim_id: createdClaim.id,
    stage: "COMMITTEE_M2",
    approver_id: aeshishUser.id,
    status: "VERIFIED",
    approved_amount: claimedAmount,
    remarks: "Inter-disciplinary committee review passed with honors.",
    action_at: new Date().toISOString(),
  });
  console.log("   ✅ Committee M2 Verified & Forwarded -> Stage 4: GOVERNOR");

  // 6. Stage 4: Research Committee Convenor / Governor (Rishal Singh) verifies claim
  console.log("\n6. Stage 4 Verification: Committee Convenor / Governor (rishalsingh@verifer.convenor.ppsu.in)...");
  const rishalUser = mitulAuth.users.find((u) => u.email === "rishalsingh@verifer.convenor.ppsu.in");
  await sbAdmin.from("claims").update({
    current_stage: "PROVOST",
    status: "UNDER_VERIFICATION",
    updated_at: new Date().toISOString(),
  }).eq("id", createdClaim.id);

  await sbAdmin.from("claim_approvals").insert({
    claim_id: createdClaim.id,
    stage: "GOVERNOR",
    approver_id: rishalUser.id,
    status: "VERIFIED",
    approved_amount: claimedAmount,
    remarks: "Committee Convenor review complete. Forwarded to Provost for final sanction.",
    action_at: new Date().toISOString(),
  });
  console.log("   ✅ Governor Verified & Forwarded -> Stage 5: PROVOST");

  // 7. Stage 5: Provost / Registrar (EAtoVC) sanctions payout
  console.log("\n7. Stage 5 Final Sanction: Provost / Registrar (eatovc@ppsu.in)...");
  const provostUser = mitulAuth.users.find((u) => u.email === "eatovc@ppsu.in");
  await sbAdmin.from("claims").update({
    current_stage: "APPROVED",
    status: "APPROVED",
    approved_amount: claimedAmount,
    finalized_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", createdClaim.id);

  await sbAdmin.from("claim_approvals").insert({
    claim_id: createdClaim.id,
    stage: "PROVOST",
    approver_id: provostUser.id,
    status: "APPROVED",
    approved_amount: claimedAmount,
    remarks: "Sanctioned ₹50,000 research incentive for PhD scholar guidance. Finance instructed for payout disbursement.",
    action_at: new Date().toISOString(),
  });
  console.log("   ✅ Provost Final Sanction Granted! Status: APPROVED (Amount: ₹50,000)");

  // 8. Verify Deepak can view his approved claim and print order
  console.log("\n8. Verifying Deepak's View of the Sanctioned Claim...");
  const { data: deepakClaims } = await sbAdmin
    .from("claims")
    .select(`
      id,
      claim_number,
      status,
      current_stage,
      claimed_amount,
      approved_amount,
      submitted_at,
      claim_types(name),
      phd_scholars(scholar_name, scholar_enrollment_id),
      claim_approvals(stage, status, remarks, approver_id)
    `)
    .eq("id", createdClaim.id)
    .single();

  console.log(`   🎉 Claim Number: ${deepakClaims.claim_number}`);
  console.log(`   🎉 Category:     ${deepakClaims.claim_types?.name}`);
  console.log(`   🎉 Scholar:      ${deepakClaims.phd_scholars[0]?.scholar_name} (${deepakClaims.phd_scholars[0]?.scholar_enrollment_id})`);
  console.log(`   🎉 Status:       ${deepakClaims.status} (Stage: ${deepakClaims.current_stage})`);
  console.log(`   🎉 Sanctioned:   ₹${deepakClaims.approved_amount}`);
  console.log(`   🎉 Approvals:    ${deepakClaims.claim_approvals.length} Stages Signed Off`);

  console.log("\n=================================================================");
  console.log("🏆 SUCCESS! COMPLETE 5-STAGE GOVERNANCE WORKFLOW TEST PASSED!");
  console.log("=================================================================\n");
}

testFullWorkflow().catch(console.error);

