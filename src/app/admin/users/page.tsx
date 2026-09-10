"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Search,
  MoreHorizontal,
  Shield,
  User,
  Eye,
  Loader2,
  AlertTriangle,
  Check,
  Plus,
  Building2,
  BadgeCheck,
  Mail,
  UserCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getAdminUsers,
  assignUserRole,
  removeUserRole,
  updateFacultyProfile,
  getDepartments,
} from "@/app/actions/admin";
import { type UserRole, type FacultyStatus } from "@/types";
import { cn } from "@/lib/utils";

const ROLE_COLORS: Record<string, string> = {
  FACULTY: "bg-blue-400/10 text-blue-500 border-blue-400/20",
  HOD: "bg-cyan-400/10 text-cyan-500 border-cyan-400/20",
  RESEARCH_COMMITTEE_MEMBER: "bg-amber-400/10 text-amber-500 border-amber-400/20",
  GOVERNOR: "bg-emerald-400/10 text-emerald-500 border-emerald-400/20",
  PROVOST: "bg-green-400/10 text-green-500 border-green-400/20",
  RESEARCH_VERIFIER: "bg-amber-400/10 text-amber-500 border-amber-400/20",
  SUPER_ADMIN: "bg-red-400/10 text-red-500 border-red-400/20",
};

interface AdminUser {
  faculty_id: string;
  auth_user_id: string;
  name: string;
  email: string;
  employee_id: string;
  designation: string;
  status: FacultyStatus;
  department_name: string | null;
  department_code: string | null;
  roles: string[];
}

interface Department {
  id: string;
  name: string;
  code: string;
}

const AVAILABLE_ROLES: UserRole[] = [
  "FACULTY",
  "HOD",
  "RESEARCH_COMMITTEE_MEMBER",
  "GOVERNOR",
  "PROVOST",
  "SUPER_ADMIN",
];

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    FACULTY: "Faculty",
    HOD: "HOD",
    RESEARCH_COMMITTEE_MEMBER: "Committee (M1/M2)",
    GOVERNOR: "Governor",
    PROVOST: "Provost",
    SUPER_ADMIN: "Admin",
  };
  return labels[role] || role;
}

