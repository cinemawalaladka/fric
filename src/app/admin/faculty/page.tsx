"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, MoreHorizontal, GraduationCap, Building2, UserCheck, AlertTriangle, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getAdminUsers } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

interface FacultyMember {
  faculty_id: string;
  name: string;
  email: string;
  employee_id: string;
  designation: string;
  status: string;
  department_name: string | null;
  roles: string[];
}

export default function FacultyManagementPage() {
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");

  const fetchFaculty = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminUsers();
      if (res.success && res.users) {
        // Filter out non-faculty (users without FACULTY role) or show all faculty profiles
        const facultyList = (res.users as unknown as FacultyMember[]).filter(
          (u) => u.roles.includes("FACULTY")
        );
        setFaculty(facultyList);
      } else {
        setError(res.error || "Failed to fetch faculty records.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const departments = Array.from(
    new Set(faculty.map((f) => f.department_name).filter(Boolean))
  );

  const filtered = faculty.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.email.toLowerCase().includes(search.toLowerCase()) ||
      (f.employee_id && f.employee_id.toLowerCase().includes(search.toLowerCase()));
    const matchesDept = deptFilter === "ALL" || f.department_name === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Faculty Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            View, audit, and manage official faculty profiles and designations
          </p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-slate-200 p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, email, or employee ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50/50 border-slate-200 text-xs h-9 rounded-none"
              disabled={loading}
            />
          </div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="h-9 px-3 border border-slate-200 bg-slate-50/50 text-xs text-slate-700 focus:outline-none rounded-none cursor-pointer"
            disabled={loading}
          >
            <option value="ALL">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept || ""}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 p-4 flex items-center justify-between text-xs text-red-700 font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchFaculty} className="h-7 text-xs border-red-300 text-red-800 rounded-none">
            Retry
          </Button>
        </div>
      )}

      {/* Faculty Data Table */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Faculty Profiles
          </h3>
          <span className="text-xs font-mono font-semibold text-slate-500">
            {loading ? "Loading..." : `${filtered.length} Profiles Listed`}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-slate-600 mb-2" />
            <p className="text-xs font-medium">Fetching faculty profiles from database...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="text-xs font-medium">No faculty records match your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Faculty Name</th>
                  <th className="py-3 px-4">Emp ID</th>
                  <th className="py-3 px-4">Department / School</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((member) => (
                  <tr key={member.faculty_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{member.name}</span>
                          <span className="text-[11px] text-slate-500">{member.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-700 font-bold whitespace-nowrap">
                      {member.employee_id || "—"}
                    </td>

                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {member.department_name || "Unassigned"}
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {member.designation || "—"}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={cn(
                          "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                          member.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        {member.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-7 px-2 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs inline-flex items-center gap-1 cursor-pointer">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-none shadow-md">
                          <DropdownMenuItem className="text-xs">
                            <UserCheck className="mr-2 h-3.5 w-3.5 text-slate-700" />
                            Verify Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs">
                            <GraduationCap className="mr-2 h-3.5 w-3.5 text-slate-700" />
                            Update Designation
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
    </div>
  );
}
