"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Save,
  Building2,
  DollarSign,
  Calendar,
  Bell,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Flame,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getSystemSettings, updateSystemSettings, wipeoutAllClaimsAndDocuments } from "@/app/actions/admin";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wipeout States
  const [isWipeoutOpen, setIsWipeoutOpen] = useState(false);
  const [wipeoutConfirmText, setWipeoutConfirmText] = useState("");
  const [wipingOut, setWipingOut] = useState(false);
  const [wipeoutSuccessMsg, setWipeoutSuccessMsg] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSystemSettings();
      if (res.success && res.settings) {
        setSettings(res.settings);
      } else {
        setError(res.error || "Failed to load system settings.");
      }
    } catch {
      setError("An unexpected error occurred while loading settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    setError(null);

    try {
      const res = await updateSystemSettings(settings);
      if (res.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3500);
      } else {
        setError(res.error || "Failed to save settings.");
      }
    } catch {
      setError("An error occurred while saving system settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteWipeout = async () => {
    if (wipeoutConfirmText !== "WIPEOUT") {
      alert("Please type WIPEOUT to confirm database purge.");
      return;
    }

    setWipingOut(true);
    try {
      const res = await wipeoutAllClaimsAndDocuments();
      if (res.success) {
        setIsWipeoutOpen(false);
        setWipeoutConfirmText("");
        setWipeoutSuccessMsg(
          `Database Cleaned: Successfully purged ${res.deletedClaimsCount} claims and ${res.deletedDocsCount} documents from the cloud.`
        );
        setTimeout(() => setWipeoutSuccessMsg(null), 6000);
      } else {
        alert(res.error || "Wipeout failed.");
      }
    } catch {
      alert("An unexpected error occurred during system wipeout.");
    } finally {
      setWipingOut(false);
    }
  };

  const updateKey = (key: string, val: any) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            System Settings & Policy Governance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Global configuration for research incentives, institutional policies, deadlines, and submission controls
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>System configuration settings successfully saved and applied.</span>
        </div>
      )}

      {wipeoutSuccessMsg && (
        <div className="border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{wipeoutSuccessMsg}</span>
        </div>
      )}

      {error && (
        <div className="border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin text-slate-600 mb-2" />
          <p className="text-xs font-medium">Loading institutional configuration...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Institutional Information */}
          <div className="bg-white border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Institutional Profile & Branding
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                University information displayed across reports, sanction orders, and emails
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">University Name</label>
                  <Input
                    value={settings.university_name || "P P Savani University"}
                    onChange={(e) => updateKey("university_name", e.target.value)}
                    className="bg-slate-50/50 border-slate-200 text-xs h-9 rounded-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Portal Title</label>
                  <Input
                    value={settings.portal_title || "Faculty Research Incentive Cell (FRIC)"}
                    onChange={(e) => updateKey("portal_title", e.target.value)}
                    className="bg-slate-50/50 border-slate-200 text-xs h-9 rounded-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Research Support Contact Email</label>
                  <Input
                    type="email"
                    value={settings.support_email || "research@ppsu.ac.in"}
                    onChange={(e) => updateKey("support_email", e.target.value)}
                    className="bg-slate-50/50 border-slate-200 text-xs h-9 rounded-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Provost Executive Office</label>
                  <Input
                    value={settings.provost_office || "provost@ppsu.in / EAtoVC@ppsu.in"}
                    onChange={(e) => updateKey("provost_office", e.target.value)}
                    className="bg-slate-50/50 border-slate-200 text-xs h-9 rounded-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Incentive Ceilings & Financial Policy */}
          <div className="bg-white border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Incentive Financial Ceilings
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monetary caps and eligibility limits enforced by the automated calculation engine
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Maximum Incentive Cap Per Faculty / Academic Year (₹)</label>
                  <Input
                    type="number"
                    value={settings.max_incentive_cap_per_year || "150000"}
                    onChange={(e) => updateKey("max_incentive_cap_per_year", e.target.value)}
                    className="bg-slate-50/50 border-slate-200 text-xs h-9 rounded-none font-mono"
                    required
                  />
                  <span className="text-[11px] text-slate-500">Standard University limit: ₹1,50,000</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Automated Verifier SLA Reminder (Days)</label>
                  <Input
                    type="number"
                    min="1"
                    max="14"
                    value={settings.auto_reminder_days || "3"}
                    onChange={(e) => updateKey("auto_reminder_days", e.target.value)}
                    className="bg-slate-50/50 border-slate-200 text-xs h-9 rounded-none font-mono"
                  />
                  <span className="text-[11px] text-slate-500">Days before pending claims trigger notification</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submission Windows & Policy Controls */}
          <div className="bg-white border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Submission Windows & Access Controls
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Control active claim submissions and portal availability
              </p>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-800">Allow New Claim Submissions</span>
                  <p className="text-[11px] text-slate-500">
                    When enabled, faculty members can create and submit new claims for the active academic cycle.
                  </p>
                </div>
                <Switch
                  checked={settings.allow_submissions === "true" || settings.allow_submissions === true}
                  onCheckedChange={(checked) => updateKey("allow_submissions", String(checked))}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-800">Strict DOI / Duplicate Protection</span>
                  <p className="text-[11px] text-slate-500">
                    Enforce unique DOI / ISSN matching across the database to prevent duplicate claim payouts.
                  </p>
                </div>
                <Switch
                  checked={settings.require_doi_verification !== "false"}
                  onCheckedChange={(checked) => updateKey("require_doi_verification", String(checked))}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs uppercase tracking-wider text-red-800 flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-red-600" /> System Maintenance Mode
                  </span>
                  <p className="text-[11px] text-red-700">
                    Locks the portal for non-administrators with banner warning during policy revisions.
                  </p>
                </div>
                <Switch
                  checked={settings.maintenance_mode === "true" || settings.maintenance_mode === true}
                  onCheckedChange={(checked) => updateKey("maintenance_mode", String(checked))}
                />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={fetchSettings}
              disabled={saving}
              className="text-xs h-9 rounded-none border-slate-200 text-slate-700"
            >
              Discard Changes
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-slate-900 hover:bg-slate-800 text-white gap-1.5 min-w-[140px] text-xs h-9 rounded-none shadow-xs"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Danger Zone: Complete Wipeout Card */}
      <div className="border border-red-200 bg-red-50/60 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-red-200 bg-red-100/50">
          <h3 className="text-sm font-bold uppercase tracking-wider text-red-800 flex items-center gap-2">
            <Flame className="h-4 w-4 text-red-600" /> Danger Zone: Complete Database Wipeout
          </h3>
          <p className="text-xs text-red-600 mt-0.5">
            Permanently purge all test claims, calculation snapshots, and uploaded documents from the database and cloud storage
          </p>
        </div>
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-red-900">Clean Entire Claims & Storage Database</p>
            <p className="text-xs text-red-700 max-w-xl">
              Deletes all research claims across all departments, purges uploaded file attachments from Supabase storage bucket, and resets the approval queue to clean state.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => {
              setWipeoutConfirmText("");
              setIsWipeoutOpen(true);
            }}
            className="bg-red-700 hover:bg-red-800 text-white shrink-0 gap-1.5 text-xs h-9 rounded-none shadow-xs"
          >
            <Flame className="h-3.5 w-3.5" />
            Complete Wipeout
          </Button>
        </div>
      </div>

      {/* Wipeout Danger Modal */}
      <Dialog open={isWipeoutOpen} onOpenChange={setIsWipeoutOpen}>
        <DialogContent className="max-w-md border-red-300 rounded-none">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-700">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <DialogTitle className="text-base text-red-700 font-bold">Complete Database Wipeout</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-600 pt-2 leading-relaxed">
              This action is <strong className="text-red-700 font-bold">permanent and irreversible</strong>. It will completely purge:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs bg-red-50 p-3.5 border border-red-200 text-slate-700">
            <ul className="list-disc list-inside space-y-1">
              <li>All research claims & calculation snapshots</li>
              <li>All uploaded documents & files from cloud storage</li>
              <li>All verifier approvals, stage movements & comments</li>
              <li>All research publication, project, patent, book & citation records</li>
            </ul>
            <p className="text-[11px] text-red-800 font-semibold pt-1">
              Faculty user accounts and institutional settings will be preserved.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Type <span className="font-mono text-red-700">WIPEOUT</span> to confirm:
            </label>
            <Input
              placeholder="WIPEOUT"
              value={wipeoutConfirmText}
              onChange={(e) => setWipeoutConfirmText(e.target.value.toUpperCase())}
              className="font-mono text-center tracking-widest text-sm border-red-300 rounded-none bg-white"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsWipeoutOpen(false)}
              disabled={wipingOut}
              className="rounded-none text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCompleteWipeout}
              disabled={wipingOut || wipeoutConfirmText !== "WIPEOUT"}
              className="bg-red-700 hover:bg-red-800 text-white gap-1.5 rounded-none text-xs"
            >
              {wipingOut ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Purging Entire Database...
                </>
              ) : (
                <>
                  <Flame className="h-3.5 w-3.5" />
                  Confirm Permanent Wipeout
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
