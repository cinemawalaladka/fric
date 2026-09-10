"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardHeader } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShieldAlert,
  Loader2,
  AlertTriangle,
  Search,
  Download,
  Eye,
  Activity,
  Layers,
  User,
  Clock,
  Filter,
  CheckCircle2,
  RefreshCw,
  FileText,
  ShieldCheck,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getAdminAuditLogs } from "@/app/actions/admin";
import { formatDistanceToNow, format } from "date-fns";

interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  old_value: any;
  new_value: any;
  ip_address: string | null;
  created_at: string;
  actorName: string;
  actorEmail: string;
  actorDesignation: string;
  claimNumber: string | null;
  activityNarrative: string;
  eventCategory: string;
}

const ACTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  CREATE: { bg: "bg-blue-500/10", text: "text-blue-500 dark:text-blue-400", border: "border-blue-500/20" },
  UPDATE: { bg: "bg-amber-500/10", text: "text-amber-500 dark:text-amber-400", border: "border-amber-500/20" },
  DELETE: { bg: "bg-red-500/10", text: "text-red-500 dark:text-red-400", border: "border-red-500/20" },
  SUBMIT: { bg: "bg-violet-500/10", text: "text-violet-500 dark:text-violet-400", border: "border-violet-500/20" },
  VERIFY: { bg: "bg-indigo-500/10", text: "text-indigo-500 dark:text-indigo-400", border: "border-indigo-500/20" },
  RETURN: { bg: "bg-orange-500/10", text: "text-orange-500 dark:text-orange-400", border: "border-orange-500/20" },
  APPROVE: { bg: "bg-emerald-500/10", text: "text-emerald-500 dark:text-emerald-400", border: "border-emerald-500/20" },
  ROLE_CHANGE: { bg: "bg-pink-500/10", text: "text-pink-500 dark:text-pink-400", border: "border-pink-500/20" },
};

