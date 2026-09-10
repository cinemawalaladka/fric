"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/layout/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Loader2, AlertTriangle } from "lucide-react";
import { getIncentiveRules } from "@/app/actions/admin";

interface IncentiveRule {
  id: string;
  category: string;
  amount: string;
  status: string;
  active_from: string;
  claim_type: {
    name: string;
    code: string;
  } | null;
}

export default function IncentiveRulesPage() {
  const [rules, setRules] = useState<IncentiveRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getIncentiveRules();
      if (res.success && res.rules) {
        setRules(res.rules as unknown as IncentiveRule[]);
      } else {
        setError(res.error || "Failed to fetch incentive rules.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Incentive Rules
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage institutional calculation formulas, category payouts, and eligibility policy rules
          </p>
        </div>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 p-4 flex items-center justify-between text-xs text-red-700 font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRules} className="h-7 text-xs border-red-300 text-red-800 rounded-none">
            Retry
          </Button>
        </div>
      )}

      {/* Incentive Policy Grid Table */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Incentive Policy Grid
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Rules matching claim fields to target university incentive payouts</p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-500">
            {loading ? "Loading..." : `${rules.length} Rules Configured`}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-slate-600 mb-2" />
            <p className="text-xs font-medium">Fetching policy rules...</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="text-xs font-medium">No rules configured in policy.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Claim Type</th>
                  <th className="py-3 px-4">Incentive Category</th>
                  <th className="py-3 px-4 text-right">Incentive Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Active From</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900 block">{rule.claim_type?.name || "Unknown"}</span>
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{rule.claim_type?.code}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                      {rule.category}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                      ₹{Number(rule.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                          rule.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {rule.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-slate-500 font-mono whitespace-nowrap">
                      {rule.active_from}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
