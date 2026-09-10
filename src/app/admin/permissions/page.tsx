"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Key, Loader2, Check, AlertTriangle } from "lucide-react";
import { getRoles, getPermissions, getRolePermissions, toggleRolePermission } from "@/app/actions/admin";

interface Role {
  id: string;
  name: string;
  description: string;
}

interface Permission {
  id: string;
  name: string;
  code: string;
  description: string;
}

function getRoleDisplayName(roleName: string) {
  const map: Record<string, string> = {
    FACULTY: "Faculty",
    HOD: "HOD",
    RESEARCH_COMMITTEE_MEMBER: "Committee Member",
    GOVERNOR: "Governor",
    PROVOST: "Provost",
    RESEARCH_VERIFIER: "Verifier",
    SUPER_ADMIN: "Super Admin",
  };
  return map[roleName] || roleName;
}

export default function PermissionManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [assignedPerms, setAssignedPerms] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [updatingPerm, setUpdatingPerm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1. Initial Load: Fetch Roles and Permissions
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesRes, permsRes] = await Promise.all([getRoles(), getPermissions()]);

      if (rolesRes.success && rolesRes.roles) {
        setRoles(rolesRes.roles as Role[]);
        // Set FACULTY or first role by default
        const defaultRole = (rolesRes.roles as Role[]).find((r) => r.name === "FACULTY") || rolesRes.roles[0];
        setSelectedRole(defaultRole || null);
      } else {
        setError(rolesRes.error || "Failed to load roles.");
      }

      if (permsRes.success && permsRes.permissions) {
        setPermissions(permsRes.permissions as Permission[]);
      } else {
        setError(permsRes.error || "Failed to load permissions.");
      }
    } catch {
      setError("An unexpected error occurred while loading permissions data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 2. Load Permissions for selected Role
  useEffect(() => {
    if (!selectedRole) return;

    const fetchRolePerms = async () => {
      try {
        const res = await getRolePermissions(selectedRole.id);
        if (res.success && res.permissionIds) {
          setAssignedPerms(res.permissionIds);
        }
      } catch {
        setError("Failed to fetch permissions for the selected role.");
      }
    };

    fetchRolePerms();
  }, [selectedRole]);

  // 3. Handle Permission Toggle
  const handleToggle = async (permissionId: string, isChecked: boolean) => {
    if (!selectedRole) return;
    setUpdatingPerm(permissionId);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await toggleRolePermission(selectedRole.id, permissionId, isChecked);
      if (res.success) {
        setAssignedPerms((prev) =>
          isChecked ? [...prev, permissionId] : prev.filter((id) => id !== permissionId)
        );
        setSuccessMsg("Permissions updated successfully.");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(res.error || "Failed to update permission.");
      }
    } catch {
      setError("An error occurred while updating permissions.");
    } finally {
      setUpdatingPerm(null);
    }
  };

  // Group permissions by category/prefix
  const getGroupLabel = (code: string) => {
    if (code.startsWith("claim.") || code.startsWith("claims:")) return "Claims Lifecycle";
    if (code.startsWith("document.") || code.startsWith("documents:")) return "Document Control";
    if (code.startsWith("user.") || code.startsWith("role.") || code.startsWith("permission.") || code.startsWith("workflow.") || code.startsWith("rule.") || code.startsWith("settings.") || code.startsWith("admin:")) return "Administrative Operations";
    if (code.startsWith("audit.")) return "Security & Audit";
    if (code.startsWith("report.")) return "Reports & Analytics";
    return "General System";
  };

  const groupedPermissions = permissions.reduce<Record<string, Permission[]>>((groups, perm) => {
    const group = getGroupLabel(perm.code);
    if (!groups[group]) groups[group] = [];
    groups[group].push(perm);
    return groups;
  }, {});

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Permission Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure role-based action permissions and policies dynamically
          </p>
        </div>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 p-4 flex items-center justify-between text-xs text-red-700 font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} className="h-7 text-xs border-red-300 text-red-800 rounded-none">
            Retry
          </Button>
        </div>
      )}

      {successMsg && (
        <div className="border border-emerald-300 bg-emerald-50 text-emerald-800 p-4 flex items-center gap-3 text-xs font-semibold">
          <Check className="h-5 w-5 shrink-0 text-emerald-600" />
          <p>{successMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Roles Selection Tabs */}
        <div className="bg-white border border-slate-200 overflow-hidden shadow-xs lg:col-span-4 h-fit">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-700" />
              Access Roles
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Select a role to configure its action matrix</p>
          </div>
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="flex justify-center py-12 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
              </div>
            ) : (
              roles.map((role) => {
                const isActive = selectedRole?.id === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role)}
                    className={`w-full text-left p-4 transition-colors cursor-pointer block ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs uppercase tracking-wider">
                        {getRoleDisplayName(role.name)}
                      </span>
                      {isActive && <Check className="h-4 w-4 text-white" />}
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                      {role.description}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Permission Matrix Table */}
        <div className="bg-white border border-slate-200 overflow-hidden shadow-xs lg:col-span-8">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Key className="h-4 w-4 text-slate-700" />
                Permission Matrix
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Capabilities for <strong>{getRoleDisplayName(selectedRole?.name || "")}</strong>
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-1 border border-slate-200">
              {assignedPerms.length} Granted
            </span>
          </div>

          <div className="p-6 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-slate-600 mb-2" />
                <p className="text-xs font-medium">Fetching permission mappings...</p>
              </div>
            ) : (
              Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category} className="border border-slate-200 overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {category}
                    </h4>
                  </div>
                  <div className="divide-y divide-slate-100 bg-white">
                    {perms.map((perm) => {
                      const isAssigned = assignedPerms.includes(perm.id);
                      const isUpdating = updatingPerm === perm.id;
                      return (
                        <div
                          key={perm.id}
                          className="flex items-start gap-3 p-3.5 hover:bg-slate-50/70 transition-colors"
                        >
                          <Checkbox
                            id={perm.id}
                            checked={isAssigned}
                            disabled={!!updatingPerm}
                            onCheckedChange={(checked) => handleToggle(perm.id, !!checked)}
                            className="mt-0.5 rounded-none"
                          />
                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor={perm.id}
                              className="text-xs font-bold text-slate-900 cursor-pointer block"
                            >
                              {perm.name}
                            </label>
                            <p className="text-xs text-slate-500 mt-0.5 leading-normal">
                              {perm.description}
                            </p>
                            <code className="text-[10px] font-mono text-slate-400 mt-1 inline-block">
                              {perm.code}
                            </code>
                          </div>
                          {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-900 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
