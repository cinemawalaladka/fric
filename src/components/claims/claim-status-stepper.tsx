"use client";

import { cn } from "@/lib/utils";
import { STAGE_SEQUENCE, WORKFLOW_STAGES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, RotateCcw, XCircle, Award, AlertCircle, Building2, BookOpen, GraduationCap, ShieldCheck, Users, Printer } from "lucide-react";

type ApprovalRecord = {
  id?: string;
  stage: string;
  status: string;
  remarks?: string | null;
  approved_amount?: number | null;
  action_at?: string | null;
  approver?: {
    name?: string;
    designation?: string;
  } | null;
};

interface ClaimStatusStepperProps {
  currentStage: string;
  status: string;
  approvals?: ApprovalRecord[];
  approvedAmount?: number | null;
  className?: string;
  onPrint?: () => void;
  canPrint?: boolean;
}

const STEP_ICONS: Record<string, any> = {
  FACULTY: GraduationCap,
  HOD_PRINCIPAL: Building2,
  COMMITTEE_M1: BookOpen,
  COMMITTEE_M2: Users,
  GOVERNOR: ShieldCheck,
  PROVOST: ShieldCheck,
  APPROVED: Award,
};

const ORDERED_STEPS = [
  { code: "FACULTY", label: WORKFLOW_STAGES.FACULTY.title, roleLabel: WORKFLOW_STAGES.FACULTY.roleLabel },
  ...STAGE_SEQUENCE.filter((code) => code !== "APPROVED").map((code) => ({
    code,
    label: WORKFLOW_STAGES[code].title,
    roleLabel: WORKFLOW_STAGES[code].roleLabel,
  })),
];

