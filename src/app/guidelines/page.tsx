import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { Card, CardContent } from "@/components/ui/card";
import {
  ClipboardList,
  Upload,
  Search,
  CheckCircle2,
  FileText,
  AlertCircle,
} from "lucide-react";

const STEPS = [
  { icon: ClipboardList, title: "1. Select Claim Type", desc: "Choose the category that matches your research output — Journal Publication, Book, Patent, Citation, or Research Project." },
  { icon: FileText, title: "2. Fill Research Details", desc: "Enter the specific details about your research work. Fields are dynamically generated based on the claim type selected." },
  { icon: Search, title: "3. Eligibility Check", desc: "The system automatically evaluates your eligibility based on configured policy rules and shows an estimated incentive amount." },
  { icon: Upload, title: "4. Upload Documents", desc: "Attach required supporting documents — published paper, indexing proof, patent certificate, sanction letter, etc." },
  { icon: CheckCircle2, title: "5. Review & Submit", desc: "Review all details and submit. You can also save as draft and complete later." },
  { icon: AlertCircle, title: "6. Verification", desc: "The Research Verifier reviews your claim, verifies documents, and either verifies or returns it for corrections." },
];

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1
              className="text-3xl sm:text-4xl font-bold mb-3"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Submission <span className="gradient-text">Guidelines</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Step-by-step guide for submitting research incentive claims
            </p>
          </div>

          <div className="space-y-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <Card key={i} className="glass-card border-border/40">
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold mb-1">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="glass-card border-border/40 mt-8">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-3">Document Requirements</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground mb-2">Journal Publication</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Published paper PDF</li>
                    <li>• Acceptance / publication letter</li>
                    <li>• Indexing proof (screenshot)</li>
                    <li>• DOI confirmation</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground mb-2">Patent</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Patent filing receipt</li>
                    <li>• Publication certificate</li>
                    <li>• Grant certificate (if granted)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground mb-2">Book / Chapter</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Book cover page / title page</li>
                    <li>• Publisher confirmation</li>
                    <li>• ISBN proof</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground mb-2">Research Project</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Sanction letter</li>
                    <li>• Fund utilization certificate</li>
                    <li>• Completion certificate</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