const CATEGORY_ICONS: Record<string, any> = {
  "Claim Workflow": CheckCircle2,
  "Document Attachment": FileText,
  "Role Security": ShieldCheck,
  "Academic Year": Calendar,
  "System Settings": Building2,
  General: Activity,
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminAuditLogs();
      if (res.success && res.logs) {
        setLogs(res.logs as unknown as AuditLog[]);
      } else {
        setError(res.error || "Failed to fetch audit logs.");
      }
    } catch {
      setError("An unexpected error occurred while loading audit trail.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesCategory =
        categoryFilter === "ALL" ||
        log.eventCategory === categoryFilter ||
        log.action === categoryFilter;

      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        (log.actorName && log.actorName.toLowerCase().includes(q)) ||
        (log.actorEmail && log.actorEmail.toLowerCase().includes(q)) ||
        (log.activityNarrative && log.activityNarrative.toLowerCase().includes(q)) ||
        (log.claimNumber && log.claimNumber.toLowerCase().includes(q)) ||
        (log.entity_type && log.entity_type.toLowerCase().includes(q)) ||
        (log.action && log.action.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [logs, categoryFilter, search]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = logs.length;
    const claimsActivity = logs.filter((l) => l.eventCategory === "Claim Workflow").length;
    const documentEvents = logs.filter((l) => l.eventCategory === "Document Attachment").length;
    const securityEvents = logs.filter((l) => l.eventCategory === "Role Security").length;

    return { total, claimsActivity, documentEvents, securityEvents };
  }, [logs]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = [
      "Timestamp",
      "Actor Name",
      "Actor Email",
      "Designation",
      "Category",
      "Action",
      "Activity Narrative",
      "Entity Type",
      "Claim Number",
    ];
    const rows = filteredLogs.map((l) => [
      l.created_at,
      `"${l.actorName}"`,
      l.actorEmail,
      `"${l.actorDesignation}"`,
      l.eventCategory,
      l.action,
      `"${l.activityNarrative.replace(/"/g, '""')}"`,
      l.entity_type,
      l.claimNumber || "N/A",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FRIC_Audit_Trail_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Audit Logs & Compliance Activity Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Immutable real-time audit record showing exact human-readable actions, claim approvals, file attachments, and permission updates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
            className="gap-1.5 text-xs border-slate-200 text-slate-700 hover:bg-slate-100 rounded-none shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-none shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Export Audit CSV
          </Button>
        </div>
      </div>

      {/* KPI Metric Strip (Sharp 4-Cell Bar) */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          <div className="p-4 sm:p-5 flex flex-col justify-center hover:bg-slate-50/60 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Activity Events</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight mt-1">{metrics.total}</p>
            <span className="text-[11px] text-slate-500 mt-0.5">Recorded immutable entries</span>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-center hover:bg-slate-50/60 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Claim Verifications</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight mt-1">{metrics.claimsActivity}</p>
            <span className="text-[11px] text-slate-500 mt-0.5">Workflow reviews & sanctions</span>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-center hover:bg-slate-50/60 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Document Uploads</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight mt-1">{metrics.documentEvents}</p>
            <span className="text-[11px] text-slate-500 mt-0.5">File attachments & proofs</span>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-center hover:bg-slate-50/60 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Role & Access Logs</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight mt-1">{metrics.securityEvents}</p>
            <span className="text-[11px] text-slate-500 mt-0.5">Security & permission events</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search actor, activity narrative, claim #, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50/50 border-slate-200 text-xs h-9 rounded-none"
            />
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1 uppercase">
              <Filter className="h-3 w-3" /> Category:
            </span>
            {[
              { label: "All Events", val: "ALL" },
              { label: "Claims & Approvals", val: "Claim Workflow" },
              { label: "Document Uploads", val: "Document Attachment" },
              { label: "Role Changes", val: "Role Security" },
              { label: "System Config", val: "System Settings" },
            ].map((c) => {
              const isSelected = categoryFilter === c.val;
              return (
                <button
                  key={c.val}
                  onClick={() => setCategoryFilter(c.val)}
                  className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider border transition-all ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="border border-red-200 bg-red-50 p-4 flex items-center justify-between text-xs text-red-700 font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLogs} className="h-7 text-xs border-red-300 text-red-800 rounded-none">
            Retry
          </Button>
        </div>
      )}

      {/* Audit Event Ledger Table */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Institutional Event Stream
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredLogs.length} of {logs.length} recorded events with detailed narratives
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-500">
            {filteredLogs.length} Records
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-slate-600 mb-2" />
            <p className="text-xs font-medium">Loading activity audit records...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="text-xs font-medium">No matching audit events found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action & Category</th>
                  <th className="py-3 px-4">Activity Narrative</th>
                  <th className="py-3 px-4">Target / Claim</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const isExpanded = !!expandedRows[log.id];

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap align-top">
                        <div className="font-bold text-slate-900">{format(new Date(log.created_at), "dd MMM yyyy")}</div>
                        <div>{format(new Date(log.created_at), "HH:mm:ss")}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap align-top">
                        <span className="font-bold text-slate-900 block">{log.actorName}</span>
                        <span className="text-[11px] text-slate-500 block">{log.actorEmail}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{log.actorDesignation}</span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap align-top">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 border border-slate-200 text-slate-800">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">{log.eventCategory}</span>
                      </td>

                      <td className="py-3.5 px-4 max-w-md text-slate-800 font-medium leading-relaxed align-top">
                        {log.activityNarrative}
                        {isExpanded && (
                          <div className="mt-2 pt-2 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">Previous State</span>
                              <pre className="p-2 bg-slate-900 text-slate-200 text-[10px] font-mono mt-1 overflow-x-auto max-h-36">
                                {log.old_value ? JSON.stringify(log.old_value, null, 2) : "None"}
                              </pre>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">Resulting State</span>
                              <pre className="p-2 bg-slate-900 text-emerald-300 text-[10px] font-mono mt-1 overflow-x-auto max-h-36">
                                {log.new_value ? JSON.stringify(log.new_value, null, 2) : "None"}
                              </pre>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap align-top">
                        {log.claimNumber ? (
                          <span className="bg-slate-100 px-2 py-0.5 border border-slate-200 text-[11px]">
                            {log.claimNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap align-top">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleRow(log.id)}
                          className="h-7 px-2 text-[11px] border-slate-200 text-slate-700 hover:bg-slate-100 rounded-none"
                        >
                          {isExpanded ? "Hide" : "Diff"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="h-7 px-2 text-[11px] border-slate-200 text-slate-700 hover:bg-slate-100 rounded-none"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* State Diff Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedLog && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={ACTION_COLORS[selectedLog.action]?.bg || "bg-muted"}>
                    {selectedLog.action}
                  </Badge>
                  <DialogTitle className="text-base font-bold">
                    {selectedLog.eventCategory} Audit Record
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs font-semibold text-foreground pt-1">
                  {selectedLog.activityNarrative}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Actor</span>
                    <span className="font-bold text-foreground text-sm">{selectedLog.actorName}</span>
                    <span className="text-muted-foreground block text-[11px]">{selectedLog.actorEmail}</span>
                    <span className="text-primary block text-[11px] font-medium">{selectedLog.actorDesignation}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Audit Event ID</span>
                    <span className="font-mono text-muted-foreground text-[11px] block">{selectedLog.id}</span>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold mt-1">Timestamp</span>
                    <span className="font-semibold text-foreground block">
                      {format(new Date(selectedLog.created_at), "dd MMMM yyyy, HH:mm:ss")}
                    </span>
                  </div>
                </div>

                {/* State Diff */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <span className="font-semibold text-muted-foreground text-xs uppercase flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span> Previous Value
                    </span>
                    <pre className="p-3 rounded-lg bg-black/40 border border-border/40 font-mono text-[11px] text-amber-300 overflow-x-auto max-h-60 leading-relaxed whitespace-pre-wrap">
                      {selectedLog.old_value ? JSON.stringify(selectedLog.old_value, null, 2) : "None (Initial State)"}
                    </pre>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-semibold text-muted-foreground text-xs uppercase flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> New Value
                    </span>
                    <pre className="p-3 rounded-lg bg-black/40 border border-border/40 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-60 leading-relaxed whitespace-pre-wrap">
                      {selectedLog.new_value ? JSON.stringify(selectedLog.new_value, null, 2) : "None (Deleted / Null)"}
                    </pre>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