function roleDescription(role: string) {
  const descriptions: Record<string, string> = {
    FACULTY: "Submit and track research incentive claims",
    HOD: "Review department claims at Stage 1",
    RESEARCH_COMMITTEE_MEMBER: "Review assigned M1 or M2 committee stages",
    GOVERNOR: "Stage 4 Research Governance review",
    PROVOST: "Stage 5 Final sanction authority and amount modification",
    SUPER_ADMIN: "Full central system management",
  };
  return descriptions[role] || "Configured database role";
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Modals state
  const [viewUser, setViewUser] = useState<AdminUser | null>(null);
  const [rolesUser, setRolesUser] = useState<AdminUser | null>(null);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editEmpId, setEditEmpId] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
  const [editDeptId, setEditDeptId] = useState("");
  const [editStatus, setEditStatus] = useState<FacultyStatus>("ACTIVE");
  const [updating, setUpdating] = useState(false);
  const [selectedVerifierStage, setSelectedVerifierStage] = useState<string>("HOD_PRINCIPAL");
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);

  const fetchUsersData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resUsers, resDepts] = await Promise.all([
        getAdminUsers(),
        getDepartments(),
      ]);

      if (resUsers.success && resUsers.users) {
        setUsers(resUsers.users as unknown as AdminUser[]);
      } else {
        setError(resUsers.error || "Failed to fetch user records.");
      }

      if (resDepts.success && resDepts.departments) {
        setDepartments(resDepts.departments);
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersData();
  }, []);

  const openEditModal = (user: AdminUser) => {
    setEditUser(user);
    setEditName(user.name || "");
    setEditEmpId(user.employee_id || "");
    setEditDesignation(user.designation || "");
    // Find matching department ID if available
    const dept = departments.find((d) => d.name === user.department_name);
    setEditDeptId(dept ? dept.id : "");
    setEditStatus(user.status || "ACTIVE");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    setUpdating(true);
    try {
      const res = await updateFacultyProfile(editUser.faculty_id, {
        name: editName,
        employee_id: editEmpId,
        designation: editDesignation,
        department_id: editDeptId || undefined,
        status: editStatus,
      });

      if (res.success) {
        setEditUser(null);
        await fetchUsersData();
      } else {
        alert(res.error || "Failed to update profile.");
      }
    } catch {
      alert("An error occurred while saving user updates.");
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleRole = async (userId: string, roleName: UserRole, isCurrentlyAssigned: boolean) => {
    setRoleUpdating(roleName);
    try {
      let res;
      if (isCurrentlyAssigned) {
        res = await removeUserRole(userId, roleName);
      } else {
        res = await assignUserRole(userId, roleName, selectedVerifierStage);
      }

      if (res.success) {
        // Refresh local data & active modal user
        const resUsers = await getAdminUsers();
        if (resUsers.success && resUsers.users) {
          const updatedList = resUsers.users as unknown as AdminUser[];
          setUsers(updatedList);
          if (rolesUser) {
            const updatedActive = updatedList.find((u) => u.faculty_id === rolesUser.faculty_id);
            if (updatedActive) setRolesUser(updatedActive);
          }
        }
      } else {
        alert(res.error || "Failed to update role.");
      }
    } catch {
      alert("An unexpected error occurred while managing role.");
    } finally {
      setRoleUpdating(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.employee_id && u.employee_id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            User Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            View, edit profiles, and manage system roles for all registered users
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200 p-4 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, email, or employee ID..."
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
          <Button variant="outline" size="sm" onClick={fetchUsersData} className="h-7 text-xs border-red-300 text-red-800 rounded-none">
            Retry
          </Button>
        </div>
      )}

      {/* Users Data Table */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Registered Users
          </h3>
          <span className="text-xs font-mono font-semibold text-slate-500">
            {loading ? "Loading..." : `${filtered.length} Users Listed`}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-slate-600 mb-2" />
            <p className="text-xs font-medium">Fetching user records from database...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <User className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="text-xs font-medium">No user profiles matching your query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Emp ID</th>
                  <th className="py-3 px-4">Department / School</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">System Roles</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((user) => (
                  <tr key={user.faculty_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
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

                    <td className="py-3 px-4 font-mono text-slate-700 font-bold whitespace-nowrap">
                      {user.employee_id || "—"}
                    </td>

                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {user.department_name || "—"}
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {user.designation || "—"}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <span
                            key={role}
                            className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200"
                          >
                            {roleLabel(role)}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={cn(
                          "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                          user.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        {user.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label="User Actions"
                          className="h-7 px-2 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-none shadow-md">
                          <DropdownMenuItem onClick={() => setViewUser(user)}>
                            <Eye className="mr-2 h-3.5 w-3.5 text-slate-700" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setRolesUser(user)}>
                            <Shield className="mr-2 h-3.5 w-3.5 text-amber-600" />
                            Manage Roles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditModal(user)}>
                            <User className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                            Edit User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL 1: VIEW DETAILS ================= */}
      {viewUser && (
        <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                User Profile Details
              </DialogTitle>
              <DialogDescription>Full record for {viewUser.name}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/30">
                <Avatar className="h-12 w-12 border border-border/50">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                    {viewUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-base">{viewUser.name}</h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {viewUser.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-muted/20 border border-border/20 space-y-1">
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Employee ID</span>
                  <span className="font-mono font-medium">{viewUser.employee_id || "N/A"}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/20 border border-border/20 space-y-1">
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Designation</span>
                  <span className="font-medium">{viewUser.designation || "N/A"}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/20 border border-border/20 space-y-1">
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Department</span>
                  <span className="font-medium">{viewUser.department_name || "Unassigned"}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/20 border border-border/20 space-y-1">
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Status</span>
                  <Badge variant="outline" className="text-[10px]">
                    {viewUser.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-semibold text-slate-700 block">Assigned Roles</span>
                <div className="flex flex-wrap gap-2">
                  {viewUser.roles.map((role) => (
                    <Badge key={role} variant="outline" className={cn("text-xs font-medium px-2.5 py-0.5", ROLE_COLORS[role] || "")}>
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => setViewUser(null)} className="w-full">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ================= MODAL 2: MANAGE ROLES ================= */}
      {rolesUser && (
        <Dialog open={!!rolesUser} onOpenChange={() => setRolesUser(null)}>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-500" />
                Manage User Roles
              </DialogTitle>
              <DialogDescription>
                Assign or revoke roles for <strong className="text-foreground">{rolesUser.name}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-2">
              {AVAILABLE_ROLES.map((role) => {
                const isAssigned = rolesUser.roles.includes(role);
                return (
                  <div
                    key={role}
                    className="p-3 rounded-xl border border-border/40 bg-muted/20 hover:bg-accent/20 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">
                          {roleLabel(role)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {roleDescription(role)}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant={isAssigned ? "default" : "outline"}
                        className={cn(
                          "text-xs px-3 h-8",
                          isAssigned
                            ? role === "SUPER_ADMIN"
                              ? "bg-red-600 hover:bg-red-700 text-white"
                              : role === "RESEARCH_VERIFIER" || role === "RESEARCH_COMMITTEE_MEMBER"
                              ? "bg-amber-600 hover:bg-amber-700 text-white"
                              : role === "HOD"
                              ? "bg-cyan-600 hover:bg-cyan-700 text-white"
                              : role === "GOVERNOR" || role === "PROVOST"
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                            : "hover:bg-accent"
                        )}
                        disabled={roleUpdating === role}
                        onClick={() => handleToggleRole(rolesUser.auth_user_id, role, isAssigned)}
                      >
                        {roleUpdating === role ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : isAssigned ? (
                          <>
                            <Check className="mr-1 h-3.5 w-3.5" /> Assigned
                          </>
                        ) : (
                          <>
                            <Plus className="mr-1 h-3.5 w-3.5" /> Assign
                          </>
                        )}
                      </Button>
                    </div>

                    {(role === "RESEARCH_VERIFIER" || role === "RESEARCH_COMMITTEE_MEMBER" || role === "GOVERNOR" || role === "PROVOST" || role === "HOD") && (
                      <div className="pt-2 border-t border-border/30">
                        <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                          Assigned Verification Stage in Workflow:
                        </Label>
                        <select
                          value={selectedVerifierStage}
                          onChange={(e) => setSelectedVerifierStage(e.target.value)}
                          className="w-full h-8 text-xs rounded-lg border border-border/50 bg-background px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                        >
                          <option value="HOD_PRINCIPAL">Stage 1 - Department HOD Review</option>
                          <option value="COMMITTEE_M1">Stage 2 - Research Committee Member 1</option>
                          <option value="COMMITTEE_M2">Stage 3 - Research Committee Member 2</option>
                          <option value="GOVERNOR">Stage 4 - Governor Review</option>
                          <option value="PROVOST">Stage 5 - Provost Final Sanction</option>
                          <option value="ALL">All Stages (Global Verifier)</option>
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => setRolesUser(null)} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ================= MODAL 3: EDIT USER ================= */}
      {editUser && (
        <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
          <DialogContent className="sm:max-w-lg bg-card border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-500" />
                Edit User Profile
              </DialogTitle>
              <DialogDescription>Update details for {editUser.email}</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs font-semibold">
                  Full Name
                </Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-input/50 border-border/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-emp-id" className="text-xs font-semibold">
                    Employee ID
                  </Label>
                  <Input
                    id="edit-emp-id"
                    value={editEmpId}
                    onChange={(e) => setEditEmpId(e.target.value)}
                    className="bg-input/50 border-border/50"
                    placeholder="e.g. PPSU-FAC-2024-001"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-designation" className="text-xs font-semibold">
                    Designation
                  </Label>
                  <Input
                    id="edit-designation"
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value)}
                    className="bg-input/50 border-border/50"
                    placeholder="e.g. Associate Professor"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-dept" className="text-xs font-semibold">
                    Department
                  </Label>
                  <select
                    id="edit-dept"
                    value={editDeptId}
                    onChange={(e) => setEditDeptId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border/50 bg-input/50 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-status" className="text-xs font-semibold">
                    Account Status
                  </Label>
                  <select
                    id="edit-status"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as FacultyStatus)}
                    className="w-full h-10 px-3 rounded-lg border border-border/50 bg-input/50 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="ON_LEAVE">ON LEAVE</option>
                  </select>
                </div>
              </div>

              <DialogFooter className="pt-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditUser(null)}
                  disabled={updating}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  disabled={updating}
                >
                  {updating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
