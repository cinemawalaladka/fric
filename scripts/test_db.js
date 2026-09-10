const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://pvgkulxvmaagtvqgzzan.supabase.co";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2Z2t1bHh2bWFhZ3R2cWd6emFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjQ2NTE0MiwiZXhwIjoyMTAyMDQxMTQyfQ.vfCFrewGYe2dMm10jlUFJvGpTrLQE7pbgE6pMxt_Ag8";

const supabase = createClient(supabaseUrl, serviceKey);

async function testInsertExistingOnly() {
  console.log("--- Testing Schema-Safe Insert ---");

  // 1. Get faculty
  const { data: faculty, error: facErr } = await supabase.from("faculty").select("*").limit(1).single();

  // 2. Get active academic year
  const { data: ay, error: ayErr } = await supabase.from("academic_years").select("*").eq("is_active", true).single();

  // 3. Get claim type JOURNAL_PUBLICATION
  const { data: ct, error: ctErr } = await supabase.from("claim_types").select("*").eq("code", "JOURNAL_PUBLICATION").single();

  // 4. Insert claim
  const claimNum = `TEST-FRIC-${Date.now()}`;
  const { data: claim, error: claimErr } = await supabase.from("claims").insert({
    claim_number: claimNum,
    faculty_id: faculty.id,
    claim_type_id: ct.id,
    academic_year_id: ay.id,
    status: "SUBMITTED",
    current_stage: "HOD_PRINCIPAL",
    claimed_amount: 5000,
    calculated_amount: 5000,
    submitted_at: new Date().toISOString(),
  }).select().single();

  if (claimErr) {
    console.error("Claims Insert Error:", claimErr);
    return;
  }
  console.log("✅ Claim Inserted successfully, ID:", claim.id, "Status:", claim.status, "Stage:", claim.current_stage);

  // 5. Insert publications (schema-safe)
  const { data: pub, error: pubErr } = await supabase.from("publications").insert({
    claim_id: claim.id,
    title: "Test Paper Work Title",
    journal_name: "IEEE Transactions on AI",
    issn: "1234-5678",
    indexing: "Scopus",
    quartile: "Q1",
    impact_factor: 5.2,
    acceptance_rate: 15,
    abdc_category: "A",
    doi: "10.1109/TEST.123",
  }).select().single();

  if (pubErr) {
    console.error("❌ Publications Insert Error:", pubErr);
  } else {
    console.log("✅ Publications Inserted successfully, ID:", pub.id);
  }

  // 6. Insert author entries (schema-safe)
  const { data: auth, error: authErr } = await supabase.from("publication_authors").insert([
    {
      publication_id: pub.id,
      faculty_id: faculty.id,
      author_name: faculty.name,
      author_order: 1,
      is_first_author: true,
      is_corresponding_author: false,
      is_ppsu_faculty: true,
    }
  ]).select();

  if (authErr) {
    console.error("❌ Publication Authors Insert Error:", authErr);
  } else {
    console.log("✅ Publication Authors Inserted successfully, Count:", auth.length);
  }

  // 7. Check if claim can be fetched by HOD
  const { data: hodClaims, error: hodErr } = await supabase
    .from("claims")
    .select("id, claim_number, status, current_stage")
    .eq("id", claim.id)
    .eq("current_stage", "HOD_PRINCIPAL");

  console.log("✅ HOD Stage Query Check Result:", hodClaims, hodErr?.message || "OK");

  // Cleanup test claim
  await supabase.from("claims").delete().eq("id", claim.id);
  console.log("Test claim cleaned up.");
}

testInsertExistingOnly();
