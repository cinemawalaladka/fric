"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MaintenanceBanner } from "@/components/layout/maintenance-banner";
import { FACULTY_NAV } from "@/lib/constants";
import { getFacultyProfileData } from "@/app/actions/dashboard";

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userName, setUserName] = useState("Faculty User");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    getFacultyProfileData().then((res) => {
      if (res.success && res.profile) {
        const profile = res.profile as { name: string; email: string };
        setUserName(profile.name);
        setUserEmail(profile.email);
      }
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen">
      <AppSidebar navItems={FACULTY_NAV} role="Faculty" userName={userName} userEmail={userEmail} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <MaintenanceBanner />
        <main className="flex-1 p-6 lg:p-8 pt-16 lg:pt-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