function formatTime(isoString?: string | null) {
  if (!isoString) return "";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export function ClaimStatusStepper({
  currentStage = "FACULTY",
  status = "SUBMITTED",
  approvals = [],
  approvedAmount,
  className,
  onPrint,
  canPrint = true,
}: ClaimStatusStepperProps) {
  const isReturned = status === "RETURNED";
  const isRejected = status === "REJECTED";
  const isFullyApproved = status === "APPROVED" || currentStage === "APPROVED";

  // Build lookup map for approvals by stage
  const approvalMap = new Map<string, ApprovalRecord>();
  approvals.forEach((app) => {
    approvalMap.set(app.stage, app);
  });

  // Calculate active stage index
  const activeIndex = isFullyApproved
    ? ORDERED_STEPS.length
    : ORDERED_STEPS.findIndex((s) => s.code === currentStage);

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Payout Sanctioned Banner if fully approved */}
      {isFullyApproved && (
        <div className="bg-gradient-to-r from-emerald-500/15 via-green-500/10 to-emerald-500/15 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                Claim Sanctioned & Approved by Provost!
              </h4>
              <p className="text-xs text-muted-foreground">
                All configured workflow stages have approved this claim. Payout authorization complete.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0 self-end sm:self-center">
            {approvedAmount !== null && approvedAmount !== undefined && (
              <div className="text-right shrink-0">
                <span className="text-xs font-medium text-emerald-400/80 block uppercase tracking-wider">Approved Amount</span>
                <span className="text-lg font-bold text-emerald-400">{formatInr(approvedAmount)}</span>
              </div>
            )}
            {canPrint && onPrint && (
              <Button
                type="button"
                onClick={onPrint}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-md shadow-emerald-900/20 shrink-0"
              >
                <Printer className="h-4 w-4" />
                Print Sanction Order (PDF)
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Status banner for Returned / Rejected */}
      {isReturned && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-start gap-3">
          <RotateCcw className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-orange-400">Claim Returned for Revision</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Please review the feedback from verifier, update your claim documents/data, and resubmit.
            </p>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-red-400">Claim Rejected</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              This claim has been rejected during verification.
            </p>
          </div>
        </div>
      )}

      {/* Stepper Steps Flow */}
      <div className="relative">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 relative">
          {ORDERED_STEPS.map((step, idx) => {
            const Icon = STEP_ICONS[step.code] || Building2;
            const approvalRecord = approvalMap.get(step.code);

            // Determine accurate status for this step
            let stepState: "completed" | "current" | "bypassed" | "upcoming" | "returned" = "upcoming";

            if (step.code === "FACULTY") {
              stepState = status === "DRAFT" ? "current" : "completed";
            } else if (isFullyApproved) {
              stepState = "completed";
            } else if (approvalRecord && (approvalRecord.status === "VERIFIED" || approvalRecord.status === "APPROVED")) {
              stepState = "completed";
            } else if (step.code === currentStage) {
              stepState = isReturned ? "returned" : "current";
            } else if (idx < activeIndex) {
              stepState = "bypassed";
            } else {
              stepState = "upcoming";
            }

            return (
              <div key={step.code} className="flex flex-col items-center text-center relative group">
                {/* Step Icon Badge */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 relative border z-10",
                    stepState === "completed" && "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-500/10",
                    stepState === "current" && "bg-amber-500/20 border-amber-500/60 text-amber-400 animate-pulse ring-2 ring-amber-500/30",
                    stepState === "bypassed" && "bg-blue-500/15 border-blue-500/40 text-blue-400 shadow-sm",
                    stepState === "returned" && "bg-orange-500/20 border-orange-500/60 text-orange-400 ring-2 ring-orange-500/30",
                    stepState === "upcoming" && "bg-muted/40 border-border/40 text-muted-foreground opacity-60"
                  )}
                >
                  <Icon className="h-6 w-6" />
                  
                  {/* Status Overlay Badge */}
                  <div className="absolute -bottom-1 -right-1">
                    {stepState === "completed" && <CheckCircle2 className="h-4 w-4 text-emerald-400 fill-background" />}
                    {stepState === "current" && <Clock className="h-4 w-4 text-amber-400 fill-background animate-spin" style={{ animationDuration: "4s" }} />}
                    {stepState === "bypassed" && <ShieldCheck className="h-4 w-4 text-blue-400 fill-background" />}
                    {stepState === "returned" && <AlertCircle className="h-4 w-4 text-orange-400 fill-background" />}
                  </div>
                </div>

                {/* Step Metadata */}
                <div className="mt-3 space-y-1 w-full px-1">
                  <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground/70 block">
                    Stage {idx + 1}
                  </span>
                  <p className={cn("text-xs font-semibold line-clamp-1", stepState === "current" && "text-amber-400 font-bold", stepState === "completed" && "text-foreground")}>
                    {step.roleLabel}
                  </p>
                  
                  {/* State badge text */}
                  {step.code === "FACULTY" && stepState === "completed" ? (
                    <span className="inline-block text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                      Submitted
                    </span>
                  ) : stepState === "completed" ? (
                    <span className="inline-block text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                      Approved
                    </span>
                  ) : null}

                  {stepState === "bypassed" && (
                    <span className="inline-block text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full font-medium" title="Bypassed due to self-submission hierarchy">
                      Self-Bypassed
                    </span>
                  )}
                  {stepState === "current" && (
                    <span className="inline-block text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-medium">
                      Pending Here
                    </span>
                  )}
                  {stepState === "returned" && (
                    <span className="inline-block text-[10px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full font-medium">
                      Action Required
                    </span>
                  )}
                  {stepState === "upcoming" && (
                    <span className="inline-block text-[10px] text-muted-foreground/50">
                      Upcoming
                    </span>
                  )}

                  {/* Approver info or date */}
                  {approvalRecord?.action_at && (
                    <p className="text-[10px] text-muted-foreground/80 font-mono mt-1">
                      {formatTime(approvalRecord.action_at)}
                    </p>
                  )}
                  {approvalRecord?.approver?.name && (
                    <p className="text-[10px] text-muted-foreground truncate">
                      By {approvalRecord.approver.name}
                    </p>
                  )}
                  {approvalRecord?.remarks && (
                    <div className="mt-1.5 p-1.5 rounded bg-muted/40 text-[10px] text-muted-foreground italic text-left border border-border/30 line-clamp-2">
                      &quot;{approvalRecord.remarks}&quot;
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
