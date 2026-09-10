"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getFacultyDashboardData } from "@/app/actions/dashboard";
import {
  FileText,
  Send,
  RotateCcw,
  CheckCircle2,
  Plus,
  ArrowRight,
  ChevronRight,
  Clock,
  Sparkles,
  IndianRupee,
  Wallet,
} from "lucide-react";

type FacultyClaim = {
  id: string;
  number: string;
  type: string;
  title: string;
  status: string;
  claimedAmount: number;
  calculatedAmount: number;
  approvedAmount: number;
  date: string;
};

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  DRAFT: {
    label: "Draft",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  SUBMITTED: {
    label: "Submitted",
    className: "bg-slate-100 text-slate-800 border-slate-300",
  },
  UNDER_VERIFICATION: {
    label: "Under Verification",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  VERIFIED: {
    label: "Verified",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  RETURNED: {
    label: "Returned",
    className: "bg-orange-50 text-orange-800 border-orange-200",
  },
  RESUBMITTED: {
    label: "Resubmitted",
    className: "bg-slate-100 text-slate-800 border-slate-300",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
};

function formatInrRaw(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Split-Flap Digit Tile Component (Light Liquid Glass Aesthetic)
function AirportDigitDisplay({
  amount,
  variant = "claimed",
}: {
  amount: number;
  variant?: "claimed" | "approved";
}) {
  const formatted = formatInrRaw(amount);
  const chars = formatted.split("");

  const tileStyles =
    variant === "approved"
      ? "bg-red-50/70 border-red-200/90 text-red-700"
      : "bg-slate-50/90 border-slate-200 text-slate-800";

  const dividerColor =
    variant === "approved" ? "bg-red-200/60" : "bg-slate-200/80";

  return (
    <div className="flex items-center gap-1.5 flex-wrap my-2 font-mono">
      {chars.map((char, idx) => (
        <div
          key={idx}
          className={cn(
            "relative flex items-center justify-center min-w-[26px] h-10 px-1.5 rounded-md border text-xl font-extrabold font-mono tracking-wider select-none",
            tileStyles
          )}
        >
          {/* Split flap horizontal divider line */}
          <span
            className={cn(
              "absolute inset-x-0 top-1/2 h-[1px] z-10 pointer-events-none",
              dividerColor
            )}
          />
          <span className="relative z-0">{char}</span>
        </div>
      ))}
    </div>
  );
}

export default function FacultyDashboardPage() {
  const [claims, setClaims] = useState<FacultyClaim[]>([]);
  const [facultyName, setFacultyName] = useState<string>("Dr. Faculty User");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFacultyDashboardData().then((res) => {
      if (res.success) {
        setClaims((res.claims || []) as FacultyClaim[]);
        if (res.facultyName) setFacultyName(res.facultyName);
      }
      setLoading(false);
    });
  }, []);

  // Filter Exactly 4 Analytic Cards
  const stats = useMemo(() => {
    const count = (status: string) =>
      claims.filter((claim) => claim.status === status).length;
    return [
      {
        label: "Total Claims",
        value: claims.length,
        description: "Lifetime submitted",
      },
      {
        label: "Submitted",
        value:
          count("SUBMITTED") +
          count("UNDER_VERIFICATION") +
          count("RESUBMITTED"),
        description: "In verification queue",
      },
      {
        label: "Verified & Approved",
        value: count("VERIFIED") + count("APPROVED"),
        description: "Incentive approved",
      },
      {
        label: "Returned",
        value: count("RETURNED"),
        description: "Requires revision",
      },
    ];
  }, [claims]);

  const totalClaimed = claims.reduce(
    (sum, claim) => sum + (claim.claimedAmount || claim.calculatedAmount || 0),
    0
  );
  const totalApproved = claims
    .filter((claim) => claim.status === "APPROVED")
    .reduce((sum, claim) => sum + (claim.approvedAmount || 0), 0);
  const recentClaims = claims.slice(0, 5);

  return (
    <div className="space-y-6 pb-8">
      {/* ═══════════ TOP HEADER — HELLO USER + LIQUID GLASS NEW CLAIM BUTTON ═══════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Hello, {facultyName}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Welcome
          </p>
        </div>

        <Link
          href="/faculty/new-claim"
          className="group relative inline-flex items-center justify-center gap-2.5 px-4.5 py-2 rounded-full bg-white/80 hover:bg-white text-slate-800 hover:text-red-700 font-bold text-sm backdrop-blur-md border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm transition-all duration-200 shrink-0"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow-xs group-hover:scale-105 transition-transform">
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
          </span>
          <span className="font-semibold text-slate-900 group-hover:text-red-700 transition-colors">New Claim</span>
        </Link>
      </div>

      {/* ═══════════ UNIFIED METRIC STRIP ═══════════ */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-md shadow-xs overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/70">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="p-4 sm:p-5 flex flex-col justify-center transition-colors hover:bg-slate-50/60"
            >
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                {stat.label}
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                {stat.value}
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 hidden sm:inline-block">
                {stat.description}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════ DISPLAY BOARD AMOUNT CARDS (LIGHT LIQUID GLASS DESIGN) ═══════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Claimed Amount Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between transition-all hover:bg-white">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Claimed Amount
            </span>
          </div>

          <AirportDigitDisplay amount={totalClaimed} variant="claimed" />

          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Cumulative estimated incentive amount across submitted claims</span>
          </p>
        </div>

        {/* Total Approved Amount Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between transition-all hover:bg-white">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Approved Amount
            </span>
          </div>

          <AirportDigitDisplay amount={totalApproved} variant="approved" />

          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Total sanction amount approved by research cell & Provost</span>
          </p>
        </div>
      </div>

      {/* ═══════════ RECENT CLAIMS DATA TABLE (SHARP CORNERS, ZERO BLUE/RED, ZERO ICONS) ═══════════ */}
      <div className="bg-white border border-slate-200 overflow-hidden">
        {/* Table Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Recent Claims
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Your latest research incentive submissions
            </p>
          </div>
          <Link
            href="/faculty/claims"
            className="text-xs font-semibold text-slate-700 hover:text-slate-950 transition-colors uppercase tracking-wider underline underline-offset-4"
          >
            View All
          </Link>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Loading recent claims...
          </div>
        ) : recentClaims.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="text-sm font-medium text-slate-700">No claims submitted yet.</p>
            <p className="text-xs text-slate-400 mt-1">
              Click &quot;New Claim&quot; to submit your research incentive.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90">
                  <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    CLAIM ID
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    TYPE
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    SUBMITTED ON
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    STATUS
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase text-right">
                    APPROVED AMOUNT
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase text-right">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {recentClaims.map((claim) => {
                  const status =
                    STATUS_MAP[claim.status] || STATUS_MAP.DRAFT;
                  const displayAmount =
                    claim.approvedAmount || claim.calculatedAmount || claim.claimedAmount;

                  return (
                    <tr
                      key={claim.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* CLAIM ID */}
                      <td className="px-6 py-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {claim.number || "RI-001"}
                      </td>

                      {/* TYPE (NO ICON) */}
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-semibold text-slate-900 block truncate max-w-[240px]">
                            {claim.type}
                          </span>
                          <span className="text-xs text-slate-500 truncate block max-w-[240px] mt-0.5">
                            {claim.title}
                          </span>
                        </div>
                      </td>

                      {/* SUBMITTED ON */}
                      <td className="px-6 py-4 text-slate-600 text-xs font-medium whitespace-nowrap">
                        {claim.date || "10 May 2024"}
                      </td>

                      {/* STATUS (NO DOT) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 text-xs font-semibold border",
                            status.className
                          )}
                        >
                          {status.label}
                        </span>
                      </td>

                      {/* APPROVED AMOUNT */}
                      <td className="px-6 py-4 text-right font-bold text-slate-900 font-mono">
                        {formatInrRaw(displayAmount)}
                      </td>

                      {/* ACTION */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Link
                          href={`/faculty/claims/${claim.id}`}
                          className="inline-flex items-center px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition-colors"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

