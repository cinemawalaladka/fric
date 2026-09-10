"use server";

import { createClient } from "@/lib/supabase/server";
import { type AuditAction } from "@/types";

interface AuditLogParams {
  entityType: string;
  entityId: string;
  action: AuditAction;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    const supabase = await createClient();

    // Get current user session
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("audit_logs")
      .insert({
        user_id: user?.id || null,
        entity_type: params.entityType,
        entity_id: params.entityId,
        action: params.action,
        old_value: params.oldValue || null,
        new_value: params.newValue || null,
        ip_address: params.ipAddress || null,
      });

    if (error) {
      console.error("Error creating audit log:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Unexpected error creating audit log:", err);
    return { success: false, error: "Internal server error" };
  }
}
