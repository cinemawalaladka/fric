import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t border-border/40 bg-background/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="text-lg font-bold gradient-text">FRIC Portal</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Faculty Research Incentive Claim Portal — A centralized platform for
              digitizing and managing research incentive claims at PPSU.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/policy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Policy
                </Link>
              </li>
              <li>
                <Link href="/guidelines" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Guidelines
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Faculty Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Contact</h3>
            <ul className="space-y-2.5">
              <li className="text-sm text-muted-foreground">
                PPSU Research Cell
              </li>
              <li className="text-sm text-muted-foreground">
                research@ppsu.ac.in
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} PPSU Research Incentive Management Portal. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with ❤️ for PPSU Faculty
          </p>
        </div>
      </div>
    </footer>
  );
}
