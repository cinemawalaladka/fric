"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Building2, Mail, BadgeCheck, GraduationCap, Info } from "lucide-react";
import type { FacultyProfile } from "@/hooks/use-claim-form";

interface Props {
  faculty: FacultyProfile | null;
  departmentName: string;
  loading: boolean;
}

export function StepFacultyInfo({ faculty, departmentName, loading }: Props) {
  if (loading) {
    return (
      <div className="animate-slide-up space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
        <Card className="glass-card border-border/40">
          <CardContent className="pt-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!faculty) {
    return (
      <div className="animate-slide-up">
        <Card className="glass-card border-destructive/40">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive text-sm">
              Faculty profile not found. Please contact the administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const infoRows = [
    { icon: User, label: "Full Name", value: faculty.name },
    { icon: BadgeCheck, label: "Employee ID", value: faculty.employee_id },
    { icon: Building2, label: "School / Department", value: departmentName },
    { icon: GraduationCap, label: "Designation", value: faculty.designation },
    { icon: Mail, label: "Email", value: faculty.email },
  ];

  return (
    <div className="animate-slide-up">
      <h2 className="text-xl font-semibold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
        Faculty Information
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Your profile information, auto-populated from the system.
      </p>

      <Card className="glass-card border-border/40 mb-4">
        <CardContent className="pt-6 space-y-0 divide-y divide-border/20">
          {infoRows.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/15 shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                    {row.label}
                  </p>
                  <p className="text-sm font-medium truncate">{row.value || "—"}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="glass-card border-border/40">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/15 shrink-0">
              <Badge className="bg-amber-400/10 text-amber-400 border-amber-400/20 text-[10px] px-1.5">
                {faculty.status || "ACTIVE"}
              </Badge>
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Status</p>
              <p className="text-sm font-medium">{faculty.status || "Active"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/15 text-xs text-blue-400 flex items-start gap-2">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          To update your profile information, please contact the university administrator.
        </span>
      </div>
    </div>
  );
}
