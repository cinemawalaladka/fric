"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Info } from "lucide-react";

interface Props {
  details: Record<string, any>;
  onUpdate: (key: string, value: any) => void;
}

export function StepPatent({ details, onUpdate }: Props) {
  const patentType = details.patentType || "";

  return (
    <div className="animate-slide-up">
      <h2 className="text-xl font-semibold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
        Patent / IPR Details
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Provide details about your patent or intellectual property.
      </p>

      <Card className="glass-card border-border/40 mb-5">
        <CardContent className="pt-6 space-y-5">
          {/* Patent Type Selector */}
          <div className="space-y-2">
            <Label>Patent Type *</Label>
            <Select value={patentType} onValueChange={(v) => onUpdate("patentType", v)}>
              <SelectTrigger className="bg-input/50 border-border/50">
                <SelectValue placeholder="Select patent type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Design">Design Patent</SelectItem>
                <SelectItem value="Utility">Utility Patent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="opacity-20" />

          <div className="space-y-2">
            <Label>Patent Title *</Label>
            <Input
              placeholder="Enter the title of the patent"
              value={details.title || ""}
              onChange={(e) => onUpdate("title", e.target.value)}
              className="bg-input/50 border-border/50"
            />
          </div>

          {/* Design Patent Fields */}
          {patentType === "Design" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Patent Number</Label>
                  <Input
                    placeholder="e.g., IN202641012345"
                    value={details.patentNumber || ""}
                    onChange={(e) => onUpdate("patentNumber", e.target.value)}
                    className="bg-input/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Applicant Name</Label>
                  <Input
                    placeholder="Name of the applicant"
                    value={details.applicantName || ""}
                    onChange={(e) => onUpdate("applicantName", e.target.value)}
                    className="bg-input/50 border-border/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Issuing Authority</Label>
                  <Input
                    placeholder="e.g., Indian Patent Office"
                    value={details.issuingAuthority || ""}
                    onChange={(e) => onUpdate("issuingAuthority", e.target.value)}
                    className="bg-input/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Patent Status *</Label>
                  <Select value={details.patentStatus || ""} onValueChange={(v) => onUpdate("patentStatus", v)}>
                    <SelectTrigger className="bg-input/50 border-border/50">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Filed">Filed</SelectItem>
                      <SelectItem value="Published">Published</SelectItem>
                      <SelectItem value="Granted">Granted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Filing Date</Label>
                  <Input
                    type="date"
                    value={details.filingDate || ""}
                    onChange={(e) => onUpdate("filingDate", e.target.value)}
                    className="bg-input/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Grant Date</Label>
                  <Input
                    type="date"
                    value={details.grantDate || ""}
                    onChange={(e) => onUpdate("grantDate", e.target.value)}
                    className="bg-input/50 border-border/50"
                  />
                </div>
              </div>
            </>
          )}

          {/* Utility Patent Fields */}
          {patentType === "Utility" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Patent Grant Number</Label>
                  <Input
                    placeholder="e.g., IN202641012345"
                    value={details.patentNumber || ""}
                    onChange={(e) => onUpdate("patentNumber", e.target.value)}
                    className="bg-input/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Patent Status *</Label>
                  <Select value={details.patentStatus || ""} onValueChange={(v) => onUpdate("patentStatus", v)}>
                    <SelectTrigger className="bg-input/50 border-border/50">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Filed">Filed</SelectItem>
                      <SelectItem value="Published">Published</SelectItem>
                      <SelectItem value="Granted">Granted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Grant Date</Label>
                  <Input
                    type="date"
                    value={details.grantDate || ""}
                    onChange={(e) => onUpdate("grantDate", e.target.value)}
                    className="bg-input/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Government Authority</Label>
                  <Input
                    placeholder="e.g., Indian Patent Office"
                    value={details.issuingAuthority || ""}
                    onChange={(e) => onUpdate("issuingAuthority", e.target.value)}
                    className="bg-input/50 border-border/50"
                  />
                </div>
              </div>

              {details.patentStatus !== "Granted" && (
                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15 text-xs text-amber-400 flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    Utility patent incentive of ₹25,000 applies only to <strong>Granted</strong> patents.
                    If your patent has been granted, please update the status above.
                  </span>
                </div>
              )}
            </>
          )}

          {/* Inventors */}
          <div className="space-y-2">
            <Label>All Inventor Names</Label>
            <Textarea
              placeholder="List all inventors (comma-separated)"
              value={details.inventorNames || ""}
              onChange={(e) => onUpdate("inventorNames", e.target.value)}
              className="bg-input/50 border-border/50"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15 text-xs text-amber-400">
        💡 Design Patent: ₹5,000 &nbsp;|&nbsp; Utility Patent (Granted): ₹25,000
      </div>
    </div>
  );
}
