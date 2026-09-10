"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/layout/app-sidebar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Search,
  RefreshCw,
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
import { getVerifierReportsData } from "@/app/actions/verification";
import { cn } from "@/lib/utils";

const CHART_COLORS = ["#dc2626", "#ea580c", "#d97706", "#059669", "#0284c7", "#7c3aed", "#db2777"];

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

export default function VerifierReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getVerifierReportsData();
      if (res.success) {
        setData(res);
      } else {
        setError(res.error || "Failed to load verification reports data.");
      }
    } catch {
      setError("An unexpected error occurred while generating verification reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Filtered claims list
  const filteredClaims = useMemo(() => {
    if (!data?.claimsList) return [];
    return data.claimsList.filter((c: any) => {
      const matchesSearch =
        !search ||
        c.claim_number.toLowerCase().includes(search.toLowerCase()) ||
        c.faculty_name.toLowerCase().includes(search.toLowerCase()) ||
        c.title.toLowerCase().includes(search.toLowerCase());

      const matchesDept = deptFilter === "ALL" || c.department_id === deptFilter;
      const matchesType = typeFilter === "ALL" || c.claim_type === typeFilter;
      const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;

      return matchesSearch && matchesDept && matchesType && matchesStatus;
    });
  }, [data, search, deptFilter, typeFilter, statusFilter]);

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredClaims || filteredClaims.length === 0) return;
    const headers = [
      "Claim Number",
      "Faculty Name",
      "Email",
      "Department",
      "School",
      "Research Output Type",
      "Research Title",
      "Claimed Amount (INR)",
      "Approved Amount (INR)",
      "Status",
      "Current Stage",
      "Submission Date",
    ];

    const rows = filteredClaims.map((c: any) => [
      `"${c.claim_number}"`,
      `"${c.faculty_name}"`,
      `"${c.faculty_email}"`,
      `"${c.department_name}"`,
      `"${c.school_name}"`,
      `"${c.claim_type}"`,
      `"${(c.title || "").replace(/"/g, '""')}"`,
      c.claimed_amount || 0,
      c.approved_amount || 0,
      `"${c.status}"`,
      `"${c.current_stage}"`,
      `"${c.submitted_at || c.created_at}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `FRIC_Verification_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = data?.summary || {
    totalClaims: 0,
    totalClaimed: 0,
    totalApproved: 0,
    totalPending: 0,
    totalPendingAtMyStage: 0,
    totalVerified: 0,
    totalReturned: 0,
    approvalRate: 0,
  };

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      {/* Top Header */}
      <DashboardHeader
        title="Verification Reports & Analytics"
        description="Comprehensive analysis of research claims, verification stages, and sanctioned payouts"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReports}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>

          <button
            onClick={handleExportCSV}
            disabled={filteredClaims.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold border border-slate-900 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV ({filteredClaims.length})
          </button>
        </div>
      </DashboardHeader>

      {/* ═══════════ UNIFIED METRIC STRIP (SHARP TABLE BAR) ═══════════ */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          <div className="p-4 flex flex-col justify-center hover:bg-slate-50/60 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Sanctioned Payout
            </span>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1 font-mono">
              {formatInrCompact(summary.totalApproved)}
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5">
              From {formatInrCompact(summary.totalClaimed)} claimed
            </span>
          </div>

          <div className="p-4 flex flex-col justify-center hover:bg-slate-50/60 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Claims
            </span>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1 font-mono">
              {summary.totalClaims}
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5">
              Submitted in portfolio
            </span>
          </div>

          <div className="p-4 flex flex-col justify-center hover:bg-slate-50/60 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Action at My Stage
            </span>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1 font-mono">
              {summary.totalPendingAtMyStage}
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5">
              Pending review queue
            </span>
          </div>

          <div className="p-4 flex flex-col justify-center hover:bg-slate-50/60 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              In Workflow Pipeline
            </span>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1 font-mono">
              {summary.totalPending}
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5">
              Across 5 stages
            </span>
          </div>

          <div className="p-4 flex flex-col justify-center hover:bg-slate-50/60 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Revision Requests
            </span>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1 font-mono">
              {summary.totalReturned}
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5">
              Returned to faculty
            </span>
          </div>

          <div className="p-4 flex flex-col justify-center hover:bg-slate-50/60 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Approval Rate
            </span>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1 font-mono">
              {summary.approvalRate}%
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5">
              {summary.totalVerified} verified
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════ ANALYTICS CHARTS ROW ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Expenditure Chart */}
        <div className="bg-white border border-slate-200 overflow-hidden lg:col-span-2">
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
              <div className="h-[260px] flex items-center justify-center text-sm text-slate-400">
                Loading analytics metrics...
              </div>
            ) : (data?.departmentStats || []).length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-sm text-slate-400">
                No department expenditure records available.
              </div>
            ) : (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.departmentStats || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" />
                    <XAxis
                      dataKey="name"
                      className="text-xs font-medium"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                    />
                    <YAxis
                      className="text-xs font-mono font-medium"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      tickFormatter={(v) => `₹${v / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e2e8f0",
                        borderRadius: "0px",
                        fontSize: "0.75rem",
                        boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(val: any) => [formatInr(Number(val)), "Amount"]}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Bar
                      dataKey="claimedAmount"
                      name="Claimed (₹)"
                      fill="#94a3b8"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="approvedAmount"
                      name="Approved (₹)"
                      fill="#0f172a"
                      radius={[0, 0, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Research Category Mix */}
        <div className="bg-white border border-slate-200 overflow-hidden">
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
              <div className="h-[260px] flex items-center justify-center text-sm text-slate-400">
                Loading category metrics...
              </div>
            ) : (data?.claimTypeStats || []).length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-sm text-slate-400">
                No category records available.
              </div>
            ) : (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.claimTypeStats || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="name"
                    >
                      {(data?.claimTypeStats || []).map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
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
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════ FILTER AND SEARCH TOOLBAR ═══════════ */}
      <div className="bg-white border border-slate-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by ID, faculty, or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50/70 border-slate-200 text-xs rounded-none"
            />
          </div>

          {/* Department Filter */}
          <Select value={deptFilter} onValueChange={(val) => setDeptFilter(val || "ALL")}>
            <SelectTrigger className="bg-slate-50/70 border-slate-200 text-xs rounded-none">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Departments</SelectItem>
              {(data?.departments || []).map((dept: any) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Claim Type Filter */}
          <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val || "ALL")}>
            <SelectTrigger className="bg-slate-50/70 border-slate-200 text-xs rounded-none">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {(data?.claimTypes || []).map((t: any) => (
                <SelectItem key={t.id} value={t.name}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "ALL")}>
            <SelectTrigger className="bg-slate-50/70 border-slate-200 text-xs rounded-none">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="UNDER_VERIFICATION">Under Verification</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="RETURNED">Returned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ═══════════ DETAILED CLAIMS DATA TABLE (SHARP CORNERS) ═══════════ */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              {loading
                ? "Loading records..."
                : `Filtered Claims Dataset (${filteredClaims.length} records)`}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live filterable institutional verification ledger
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-sm text-slate-500">
            Generating verification reports...
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="text-sm font-medium text-slate-800">
              No matching records found for current filters.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search criteria or resetting filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90">
                  <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    CLAIM ID
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    FACULTY / DEPT
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    RESEARCH TITLE
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    SUBMITTED ON
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    STAGE
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase text-right">
                    CLAIMED (₹)
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase text-right">
                    APPROVED (₹)
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase text-right">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClaims.map((claim: any) => (
                  <tr
                    key={claim.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* CLAIM ID */}
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {claim.claim_number}
                    </td>

                    {/* FACULTY / DEPT */}
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-semibold text-slate-900 block truncate max-w-[200px]">
                          {claim.faculty_name}
                        </span>
                        <span className="text-xs text-slate-500 truncate block max-w-[200px] mt-0.5">
                          {claim.department_code} • {claim.school_name}
                        </span>
                      </div>
                    </td>

                    {/* RESEARCH TITLE */}
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-semibold text-slate-900 block truncate max-w-[240px]">
                          {claim.title}
                        </span>
                        <span className="text-xs text-slate-500 truncate block max-w-[240px] mt-0.5">
                          {claim.claim_type}
                        </span>
                      </div>
                    </td>

                    {/* SUBMITTED ON */}
                    <td className="px-6 py-4 text-slate-600 text-xs font-medium whitespace-nowrap">
                      {claim.submitted_at || claim.created_at}
                    </td>

                    {/* STAGE */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold border bg-slate-100 text-slate-800 border-slate-200">
                        {claim.current_stage}
                      </span>
                    </td>

                    {/* CLAIMED AMOUNT */}
                    <td className="px-6 py-4 text-right font-mono text-slate-600 font-medium whitespace-nowrap">
                      {formatInr(claim.claimed_amount)}
                    </td>

                    {/* APPROVED AMOUNT */}
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatInr(claim.approved_amount)}
                    </td>

                    {/* ACTION */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <Link
                        href={`/verifier/claims/${claim.id}`}
                        className="inline-flex items-center px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition-colors shadow-2xs"
                      >
                        Review
                      </Link>
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
