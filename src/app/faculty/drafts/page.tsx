"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getFacultyDashboardData } from "@/app/actions/dashboard";
import {
  FileText,
  Search,
  ArrowRight,
  Plus,
  Sparkles,
  BookOpen,
  BookMarked,
  Wrench,
  BarChart3,
  FlaskConical,
  Edit3,
  Clock,
  XCircle,
  FolderOpen,
} from "lucide-react";

type DraftClaim = {
  id: string;
  number: string;
  type: string;
  title: string;
  status: string;
  date: string;
};

function getCategoryIcon(typeStr: string) {
  const lower = (typeStr || "").toLowerCase();
  if (lower.includes("paper")) return FileText;
  if (lower.includes("book chapter")) return BookMarked;
  if (lower.includes("book")) return BookOpen;
  if (lower.includes("patent")) return Wrench;
  if (lower.includes("citation")) return BarChart3;
  if (lower.includes("project") || lower.includes("grant")) return FlaskConical;
  return FileText;
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<DraftClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getFacultyDashboardData().then((res) => {
      if (res.success) {
        setDrafts(
          ((res.claims || []) as DraftClaim[]).filter(
            (claim) => claim.status === "DRAFT"
          )
        );
      }
      setLoading(false);
    });
  }, []);

  const filteredDrafts = useMemo(() => {
    return drafts.filter((draft) => {
      const term = search.toLowerCase();
      return (
        (draft.title || "").toLowerCase().includes(term) ||
        (draft.number || "").toLowerCase().includes(term)
      );
    });
  }, [drafts, search]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* ═══════════ TOP HEADER ═══════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
              Draft Claims
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <Sparkles className="w-3 h-3 mr-1 text-amber-600" /> Draft Vault
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Review, edit, and complete your saved research incentive claims
          </p>
        </div>

        <Link
          href="/faculty/new-claim"
          className={cn(
            buttonVariants({}),
            "bg-[#b91c1c] hover:bg-[#991b1b] text-white font-bold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center shrink-0"
          )}
        >
          <Plus className="mr-2 h-4 w-4 stroke-[3]" />
          New Claim
        </Link>
      </div>

      {/* ═══════════ SEARCH BAR (WHEN DRAFTS EXIST) ═══════════ */}
      {drafts.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search drafts by Claim ID or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-slate-50 border-slate-200/80 rounded-xl focus:bg-white text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium px-2 shrink-0">
            <strong>{filteredDrafts.length}</strong> {filteredDrafts.length === 1 ? "draft" : "drafts"} saved
          </div>
        </div>
      )}

      {/* ═══════════ DRAFTS LIST OR EMPTY STATE ═══════════ */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <p className="text-slate-400 font-mono text-sm animate-pulse">
            Fetching saved draft claims...
          </p>
        </div>
      ) : drafts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/70 flex items-center justify-center mx-auto mb-4 text-amber-600">
            <FolderOpen className="h-8 w-8 stroke-[1.5]" />
          </div>
          <h2 className="text-lg font-extrabold text-[#0f172a]">No Saved Drafts</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 mb-6 leading-relaxed">
            You don&apos;t have any incomplete research incentive claims saved. When you save a draft during submission, it will appear here so you can continue anytime.
          </p>
          <Link
            href="/faculty/new-claim"
            className={cn(
              buttonVariants({}),
              "bg-[#b91c1c] hover:bg-[#991b1b] text-white font-bold px-6 py-2.5 rounded-xl shadow-md inline-flex items-center"
            )}
          >
            <Plus className="mr-2 h-4 w-4 stroke-[3]" />
            Create New Claim
          </Link>
        </div>
      ) : filteredDrafts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-800">No matching drafts found</p>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Try adjusting your search terms or clear search to view all drafts.
          </p>
          <button
            onClick={() => setSearch("")}
            className="text-xs text-[#b91c1c] font-bold hover:underline"
          >
            Clear Search Filter
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDrafts.map((draft) => {
            const TypeIcon = getCategoryIcon(draft.type);
            return (
              <div
                key={draft.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200 group"
              >
                {/* Left Meta Info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200/70 shrink-0 group-hover:scale-105 transition-transform">
                    <TypeIcon className="h-5 w-5 stroke-[2.2]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-extrabold text-amber-800">
                        {draft.number || "DRAFT"}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {draft.type}
                      </span>
                      {draft.date && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {draft.date}
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[#b91c1c] transition-colors truncate">
                      {draft.title || "Untitled Draft Claim"}
                    </h3>
                  </div>
                </div>

                {/* Right Side: Status Badge & Continue Action */}
                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-800 border-amber-200/80 px-3 py-1 text-xs font-bold rounded-full"
                  >
                    Draft
                  </Badge>

                  <Link
                    href={`/faculty/new-claim?draft=${draft.id}`}
                    className={cn(
                      buttonVariants({ size: "sm" }),
                      "bg-[#b91c1c] hover:bg-[#991b1b] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm hover:shadow transition-all"
                    )}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Continue
                    <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
