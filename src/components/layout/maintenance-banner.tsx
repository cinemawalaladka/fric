"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { getSystemMaintenanceStatus } from "@/app/actions/dashboard";
import { ShieldAlert, Lock, AlertTriangle } from "lucide-react";

export function MaintenanceBanner() {
  const pathname = usePathname();
  const [status, setStatus] = useState<{
    maintenanceMode: boolean;
    allowSubmissions: boolean;
  }>({
    maintenanceMode: false,
    allowSubmissions: true,
  });

  const checkStatus = useCallback(() => {
    getSystemMaintenanceStatus().then((res) => {
      if (res.success) {
        setStatus({
          maintenanceMode: res.maintenanceMode,
          allowSubmissions: res.allowSubmissions,
        });
      }
    });
  }, []);

  useEffect(() => {
    checkStatus();

    const handleFocus = () => checkStatus();
    window.addEventListener("focus", handleFocus);

    // Poll every 15 seconds to immediately reflect admin changes
    const interval = setInterval(checkStatus, 15000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [pathname, checkStatus]);

  if (status.maintenanceMode) {
    return (
      <div
        role="alert"
        className="w-full bg-red-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs font-semibold tracking-wide border-b border-red-700 animate-in fade-in slide-in-from-top-2 duration-300"
      >
        <div className="flex items-center gap-2.5 mx-auto text-center">
          <ShieldAlert className="h-4 w-4 shrink-0 text-white animate-bounce" />
          <span>
            <strong className="uppercase font-black tracking-wider mr-1.5 bg-red-900/60 px-2 py-0.5 rounded text-[11px]">
              System Maintenance Mode Active
            </strong>
            The portal is currently undergoing policy reviews or system upgrades. New claim submissions and edits are temporarily restricted.
          </span>
        </div>
      </div>
    );
  }

  if (!status.allowSubmissions && !status.maintenanceMode) {
    return (
      <div
        role="alert"
        className="w-full bg-amber-600 text-white px-4 py-2 shadow-xs flex items-center justify-between text-xs font-medium tracking-wide border-b border-amber-700 animate-in fade-in duration-300"
      >
        <div className="flex items-center gap-2 mx-auto text-center">
          <Lock className="h-3.5 w-3.5 shrink-0 text-amber-100" />
          <span>
            <strong>Submission Window Notice:</strong> New research incentive claim submissions are currently closed by university administration.
          </span>
        </div>
      </div>
    );
  }

  return null;
}
