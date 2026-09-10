"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAuditLog } from "./audit";
import { getVerifierStageInfo } from "@/lib/constants";

// Ensure the private storage bucket exists
async function ensureClaimDocumentsBucket() {
  try {
    const adminSupabase = createAdminClient();
    const { data: buckets } = await adminSupabase.storage.listBuckets();
    const bucketExists = buckets?.some(
      (b) => b.name === "claim-documents" || b.id === "claim-documents"
    );
    if (!bucketExists) {
      await adminSupabase.storage.createBucket("claim-documents", {
        public: false,
        fileSizeLimit: 52428800, // 50MB
      });
    }
  } catch (err) {
    console.warn("Bucket ensure check failed, continuing:", err);
  }
}

// Upload a single claim document via FormData
export async function uploadClaimDocument(
  claimId: string,
  documentType: string,
  formData: FormData
) {
  try {
    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No file provided in form data." };
    }

    // 50 MB limit check
    if (file.size > 50 * 1024 * 1024) {
      return { success: false, error: `File "${file.name}" exceeds the 50 MB size limit.` };
    }

    const adminSupabase = createAdminClient();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await ensureClaimDocumentsBucket();

    // Sanitize file name
    const rawName = file.name || "document.pdf";
    const sanitizedName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${claimId}/${Date.now()}_${sanitizedName}`;

    // Read bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage bucket
    const { error: uploadErr } = await adminSupabase.storage
      .from("claim-documents")
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadErr) {
      console.error("Storage upload error:", uploadErr);
      return { success: false, error: `Storage upload failed: ${uploadErr.message}` };
    }

    // Insert metadata record into claim_documents table
    const { data: docRecord, error: dbErr } = await adminSupabase
      .from("claim_documents")
      .insert({
        claim_id: claimId,
        document_type: documentType,
        file_name: rawName,
        storage_bucket: "claim-documents",
        storage_path: storagePath,
        file_size: file.size,
        mime_type: file.type || "application/octet-stream",
        uploaded_by: user?.id || null,
        verification_status: "PENDING",
      })
      .select()
      .single();

    if (dbErr) {
      console.error("Database insert error for document:", dbErr);
      return { success: false, error: dbErr.message };
    }

    // Audit log
    await createAuditLog({
      entityType: "claim_documents",
      entityId: docRecord.id,
      action: "CREATE",
      newValue: { file_name: rawName, claim_id: claimId, storage_path: storagePath },
    });

    return { success: true, document: docRecord };
  } catch (err: any) {
    console.error("Upload claim document error:", err);
    return { success: false, error: err.message || "Failed to upload document" };
  }
}

// Upload multiple claim documents sequentially/in-parallel
export async function uploadMultipleClaimDocuments(
  claimId: string,
  formData: FormData
) {
  try {
    const fileEntries: { type: string; file: File }[] = [];
    const keys = Array.from(formData.keys());

    // Check for keys formatted as file_[type]
    for (const key of keys) {
      if (key.startsWith("file_")) {
        const type = key.replace("file_", "");
        const file = formData.get(key) as File;
        if (file && typeof file !== "string" && file.size > 0) {
          fileEntries.push({ type, file });
        }
      }
    }

    // Fallback: Check for 'files' and 'types' arrays
    if (fileEntries.length === 0) {
      const allFiles = formData.getAll("files") as File[];
      const allTypes = formData.getAll("types") as string[];
      for (let i = 0; i < allFiles.length; i++) {
        const file = allFiles[i];
        if (file && typeof file !== "string" && file.size > 0) {
          fileEntries.push({
            type: allTypes[i] || "Supporting Document",
            file,
          });
        }
      }
    }

    if (fileEntries.length === 0) {
      return { success: true, count: 0, documents: [] };
    }

    const uploadedDocs = [];
    const errors: string[] = [];

    for (const entry of fileEntries) {
      const singleFormData = new FormData();
      singleFormData.append("file", entry.file);
      const res = await uploadClaimDocument(claimId, entry.type, singleFormData);
      if (res.success && res.document) {
        uploadedDocs.push(res.document);
      } else {
        errors.push(`${entry.type}: ${res.error || "Upload failed"}`);
      }
    }

    if (uploadedDocs.length === 0 && errors.length > 0) {
      return { success: false, error: errors.join(", ") };
    }

    return {
      success: true,
      count: uploadedDocs.length,
      documents: uploadedDocs,
      warnings: errors.length > 0 ? errors : undefined,
    };
  } catch (err: any) {
    console.error("Batch upload error:", err);
    return { success: false, error: err.message || "Batch upload failed" };
  }
}

// Generate secure signed URL for private storage access (valid for 60 mins)
export async function getDocumentDownloadUrl(storagePath: string) {
  try {
    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase.storage
      .from("claim-documents")
      .createSignedUrl(storagePath, 60 * 60); // Valid for 1 hour

    if (error) {
      console.error("Error generating signed download URL:", error);
      return { success: false, error: error.message };
    }

    return { success: true, signedUrl: data.signedUrl };
  } catch (err: any) {
    console.error("Signed URL error:", err);
    return { success: false, error: "Internal server error" };
  }
}

// Delete document from storage and metadata
export async function deleteClaimDocument(documentId: string, storagePath: string) {
  try {
    const adminSupabase = createAdminClient();

    // 1. Delete from Supabase Storage
    const { error: storageErr } = await adminSupabase.storage
      .from("claim-documents")
      .remove([storagePath]);

    if (storageErr) {
      console.warn("Storage removal warning (might already be deleted):", storageErr);
    }

    // 2. Delete from claim_documents table
    const { error: dbErr } = await adminSupabase
      .from("claim_documents")
      .delete()
      .eq("id", documentId);

    if (dbErr) {
      return { success: false, error: dbErr.message };
    }

    // Log audit
    await createAuditLog({
      entityType: "claim_documents",
      entityId: documentId,
      action: "DELETE",
      oldValue: { storage_path: storagePath },
    });

    return { success: true };
  } catch (err) {
    console.error("Delete document error:", err);
    return { success: false, error: "Internal server error" };
  }
}

// Fetch all documents for Verifiers review table
export async function getAllDocumentsForVerifier() {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized access." };

    // Fetch user's faculty profile & roles
    const [{ data: profile }, { data: userRoles }] = await Promise.all([
      adminSupabase
        .from("faculty")
        .select("id, designation, department_id")
        .eq("auth_user_id", user.id)
        .maybeSingle(),
      adminSupabase
        .from("user_roles")
        .select("roles(name)")
        .eq("user_id", user.id)
        .eq("status", "ACTIVE"),
    ]);

    const roles = (userRoles || [])
      .map((row: any) => (Array.isArray(row.roles) ? row.roles[0]?.name : row.roles?.name))
      .filter(Boolean) as string[];

    const verifierStageInfo = getVerifierStageInfo(profile?.designation, roles);
    const verifierStage = verifierStageInfo.code;

    if (verifierStage === "NONE") {
      return { success: false, error: "Unauthorized access. No verifier role assigned." };
    }

    let query = adminSupabase
      .from("claim_documents")
      .select(`
        id,
        claim_id,
        document_type,
        file_name,
        storage_path,
        file_size,
        mime_type,
        verification_status,
        created_at,
        claim:claims!inner(
          id,
          claim_number,
          status,
          current_stage,
          claimed_amount,
          faculty_id,
          faculty:faculty!inner(id, name, email, employee_id, designation, department_id, department:departments(name, code))
        )
      `);

    if (verifierStage !== "ALL") {
      query = query.eq("claim.current_stage", verifierStage);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch all verifier documents error:", error);
      return { success: false, error: error.message };
    }

    let documents = data || [];

    // Filter out self-submitted claims
    if (profile?.id) {
      documents = documents.filter((doc: any) => doc.claim?.faculty_id !== profile.id);
    }

    // For HOD: Filter to only claimant faculty from the same department
    if (verifierStage === "HOD_PRINCIPAL" && profile?.department_id) {
      documents = documents.filter(
        (doc: any) => doc.claim?.faculty?.department_id === profile.department_id
      );
    }

    return { success: true, documents };
  } catch (err: any) {
    console.error("Get all documents error:", err);
    return { success: false, error: "Internal server error" };
  }
}

// Update single document verification status (VERIFIED / REJECTED / PENDING)
export async function updateDocumentVerificationStatus(
  documentId: string,
  status: "PENDING" | "VERIFIED" | "REJECTED",
  remarks?: string
) {
  try {
    const adminSupabase = createAdminClient();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await adminSupabase
      .from("claim_documents")
      .update({
        verification_status: status,
        verified_by: user?.id || null,
        verified_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    // Record in document_verifications table if user logged in
    if (user?.id) {
      await adminSupabase.from("document_verifications").insert({
        claim_document_id: documentId,
        verifier_id: user.id,
        status,
        remarks: remarks || null,
      });
    }

    await createAuditLog({
      entityType: "claim_documents",
      entityId: documentId,
      action: "VERIFY",
      newValue: { verification_status: status, remarks },
    });

    return { success: true, document: data };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update status" };
  }
}
