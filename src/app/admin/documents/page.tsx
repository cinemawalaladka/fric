"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  FolderOpen,
  Plus,
  FileText,
  FileCheck,
  HardDrive,
  Trash2,
  Edit2,
  AlertTriangle,
  Loader2,
  Download,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getAdminDocumentTypes,
  createDocumentType,
  updateDocumentType,
  deleteDocumentType,
  getAdminDocumentsOverview,
} from "@/app/actions/admin";
import { format } from "date-fns";

interface DocumentType {
  id: string;
  name: string;
  code: string;
  description: string | null;
  allowed_mime_types: string[];
  max_file_size_bytes: number;
  is_required: boolean;
  created_at: string;
}

interface RecentDocument {
  id: string;
  file_name: string;
  file_size_bytes: number;
  file_path: string;
  mime_type: string;
  created_at: string;
  claim: any;
}

export default function AdminDocumentsPage() {
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([]);
  const [totalDocsCount, setTotalDocsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingType, setEditingType] = useState<DocumentType | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formExtensions, setFormExtensions] = useState("application/pdf, image/png, image/jpeg");
  const [formMaxSizeMb, setFormMaxSizeMb] = useState(10);
  const [formIsRequired, setFormIsRequired] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [typesRes, overviewRes] = await Promise.all([
        getAdminDocumentTypes(),
        getAdminDocumentsOverview(),
      ]);

      if (typesRes.success && typesRes.documentTypes) {
        setDocTypes(typesRes.documentTypes as DocumentType[]);
      } else {
        setError(typesRes.error || "Failed to load document types.");
      }

      if (overviewRes.success) {
        setRecentDocs((overviewRes.recentDocuments || []) as RecentDocument[]);
        setTotalDocsCount(overviewRes.totalDocuments || 0);
      }
    } catch {
      setError("An unexpected error occurred while loading document management.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCode) return;

    setSubmitting(true);
    try {
      const res = await createDocumentType({
        name: formName,
        code: formCode,
        description: formDesc,
        allowed_extensions: formExtensions,
        max_size_mb: formMaxSizeMb,
        is_required: formIsRequired,
      });

      if (res.success) {
        setIsAddOpen(false);
        setFormName("");
        setFormCode("");
        setFormDesc("");
        await fetchData();
      } else {
        alert(res.error || "Failed to create document type.");
      }
    } catch {
      alert("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType) return;

    setSubmitting(true);
    try {
      const res = await updateDocumentType(editingType.id, {
        name: formName,
        description: formDesc,
        is_required: formIsRequired,
        max_size_mb: formMaxSizeMb,
      });

      if (res.success) {
        setIsEditOpen(false);
        setEditingType(null);
        await fetchData();
      } else {
        alert(res.error || "Failed to update document type.");
      }
    } catch {
      alert("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove the document type "${name}"? Existing files will remain in cloud storage.`)) {
      return;
    }

    try {
      const res = await deleteDocumentType(id);
      if (res.success) {
        await fetchData();
      } else {
        alert(res.error || "Failed to delete document type.");
      }
    } catch {
      alert("An error occurred during deletion.");
    }
  };

  const openEditModal = (dt: DocumentType) => {
    setEditingType(dt);
    setFormName(dt.name);
    setFormDesc(dt.description || "");
    setFormIsRequired(dt.is_required);
    setFormMaxSizeMb(Math.round(dt.max_file_size_bytes / (1024 * 1024)) || 10);
    setIsEditOpen(true);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Document Requirements & Storage Vault
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure mandatory and optional supporting documents required for research incentive claims
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setFormName("");
            setFormCode("");
            setFormDesc("");
            setFormIsRequired(false);
            setFormMaxSizeMb(10);
            setIsAddOpen(true);
          }}
          className="gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-none shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Document Type
        </Button>
      </div>

      {/* Storage KPI Overview Strip (Sharp Table Bar) */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          <div className="p-4 sm:p-5 flex flex-col justify-center hover:bg-slate-50/60 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Configured Types</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight mt-1">
              {docTypes.length}
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5">Active document specifications</span>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-center hover:bg-slate-50/60 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Documents Uploaded</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight mt-1">
              {totalDocsCount}
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5">Across all faculty claims</span>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-center hover:bg-slate-50/60 transition-colors">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Encrypted Cloud Storage</span>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Supabase S3
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5">Automated AES-256 vault</span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="border border-red-200 bg-red-50 p-4 flex items-center justify-between text-xs text-red-700 font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="h-7 text-xs border-red-300 text-red-800 rounded-none">
            Retry
          </Button>
        </div>
      )}

      {/* Document Types Table */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Configured Document Requirements
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Documents that faculty must attach during submission across claim categories
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-500">
            {docTypes.length} Types
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-slate-600 mb-2" />
            <p className="text-xs font-medium">Loading document specifications...</p>
          </div>
        ) : docTypes.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="text-xs font-medium">No document types configured yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Code Identifier</th>
                  <th className="py-3 px-4">Requirement</th>
                  <th className="py-3 px-4">Max Size Limit</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {docTypes.map((dt) => {
                  const sizeMb = dt.max_file_size_bytes
                    ? Math.round(dt.max_file_size_bytes / (1024 * 1024))
                    : 10;
                  return (
                    <tr key={dt.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{dt.name}</span>
                          <span className="text-[11px] text-slate-500">{dt.description || "No specific description"}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold whitespace-nowrap">
                        <span className="bg-slate-100 px-2 py-0.5 border border-slate-200 text-[11px] text-slate-700">
                          {dt.code}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {dt.is_required ? (
                          <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                            Mandatory
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                            Optional
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {sizeMb || 10} MB (PDF/JPG/PNG)
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(dt)}
                          className="h-7 px-2 text-xs border-slate-200 text-slate-700 hover:bg-slate-100 rounded-none"
                          title="Edit Document Requirement"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(dt.id, dt.name)}
                          className="h-7 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50 rounded-none"
                          title="Delete Document Requirement"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Uploaded Files Repository */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Recent Cloud Attachments
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Latest files uploaded by faculty during claim submissions</p>
        </div>
        <div>
          {recentDocs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No recent files found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">File Name</th>
                    <th className="py-3 px-4">Associated Claim</th>
                    <th className="py-3 px-4">Claimant</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Uploaded Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentDocs.map((doc) => {
                    const claimObj = Array.isArray(doc.claim) ? doc.claim[0] : doc.claim;
                    const facObj = Array.isArray(claimObj?.faculty) ? claimObj.faculty[0] : claimObj?.faculty;
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                          <span className="truncate max-w-[200px]" title={doc.file_name}>
                            {doc.file_name}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {claimObj?.claim_number || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {facObj?.name || "Faculty Member"}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {(doc.file_size_bytes / (1024 * 1024)).toFixed(2)} MB
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {format(new Date(doc.created_at), "dd MMM yyyy, HH:mm")}
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

      {/* Add Document Type Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Document Requirement</DialogTitle>
            <DialogDescription>Define a new supporting document type for claims.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Document Title *</Label>
              <Input
                placeholder="e.g. Scopus / WoS Indexing Proof"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Code Identifier *</Label>
              <Input
                placeholder="e.g. SCOPUS_PROOF"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Input
                placeholder="Brief instruction for faculty upload..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Max File Size (MB)</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={formMaxSizeMb}
                  onChange={(e) => setFormMaxSizeMb(Number(e.target.value))}
                />
              </div>

              <div className="flex flex-col justify-end space-y-2 pb-1">
                <Label className="text-xs">Mandatory Upload</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formIsRequired}
                    onCheckedChange={setFormIsRequired}
                  />
                  <span className="text-xs text-muted-foreground">
                    {formIsRequired ? "Required" : "Optional"}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-primary text-primary-foreground">
                {submitting ? "Saving..." : "Create Requirement"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Document Type Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Document Requirement</DialogTitle>
            <DialogDescription>Modify settings for {editingType?.name}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Document Title *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Input
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Max File Size (MB)</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={formMaxSizeMb}
                  onChange={(e) => setFormMaxSizeMb(Number(e.target.value))}
                />
              </div>

              <div className="flex flex-col justify-end space-y-2 pb-1">
                <Label className="text-xs">Mandatory Upload</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formIsRequired}
                    onCheckedChange={setFormIsRequired}
                  />
                  <span className="text-xs text-muted-foreground">
                    {formIsRequired ? "Required" : "Optional"}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-primary text-primary-foreground">
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
