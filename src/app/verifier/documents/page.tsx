"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Eye,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck,
  Building2,
  User,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getAllDocumentsForVerifier,
  getDocumentDownloadUrl,
  updateDocumentVerificationStatus,
} from "@/app/actions/documents";
import {
  DocumentViewerModal,
  type PreviewableDocument,
} from "@/components/claims/document-viewer-modal";

type VerifierDocRow = {
  id: string;
  claim_id: string;
  document_type: string;
  file_name: string;
  storage_path: string;
  file_size: number | null;
  mime_type: string | null;
  verification_status: "PENDING" | "VERIFIED" | "REJECTED";
  created_at: string;
  claim: {
    id?: string;
    claim_number: string;
    status: string;
    current_stage: string;
    claimed_amount: number;
    faculty: {
      name: string;
      email: string;
      employee_id: string;
      designation: string;
      department?: {
        name: string;
        code: string;
      } | {
        name: string;
        code: string;
      }[];
    } | {
      name: string;
      email: string;
      employee_id: string;
      designation: string;
      department?: {
        name: string;
        code: string;
      } | {
        name: string;
        code: string;
      }[];
    }[];
  } | {
    id?: string;
    claim_number: string;
    status: string;
    current_stage: string;
    claimed_amount: number;
    faculty: any;
  }[];
};

function formatDate(iso?: string | null) {
  if (!iso) return "N/A";
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(iso));
}

export default function VerifierDocumentsPage() {
  const [documents, setDocuments] = useState<VerifierDocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Document Viewer State
  const [previewDoc, setPreviewDoc] = useState<PreviewableDocument | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const fetchDocs = async () => {
    const res = await getAllDocumentsForVerifier();
    if (res.success && res.documents) {
      setDocuments(res.documents as unknown as VerifierDocRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleStatusUpdate = async (
    docId: string,
    newStatus: "PENDING" | "VERIFIED" | "REJECTED"
  ) => {
    setUpdatingId(docId);
    const res = await updateDocumentVerificationStatus(docId, newStatus);
    if (res.success) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, verification_status: newStatus } : d))
      );
    } else {
      alert(res.error || "Failed to update status.");
    }
    setUpdatingId(null);
  };

  const handleDownload = async (doc: VerifierDocRow) => {
    if (!doc.storage_path) return;
    const res = await getDocumentDownloadUrl(doc.storage_path);
    if (res.success && res.signedUrl) {
      const a = document.createElement("a");
      a.href = res.signedUrl;
      a.download = doc.file_name;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert(res.error || "Failed to generate download link.");
    }
  };

  const handleView = (doc: VerifierDocRow) => {
    setPreviewDoc({
      id: doc.id,
      file_name: doc.file_name,
      document_type: doc.document_type,
      storage_path: doc.storage_path,
      file_size: doc.file_size || undefined,
      mime_type: doc.mime_type || undefined,
      verification_status: doc.verification_status,
    });
    setViewerOpen(true);
  };

  // Helper for faculty details
  const getFaculty = (claim: any) => {
    const c = Array.isArray(claim) ? claim[0] : claim;
    if (!c?.faculty) return { name: "Unknown", department: "N/A", email: "" };
    const fac = Array.isArray(c.faculty) ? c.faculty[0] : c.faculty;
    const dept = Array.isArray(fac.department) ? fac.department[0] : fac.department;
    return {
      name: fac.name || "Unknown Faculty",
      department: dept?.name || "N/A",
      deptCode: dept?.code || "",
      email: fac.email || "",
      designation: fac.designation || "",
    };
  };

  const getClaimNumber = (claim: any) => {
    const c = Array.isArray(claim) ? claim[0] : claim;
    return c?.claim_number || "N/A";
  };

  const getClaimId = (claim: any, doc: any) => {
    const c = Array.isArray(claim) ? claim[0] : claim;
    return c?.id || doc.claim_id;
  };

  const filteredDocuments = documents.filter((doc) => {
    const fac = getFaculty(doc.claim);
    const claimNum = getClaimNumber(doc.claim);

    const matchesSearch =
      doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.document_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fac.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fac.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claimNum.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatus === "ALL" || doc.verification_status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = documents.filter((d) => d.verification_status === "PENDING").length;
  const verifiedCount = documents.filter((d) => d.verification_status === "VERIFIED").length;
  const rejectedCount = documents.filter((d) => d.verification_status === "REJECTED").length;

  return (
    <div className="animate-fade-in space-y-6">
      <DashboardHeader
        title="Documents Verification Review"
        description="Inspect and verify all supporting documents uploaded across faculty incentive claims"
      />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="glass-card border-slate-200/80 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Total Documents</p>
              <p className="text-2xl font-extrabold text-foreground mt-0.5">{documents.length}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <FileCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Pending Review</p>
              <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{pendingCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Verified Documents</p>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{verifiedCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-rose-500/20 bg-rose-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">Flagged / Rejected</p>
              <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">{rejectedCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by file name, document type, faculty, department, or claim number..."
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

      {/* Documents List */}
      {loading ? (
        <div className="text-center py-20 text-muted-foreground">
          Fetching documents for verification...
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-30 text-slate-500" />
          <p className="text-lg font-bold text-foreground mb-1">No Documents Found</p>
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? "No documents match your search criteria."
              : "No claim documents currently in the verification repository."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocuments.map((doc) => {
            const fac = getFaculty(doc.claim);
            const claimNum = getClaimNumber(doc.claim);
            const claimId = getClaimId(doc.claim, doc);
            const fileSizeMb = doc.file_size
              ? (doc.file_size / (1024 * 1024)).toFixed(2)
              : null;

            return (
              <Card
                key={doc.id}
                className="glass-card border-slate-200/80 dark:border-slate-800 hover:border-primary/40 transition-all shadow-sm"
              >
                <CardContent className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shrink-0 mt-0.5">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-foreground truncate">
                          {doc.file_name}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase font-bold py-0.5 ${
                            doc.verification_status === "VERIFIED"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                              : doc.verification_status === "REJECTED"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {doc.verification_status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {doc.document_type}
                        </span>
                        {fileSizeMb && <span>• {fileSizeMb} MB</span>}
                        <span>• Uploaded {formatDate(doc.created_at)}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {fac.name} ({fac.designation})
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {fac.department}
                        </span>
                        <span>•</span>
                        <Link
                          href={`/verifier/claims/${claimId}`}
                          className="inline-flex items-center gap-1 text-[#b91c1c] font-semibold hover:underline"
                        >
                          Claim: {claimNum}
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Verification Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-end lg:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(doc)}
                      className="h-8 px-3 text-xs font-semibold border-slate-200 dark:border-slate-700 hover:bg-primary/5 hover:text-primary flex items-center gap-1.5"
                      title="Inspect & Preview Document"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      className="h-8 px-2.5 text-xs font-semibold border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                      title="Download Document"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>

                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

                    {doc.verification_status !== "VERIFIED" && (
                      <Button
                        size="sm"
                        disabled={updatingId === doc.id}
                        onClick={() => handleStatusUpdate(doc.id, "VERIFIED")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 font-semibold"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Mark Verified
                      </Button>
                    )}

                    {doc.verification_status !== "REJECTED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updatingId === doc.id}
                        onClick={() => handleStatusUpdate(doc.id, "REJECTED")}
                        className="border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs h-8 px-3 font-semibold"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Reject
                      </Button>
                    )}
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
