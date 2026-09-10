"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, X, AlertCircle, CheckCircle2, Eye } from "lucide-react";
import type { DocumentSlot } from "@/hooks/use-claim-form";
import { DocumentViewerModal, type PreviewableDocument } from "@/components/claims/document-viewer-modal";
import { Button } from "@/components/ui/button";

interface Props {
  documents: DocumentSlot[];
  onSetFile: (slotId: string, file: File | null) => void;
}

export function StepDocuments({ documents, onSetFile }: Props) {
  const [previewDoc, setPreviewDoc] = useState<PreviewableDocument | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const mandatoryCount = documents.filter((d) => d.mandatory).length;
  const mandatoryUploaded = documents.filter((d) => d.mandatory && d.file).length;
  const allMandatoryDone = mandatoryCount === mandatoryUploaded;

  const handleFileChange = (slotId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Validate file size (50 MB max)
      if (file.size > 50 * 1024 * 1024) {
        alert("File size exceeds 50 MB limit.");
        return;
      }
      onSetFile(slotId, file);
    }
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handlePreview = (slot: DocumentSlot) => {
    if (!slot.file) return;
    setPreviewDoc({
      file_name: slot.file.name,
      document_type: slot.label,
      file_size: slot.file.size,
      mime_type: slot.file.type,
      file: slot.file,
    });
    setModalOpen(true);
  };

  return (
    <div className="animate-slide-up space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
            Supporting Verification Documents
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-[#b91c1c] border border-red-200/60">
            Step 4
          </span>
        </div>
        <p className="text-sm text-slate-500">
          Upload official proofs (PDF, PNG, JPG, WEBP — up to 50 MB per file).
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {!allMandatoryDone ? (
            <span className="text-amber-600 font-medium">
              ({mandatoryUploaded}/{mandatoryCount} mandatory documents uploaded)
            </span>
          ) : (
            <span className="text-emerald-600 font-semibold">
              ✓ All mandatory documents uploaded
            </span>
          )}
        </p>
      </div>

      <div className="space-y-3">
        {documents.map((slot) => (
          <Card key={slot.slotId} className="glass-card border-border/40">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                {/* Status icon */}
                <div className="mt-1 shrink-0">
                  {slot.file ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : slot.mandatory ? (
                    <AlertCircle className="h-5 w-5 text-amber-400/60" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-border/30" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{slot.label}</p>
                    {slot.mandatory && (
                      <span className="text-amber-400 text-[10px] font-bold">★ Required</span>
                    )}
                  </div>

                  {slot.helpText && (
                    <p className="text-[10px] text-muted-foreground mb-2">{slot.helpText}</p>
                  )}

                  {/* Uploaded file display */}
                  {slot.file ? (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border/20">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{slot.file.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {(slot.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(slot)}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        title="Preview file"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Preview
                      </Button>
                      <button
                        type="button"
                        onClick={() => onSetFile(slot.slotId, null)}
                        className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                        title="Remove file"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 p-3 border border-dashed border-border/40 rounded-lg hover:border-primary/30 hover:bg-primary/3 transition-all cursor-pointer">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Click to upload</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={(e) => handleFileChange(slot.slotId, e)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DocumentViewerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        document={previewDoc}
      />
    </div>
  );
}
