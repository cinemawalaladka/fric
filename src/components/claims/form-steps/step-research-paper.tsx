"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ABDC_CATEGORIES, QUARTILE_OPTIONS } from "@/lib/constants";

const INDEXING_DB_OPTIONS = ["Scopus", "Web of Science", "SCI", "PubMed", "IEEE Xplore", "DOAJ", "UGC CARE", "Google Scholar", "Other"];

interface Props {
  details: Record<string, any>;
  onUpdate: (key: string, value: any) => void;
}

export function StepResearchPaper({ details, onUpdate }: Props) {
  const indexedIn: string[] = Array.isArray(details.indexedIn) ? details.indexedIn : [];

  const toggleIndexedIn = (db: string) => {
    const next = indexedIn.includes(db)
      ? indexedIn.filter((v: string) => v !== db)
      : [...indexedIn, db];
    onUpdate("indexedIn", next);
  };

  return (
    <div className="animate-slide-up">
      <h2 className="text-xl font-semibold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
        Publication Details
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Provide details about your research paper / review paper.
      </p>

      {/* Section A: Publication Information */}
      <Card className="glass-card border-border/40 mb-5">
        <CardContent className="pt-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-widest text-primary uppercase">Section A</span>
            <span className="text-xs text-muted-foreground">— Publication Information</span>
          </div>

          <div className="space-y-2">
            <Label>Title of Paper *</Label>
            <Input
              placeholder="Enter the title of your publication"
              value={details.title || ""}
              onChange={(e) => onUpdate("title", e.target.value)}
              className="bg-input/50 border-border/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Journal Name *</Label>
              <Input
                placeholder="e.g., IEEE Access"
                value={details.journalName || ""}
                onChange={(e) => onUpdate("journalName", e.target.value)}
                className="bg-input/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label>ISSN</Label>
              <Input
                placeholder="e.g., 2169-3536"
                value={details.issn || ""}
                onChange={(e) => onUpdate("issn", e.target.value)}
                className="bg-input/50 border-border/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>DOI</Label>
              <Input
                placeholder="e.g., 10.1109/ACCESS.2026.1234567"
                value={details.doi || ""}
                onChange={(e) => onUpdate("doi", e.target.value)}
                className="bg-input/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Publication Date</Label>
              <Input
                type="date"
                value={details.publicationDate || ""}
                onChange={(e) => onUpdate("publicationDate", e.target.value)}
                className="bg-input/50 border-border/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Volume</Label>
              <Input
                placeholder="e.g., 12"
                value={details.volume || ""}
                onChange={(e) => onUpdate("volume", e.target.value)}
                className="bg-input/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Issue</Label>
              <Input
                placeholder="e.g., 3"
                value={details.issue || ""}
                onChange={(e) => onUpdate("issue", e.target.value)}
                className="bg-input/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Page / Article Number</Label>
              <Input
                placeholder="e.g., 12345–12360"
                value={details.pageNumber || ""}
                onChange={(e) => onUpdate("pageNumber", e.target.value)}
                className="bg-input/50 border-border/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Publisher Name</Label>
              <Input
                placeholder="e.g., IEEE, Elsevier, Springer"
                value={details.publisherName || ""}
                onChange={(e) => onUpdate("publisherName", e.target.value)}
                className="bg-input/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Paper Type *</Label>
              <Select value={details.paperType || ""} onValueChange={(v) => onUpdate("paperType", v)}>
                <SelectTrigger className="bg-input/50 border-border/50">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Research">Research Paper</SelectItem>
                  <SelectItem value="Review">Review Paper</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section B: Journal Indexing / Classification */}
      <Card className="glass-card border-border/40">
        <CardContent className="pt-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-widest text-primary uppercase">Section B</span>
            <span className="text-xs text-muted-foreground">— Journal Indexing & Classification</span>
          </div>

          {/* Indexed In (multi-select checkboxes) */}
          <div className="space-y-2">
            <Label>Indexed In</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {INDEXING_DB_OPTIONS.map((db) => (
                <div key={db} className="flex items-center gap-2">
                  <Checkbox
                    id={`idx-${db}`}
                    checked={indexedIn.includes(db)}
                    onCheckedChange={() => toggleIndexedIn(db)}
                  />
                  <Label htmlFor={`idx-${db}`} className="text-xs cursor-pointer font-normal">
                    {db}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator className="opacity-20" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SCI Listed? *</Label>
              <Select value={details.sciListed || ""} onValueChange={(v) => onUpdate("sciListed", v)}>
                <SelectTrigger className="bg-input/50 border-border/50">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quartile</Label>
              <Select value={details.quartile || ""} onValueChange={(v) => onUpdate("quartile", v)}>
                <SelectTrigger className="bg-input/50 border-border/50">
                  <SelectValue placeholder="Select quartile" />
                </SelectTrigger>
                <SelectContent>
                  {QUARTILE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                  <SelectItem value="NA">N/A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Acceptance Rate (%)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="e.g., 12.5"
                value={details.acceptanceRate || ""}
                onChange={(e) => onUpdate("acceptanceRate", e.target.value)}
                className="bg-input/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Thomson Reuters Impact Factor</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g., 3.45"
                value={details.impactFactor || ""}
                onChange={(e) => onUpdate("impactFactor", e.target.value)}
                className="bg-input/50 border-border/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>SCI Score</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g., 2.5"
                value={details.sciScore || ""}
                onChange={(e) => onUpdate("sciScore", e.target.value)}
                className="bg-input/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label>NAAS Score</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g., 7.2"
                value={details.naasScore || ""}
                onChange={(e) => onUpdate("naasScore", e.target.value)}
                className="bg-input/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label>ABDC Classification</Label>
              <Select value={details.abdcCategory || ""} onValueChange={(v) => onUpdate("abdcCategory", v)}>
                <SelectTrigger className="bg-input/50 border-border/50">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {ABDC_CATEGORIES.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                  <SelectItem value="NA">N/A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Other Rating / Remarks</Label>
            <Input
              placeholder="Any other relevant classification or rating"
              value={details.otherRating || ""}
              onChange={(e) => onUpdate("otherRating", e.target.value)}
              className="bg-input/50 border-border/50"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
