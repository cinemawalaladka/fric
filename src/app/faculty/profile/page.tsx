"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/layout/app-sidebar";
import {
  User,
  Mail,
  Building2,
  Briefcase,
  Hash,
  Calendar,
  GraduationCap,
  Award,
  FileText,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
} from "lucide-react";
import { getFacultyProfileData } from "@/app/actions/dashboard";
import { cn } from "@/lib/utils";

type DepartmentInfo = {
  name: string;
  school?: { name: string } | { name: string }[] | null;
};

type Profile = {
  id: string;
  employee_id: string;
  name: string;
  email: string;
  designation: string;
  status: string;
  created_at: string;
  department?: DepartmentInfo | DepartmentInfo[] | null;
};

type Stats = {
  totalClaims: number;
  approvedClaims: number;
  totalApprovedAmount: number;
};

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U"
  );
}

function joinedDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "August 2026";
  }
}

function getDeptAndSchool(profile: Profile) {
  const dept = Array.isArray(profile.department)
    ? profile.department[0]
    : profile.department;
  const deptName = dept?.name || "School of Engineering";
  let schoolName = "P P Savani University";
  if (dept?.school) {
    schoolName = Array.isArray(dept.school)
      ? dept.school[0]?.name || "P P Savani University"
      : dept.school?.name || "P P Savani University";
  }
  return { deptName, schoolName };
}

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalClaims: 0,
    approvedClaims: 0,
    totalApprovedAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getFacultyProfileData().then((res) => {
      if (res.success && res.profile) {
        setProfile(res.profile as unknown as Profile);
        if (res.stats) setStats(res.stats);
      }
      setLoading(false);
    });
  }, []);

  const { deptName, schoolName } = useMemo(() => {
    if (!profile)
      return {
        deptName: "School of Engineering",
        schoolName: "P P Savani University",
      };
    return getDeptAndSchool(profile);
  }, [profile]);

  const copyEmpId = () => {
    if (profile?.employee_id) {
      navigator.clipboard.writeText(profile.employee_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const identityDetails = useMemo(() => {
    if (!profile) return [];
    return [
      {
        icon: Hash,
        label: "Employee ID",
        value: profile.employee_id || "EMP002",
        actionable: true,
      },
      {
        icon: Mail,
        label: "Official Email",
        value: profile.email,
      },
      {
        icon: GraduationCap,
        label: "School / Faculty",
        value: schoolName,
      },
      {
        icon: Building2,
        label: "Department",
        value: deptName,
      },
      {
        icon: Briefcase,
        label: "Designation",
        value: profile.designation || "Assistant Professor",
      },
      {
        icon: Calendar,
        label: "Member Since",
        value: joinedDate(profile.created_at),
      },
    ];
  }, [profile, deptName, schoolName]);

  return (
    <div className="animate-fade-in space-y-6 pb-12 max-w-5xl">
      {/* ═══════════ TOP HEADER ═══════════ */}
      <DashboardHeader
        title="Faculty Profile"
        description="Official institutional credentials and research summary"
      />

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500 bg-white/70 rounded-2xl border border-slate-200/80">
          Loading profile credentials...
        </div>
      ) : !profile ? (
        <div className="p-12 text-center text-sm text-slate-500 bg-white/70 rounded-2xl border border-slate-200/80">
          Faculty profile record not found.
        </div>
      ) : (
        <div className="space-y-6">
          {/* ═══════════ MAIN EXECUTIVE IDENTITY CARD ═══════════ */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-xs">
            {/* Top Warm Sheen Header Strip */}
            <div className="h-28 sm:h-32 bg-gradient-to-r from-slate-100 via-rose-50/50 to-slate-100 border-b border-slate-200/60 p-6 flex items-start justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                P P Savani University • Faculty Record
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-slate-700 border border-slate-200 shadow-2xs">
                {profile.status === "ACTIVE" ? "Active Faculty" : profile.status}
              </span>
            </div>

            {/* Profile Avatar & Info Content */}
            <div className="px-6 sm:px-8 pb-8 pt-0 relative">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  {/* Luxury Monogram Avatar (Zero Colored Dots) */}
                  <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-gradient-to-br from-red-600 via-rose-600 to-red-800 text-white flex items-center justify-center text-3xl sm:text-4xl font-extrabold shadow-md border-4 border-white shrink-0 select-none">
                    {initials(profile.name)}
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {profile.name}
                    </h2>
                    <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                      <span>{profile.designation || "Assistant Professor"}</span>
                      <span>•</span>
                      <span>{deptName}</span>
                    </p>
                  </div>
                </div>

                {/* Employee ID Copy Pill */}
                <button
                  onClick={copyEmpId}
                  className="self-start sm:self-end inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-mono font-semibold text-slate-700 transition-colors cursor-pointer"
                  title="Click to copy Employee ID"
                >
                  <Hash className="h-3.5 w-3.5 text-slate-400" />
                  <span>{profile.employee_id || "EMP002"}</span>
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </button>
              </div>

              {/* ═══════════ CREDENTIALS BENTO GRID ═══════════ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-4 border-t border-slate-100">
                {identityDetails.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="p-3.5 rounded-2xl border border-slate-200/70 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all flex items-start gap-3"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200/80 text-slate-600 shrink-0 shadow-2xs">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {item.label}
                        </p>
                        <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ═══════════ RESEARCH & INCENTIVE OVERVIEW (NO BLUE, NO DOTS) ═══════════ */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Research Incentive Portfolio
                </h3>
                <p className="text-xs text-slate-500">
                  Aggregate research submissions and approved financial incentives
                </p>
              </div>
              <Link
                href="/faculty/claims"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 hover:text-red-800 transition-colors"
              >
                <span>View All Claims</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Metric 1 */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Lifetime Claims
                </span>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stats.totalClaims}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Total claims submitted
                </p>
              </div>

              {/* Metric 2 */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Approved Claims
                </span>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stats.approvedClaims}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Successfully verified & passed
                </p>
              </div>

              {/* Metric 3 */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Total Sanctioned Incentive
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-red-700 tracking-tight font-mono">
                  {formatInr(stats.totalApprovedAmount)}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Provost final approved payout
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
