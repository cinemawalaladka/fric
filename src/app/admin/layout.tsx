"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ADMIN_NAV } from "@/lib/constants";
import { getCurrentUserRoles, getFacultyProfileData } from "@/app/actions/dashboard";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState("System Administrator");
  const [userEmail, setUserEmail] = useState("");
  const [checkingAccess, setCheckingAccess] = useState(true);

  const checkAccess = useCallback(() => {
    getCurrentUserRoles()
      .then((res) => {
        if (res.success && res.roles && res.roles.includes("SUPER_ADMIN")) {
          if (res.isAdminCookie) {
            setUserName("Niraj Shah (Super Admin)");
            setUserEmail("admin@ppsu.in");
          } else {
            // If accessing via db user (e.g. faculty with admin role), fetch their faculty profile
            getFacultyProfileData().then((profileRes) => {
              if (profileRes.success && profileRes.profile) {
                const profile = profileRes.profile as { name: string; email: string };
                setUserName(profile.name || "Niraj Shah (Super Admin)");
                setUserEmail(profile.email || "admin@ppsu.in");
              } else {
                setUserName("Niraj Shah (Super Admin)");
                setUserEmail("admin@ppsu.in");
              }
            });
          }
          setCheckingAccess(false);
        } else {
          router.replace("/admin-login");
        }
      })
      .catch(() => {
        router.replace("/admin-login");
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

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/login");
  };

  if (checkingAccess) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-red-500 mb-3" />
        <p className="text-sm font-medium">Verifying Administrator Permissions...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar
        navItems={ADMIN_NAV}
        role="Super Admin"
        userName={userName}
        userEmail={userEmail}
        onLogout={handleLogout}
      />
      <main className="flex-1 p-6 lg:p-8 pt-16 lg:pt-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
