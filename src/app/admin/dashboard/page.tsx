"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminDashboardData } from "@/app/actions/dashboard";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  FileText,
  CheckCircle2,
  Clock,
  RotateCcw,
  IndianRupee,
  Shield,
  BarChart3,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  GitBranch,
  ScrollText,
  Settings,
  FolderOpen,
  ArrowRight,
  Building2,
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
  AreaChart,
  Area,
} from "recharts";

type AdminStats = {
  totalUsers: number;
  activeFaculty: number;
  totalClaims: number;
  pending: number;
  verified: number;
  returned: number;
  totalClaimed: number;
  totalApproved: number;
};

type MonthlyRow = { month: string; claims: number; amount: number };
type ClaimTypeRow = { name: string; value: number; color: string };
type ActivityRow = { action: string; detail: string; time: string; type: string };

const PIE_COLORS = ["#dc2626", "#991b1b", "#b91c1c", "#ea580c", "#475569", "#0f172a", "#f87171"];

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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeFaculty: 0,
    totalClaims: 0,
    pending: 0,
    verified: 0,
    returned: 0,
    totalClaimed: 0,
    totalApproved: 0,
  });
  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);
  const [claimTypes, setClaimTypes] = useState<ClaimTypeRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminDashboardData().then((res) => {
      if (res.success) {
        setStats(res.stats as AdminStats);
        setMonthly((res.monthly || []) as MonthlyRow[]);
        setClaimTypes((res.claimTypes || []) as ClaimTypeRow[]);
        setActivity((res.activity || []) as ActivityRow[]);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="animate-fade-in space-y-8">
      {/* Hero Welcome & Live Pulse */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-background to-amber-500/10 border border-border/50 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1.5 py-1 px-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                FRIC Central Administration
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">P P Savani University</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Executive Research Governance Dashboard
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Comprehensive institutional oversight of faculty publications, patent filings, funded research projects, and incentive disbursements across all university schools.
            </p>
          </div>

          {/* Quick Action Pills */}
          <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
            <Link href="/admin/claims">
              <Button size="sm" className="w-full justify-between gap-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs shadow-sm">
                <span>Review Claims</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Link href="/admin/reports">
              <Button variant="outline" size="sm" className="w-full justify-between gap-2 bg-background/50 backdrop-blur text-xs">
                <span>Financial Analytics</span>
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ═══════════ UNIFIED ADMIN KPI METRIC STRIP (SHARP TABLE BAR) ═══════════ */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          {/* Sanctioned Payout */}
          <div className="p-4 sm:p-5 flex flex-col justify-center transition-colors hover:bg-slate-50/60">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
              Sanctioned Payout
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 font-mono">
              {formatInrCompact(stats.totalApproved)}
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5">
              {stats.verified} Approved claims of {formatInrCompact(stats.totalClaimed)} claimed
            </span>
          </div>

          {/* Active in Pipeline */}
          <div className="p-4 sm:p-5 flex flex-col justify-center transition-colors hover:bg-slate-50/60">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
              Active in Pipeline
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 font-mono">
              {stats.pending}
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5">
              Across 5 stages {stats.returned > 0 ? `(${stats.returned} returned)` : ""}
            </span>
          </div>

          {/* Total Submissions */}
          <div className="p-4 sm:p-5 flex flex-col justify-center transition-colors hover:bg-slate-50/60">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Submissions
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 font-mono">
              {stats.totalClaims}
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5">
              2026-27 Active cycle across all categories
            </span>
          </div>

          {/* Faculty Registered */}
          <div className="p-4 sm:p-5 flex flex-col justify-center transition-colors hover:bg-slate-50/60">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
              Faculty Registered
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 font-mono">
              {stats.activeFaculty}
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5">
              SOE, SOS, SOD, SOM ({stats.totalUsers} total users)
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      {/* ═══════════ VISUAL ANALYTICS & RESEARCH DISTRIBUTION (SHARP TABLE UI + PPSU RED THEME) ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Area & Bar Chart */}
        <div className="bg-white border border-slate-200 overflow-hidden shadow-xs lg:col-span-2">
          <div className="flex flex-row items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Incentive Sanction & Submission Volume
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly trajectory of approved payouts and submission counts
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200">
              Academic Year 2026-27
            </span>
          </div>
          <div className="p-6">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={
                    monthly.length > 0
                      ? monthly
                      : [
                          {
                            month: "Aug",
                            claims: stats.totalClaims || 5,
                            amount: stats.totalApproved || 25000,
                          },
                        ]
                  }
                >
                  <defs>
                    <linearGradient id="colorAmountPpsu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" />
                  <XAxis
                    dataKey="month"
                    className="text-xs font-medium"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="left"
                    className="text-xs font-mono font-medium"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    tickFormatter={(v) => `₹${v / 1000}k`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    className="text-xs font-mono font-medium"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#e2e8f0",
                      borderRadius: "0px",
                      fontSize: "0.75rem",
                      boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(val: any, name: any) => [
                      name === "amount" ? formatInr(Number(val)) : val,
                      name === "amount" ? "Sanctioned Payout (₹)" : "Submissions Count",
                    ]}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="amount"
                    stroke="#dc2626"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorAmountPpsu)"
                    name="amount"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="claims"
                    fill="#0f172a"
                    radius={[0, 0, 0, 0]}
                    maxBarSize={32}
                    name="claims"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Claim Category Distribution */}
        <div className="bg-white border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Research Distribution
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Claims by category type
            </p>
          </div>
          <div className="p-6 flex flex-col justify-between h-[calc(100%-65px)]">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      claimTypes.length > 0
                        ? claimTypes
                        : [
                            { name: "Research Paper", value: 3, color: "#dc2626" },
                            { name: "Research Project", value: 2, color: "#991b1b" },
                          ]
                    }
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {(claimTypes.length > 0
                      ? claimTypes
                      : [
                          { name: "Research Paper", value: 3, color: "#dc2626" },
                          { name: "Research Project", value: 2, color: "#991b1b" },
                        ]
                    ).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]}
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

            {/* Mini Category Breakdown List */}
            <div className="mt-4 pt-3 border-t border-slate-100 divide-y divide-slate-100 text-xs">
              {(claimTypes.length > 0
                ? claimTypes
                : [
                    { name: "Research Paper", value: 3, color: "#dc2626" },
                    { name: "Research Project", value: 2, color: "#991b1b" },
                  ]
              ).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-1.5">
                  <span className="font-medium text-slate-700 truncate max-w-[170px]">
                    {item.name}
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {item.value} claim{item.value !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ CORE ADMINISTRATION MODULES (SHARP TABLE CARDS) ═══════════ */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3">
          Core Administration Modules
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/users" className="group">
            <div className="bg-white border border-slate-200 hover:border-slate-400 transition-colors p-4 h-full shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs border border-slate-200">
                  UA
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 group-hover:text-red-700 transition-colors">
                    Users & Access
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Manage roles & designations</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/workflow" className="group">
            <div className="bg-white border border-slate-200 hover:border-slate-400 transition-colors p-4 h-full shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs border border-slate-200">
                  AP
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 group-hover:text-red-700 transition-colors">
                    Approval Pipeline
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Configure 5-stage workflow</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/documents" className="group">
            <div className="bg-white border border-slate-200 hover:border-slate-400 transition-colors p-4 h-full shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs border border-slate-200">
                  DT
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 group-hover:text-red-700 transition-colors">
                    Document Types
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Required uploads policy</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/audit-logs" className="group">
            <div className="bg-white border border-slate-200 hover:border-slate-400 transition-colors p-4 h-full shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs border border-slate-200">
                  AT
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 group-hover:text-red-700 transition-colors">
                    Audit Trail
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Compliance & system log</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
