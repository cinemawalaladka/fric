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

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function cleanAllClaims() {
  console.log("🧹 Starting Complete Cleanup of Claims & Related Data...");

  try {
    // 1. Fetch all storage files in 'claim-documents' bucket
    console.log("📁 Cleaning Storage Bucket: 'claim-documents'...");
    const { data: storageFiles, error: listErr } = await supabase.storage
      .from("claim-documents")
      .list();

    if (!listErr && storageFiles && storageFiles.length > 0) {
      const pathsToDelete = [];
      for (const item of storageFiles) {
        if (item.id === null) {
          // Folder
          const { data: subFiles } = await supabase.storage
            .from("claim-documents")
            .list(item.name);
          if (subFiles) {
            subFiles.forEach((sub) => pathsToDelete.push(`${item.name}/${sub.name}`));
          }
        } else {
          pathsToDelete.push(item.name);
        }
      }
      if (pathsToDelete.length > 0) {
        const { error: delErr } = await supabase.storage
          .from("claim-documents")
          .remove(pathsToDelete);
        if (delErr) {
          console.warn("Storage deletion warning:", delErr.message);
        } else {
          console.log(`✅ Deleted ${pathsToDelete.length} files from Supabase Storage.`);
        }
      }
    } else {
      console.log("ℹ️ No storage files found or storage already empty.");
    }

    // 2. Delete child tables
    console.log("🗑️ Deleting child tables data...");
    
    // Claim Documents
    const { error: docErr } = await supabase.from("claim_documents").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (docErr) console.warn("claim_documents delete warning:", docErr.message);

    // Claim Approvals
    const { error: appErr } = await supabase.from("claim_approvals").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (appErr) console.warn("claim_approvals delete warning:", appErr.message);

    // Claim Comments
    const { error: comErr } = await supabase.from("claim_comments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (comErr) console.warn("claim_comments delete warning:", comErr.message);

    // Co-Authors / Authors
    const { error: authErr } = await supabase.from("co_authors").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (authErr) console.warn("co_authors delete warning:", authErr.message);

    // Publications
    const { error: pubErr } = await supabase.from("publications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (pubErr) console.warn("publications delete warning:", pubErr.message);

    // Books
    const { error: bookErr } = await supabase.from("books").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (bookErr) console.warn("books delete warning:", bookErr.message);

    // Patents
    const { error: patErr } = await supabase.from("patents").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (patErr) console.warn("patents delete warning:", patErr.message);

    // Citations
    const { error: citErr } = await supabase.from("citations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (citErr) console.warn("citations delete warning:", citErr.message);

    // Research Projects
    const { error: projErr } = await supabase.from("research_projects").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (projErr) console.warn("research_projects delete warning:", projErr.message);

    // Notifications related to claims
    const { error: notifErr } = await supabase.from("notifications").delete().not("claim_id", "is", null);
    if (notifErr) console.warn("notifications delete warning:", notifErr.message);

    // Audit logs for claims & documents
    const { error: auditErr } = await supabase.from("audit_logs").delete().in("entity_type", ["claims", "claim_documents", "claim_approvals"]);
    if (auditErr) console.warn("audit_logs delete warning:", auditErr.message);

    // 3. Delete all claims
    console.log("🗑️ Deleting all records from 'claims' table...");
    const { data: deletedClaims, error: claimsErr } = await supabase
      .from("claims")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")
      .select("id, claim_number");

    if (claimsErr) {
      console.error("❌ Failed to delete claims:", claimsErr.message);
      process.exit(1);
    }

    console.log(`✨ Success! Deleted ${deletedClaims ? deletedClaims.length : 0} claims.`);
    console.log("🎉 All claims, documents, approvals, notifications & storage files have been cleanly wiped!");
  } catch (err) {
    console.error("Cleanup error:", err);
  }
}

cleanAllClaims();
