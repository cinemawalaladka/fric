"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, Search, Check, Loader2, AlertTriangle } from "lucide-react";
import { getAdminUsers, assignUserRole, removeUserRole } from "@/app/actions/admin";
import { type UserRole } from "@/types";
import { cn } from "@/lib/utils";

interface RoleUser {
  faculty_id: string;
  auth_user_id: string;
  name: string;
  email: string;
  status: string;
  designation?: string;
  roles: string[];
}

const SYSTEM_ROLES = [
  { key: "FACULTY", label: "Faculty" },
  { key: "HOD", label: "HOD" },
  { key: "M1", label: "M1" },
  { key: "M2", label: "M2" },
  { key: "GOVERNOR", label: "Governor" },
  { key: "PROVOST", label: "Provost" },
  { key: "SUPER_ADMIN", label: "Admin" },
];

function isRoleAssigned(user: RoleUser, roleKey: string): boolean {
  const roles = user.roles || [];
  const desig = (user.designation || "").toUpperCase();

  if (roleKey === "FACULTY") {
    return roles.includes("FACULTY");
  }
  if (roleKey === "HOD") {
    return roles.includes("HOD") || desig.includes("HOD");
  }
  if (roleKey === "M1") {
    return (
      (roles.includes("RESEARCH_COMMITTEE_MEMBER") || roles.includes("M1")) &&
      (desig.includes("M1") || (!desig.includes("M2") && roles.includes("RESEARCH_COMMITTEE_MEMBER")))
    );
  }
  if (roleKey === "M2") {
    return (
      roles.includes("M2") ||
      (roles.includes("RESEARCH_COMMITTEE_MEMBER") && desig.includes("M2"))
    );
  }
  if (roleKey === "GOVERNOR") {
    return roles.includes("GOVERNOR") || desig.includes("GOVERNOR");
  }
  if (roleKey === "PROVOST") {
    return roles.includes("PROVOST") || desig.includes("PROVOST");
  }
  if (roleKey === "SUPER_ADMIN") {
    return roles.includes("SUPER_ADMIN");
  }
  return false;
}

export default function RoleManagementPage() {
  const [users, setUsers] = useState<RoleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminUsers();
      if (res.success && res.users) {
        setUsers(res.users as unknown as RoleUser[]);
      } else {
        setError(res.error || "Failed to fetch user roles.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (user: RoleUser, roleKey: string, isCurrentlyAssigned: boolean) => {
    const targetUserId = user.auth_user_id || user.faculty_id;
    setUpdatingUser(`${targetUserId}-${roleKey}`);
    try {
      let res;
      if (isCurrentlyAssigned) {
        res = await removeUserRole(targetUserId, roleKey);
      } else {
        res = await assignUserRole(targetUserId, roleKey);
      }

      if (res.success) {
        await fetchUsers();
      } else {
        alert(res.error || "Failed to update role.");
      }
    } catch {
      alert("An error occurred while updating roles.");
    } finally {
      setUpdatingUser(null);
    }
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Role Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Assign and manage sequential workflow roles and central governance access
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200 p-4 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by user name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-50/50 border-slate-200 text-xs h-9 rounded-none"
            disabled={loading}
          />
        </div>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 p-4 flex items-center justify-between text-xs text-red-700 font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchUsers} className="h-7 text-xs border-red-300 text-red-800 rounded-none">
            Retry
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Roles Table */}
        <div className="bg-white border border-slate-200 overflow-hidden shadow-xs lg:col-span-2">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              System Access Matrix
            </h3>
            <span className="text-xs font-mono font-semibold text-slate-500">
              {loading ? "Loading..." : `${filtered.length} Users`}
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-slate-600 mb-2" />
              <p className="text-xs font-medium">Fetching role permissions...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Shield className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-xs font-medium">No users found matching query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role Privileges (Click to Toggle)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((user) => (
                    <tr key={user.faculty_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap align-top">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{user.name}</span>
                            <span className="text-[11px] text-slate-500">{user.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {SYSTEM_ROLES.map((role) => {
                            const isAssigned = isRoleAssigned(user, role.key);
                            const targetUserId = user.auth_user_id || user.faculty_id;
                            const isThisUpdating = updatingUser === `${targetUserId}-${role.key}`;
                            return (
                              <button
                                key={role.key}
                                onClick={() => handleRoleChange(user, role.key, isAssigned)}
                                disabled={!!updatingUser}
                                className={cn(
                                  "px-2.5 py-1 text-[11px] font-bold transition-all border inline-flex items-center gap-1 cursor-pointer",
                                  isAssigned
                                    ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                                )}
                              >
                                {isThisUpdating ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : isAssigned ? (
                                  <Check className="h-3 w-3 stroke-[3]" />
                                ) : null}
                                {role.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Roles Reference Box */}
        <div className="bg-white border border-slate-200 overflow-hidden shadow-xs h-fit">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-700" />
              Role Reference
            </h3>
          </div>
          <div className="p-6 space-y-3.5 text-xs text-slate-600 leading-relaxed divide-y divide-slate-100">
            <div className="pt-0">
              <p className="font-bold text-slate-900 mb-0.5 text-xs uppercase tracking-wider">Faculty</p>
              <p className="text-[11px] text-slate-500">Base role for creating claims, draft management, and incentive tracking.</p>
            </div>
            <div className="pt-2.5">
              <p className="font-bold text-slate-900 mb-0.5 text-xs uppercase tracking-wider">HOD</p>
              <p className="text-[11px] text-slate-500">Stage 1 departmental verifier for initial claim eligibility & endorsement.</p>
            </div>
            <div className="pt-2.5">
              <p className="font-bold text-slate-900 mb-0.5 text-xs uppercase tracking-wider">M1 & M2</p>
              <p className="text-[11px] text-slate-500">Stages 2 & 3 Research Committee reviewers for technical validation & indexing checks.</p>
            </div>
            <div className="pt-2.5">
              <p className="font-bold text-slate-900 mb-0.5 text-xs uppercase tracking-wider">Governor</p>
              <p className="text-[11px] text-slate-500">Stage 4 Research Governance review prior to final sanction.</p>
            </div>
            <div className="pt-2.5">
              <p className="font-bold text-slate-900 mb-0.5 text-xs uppercase tracking-wider">Provost</p>
              <p className="text-[11px] text-slate-500">Stage 5 Final sanction authority with payout modification permissions.</p>
            </div>
            <div className="pt-2.5">
              <p className="font-bold text-slate-900 mb-0.5 text-xs uppercase tracking-wider">Admin</p>
              <p className="text-[11px] text-slate-500">Full central system configuration, user privileges, and audit log access.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
