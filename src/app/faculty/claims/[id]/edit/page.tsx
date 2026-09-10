"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Save, Send, CheckCircle2, Loader2, Sparkles, AlertTriangle } from "lucide-react";

// Hook
import { useClaimForm } from "@/hooks/use-claim-form";

// Steps
import { StepClaimType } from "@/components/claims/form-steps/step-claim-type";
import { StepCommonPublicationForm } from "@/components/claims/form-steps/step-common-publication";
import { StepCitation } from "@/components/claims/form-steps/step-citation";
import { StepResearchProject } from "@/components/claims/form-steps/step-research-project";
import { StepAuthors } from "@/components/claims/form-steps/step-authors";
import { StepIncentiveSummary } from "@/components/claims/form-steps/step-incentive-summary";
import { StepDocuments } from "@/components/claims/form-steps/step-documents";
import { StepReview } from "@/components/claims/form-steps/step-review";

// Actions
import { getClaimDetailsWithHistory, updateClaim } from "@/app/actions/claims";
import { uploadMultipleClaimDocuments, uploadClaimDocument } from "@/app/actions/documents";

export default function EditClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: claimId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [claimData, setClaimData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    state,
    stepLabels,
    currentStepKey,
    canAdvance,
    departmentName,
    schoolName,
    setClaimType,
    updateDetail,
    setAuthorshipPosition,
    setAuthorNumber,
    addAuthor,
    updateAuthor,
    removeAuthor,
    addCoPI,
    updateCoPI,
    removeCoPI,
    setDocumentFile,
    setDeclaration,
    nextStep,
    prevStep,
  } = useClaimForm(claimData);

  useEffect(() => {
    getClaimDetailsWithHistory(claimId).then((res) => {
      if (res.success && res.claim) {
        setClaimData(res.claim);
      } else {
        setSubmitError(res.error || "Claim not found.");
      }
      setLoading(false);
    });
  }, [claimId]);

  const handleSubmit = async () => {
    if (!state.claimType || !state.declarationAccepted) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitStatus("Updating claim details...");

    try {
      const result = await updateClaim(
        claimId,
        state.claimType.toUpperCase(),
        {
          ...state.details,
          authorshipPosition: state.authorshipPosition,
          authorNumber: state.authorNumber,
          authors: state.authors,
          coPIs: state.coPIs,
          estimatedAmount: state.incentivePreview?.facultyShare,
          calculationSnapshot: state.incentivePreview,
        },
        "SUBMITTED"
      );

      if (result.success) {
        // Upload any newly attached files
        const filesToUpload = state.documents.filter((d) => d.file !== null);
        if (filesToUpload.length > 0) {
          for (let i = 0; i < filesToUpload.length; i++) {
            const slot = filesToUpload[i];
            if (!slot.file) continue;
            setSubmitStatus(
              `Uploading document ${i + 1} of ${filesToUpload.length}: ${slot.label} (${(
                slot.file.size /
                1024 /
                1024
              ).toFixed(2)} MB)...`
            );
            const uploadFormData = new FormData();
            uploadFormData.append("claimId", claimId);
            uploadFormData.append("documentType", slot.label || slot.slotId);
            uploadFormData.append("file", slot.file);

            try {
              const res = await fetch("/api/documents/upload", {
                method: "POST",
                body: uploadFormData,
              });
              if (!res.ok) {
                const saFormData = new FormData();
                saFormData.append("file", slot.file);
                await uploadClaimDocument(claimId, slot.label || slot.slotId, saFormData);
              }
            } catch (e) {
              const saFormData = new FormData();
              saFormData.append("file", slot.file);
              await uploadClaimDocument(claimId, slot.label || slot.slotId, saFormData);
            }
          }
        }

        setSubmitStatus("Resubmitted successfully!");
        router.push("/faculty/claims");
      } else {
        setSubmitError(result.error || "Failed to submit claim.");
      }
    } catch (err: any) {
      setSubmitError(err?.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
      setSubmitStatus(null);
    }
  };

  const handleSaveDraft = async () => {
    if (!state.claimType) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitStatus("Saving draft...");

    try {
      const result = await updateClaim(
        claimId,
        state.claimType.toUpperCase(),
        {
          ...state.details,
          authorshipPosition: state.authorshipPosition,
          authorNumber: state.authorNumber,
          authors: state.authors,
          coPIs: state.coPIs,
          estimatedAmount: state.incentivePreview?.facultyShare,
          calculationSnapshot: state.incentivePreview,
        },
        "DRAFT"
      );

      if (result.success) {
        // Upload any newly attached files
        const filesToUpload = state.documents.filter((d) => d.file !== null);
        if (filesToUpload.length > 0) {
          for (let i = 0; i < filesToUpload.length; i++) {
            const slot = filesToUpload[i];
            if (!slot.file) continue;
            setSubmitStatus(
              `Saving document ${i + 1} of ${filesToUpload.length}: ${slot.label}...`
            );
            const uploadFormData = new FormData();
            uploadFormData.append("claimId", claimId);
            uploadFormData.append("documentType", slot.label || slot.slotId);
            uploadFormData.append("file", slot.file);

            try {
              const res = await fetch("/api/documents/upload", {
                method: "POST",
                body: uploadFormData,
              });
              if (!res.ok) {
                const saFormData = new FormData();
                saFormData.append("file", slot.file);
                await uploadClaimDocument(claimId, slot.label || slot.slotId, saFormData);
              }
            } catch (e) {
              const saFormData = new FormData();
              saFormData.append("file", slot.file);
              await uploadClaimDocument(claimId, slot.label || slot.slotId, saFormData);
            }
          }
        }

        setSubmitStatus("Draft saved successfully!");
        router.push("/faculty/drafts");
      } else {
        setSubmitError(result.error || "Failed to save draft.");
      }
    } catch (err: any) {
      setSubmitError(err?.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
      setSubmitStatus(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#b91c1c]" />
        <p className="text-sm font-semibold text-slate-600">Loading claim details for editing...</p>
      </div>
    );
  }

  if (claimData && claimData.status !== "DRAFT" && claimData.status !== "RETURNED") {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-amber-600 mx-auto" />
        <h2 className="text-xl font-bold text-amber-900">Claim Cannot Be Edited</h2>
        <p className="text-sm text-amber-800">
          Claim <strong>{claimData.claim_number}</strong> is currently in status <strong>{claimData.status}</strong> and cannot be edited. Only Draft or Returned claims can be modified.
        </p>
        <Button onClick={() => router.push("/faculty/claims")} className="bg-[#b91c1c] text-white">
          Back to My Claims
        </Button>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStepKey) {
      case "claim_type":
        return <StepClaimType selectedType={state.claimType} onSelect={setClaimType} />;

      case "details":
        if (
          state.claimType === "research_paper" ||
          state.claimType === "book" ||
          state.claimType === "book_chapter" ||
          state.claimType === "patent"
        ) {
          return (
            <StepCommonPublicationForm
              claimType={state.claimType}
              faculty={state.faculty}
              departmentName={departmentName}
              schoolName={schoolName}
              details={state.details}
              onUpdate={updateDetail}
            />
          );
        }
        if (state.claimType === "citation") {
          return (
            <StepCitation
              faculty={state.faculty}
              departmentName={departmentName}
              schoolName={schoolName}
              details={state.details}
              onUpdate={updateDetail}
            />
          );
        }
        if (state.claimType === "research_project") {
          return (
            <StepResearchProject
              faculty={state.faculty}
              departmentName={departmentName}
              schoolName={schoolName}
              details={state.details}
              onUpdate={updateDetail}
              coPIs={state.coPIs}
              onAddCoPI={addCoPI}
              onUpdateCoPI={updateCoPI}
              onRemoveCoPI={removeCoPI}
              onSetDocumentFile={setDocumentFile}
              depositProofFile={state.documents.find((d) => d.slotId === "ppsu_deposit_proof")?.file || state.details.depositProofFile}
            />
          );
        }
        return null;

      case "authors":
        return (
          <StepAuthors
            claimType={state.claimType!}
            authorshipPosition={state.authorshipPosition}
            onSetAuthorshipPosition={setAuthorshipPosition}
            authorNumber={state.authorNumber}
            onSetAuthorNumber={setAuthorNumber}
            authors={state.authors}
            onAddAuthor={addAuthor}
            onUpdateAuthor={updateAuthor}
            onRemoveAuthor={removeAuthor}
          />
        );

      case "incentive":
        return (
          <StepIncentiveSummary
            incentive={state.incentivePreview}
            claimType={state.claimType!}
          />
        );

      case "documents":
        return <StepDocuments documents={state.documents} onSetFile={setDocumentFile} />;

      case "review":
        return (
          <StepReview
            claimType={state.claimType!}
            faculty={state.faculty}
            departmentName={departmentName}
            details={state.details}
            authorshipPosition={state.authorshipPosition}
            authors={state.authors}
            coPIs={state.coPIs}
            incentive={state.incentivePreview}
            documents={state.documents}
            declarationAccepted={state.declarationAccepted}
            onSetDeclaration={setDeclaration}
          />
        );

      default:
        return null;
    }
  };

  const isLastStep = state.currentStep === state.totalSteps;
  const progressPercent = Math.round((state.currentStep / state.totalSteps) * 100);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
              Edit Claim ({claimData?.claim_number})
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <Sparkles className="w-3 h-3 mr-1" /> Correct & Resubmit
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Update your claim details and resubmit without creating a duplicate record.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => router.back()}
          className="border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold uppercase tracking-wider text-slate-700">
            Progress: Step {state.currentStep} of {state.totalSteps}
          </span>
          <span className="font-mono font-bold text-[#b91c1c]">
            {progressPercent}% Complete
          </span>
        </div>

        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#b91c1c] to-red-600 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          {stepLabels.map((label, i) => {
            const stepNum = i + 1;
            const isCompleted = state.currentStep > stepNum;
            const isActive = state.currentStep === stepNum;
            return (
              <div key={i} className="flex flex-col items-center group">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold transition-all duration-200",
                    isCompleted
                      ? "bg-emerald-500 text-white shadow-sm"
                      : isActive
                      ? "bg-[#b91c1c] text-white shadow-md ring-4 ring-red-100 scale-110"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  )}
                >
                  {isCompleted ? <CheckCircle2 className="h-4 w-4 stroke-[3]" /> : stepNum}
                </div>
                <span
                  className={cn(
                    "text-[10px] mt-1.5 hidden sm:block text-center max-w-[75px] leading-tight transition-colors",
                    isActive
                      ? "font-extrabold text-[#b91c1c]"
                      : isCompleted
                      ? "font-semibold text-slate-700"
                      : "text-slate-400 font-medium"
                  )}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm min-h-[420px]">
        {renderStep()}

        {submitError && (
          <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm font-semibold text-rose-700">
            {submitError}
          </div>
        )}

        <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={state.currentStep === 1 || submitting}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl h-11 px-5"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-amber-200 text-amber-800 hover:bg-amber-50 font-bold rounded-xl h-11 px-5"
              onClick={handleSaveDraft}
              disabled={submitting}
            >
              <Save className="mr-2 h-4 w-4 text-amber-600" /> Save Updates
            </Button>

            {!isLastStep ? (
              <Button
                onClick={nextStep}
                disabled={!canAdvance || submitting}
                className="bg-[#b91c1c] hover:bg-[#991b1b] text-white font-bold rounded-xl h-11 px-6 shadow-md hover:shadow-lg transition-all"
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!state.declarationAccepted || submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11 px-6 shadow-md hover:shadow-lg transition-all"
              >
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {submitting ? "Resubmitting..." : "Resubmit Claim"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
