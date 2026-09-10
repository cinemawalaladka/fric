import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAuditLog } from "@/app/actions/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const claimId = formData.get("claimId") as string;
    const documentType = formData.get("documentType") as string;
    const file = formData.get("file") as File | null;

    if (!claimId || !documentType || !file) {
      return NextResponse.json(
        { success: false, error: "Missing claimId, documentType or file" },
        { status: 400 }
      );
    }

    // 50MB limit check
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: `File "${file.name}" exceeds 50 MB limit.` },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // Ensure bucket exists
    const { data: buckets } = await adminSupabase.storage.listBuckets();
    const bucketExists = buckets?.some(
      (b) => b.name === "claim-documents" || b.id === "claim-documents"
    );
    if (!bucketExists) {
      await adminSupabase.storage.createBucket("claim-documents", {
        public: false,
        fileSizeLimit: 52428800,
      });
    }

    const rawName = file.name || "document.pdf";
    const sanitizedName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${claimId}/${Date.now()}_${sanitizedName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadErr } = await adminSupabase.storage
      .from("claim-documents")
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadErr) {
      return NextResponse.json(
        { success: false, error: `Storage upload failed: ${uploadErr.message}` },
        { status: 500 }
      );
    }

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
        uploaded_by: user.id,
        verification_status: "PENDING",
      })
      .select()
      .single();

    if (dbErr) {
      return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 });
    }

    await createAuditLog({
      entityType: "claim_documents",
      entityId: docRecord.id,
      action: "CREATE",
      newValue: { file_name: rawName, claim_id: claimId, storage_path: storagePath },
    });

    return NextResponse.json({ success: true, document: docRecord });
  } catch (err: any) {
    console.error("API document upload error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Upload failed" },
      { status: 500 }
    );
  }
}
