"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Download,
  IndianRupee,
  Building2,
  PieChart as PieIcon,
  CheckCircle2,
  Clock,
  RotateCcw,
  Loader2,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  GraduationCap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { getAdminReportsData } from "@/app/actions/admin";

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#06b6d4", "#6366f1"];

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatInrCompact(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: amount >= 100000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(amount);
}

export default function AdminReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminReportsData();
      if (res.success) {
        setData(res);
      } else {
        setError(res.error || "Failed to load reports data.");
      }
    } catch {
      setError("An unexpected error occurred while generating reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCSV = () => {
    if (!data?.claimsList || data.claimsList.length === 0) return;
    const headers = [
      "Claim Number",
      "Claimant Faculty",
      "Email",
      "Department",
      "School",
      "Claim Type",
      "Claimed Amount (INR)",
      "Approved Amount (INR)",
      "Status",
      "Current Stage",
      "Submitted Date",
    ];

    const rows = data.claimsList.map((c: any) => [
      c.claim_number,
      `"${c.faculty?.name || "N/A"}"`,
      c.faculty?.email || "N/A",
      `"${c.faculty?.department?.name || "N/A"}"`,
      `"${c.faculty?.department?.school?.name || "N/A"}"`,
      c.claim_type?.name || "N/A",
      c.claimed_amount || 0,
      c.approved_amount || 0,
      c.status,
      c.current_stage || "N/A",
      c.submitted_at || c.created_at,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FRIC_Comprehensive_Institutional_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = data?.summary || {
    totalClaims: 0,
    totalClaimed: 0,
    totalApproved: 0,
    totalPending: 0,
    totalVerified: 0,
    totalReturned: 0,
    approvalRate: 0,
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Institutional Research Analytics & Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Comprehensive analysis of research productivity, incentive disbursals, and department performance
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleExportCSV}
          disabled={!data?.claimsList || data.claimsList.length === 0}
          className="gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-none shadow-xs"
        >
          <Download className="h-3.5 w-3.5" />
          Export Institutional CSV
        </Button>
      </div>

      {/* KPI Metric Strip (Sharp 4-Cell Bar) */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          <div className="p-4 sm:p-5 flex flex-col justify-center hover:bg-slate-50/60 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sanctioned Payouts</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight mt-1">
              {formatInrCompact(summary.totalApproved)}
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5">From {formatInrCompact(summary.totalClaimed)} claimed</span>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-center hover:bg-slate-50/60 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Overall Approval Rate</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight mt-1">
              {summary.approvalRate}%
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5">{summary.totalVerified} finalized claims</span>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-center hover:bg-slate-50/60 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active In Pipeline</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight mt-1">
              {summary.totalPending}
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5">Across 5 verification stages</span>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-center hover:bg-slate-50/60 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Revision Requests</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight mt-1">
              {summary.totalReturned}
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5">Returned for clarification</span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="border border-red-200 bg-red-50 p-4 flex items-center justify-between text-xs text-red-700 font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchReports} className="h-7 text-xs border-red-300 text-red-800 rounded-none">
            Retry
          </Button>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department-wise Bar Chart */}
        <div className="bg-white border border-slate-200 overflow-hidden shadow-xs lg:col-span-2">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Department-wise Expenditure (INR)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparison of claimed vs approved incentive funds per department
            </p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="h-[280px] flex items-center justify-center text-slate-400 text-xs">
                <Loader2 className="h-6 w-6 animate-spin text-slate-600 mr-2" /> Loading department metrics...
              </div>
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.departmentStats || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                    <XAxis dataKey="name" className="text-[11px]" tick={{ fill: "#64748b" }} />
                    <YAxis className="text-[11px]" tick={{ fill: "#64748b" }} tickFormatter={(v) => `₹${(v/1000)}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e2e8f0",
                        borderRadius: "0px",
                        fontSize: "0.75rem",
                      }}
                      formatter={(val: any) => [formatInr(Number(val)), "Amount"]}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Bar dataKey="claimedAmount" name="Claimed (₹)" fill="#990000" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="approvedAmount" name="Approved (₹)" fill="#0f172a" radius={[0, 0, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Claim Category Mix */}
        <div className="bg-white border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Research Category Mix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown by research output type
            </p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="h-[240px] flex items-center justify-center text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
              </div>
            ) : (
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.claimTypeStats || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="name"
                    >
                      {(data?.claimTypeStats || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e2e8f0",
                        borderRadius: "0px",
                        fontSize: "0.75rem",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* School and Department Performance Table (Sharp Data Table) */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Department Performance & Sanctions Summary
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Detailed institutional breakdown of incentive participation and disbursements
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-500">
            {(data?.departmentStats || []).length} Departments
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">School</th>
                <th className="py-3 px-4 text-center">Total Claims</th>
                <th className="py-3 px-4 text-right">Claimed Payout</th>
                <th className="py-3 px-4 text-right">Sanctioned Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.departmentStats || []).map((dept: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                    {dept.name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                    {dept.schoolName}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono whitespace-nowrap">
                    <span className="bg-slate-100 px-2 py-0.5 border border-slate-200 font-bold text-slate-800">
                      {dept.totalClaims}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                    {formatInr(dept.claimedAmount)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                    {formatInr(dept.approvedAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
