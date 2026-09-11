"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface PasswordChangeResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

/**
 * Handles the mandatory first-time password change for any user.
 * Updates the user's password in Supabase Auth, clears must_change_password in user_metadata,
 * updates the faculty record, and returns the appropriate dashboard redirect URL.
 */
export async function completeFirstTimePasswordChange(
  newPassword: string
): Promise<PasswordChangeResult> {
  if (!newPassword || newPassword.length < 8) {
    return {
      success: false,
      error: "New password must be at least 8 characters long.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return {
        success: false,
        error: "Session expired or user not authenticated. Please log in again.",
      };
    }

    const adminSupabase = createAdminClient();

    // 1. Update password and clear must_change_password in auth user_metadata
    const { error: updateAuthErr } = await adminSupabase.auth.admin.updateUserById(
      user.id,
      {
        password: newPassword,
        user_metadata: {
          ...user.user_metadata,
          must_change_password: false,
          password_updated_at: new Date().toISOString(),
        },
      }
    );

    if (updateAuthErr) {
      return {
        success: false,
        error: updateAuthErr.message || "Failed to update password in authentication service.",
      };
    }

    // 2. Schema-safely update public.faculty if column exists
    try {
      await adminSupabase
        .from("faculty")
        .update({
          must_change_password: false,
          updated_at: new Date().toISOString(),
        })
        .eq("auth_user_id", user.id);
    } catch {
      // Ignored if column not yet added to live table
    }

    // 3. Determine redirect URL based on active roles
    const { data: userRoles } = await adminSupabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id)
      .eq("status", "ACTIVE");

    const roles = (userRoles || [])
      .map((ur: Record<string, unknown>) => {
        const role = ur.roles as { name: string } | null;
        return role?.name;
      })
      .filter((name): name is string => Boolean(name));

    let redirectTo = "/faculty/dashboard";
    if (roles.includes("SUPER_ADMIN")) {
      redirectTo = "/admin/dashboard";
    } else if (
      roles.some((role) =>
        [
          "HOD",
          "RESEARCH_COMMITTEE_MEMBER",
          "GOVERNOR",
          "PROVOST",
          "RESEARCH_VERIFIER",
        ].includes(role)
      )
    ) {
      redirectTo = "/verifier/dashboard";
    }

    return {
      success: true,
      redirectTo,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "An unexpected error occurred while updating your password.",
    };
  }
}
