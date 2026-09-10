"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Loader2, AlertTriangle } from "lucide-react";
import { createClaimType, getClaimTypes } from "@/app/actions/admin";

interface ClaimType {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export default function ClaimTypesPage() {
  const [types, setTypes] = useState<ClaimType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchClaimTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getClaimTypes();
      if (!res.success) {
        setError(res.error || "Failed to fetch claim types.");
      } else {
        setTypes((res.claimTypes || []) as ClaimType[]);
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaimTypes();
  }, []);

  const handleAddClaimType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;
    
    setSubmitting(true);
    try {
      const res = await createClaimType(name, code, desc);
      if (res.success) {
        setName("");
        setCode("");
        setDesc("");
        await fetchClaimTypes();
      } else {
        alert(res.error || "Failed to create claim type.");
      }
    } catch {
      alert("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Claim Types
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure research incentive categories, policy eligibility, and claim types
          </p>
        </div>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 p-4 flex items-center justify-between text-xs text-red-700 font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchClaimTypes} className="h-7 text-xs border-red-300 text-red-800 rounded-none">
            Retry
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Claim Types Table */}
        <div className="bg-white border border-slate-200 overflow-hidden shadow-xs lg:col-span-2">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Active Categories
            </h3>
            <span className="text-xs font-mono font-semibold text-slate-500">
              {loading ? "Loading..." : `${types.length} Categories`}
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-slate-600 mb-2" />
              <p className="text-xs font-medium">Fetching claim categories...</p>
            </div>
          ) : types.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-xs font-medium">No claim types defined.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Category Name</th>
                    <th className="py-3 px-4">Code Identifier</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {types.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {t.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 font-semibold whitespace-nowrap">
                        <span className="bg-slate-100 px-2 py-0.5 border border-slate-200 text-[11px]">
                          {t.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs leading-relaxed">
                        {t.description || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                            t.is_active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {t.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Claim Type Form */}
        <div className="bg-white border border-slate-200 overflow-hidden shadow-xs h-fit">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Add New Category
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Create a new research claim category</p>
          </div>
          <div className="p-6">
            <form onSubmit={handleAddClaimType} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Category Name</label>
                <Input
                  placeholder="e.g., Conference Paper"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-slate-50/50 border-slate-200 text-xs h-9 rounded-none"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Unique Code</label>
                <Input
                  placeholder="e.g., CONFERENCE_PAPER"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="bg-slate-50/50 border-slate-200 font-mono text-xs h-9 rounded-none uppercase"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Description</label>
                <Input
                  placeholder="Short description of the category..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="bg-slate-50/50 border-slate-200 text-xs h-9 rounded-none"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9 rounded-none shadow-xs"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Category
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
