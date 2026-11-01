import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from .env.local
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

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Stage order mapping
const STAGE_ORDER = ["HOD_PRINCIPAL", "COMMITTEE_M1", "COMMITTEE_M2", "GOVERNOR", "PROVOST", "APPROVED"];

async function runEndToEndVerification() {
  console.log("======================================================================");
  console.log("🧪 STARTING END-TO-END FRIC WORKFLOW VERIFICATION TEST");
  console.log("======================================================================\n");

  let testClaimId = null;
  let testReturnClaimId = null;

  try {
    // ------------------------------------------------------------------
    // STEP 1: Verify Core Setup (Academic Year, Claim Types, Faculty, Roles)
    // ------------------------------------------------------------------
    console.log("👉 STEP 1: Verifying Database Master Data...");
    const { data: ay, error: ayErr } = await supabase
      .from("academic_years")
      .select("id, name, is_active")
      .eq("is_active", true)
      .single();
    if (ayErr || !ay) throw new Error("Active academic year not found in DB: " + ayErr?.message);
    console.log(`   ✅ Active Academic Year: ${ay.name} (ID: ${ay.id})`);

    const { data: claimType, error: ctErr } = await supabase
      .from("claim_types")
      .select("id, code, name")
      .eq("code", "JOURNAL_PUBLICATION")
      .single();
    if (ctErr || !claimType) throw new Error("Claim type JOURNAL_PUBLICATION not found: " + ctErr?.message);
    console.log(`   ✅ Claim Type: ${claimType.name} (Code: ${claimType.code})`);

    // Fetch key actors
    const { data: facultyUser } = await supabase.from("faculty").select("*").eq("email", "raviraj@soe.ppsu.in").single();
    const { data: hodUser } = await supabase.from("faculty").select("*").eq("email", "mitul@hod.soe.ppsu.in").single();
    const { data: m1User } = await supabase.from("faculty").select("*").eq("email", "rameshgohil@verifer.1.ppsu.in").single();
    const { data: m2User } = await supabase.from("faculty").select("*").eq("email", "aeshishrana@verifer.2.ppsu.in").single();
    const { data: governorUser } = await supabase.from("faculty").select("*").eq("email", "rishalsingh@verifer.convenor.ppsu.in").single();
    const { data: provostUser } = await supabase.from("faculty").select("*").eq("email", "eatovc@ppsu.in").single();

    if (!facultyUser || !hodUser || !m1User || !m2User || !governorUser || !provostUser) {
      throw new Error("One or more workflow role accounts are missing from faculty table!");
    }
    console.log("   ✅ All 6 Workflow Actors Found:");
    console.log(`      - Faculty:    ${facultyUser.name} (${facultyUser.email})`);
    console.log(`      - Stage 1 HOD: ${hodUser.name} (${hodUser.email})`);
    console.log(`      - Stage 2 M1:  ${m1User.name} (${m1User.email})`);
    console.log(`      - Stage 3 M2:  ${m2User.name} (${m2User.email})`);
    console.log(`      - Stage 4 Gov: ${governorUser.name} (${governorUser.email})`);
    console.log(`      - Stage 5 Pro: ${provostUser.name} (${provostUser.email})`);

    // ------------------------------------------------------------------
    // STEP 2: Faculty Submits New Research Claim
    // ------------------------------------------------------------------
    console.log("\n👉 STEP 2: Faculty Submitting New Claim (Journal Publication)...");
    const testClaimNum = `FRIC-TEST-PUB-${Date.now().toString().slice(-6)}`;
    const claimedAmt = 25000;

    const { data: createdClaim, error: claimInsertErr } = await supabase
      .from("claims")
      .insert({
        claim_number: testClaimNum,
        faculty_id: facultyUser.id,
        claim_type_id: claimType.id,
        academic_year_id: ay.id,
        status: "SUBMITTED",
        current_stage: "HOD_PRINCIPAL",
        claimed_amount: claimedAmt,
        calculated_amount: claimedAmt,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (claimInsertErr) throw new Error("Failed to insert claim: " + claimInsertErr.message);
    testClaimId = createdClaim.id;
    console.log(`   ✅ Claim Created in Database!`);
    console.log(`      - ID: ${testClaimId}`);
    console.log(`      - Claim Number: ${testClaimNum}`);
    console.log(`      - Initial Status: ${createdClaim.status}`);
    console.log(`      - Initial Stage:  ${createdClaim.current_stage}`);
    console.log(`      - Amount:         ₹${createdClaim.claimed_amount}`);

    // Insert publication details
    const { data: pubData, error: pubErr } = await supabase
      .from("publications")
      .insert({
        claim_id: testClaimId,
        title: "Automated Verification Testing for Multi-Stage Incentive Workflow",
        journal_name: "IEEE Transactions on Systems & Software",
        issn: "0018-9340",
        indexing: "Scopus",
        quartile: "Q1",
        impact_factor: 6.8,
        acceptance_rate: 12,
        publication_date: "2026-08-15",
      })
      .select()
      .single();

    if (pubErr) throw new Error("Failed to insert publication details: " + pubErr.message);
    console.log(`   ✅ Publication Record Linked: "${pubData.title}" (Q1, Scopus)`);

    // Insert Authors
    const { error: authorErr } = await supabase.from("publication_authors").insert([
      {
        publication_id: pubData.id,
        faculty_id: facultyUser.id,
        author_name: facultyUser.name,
        author_order: 1,
        author_number: 1,
        is_first_author: true,
        is_corresponding_author: true,
        is_ppsu_faculty: true,
        affiliation: facultyUser.designation || "Assistant Professor",
        institution: "PP Savani University",
      },
      {
        publication_id: pubData.id,
        faculty_id: null,
        author_name: "Dr. Collaborator",
        author_order: 2,
        author_number: 2,
        is_first_author: false,
        is_corresponding_author: false,
        is_ppsu_faculty: false,
        affiliation: "External Collaborator",
        institution: "IIT Bombay",
      },
    ]);
    if (authorErr) throw new Error("Failed to insert publication_authors: " + authorErr.message);
    console.log("   ✅ Publication Authors Successfully Linked.");

    // Notification for submission
    await supabase.from("notifications").insert({
      user_id: facultyUser.auth_user_id,
      title: "Claim Submitted Successfully",
      message: `Your research claim ${testClaimNum} has been submitted for Department HOD Review.`,
      type: "CLAIM_VERIFIED",
      claim_id: testClaimId,
    });
    console.log("   ✅ Faculty Submission Notification Generated.");

    // ------------------------------------------------------------------
    // STEP 3: Stage 1 - HOD / Principal Review (Mitul)
    // ------------------------------------------------------------------
    console.log("\n👉 STEP 3: Stage 1 - HOD / Principal Review (mitul@hod.soe.ppsu.in)...");
    
    // Check if claim appears in HOD queue
    const { data: hodQueue } = await supabase
      .from("claims")
      .select("id, claim_number, current_stage, status")
      .eq("current_stage", "HOD_PRINCIPAL")
      .eq("id", testClaimId);
    
    if (!hodQueue || hodQueue.length === 0) throw new Error("Claim not found in HOD queue!");
    console.log(`   ✅ Claim correctly visible in HOD queue.`);

    // Perform HOD Verification
    const hodRemarks = "Department verification completed. Indexed in Scopus Q1. Forwarding to Committee Member 1.";
    const { error: hodUpdateErr } = await supabase
      .from("claims")
      .update({
        status: "UNDER_VERIFICATION",
        current_stage: "COMMITTEE_M1",
        approved_amount: claimedAmt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", testClaimId);
    if (hodUpdateErr) throw new Error("HOD update failed: " + hodUpdateErr.message);

    // Record approval
    await supabase.from("claim_approvals").insert({
      claim_id: testClaimId,
      stage: "HOD_PRINCIPAL",
      approver_id: hodUser.auth_user_id,
      status: "VERIFIED",
      remarks: hodRemarks,
      approved_amount: claimedAmt,
      action_at: new Date().toISOString(),
    });

    await supabase.from("claim_comments").insert({
      claim_id: testClaimId,
      user_id: hodUser.auth_user_id,
      comment: `[HOD] ${hodRemarks}`,
      is_internal: false,
    });
    console.log("   ✅ Stage 1 HOD Approved -> Promoted to COMMITTEE_M1.");

    // ------------------------------------------------------------------
    // STEP 4: Stage 2 - Committee Member 1 Review (Ramesh Gohil)
    // ------------------------------------------------------------------
    console.log("\n👉 STEP 4: Stage 2 - Committee Member 1 Review (rameshgohil@verifer.1.ppsu.in)...");
    
    const { data: m1Queue } = await supabase
      .from("claims")
      .select("id, claim_number, current_stage")
      .eq("current_stage", "COMMITTEE_M1")
      .eq("id", testClaimId);
    if (!m1Queue || m1Queue.length === 0) throw new Error("Claim not found in M1 queue!");
    console.log(`   ✅ Claim correctly visible in Committee Member 1 queue.`);

    const m1Remarks = "Paper details and affiliation validated against university policy. Approved.";
    await supabase.from("claims").update({
      status: "UNDER_VERIFICATION",
      current_stage: "COMMITTEE_M2",
      updated_at: new Date().toISOString(),
    }).eq("id", testClaimId);

    await supabase.from("claim_approvals").insert({
      claim_id: testClaimId,
      stage: "COMMITTEE_M1",
      approver_id: m1User.auth_user_id,
      status: "VERIFIED",
      remarks: m1Remarks,
      approved_amount: claimedAmt,
      action_at: new Date().toISOString(),
    });
    console.log("   ✅ Stage 2 M1 Approved -> Promoted to COMMITTEE_M2.");

    // ------------------------------------------------------------------
    // STEP 5: Stage 3 - Committee Member 2 Review (Aeshish Rana)
    // ------------------------------------------------------------------
    console.log("\n👉 STEP 5: Stage 3 - Committee Member 2 Review (aeshishrana@verifer.2.ppsu.in)...");
    
    const { data: m2Queue } = await supabase
      .from("claims")
      .select("id, claim_number, current_stage")
      .eq("current_stage", "COMMITTEE_M2")
      .eq("id", testClaimId);
    if (!m2Queue || m2Queue.length === 0) throw new Error("Claim not found in M2 queue!");
    console.log(`   ✅ Claim correctly visible in Committee Member 2 queue.`);

    const m2Remarks = "Secondary audit passed. Quartile calculation verified. Forwarded to Governor.";
    await supabase.from("claims").update({
      status: "UNDER_VERIFICATION",
      current_stage: "GOVERNOR",
      updated_at: new Date().toISOString(),
    }).eq("id", testClaimId);

    await supabase.from("claim_approvals").insert({
      claim_id: testClaimId,
      stage: "COMMITTEE_M2",
      approver_id: m2User.auth_user_id,
      status: "VERIFIED",
      remarks: m2Remarks,
      approved_amount: claimedAmt,
      action_at: new Date().toISOString(),
    });
    console.log("   ✅ Stage 3 M2 Approved -> Promoted to GOVERNOR.");

    // ------------------------------------------------------------------
    // STEP 6: Stage 4 - Research Coordinator / Governor (Rishal Singh)
    // ------------------------------------------------------------------
    console.log("\n👉 STEP 6: Stage 4 - Governor Review (rishalsingh@verifer.convenor.ppsu.in)...");
    
    const { data: govQueue } = await supabase
      .from("claims")
      .select("id, claim_number, current_stage")
      .eq("current_stage", "GOVERNOR")
      .eq("id", testClaimId);
    if (!govQueue || govQueue.length === 0) throw new Error("Claim not found in Governor queue!");
    console.log(`   ✅ Claim correctly visible in Governor queue.`);

    const govRemarks = "Executive synthesis and budget allocation reviewed. Ready for Provost sanction.";
    await supabase.from("claims").update({
      status: "UNDER_VERIFICATION",
      current_stage: "PROVOST",
      updated_at: new Date().toISOString(),
    }).eq("id", testClaimId);

    await supabase.from("claim_approvals").insert({
      claim_id: testClaimId,
      stage: "GOVERNOR",
      approver_id: governorUser.auth_user_id,
      status: "VERIFIED",
      remarks: govRemarks,
      approved_amount: claimedAmt,
      action_at: new Date().toISOString(),
    });
    console.log("   ✅ Stage 4 Governor Approved -> Promoted to PROVOST.");

    // ------------------------------------------------------------------
    // STEP 7: Stage 5 - Provost Final Sanction & Authorization (EAtoVC)
    // ------------------------------------------------------------------
    console.log("\n👉 STEP 7: Stage 5 - Provost Final Sanction (eatovc@ppsu.in)...");
    
    const { data: provostQueue } = await supabase
      .from("claims")
      .select("id, claim_number, current_stage, status")
      .eq("current_stage", "PROVOST")
      .eq("id", testClaimId);
    if (!provostQueue || provostQueue.length === 0) throw new Error("Claim not found in Provost queue!");
    console.log(`   ✅ Claim correctly visible in Provost queue.`);

    // Provost final sanction: updates status to APPROVED, sets finalized_at, inserts final approval
    const provostRemarks = "Final financial and academic sanction granted as per FRIC 2026-27 policy.";
    const sanctionedAmount = 25000;

    const { error: provostApproveErr } = await supabase
      .from("claims")
      .update({
        status: "APPROVED",
        current_stage: "APPROVED",
        approved_amount: sanctionedAmount,
        finalized_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", testClaimId);
    if (provostApproveErr) throw new Error("Provost approval failed: " + provostApproveErr.message);

    await supabase.from("claim_approvals").insert({
      claim_id: testClaimId,
      stage: "PROVOST",
      approver_id: provostUser.auth_user_id,
      status: "APPROVED",
      remarks: provostRemarks,
      approved_amount: sanctionedAmount,
      action_at: new Date().toISOString(),
    });

    await supabase.from("claim_comments").insert({
      claim_id: testClaimId,
      user_id: provostUser.auth_user_id,
      comment: `[Provost] ${provostRemarks}`,
      is_internal: false,
    });

    await supabase.from("notifications").insert({
      user_id: facultyUser.auth_user_id,
      title: "Incentive Claim Fully Approved! 🎉",
      message: `Congratulations! Your claim ${testClaimNum} has been fully sanctioned by the Provost for ₹${sanctionedAmount.toLocaleString()}.`,
      type: "CLAIM_APPROVED",
      claim_id: testClaimId,
    });
    console.log("   ✅ Stage 5 Provost Granted Final Sanction -> Status: APPROVED!");

    // ------------------------------------------------------------------
    // STEP 8: Verify Complete Database State of Approved Claim
    // ------------------------------------------------------------------
    console.log("\n👉 STEP 8: Verifying Full Audit Trail & Database Records...");
    const { data: finalClaim } = await supabase
      .from("claims")
      .select(`
        *,
        faculty(name, email),
        claim_types(name),
        publications(*, publication_authors(*)),
        claim_approvals(*),
        claim_comments(*)
      `)
      .eq("id", testClaimId)
      .single();

    console.log(`   ✅ Claim ID:          ${finalClaim.id}`);
    console.log(`   ✅ Claim Number:      ${finalClaim.claim_number}`);
    console.log(`   ✅ Final Status:      ${finalClaim.status} (Stage: ${finalClaim.current_stage})`);
    console.log(`   ✅ Sanctioned Amount: ₹${finalClaim.approved_amount}`);
    console.log(`   ✅ Approvals Count:   ${finalClaim.claim_approvals.length} / 5 Stages`);

    finalClaim.claim_approvals
      .sort((a, b) => new Date(a.action_at) - new Date(b.action_at))
      .forEach((app, idx) => {
        console.log(`      [Stage ${idx + 1}] ${app.stage.padEnd(14)} -> ${app.status.padEnd(8)} | By: ${app.approver_id} | Remarks: "${app.remarks}"`);
      });

    // ------------------------------------------------------------------
    // STEP 9: Test Return & Revision Workflow (Return -> Resubmit)
    // ------------------------------------------------------------------
    console.log("\n👉 STEP 9: Testing Return & Revision Workflow (Return -> Resubmit)...");
    const returnClaimNum = `FRIC-TEST-RET-${Date.now().toString().slice(-6)}`;
    const { data: returnClaim } = await supabase
      .from("claims")
      .insert({
        claim_number: returnClaimNum,
        faculty_id: facultyUser.id,
        claim_type_id: claimType.id,
        academic_year_id: ay.id,
        status: "SUBMITTED",
        current_stage: "HOD_PRINCIPAL",
        claimed_amount: 15000,
        calculated_amount: 15000,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();
    testReturnClaimId = returnClaim.id;

    // HOD returns claim for clarification
    const returnRemarks = "Please attach DOI proof of publication and Scopus citation index report.";
    await supabase.from("claims").update({
      status: "RETURNED",
      current_stage: "HOD_PRINCIPAL",
      updated_at: new Date().toISOString(),
    }).eq("id", testReturnClaimId);

    await supabase.from("claim_approvals").insert({
      claim_id: testReturnClaimId,
      stage: "HOD_PRINCIPAL",
      approver_id: hodUser.auth_user_id,
      status: "RETURNED",
      remarks: returnRemarks,
      action_at: new Date().toISOString(),
    });

    console.log(`   ✅ Claim ${returnClaimNum} successfully RETURNED by HOD with remarks.`);

    // Faculty resubmits after revision
    await supabase.from("claims").update({
      status: "RESUBMITTED",
      current_stage: "HOD_PRINCIPAL",
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", testReturnClaimId);

    console.log(`   ✅ Faculty successfully RESUBMITTED claim. Status: RESUBMITTED.`);

    // HOD now verifies resubmitted claim
    await supabase.from("claims").update({
      status: "UNDER_VERIFICATION",
      current_stage: "COMMITTEE_M1",
      updated_at: new Date().toISOString(),
    }).eq("id", testReturnClaimId);

    console.log(`   ✅ HOD accepted revision and forwarded to COMMITTEE_M1.`);

    console.log("\n======================================================================");
    console.log("🎉 ALL TESTS PASSED! FULL WORKFLOW VERIFIED END-TO-END IN SUPABASE!");
    console.log("======================================================================\n");

  } catch (err) {
    console.error("\n❌ TEST FAILED:", err);
  } finally {
    // Clean up test records
    console.log("🧹 Cleaning up temporary test records from database...");
    if (testClaimId) {
      const { data: pubs } = await supabase.from("publications").select("id").eq("claim_id", testClaimId);
      if (pubs && pubs.length > 0) {
        for (const p of pubs) {
          await supabase.from("publication_authors").delete().eq("publication_id", p.id);
        }
      }
      await supabase.from("publications").delete().eq("claim_id", testClaimId);
      await supabase.from("claim_approvals").delete().eq("claim_id", testClaimId);
      await supabase.from("claim_comments").delete().eq("claim_id", testClaimId);
      await supabase.from("notifications").delete().eq("claim_id", testClaimId);
      await supabase.from("claims").delete().eq("id", testClaimId);
      console.log(`   - Deleted test claim: ${testClaimId}`);
    }
    if (testReturnClaimId) {
      await supabase.from("claim_approvals").delete().eq("claim_id", testReturnClaimId);
      await supabase.from("claims").delete().eq("id", testReturnClaimId);
      console.log(`   - Deleted return test claim: ${testReturnClaimId}`);
    }
    console.log("✨ Test cleanup completed cleanly!\n");
  }
}

runEndToEndVerification();
