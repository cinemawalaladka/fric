"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Calendar,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  Check,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getAdminAcademicYears,
  setActiveAcademicYear,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
} from "@/app/actions/admin";
import { format } from "date-fns";

interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export default function AcademicYearsPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formIsActive, setFormIsActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchYears = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminAcademicYears();
      if (res.success && res.academicYears) {
        setYears(res.academicYears as AcademicYear[]);
      } else {
        setError(res.error || "Failed to fetch academic years.");
      }
    } catch {
      setError("An unexpected error occurred while loading academic periods.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  const handleSetActive = async (id: string, name: string) => {
    if (!confirm(`Set "${name}" as the active academic cycle? All faculty submissions will be assigned to this period.`)) {
      return;
    }

    try {
      const res = await setActiveAcademicYear(id);
      if (res.success) {
        await fetchYears();
      } else {
        alert(res.error || "Failed to switch active academic year.");
      }
    } catch {
      alert("An unexpected error occurred.");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formStartDate || !formEndDate) return;

    setSubmitting(true);
    try {
      const res = await createAcademicYear({
        name: formName,
        start_date: formStartDate,
        end_date: formEndDate,
        is_active: formIsActive,
      });

      if (res.success) {
        setIsAddOpen(false);
        setFormName("");
        setFormStartDate("");
        setFormEndDate("");
        setFormIsActive(false);
        await fetchYears();
      } else {
        alert(res.error || "Failed to create academic year.");
      }
    } catch {
      alert("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingYear) return;

    setSubmitting(true);
    try {
      const res = await updateAcademicYear(editingYear.id, {
        name: formName,
        start_date: formStartDate,
        end_date: formEndDate,
        is_active: formIsActive,
      });

      if (res.success) {
        setIsEditOpen(false);
        setEditingYear(null);
        await fetchYears();
      } else {
        alert(res.error || "Failed to update academic year.");
      }
    } catch {
      alert("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete academic period "${name}"? Only periods without submitted claims can be safely removed.`)) {
      return;
    }

    try {
      const res = await deleteAcademicYear(id);
      if (res.success) {
        await fetchYears();
      } else {
        alert(res.error || "Failed to delete academic year. It may have associated claims.");
      }
    } catch {
      alert("An error occurred during deletion.");
    }
  };

  const openEditModal = (yr: AcademicYear) => {
    setEditingYear(yr);
    setFormName(yr.name);
    setFormStartDate(yr.start_date ? yr.start_date.slice(0, 10) : "");
    setFormEndDate(yr.end_date ? yr.end_date.slice(0, 10) : "");
    setFormIsActive(yr.is_active);
    setIsEditOpen(true);
  };

  const activeYear = years.find((y) => y.is_active);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Academic Years & Policy Cycles
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage university academic periods, claim submission eligibility windows, and active policy cycles
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setFormName("");
            setFormStartDate("");
            setFormEndDate("");
            setFormIsActive(false);
            setIsAddOpen(true);
          }}
          className="gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-none shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Academic Period
        </Button>
      </div>

      {/* Active Academic Cycle Spotlight (Sharp Box) */}
      {activeYear && (
        <div className="bg-white border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                Currently Active Cycle
              </span>
              <span className="text-xs text-slate-500 font-mono">Accepting Claims</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Academic Year {activeYear.name}
            </h2>
            <p className="text-xs text-slate-600">
              Period Duration: <strong className="text-slate-900">{format(new Date(activeYear.start_date), "dd MMMM yyyy")}</strong> to <strong className="text-slate-900">{format(new Date(activeYear.end_date), "dd MMMM yyyy")}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5">
              Default for All Submissions
            </span>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="border border-red-200 bg-red-50 p-4 flex items-center justify-between text-xs text-red-700 font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchYears} className="h-7 text-xs border-red-300 text-red-800 rounded-none">
            Retry
          </Button>
        </div>
      )}

      {/* Academic Periods Table (Sharp Data Table) */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Configured Academic Periods
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Only one academic year can be actively marked to accept incentive submissions at any given time
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-500">
            {years.length} Periods
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-slate-600 mb-2" />
            <p className="text-xs font-medium">Fetching academic cycles...</p>
          </div>
        ) : years.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="text-xs font-medium">No academic periods configured yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Academic Year</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">End Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {years.map((yr) => (
                  <tr key={yr.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm whitespace-nowrap">
                      {yr.name}
                    </td>

                    <td className="py-3.5 px-4 text-xs font-mono text-slate-600 whitespace-nowrap">
                      {yr.start_date ? format(new Date(yr.start_date), "dd MMM yyyy") : "N/A"}
                    </td>

                    <td className="py-3.5 px-4 text-xs font-mono text-slate-600 whitespace-nowrap">
                      {yr.end_date ? format(new Date(yr.end_date), "dd MMM yyyy") : "N/A"}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {yr.is_active ? (
                        <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active Cycle
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                          Archived / Inactive
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      {!yr.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetActive(yr.id, yr.name)}
                          className="h-7 px-2 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-none"
                        >
                          Set Active
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(yr)}
                        className="h-7 px-2 text-xs border-slate-200 text-slate-700 hover:bg-slate-100 rounded-none"
                        title="Edit Period"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(yr.id, yr.name)}
                        className="h-7 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50 rounded-none"
                        title="Delete Period"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Academic Period</DialogTitle>
            <DialogDescription>Define a new academic cycle for research submissions.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Academic Year Name *</Label>
              <Input
                placeholder="e.g. 2026-27"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Start Date *</Label>
                <Input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">End Date *</Label>
                <Input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">Mark as Currently Active</Label>
                <p className="text-[11px] text-muted-foreground">Will make this the active cycle across all faculty portals.</p>
              </div>
              <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-primary text-primary-foreground">
                {submitting ? "Saving..." : "Create Period"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Academic Period</DialogTitle>
            <DialogDescription>Modify parameters for {editingYear?.name}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Academic Year Name *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Start Date *</Label>
                <Input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">End Date *</Label>
                <Input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">Mark as Currently Active</Label>
                <p className="text-[11px] text-muted-foreground">Will make this the active cycle across all faculty portals.</p>
              </div>
              <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-primary text-primary-foreground">
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
