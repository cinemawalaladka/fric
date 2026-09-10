"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MaintenanceBanner } from "@/components/layout/maintenance-banner";
import { VERIFIER_NAV, getVerifierStageInfo } from "@/lib/constants";
import { getFacultyProfileData, getCurrentUserRoles } from "@/app/actions/dashboard";
import { Loader2 } from "lucide-react";

const VERIFICATION_ROLES = ["HOD", "RESEARCH_COMMITTEE_MEMBER", "GOVERNOR", "PROVOST", "RESEARCH_VERIFIER", "SUPER_ADMIN"];

export default function VerifierLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState("Research Verifier");
  const [userEmail, setUserEmail] = useState("");
  const [roleLabel, setRoleLabel] = useState<string>("Research Verifier");
  const [checkingAccess, setCheckingAccess] = useState(true);

  const checkAccess = useCallback(() => {
    getCurrentUserRoles().then((res) => {
      if (res.success && res.roles) {
        const hasAccess = res.roles.some((role) => VERIFICATION_ROLES.includes(role));
        if (!hasAccess) {
          router.replace("/faculty/dashboard");
          return;
        }
      }
      setCheckingAccess(false);
    });
  }, [router]);

  useEffect(() => {
    // Check access on mount, every navigation, and window focus
    checkAccess();

    const handleFocus = () => checkAccess();
    window.addEventListener("focus", handleFocus);

    const interval = setInterval(checkAccess, 30000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [pathname, checkAccess]);

  useEffect(() => {
    getFacultyProfileData().then((res) => {
      if (res.success && res.profile) {
        const profile = res.profile as { name: string; email: string; designation?: string };
        setUserName(profile.name);
        setUserEmail(profile.email);
        const stageInfo = getVerifierStageInfo(profile.designation);
        setRoleLabel(`Verifier (${stageInfo.shortName})`);
      }
    });
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (checkingAccess) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-3" />
        <p className="text-sm font-medium">Verifying Verifier Permissions...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar navItems={VERIFIER_NAV} role={roleLabel as any} userName={userName} userEmail={userEmail} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <MaintenanceBanner />
        <main className="flex-1 p-6 lg:p-8 pt-16 lg:pt-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
