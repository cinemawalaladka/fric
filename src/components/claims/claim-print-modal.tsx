"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClaimPrintDocument } from "@/components/claims/claim-print-document";
import { Printer, X, HelpCircle } from "lucide-react";

interface ClaimPrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  claim: any;
}

export function ClaimPrintModal({ open, onOpenChange, claim }: ClaimPrintModalProps) {
  const [printing, setPrinting] = useState(false);

  if (!claim) return null;

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 150);
  };

  const isApproved = claim.status === "APPROVED" || claim.status === "VERIFIED" || claim.current_stage === "APPROVED";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[96vw] lg:max-w-5xl xl:max-w-6xl max-h-[95vh] h-[95vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-950/95 backdrop-blur-md border border-slate-700 shadow-2xl rounded-2xl">
        {/* Top Control Bar (Hidden in Print) */}
        <div className="no-print bg-slate-950 text-white px-5 py-3.5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-sm font-bold text-white tracking-tight">
                  Official Research Incentive Sanction Order
                </DialogTitle>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                  {claim.claim_number}
                </span>
              </div>
              <DialogDescription className="text-xs text-slate-400 mt-0.5">
                Print preview & official PDF export with university branding and audit log.
              </DialogDescription>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <Button
              onClick={handlePrint}
              disabled={printing}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-md shadow-emerald-900/30 px-4"
            >
              <Printer className="h-4 w-4" />
              {printing ? "Preparing PDF..." : "Print / Save as PDF"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs"
            >
              <X className="h-4 w-4 mr-1" />
              Close
            </Button>
          </div>
        </div>

        {/* Tip Banner (Hidden in Print) */}
        <div className="no-print bg-emerald-950/40 border-b border-emerald-900/30 px-5 py-2 flex items-center justify-between text-[11px] text-emerald-300 shrink-0">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>
              <strong>Tip:</strong> In the browser print dialog, choose Destination: <strong>&quot;Save as PDF&quot;</strong> and enable <strong>&quot;Background graphics&quot;</strong> for high-definition color badges.
            </span>
          </div>
          <span className="font-mono text-[10px] text-emerald-400/80 uppercase tracking-wider font-semibold">
            {isApproved ? "Sanctioned Order" : "Claim Summary"}
          </span>
        </div>

        {/* Scrollable Printable Paper Preview Area */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-6 md:p-8 bg-slate-900/80 flex justify-center items-start">
          <div className="w-full max-w-[880px] shadow-2xl transition-all my-auto sm:my-0">
            <ClaimPrintDocument claim={claim} />
          </div>
        </div>

        {/* Bottom Footer (Hidden in Print) */}
        <div className="no-print bg-slate-950 px-5 py-2.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="font-mono text-[11px] text-slate-400 truncate pr-2">
            Faculty: <strong className="text-slate-200">{claim.faculty?.name}</strong> • Dept: {claim.faculty?.department?.name || "N/A"}
          </span>
          <Button
            onClick={handlePrint}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs gap-1.5 h-8 px-3 shrink-0"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / Save as PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
