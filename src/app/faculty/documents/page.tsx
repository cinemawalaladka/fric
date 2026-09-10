"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/layout/app-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Eye, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFacultyDocumentsData } from "@/app/actions/dashboard";
import { getDocumentDownloadUrl } from "@/app/actions/documents";
import {
  DocumentViewerModal,
  type PreviewableDocument,
} from "@/components/claims/document-viewer-modal";

type DocumentRow = {
  id: string;
  name: string;
  type: string;
  claim: string;
  size: string;
  file_size?: number;
  storage_path?: string;
  mime_type?: string;
  status: string;
  uploadedAt: string;
};

const DOC_STATUS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-amber-400/10 text-amber-400 border-amber-400/20" },
  VERIFIED: { label: "Verified", className: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" },
  REJECTED: { label: "Rejected", className: "bg-red-400/10 text-red-400 border-red-400/20" },
};

export default function FacultyDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Document Viewer State
  const [previewDoc, setPreviewDoc] = useState<PreviewableDocument | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    getFacultyDocumentsData().then((res) => {
      if (res.success) setDocuments((res.documents || []) as DocumentRow[]);
      setLoading(false);
    });
  }, []);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.claim.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatus === "ALL" || doc.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const handleDownload = async (doc: DocumentRow) => {
    if (!doc.storage_path) return;
    const res = await getDocumentDownloadUrl(doc.storage_path);
    if (res.success && res.signedUrl) {
      const a = document.createElement("a");
      a.href = res.signedUrl;
      a.download = doc.name;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert(res.error || "Failed to generate download link.");
    }
  };

  const handleView = (doc: DocumentRow) => {
    setPreviewDoc({
      id: doc.id,
      file_name: doc.name,
      document_type: doc.type,
      storage_path: doc.storage_path,
      file_size: doc.file_size,
      mime_type: doc.mime_type,
      verification_status: doc.status,
    });
    setViewerOpen(true);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <DashboardHeader
        title="My Documents"
        description="All uploaded supporting documents across your research claims"
      />

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by file name, document type, or claim number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
          {["ALL", "PENDING", "VERIFIED", "REJECTED"].map((st) => (
            <Button
              key={st}
              variant={selectedStatus === st ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus(st)}
              className={`text-xs h-9 ${
                selectedStatus === st
                  ? "bg-[#b91c1c] text-white hover:bg-[#991b1b]"
                  : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              {st === "ALL" ? "All Documents" : st}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">
          Fetching uploaded documents...
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-30 text-slate-500" />
          <p className="text-lg font-bold text-foreground mb-1">
            No Documents Found
          </p>
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? "No documents match your search criteria."
              : "Uploaded claim documents will appear here once attached to a claim."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredDocuments.map((doc) => {
            const status = DOC_STATUS[doc.status] || DOC_STATUS.PENDING;
            return (
              <Card
                key={doc.id}
                className="glass-card border-slate-200/80 dark:border-slate-800 hover:border-primary/40 transition-all shadow-sm"
              >
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">
                        {doc.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {doc.type}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-600 dark:text-slate-400">
                          {doc.claim}
                        </span>
                        <span>•</span>
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>{doc.uploadedAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase font-bold py-0.5 ${status.className}`}
                    >
                      {status.label}
                    </Badge>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(doc)}
                      className="h-8 px-2.5 text-xs font-semibold border-slate-200 dark:border-slate-700 hover:bg-primary/5 hover:text-primary flex items-center gap-1"
                      title="Preview Document"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      className="h-8 px-2.5 text-xs font-semibold border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                      title="Download Document"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <DocumentViewerModal
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        document={previewDoc}
      />
    </div>
  );
}
