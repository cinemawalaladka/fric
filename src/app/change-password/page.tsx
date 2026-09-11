"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { completeFirstTimePasswordChange } from "@/app/actions/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Lock,
  ArrowRight,
  Loader2,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [loadingUser, setLoadingUser] = useState<boolean>(true);

  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) {
        router.replace("/login");
        return;
      }
      setUserEmail(user.email || "");
      setUserName(user.user_metadata?.name || user.email?.split("@")[0] || "Faculty Member");
      setLoadingUser(false);
    });
  }, [router]);

  // Real-time password requirement evaluations
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isFormValid =
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecial &&
    passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      const res = await completeFirstTimePasswordChange(newPassword);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = res.redirectTo || "/faculty/dashboard";
        }, 1500);
      } else {
        setError(res.error || "Failed to update password. Please try again.");
        setSubmitting(false);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
      setSubmitting(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="h-8 w-8 animate-spin text-red-500 mb-3" />
        <p className="text-xs text-slate-400 font-medium">Verifying security session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Portal Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold tracking-wide uppercase mb-1">
            <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
            PPSU FRIC Security Requirement
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Create Your Password
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Welcome, <strong className="text-slate-200">{userName}</strong>. As this is your first institutional login, you must set a permanent password.
          </p>
        </div>

        {/* Card Form */}
        <Card className="border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl text-slate-100 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-600" />

          <CardHeader className="pb-4 pt-5 px-6 border-b border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <UserCheck className="h-4 w-4 text-emerald-400" />
                <span className="font-mono text-[11px] text-slate-300 truncate max-w-[200px]">
                  {userEmail}
                </span>
              </div>
              <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-[10px] font-bold">
                Action Mandatory
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2 animate-shake">
                <XCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <div className="leading-snug">{error}</div>
              </div>
            )}

            {success ? (
              <div className="py-8 text-center space-y-3">
                <div className="h-14 w-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-white">Password Updated Successfully!</h3>
                <p className="text-xs text-slate-400">
                  Redirecting to your research dashboard...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300 font-semibold flex items-center justify-between">
                    <span>New Permanent Password</span>
                    <span className="text-[10px] text-slate-500 font-normal">Min. 8 characters</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new strong password"
                      className="bg-slate-950/70 border-slate-700 text-white placeholder:text-slate-600 pr-10 text-xs h-10 rounded-lg focus-visible:ring-red-500"
                      disabled={submitting}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300 font-semibold">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="bg-slate-950/70 border-slate-700 text-white placeholder:text-slate-600 pr-10 text-xs h-10 rounded-lg focus-visible:ring-red-500"
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Criteria Requirements Checklist */}
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Security Requirements
                  </span>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                    <div
                      className={`flex items-center gap-1.5 ${
                        hasMinLength ? "text-emerald-400 font-medium" : "text-slate-500"
                      }`}
                    >
                      {hasMinLength ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-slate-600 ml-1" />}
                      8+ characters
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        hasUppercase ? "text-emerald-400 font-medium" : "text-slate-500"
                      }`}
                    >
                      {hasUppercase ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-slate-600 ml-1" />}
                      1 uppercase (A-Z)
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        hasLowercase ? "text-emerald-400 font-medium" : "text-slate-500"
                      }`}
                    >
                      {hasLowercase ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-slate-600 ml-1" />}
                      1 lowercase (a-z)
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        hasNumber ? "text-emerald-400 font-medium" : "text-slate-500"
                      }`}
                    >
                      {hasNumber ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-slate-600 ml-1" />}
                      1 number (0-9)
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        hasSpecial ? "text-emerald-400 font-medium" : "text-slate-500"
                      }`}
                    >
                      {hasSpecial ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-slate-600 ml-1" />}
                      1 special symbol
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        passwordsMatch ? "text-emerald-400 font-medium" : "text-slate-500"
                      }`}
                    >
                      {passwordsMatch ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-slate-600 ml-1" />}
                      Passwords match
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <Button
                  type="submit"
                  disabled={!isFormValid || submitting}
                  className="w-full bg-[#b91c1c] hover:bg-[#991b1b] text-white font-bold text-xs h-10 rounded-lg gap-2 shadow-lg shadow-red-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving New Password...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Activate Account & Proceed
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Institutional Footer */}
        <p className="text-[11px] text-center text-slate-500">
          P. P. Savani University — Faculty Research & Incentive Cell (FRIC)
        </p>
      </div>
    </div>
  );
}
