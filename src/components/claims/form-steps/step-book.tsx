"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  details: Record<string, any>;
  onUpdate: (key: string, value: any) => void;
}

export function StepBook({ details, onUpdate }: Props) {
  return (
    <div className="animate-slide-up">
      <h2 className="text-xl font-semibold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
        Book Details
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Provide details about your authored or edited book.
      </p>

      <Card className="glass-card border-border/40">
        <CardContent className="pt-6 space-y-5">
          <div className="space-y-2">
            <Label>Book Title *</Label>
            <Input
              placeholder="Enter the full title of the book"
              value={details.title || ""}
              onChange={(e) => onUpdate("title", e.target.value)}
              className="bg-input/50 border-border/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ISBN *</Label>
              <Input
                placeholder="e.g., 978-3-16-148410-0"
                value={details.isbn || ""}
                onChange={(e) => onUpdate("isbn", e.target.value)}
                className="bg-input/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Publisher Name *</Label>
              <Input
                placeholder="e.g., Springer, Wiley, PHI"
                value={details.publisher || ""}
                onChange={(e) => onUpdate("publisher", e.target.value)}
                className="bg-input/50 border-border/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Publisher Type *</Label>
              <Select value={details.publisherType || ""} onValueChange={(v) => onUpdate("publisherType", v)}>
                <SelectTrigger className="bg-input/50 border-border/50">
                  <SelectValue placeholder="Select publisher type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="International">International Publisher</SelectItem>
                  <SelectItem value="National">National Publisher</SelectItem>
                </SelectContent>
              </Select>
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

          <div className="space-y-2">
            <Label>Edition</Label>
            <Input
              placeholder="e.g., 1st Edition, 2nd Edition"
              value={details.edition || ""}
              onChange={(e) => onUpdate("edition", e.target.value)}
              className="bg-input/50 border-border/50"
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 p-3 rounded-lg bg-violet-500/5 border border-violet-500/15 text-xs text-violet-400">
        💡 International Publisher: ₹10,000 &nbsp;|&nbsp; National Publisher: ₹6,000 (subject to ISBN proof)
      </div>
    </div>
  );
}
