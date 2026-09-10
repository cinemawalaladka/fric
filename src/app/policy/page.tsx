import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Shield,
  Calculator,
} from "lucide-react";

export default function PolicyPage() {
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
              Research Incentive <span className="gradient-text">Policy</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              PPSU Research Incentive Policy for Faculty Research Outputs
            </p>
          </div>

          <div className="space-y-6">
            <Card className="glass-card border-border/40">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-400/10 border border-blue-400/20">
                    <FileText className="h-5 w-5 text-blue-400" />
                  </div>
                  <h2 className="text-lg font-semibold">Eligible Research Outputs</h2>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />Journal Publications in Scopus / Web of Science / UGC CARE indexed journals</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />Authored / Edited Books and Book Chapters with reputed publishers</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />Patents — Filed, Published, or Granted</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />Citation achievements — h-index, i10-index milestones</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />Funded Research Projects from recognized funding agencies</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="glass-card border-border/40">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-400/10 border border-violet-400/20">
                    <Calculator className="h-5 w-5 text-violet-400" />
                  </div>
                  <h2 className="text-lg font-semibold">Incentive Categories</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/30 text-left">
                        <th className="pb-2 text-muted-foreground font-medium">Category</th>
                        <th className="pb-2 text-muted-foreground font-medium">Criteria</th>
                        <th className="pb-2 text-muted-foreground font-medium text-right">Amount Range</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b border-border/20"><td className="py-2.5">Scopus Q1 Journal</td><td>Impact Factor &gt; 3.0</td><td className="text-right text-emerald-400">₹25,000 - ₹50,000</td></tr>
                      <tr className="border-b border-border/20"><td className="py-2.5">Scopus Q2 Journal</td><td>Impact Factor 1.5 - 3.0</td><td className="text-right text-emerald-400">₹15,000 - ₹25,000</td></tr>
                      <tr className="border-b border-border/20"><td className="py-2.5">UGC CARE Journal</td><td>Listed in UGC CARE List</td><td className="text-right text-emerald-400">₹5,000 - ₹10,000</td></tr>
                      <tr className="border-b border-border/20"><td className="py-2.5">Granted Patent</td><td>Patent granted by any recognized office</td><td className="text-right text-emerald-400">₹50,000 - ₹1,00,000</td></tr>
                      <tr className="border-b border-border/20"><td className="py-2.5">Published Patent</td><td>Patent published</td><td className="text-right text-emerald-400">₹15,000 - ₹25,000</td></tr>
                      <tr><td className="py-2.5">Funded Project</td><td>Major project from DST/SERB/UGC etc.</td><td className="text-right text-emerald-400">₹20,000 - ₹50,000</td></tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-3 italic">
                  * Exact amounts are subject to active policy rules and verification.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-border/40">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10 border border-amber-400/20">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                  </div>
                  <h2 className="text-lg font-semibold">Important Notes</h2>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Claims must be submitted within the active academic year.</li>
                  <li>• All supporting documents must be original and verifiable.</li>
                  <li>• Duplicate claims for the same output will be rejected.</li>
                  <li>• Final incentive amounts are subject to verification and institutional approval.</li>
                  <li>• Policy values may be updated at the discretion of the administration.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
