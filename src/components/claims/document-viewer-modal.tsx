"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  FileCheck,
  ZoomIn,
  ZoomOut,
  RotateCw,
  X,
  Maximize2,
  FileImage,
} from "lucide-react";
import { getDocumentDownloadUrl } from "@/app/actions/documents";

export interface PreviewableDocument {
  id?: string;
  file_name: string;
  document_type?: string;
  storage_path?: string;
  mime_type?: string;
  file_size?: number;
  verification_status?: string;
  file?: File;
  directUrl?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: PreviewableDocument | null;
}

export function DocumentViewerModal({ open, onOpenChange, document }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);

  useEffect(() => {
    if (!open || !document) {
      setUrl(null);
      setError(null);
      setZoom(100);
      setRotation(0);
      return;
    }

    if (document.file) {
      const objectUrl = URL.createObjectURL(document.file);
      setUrl(objectUrl);
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }

    if (document.directUrl) {
      setUrl(document.directUrl);
      return;
    }

    if (document.storage_path) {
      setLoading(true);
      setError(null);

      getDocumentDownloadUrl(document.storage_path)
        .then((res) => {
          if (res.success && res.signedUrl) {
            setUrl(res.signedUrl);
          } else {
            setError(res.error || "Failed to generate document preview link.");
          }
        })
        .catch((err) => {
          setError(err?.message || "An unexpected error occurred.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, document]);

  if (!document) return null;

  const fileName = document.file_name || "Document";
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const isPdf =
    ext === "pdf" ||
    document.mime_type?.includes("pdf") ||
    document.file?.type?.includes("pdf");
  const isImage =
    ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext) ||
    document.mime_type?.startsWith("image/") ||
    document.file?.type?.startsWith("image/");

  const handleDownload = () => {
    if (!url) return;
    const a = window.document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  const handleOpenNewTab = () => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleResetZoom = () => {
    setZoom(100);
    setRotation(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!max-w-[94vw] sm:!max-w-[90vw] md:!max-w-5xl lg:!max-w-6xl w-[94vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] h-[88vh] max-h-[92vh] flex flex-col p-0 overflow-hidden bg-slate-950 text-white border border-slate-800 shadow-2xl rounded-2xl ring-1 ring-white/10"
      >
        {/* ══════════ MODAL HEADER (CLEAN NON-OVERLAPPING BAR) ══════════ */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
          {/* Document Info Left */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center shrink-0">
              {isPdf ? (
                <FileText className="h-5 w-5 text-red-400" />
              ) : isImage ? (
                <FileImage className="h-5 w-5 text-red-400" />
              ) : (
                <FileCheck className="h-5 w-5 text-red-400" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <DialogTitle className="text-sm sm:text-base font-bold text-slate-100 truncate leading-snug">
                {document.document_type || fileName}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                <span className="truncate max-w-[200px] sm:max-w-[320px] font-mono text-[11px] text-slate-400">
                  {fileName}
                </span>
                {document.file_size ? (
                  <span className="text-[11px] text-slate-500 font-medium">
                    • {(document.file_size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                ) : null}
                {document.verification_status && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] uppercase font-bold px-1.5 py-0 h-4 shrink-0 ${
                      document.verification_status === "VERIFIED"
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : document.verification_status === "REJECTED"
                        ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                        : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    {document.verification_status}
                  </Badge>
                )}
              </DialogDescription>
            </div>
          </div>

          {/* Action Buttons Right */}
          <div className="flex items-center gap-2 shrink-0">
            {url && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenNewTab}
                className="hidden sm:inline-flex items-center border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white text-xs h-8 px-3 rounded-lg font-medium transition-colors"
                title="Open in new browser tab"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                Open Tab
              </Button>
            )}

            {url && (
              <Button
                size="sm"
                onClick={handleDownload}
                className="bg-[#b91c1c] hover:bg-[#991b1b] text-white text-xs h-8 px-3.5 font-bold rounded-lg shadow-sm transition-all"
                title="Download original document"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download
              </Button>
            )}

            {/* Custom Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Preview"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {/* ══════════ VIEWER BODY CANVAS ══════════ */}
        <div className="flex-1 min-h-0 bg-slate-950 flex flex-col items-center justify-center p-3 sm:p-4 relative overflow-hidden">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center space-y-3 py-20 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-[#b91c1c]" />
              <p className="text-sm font-semibold text-slate-300">
                Opening secure document preview...
              </p>
              <p className="text-xs text-slate-500">Generating encrypted signed access URL</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-8 max-w-md text-center space-y-3 bg-slate-900/60 rounded-2xl border border-rose-500/20">
              <AlertCircle className="h-12 w-12 text-rose-400 mx-auto" />
              <h4 className="text-base font-bold text-rose-300">
                Unable to load preview
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="border-slate-700 text-slate-300 hover:text-white"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {/* Document Content View */}
          {!loading && !error && url && (
            <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden rounded-xl bg-slate-900/50 border border-slate-800/60">
              {isPdf ? (
                <iframe
                  src={`${url}#view=FitH`}
                  className="w-full h-full border-0 bg-white rounded-lg"
                  title={fileName}
                />
              ) : isImage ? (
                <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
                  {/* Image Scrollable Box */}
                  <div className="w-full h-full flex items-center justify-center overflow-auto p-4 select-none">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={fileName}
                      style={{
                        transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                        transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        maxWidth: "100%",
                        maxHeight: "100%",
                      }}
                      className="object-contain rounded-lg shadow-2xl border border-slate-800/80 pointer-events-auto"
                    />
                  </div>

                  {/* Dedicated Floating Image Toolbar at Bottom */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/80 shadow-xl z-20">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setZoom((z) => Math.max(50, z - 25))}
                      className="h-7 w-7 p-0 rounded-full text-slate-300 hover:text-white hover:bg-slate-800"
                      title="Zoom Out"
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-xs font-mono font-bold px-2 text-slate-200 select-none min-w-[48px] text-center">
                      {zoom}%
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setZoom((z) => Math.min(300, z + 25))}
                      className="h-7 w-7 p-0 rounded-full text-slate-300 hover:text-white hover:bg-slate-800"
                      title="Zoom In"
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </Button>
                    <div className="h-4 w-px bg-slate-700 mx-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="h-7 w-7 p-0 rounded-full text-slate-300 hover:text-white hover:bg-slate-800"
                      title="Rotate 90°"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetZoom}
                      className="h-7 px-2 text-[11px] font-semibold rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Reset View"
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              ) : (
                /* Fallback for non-PDF non-image files */
                <div className="p-8 sm:p-12 text-center space-y-4 max-w-md">
                  <div className="h-16 w-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto shadow-inner">
                    <FileText className="h-8 w-8 text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-200">
                      File type preview not directly supported
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Download this document to view it locally on your computer.
                    </p>
                  </div>
                  <Button
                    onClick={handleDownload}
                    className="bg-[#b91c1c] hover:bg-[#991b1b] text-white text-xs h-9 px-4 font-bold rounded-xl shadow transition-all"
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Download File ({fileName})
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
