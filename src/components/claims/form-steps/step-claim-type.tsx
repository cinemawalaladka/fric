"use client";

import { CLAIM_TYPES } from "@/lib/claim-form-config";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface Props {
  selectedType: string | null;
  onSelect: (type: string) => void;
}

const CATEGORY_STYLE_MAP: Record<
  string,
  { iconBg: string; iconColor: string }
> = {
  research_paper: {
    iconBg: "bg-blue-500/10 border-blue-500/20",
    iconColor: "text-blue-600",
  },
  book: {
    iconBg: "bg-indigo-500/10 border-indigo-500/20",
    iconColor: "text-indigo-600",
  },
  book_chapter: {
    iconBg: "bg-purple-500/10 border-purple-500/20",
    iconColor: "text-purple-600",
  },
  patent: {
    iconBg: "bg-amber-500/10 border-amber-500/20",
    iconColor: "text-amber-600",
  },
  citation: {
    iconBg: "bg-cyan-500/10 border-cyan-500/20",
    iconColor: "text-cyan-600",
  },
  research_project: {
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    iconColor: "text-emerald-600",
  },
};

export function StepClaimType({ selectedType, onSelect }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
            Select Claim Category
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Step 1
          </span>
        </div>
        <p className="text-sm text-slate-500">
          Choose the research output category that matches your submission.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CLAIM_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          const style =
            CATEGORY_STYLE_MAP[type.id] || CATEGORY_STYLE_MAP.research_paper;

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelect(type.id)}
              className={cn(
                "relative text-left p-5 rounded-2xl border transition-all duration-200 group flex items-start gap-4 cursor-pointer",
                isSelected
                  ? "border-[#b91c1c] bg-red-50/30 shadow-md ring-2 ring-[#b91c1c]/20"
                  : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
              )}
            >
              {/* Category Icon */}
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl border shrink-0 transition-transform group-hover:scale-105",
                  style.iconBg,
                  style.iconColor
                )}
              >
                <Icon className="h-6 w-6 stroke-[2.2]" />
              </div>

              {/* Text info */}
              <div className="flex-1 min-w-0 pr-6">
                <p className="text-base font-extrabold text-[#0f172a] group-hover:text-[#b91c1c] transition-colors">
                  {type.name}
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {type.description}
                </p>
              </div>

              {/* Checkmark */}
              {isSelected ? (
                <div className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-[#b91c1c] text-white shadow-sm">
                  <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                </div>
              ) : (
                <div className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 group-hover:border-slate-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
