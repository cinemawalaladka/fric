"use client";

import "./login.css";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Eye,
  EyeOff,
  Loader2,
  ShieldAlert,
  Mail,
  Lock,
  ArrowRight,
} from "lucide-react";

const PPSU_SLIDES = [
  "/ppsuimage/ppsuimg 1.jpg",
  "/ppsuimage/ppsuimg 2.jpg",
  "/ppsuimage/ppsuimg 3.jpg",
  "/ppsuimage/ppsuimg 4.jpg",
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Automatic preloading and slide rotation
  useEffect(() => {
    PPSU_SLIDES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % PPSU_SLIDES.length);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    try {
      // 1. Super Admin authentication
      if (cleanEmail.toLowerCase() === "admin@ppsu.in") {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          window.location.href = "/admin/dashboard";
          return;
        } else {
          setError(data.error || "Invalid administrator credentials.");
          setLoading(false);
          return;
        }
      }

      // 2. Clear any stale admin session cookies for regular/verifier accounts
      await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});

      // 3. Standard Supabase Authentication
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (authError) {
        setError(authError.message || "Invalid email or password.");
        setLoading(false);
        return;
      }

      const user = authData?.user;
      if (!user) {
        setError("Authentication failed. User session not found.");
        setLoading(false);
        return;
      }

      // 4. Fetch User Roles for Routing
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("roles(name)")
        .eq("user_id", user.id)
        .eq("status", "ACTIVE");

      const roles = (userRoles || [])
        .map((ur: Record<string, unknown>) => {
          const role = ur.roles as { name: string } | null;
          return role?.name;
        })
        .filter((name): name is string => Boolean(name));

      if (roles.includes("SUPER_ADMIN")) {
        window.location.href = "/admin/dashboard";
      } else if (
        roles.some((role) =>
          ["HOD", "RESEARCH_COMMITTEE_MEMBER", "GOVERNOR", "PROVOST", "RESEARCH_VERIFIER"].includes(role)
        )
      ) {
        window.location.href = "/verifier/dashboard";
      } else {
        window.location.href = "/faculty/dashboard";
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected authentication error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* ═══════════ LEFT PANEL — Cinematic PPSU Image Slideshow ═══════════ */}
      <div className="login-left">
        {/* Fullscreen Slideshow Images */}
        <div className="login-left__slideshow" aria-hidden="true">
          {PPSU_SLIDES.map((src, idx) => (
            <img
              key={src}
              src={src}
              alt=""
              className={`login-left__slide ${idx === currentSlide ? "login-left__slide--active" : ""}`}
            />
          ))}
          {/* Subtle dark gradient overlay for text readability */}
          <div className="login-left__overlay" />
        </div>

        {/* Bottom-left text */}
        <div className="login-left__footer">
          <span className="login-left__subtitle">A secure platform for</span>
          <h2 className="login-left__heading">
            Manage your research<br />
            incentives with clarity<br />
            and ease.
          </h2>
        </div>
      </div>

      {/* ═══════════ RIGHT PANEL — Liquid Style Authentication Card ═══════════ */}
      <div className="login-right">
        {/* Liquid Background Animated Glowing Orbs */}
        <div className="login-liquid-bg" aria-hidden="true">
          <div className="liquid-orb liquid-orb--1" />
          <div className="liquid-orb liquid-orb--2" />
          <div className="liquid-orb liquid-orb--3" />
        </div>

        {/* Content Wrapper (Centered Vertically and Horizontally) */}
        <div className="login-right__wrapper">

          {/* Large Transparent PPSU Logo Outside Card */}
          <div className="login-logo-outside">
            <img
              src="/ppsuimage/ppsulogo.png"
              alt="P P Savani University"
              className="login-logo-outside__img"
            />
          </div>

          {/* Liquid Glass Card */}
          <div className="login-card">

            {/* Card Header Title & Description */}
            <div className="login-card__header">
              <h1 className="login-card__title">Portal Sign In</h1>
              <p className="login-card__subtitle">
                Enter your institutional email and password to access your portal.
              </p>
            </div>

          {/* Error alert */}
          {error && (
            <div className="login-card__error">
              <ShieldAlert className="login-card__error-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="login-card__form">
            
            {/* Email Field */}
            <div className="login-field">
              <label htmlFor="login-email" className="login-field__label">
                Institutional Email Address <span className="login-field__asterisk">*</span>
              </label>
              <div className="login-field__input-wrap">
                <Mail className="login-field__icon" />
                <input
                  id="login-email"
                  type="email"
                  placeholder="user@ppsu.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-field__input"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="login-field">
              <div className="login-field__label-row">
                <label htmlFor="login-password" className="login-field__label">
                  Password <span className="login-field__asterisk">*</span>
                </label>
                <button
                  type="button"
                  className="login-field__forgot"
                  onClick={() => alert("Please contact the PPSU Research Cell Admin to reset your credentials.")}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="login-field__input-wrap">
                <Lock className="login-field__icon" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-field__input login-field__input--has-eye"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-field__eye"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Liquid Red Submit Button */}
            <button
              type="submit"
              className="login-btn-liquid"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="login-btn-liquid__spinner" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="login-btn-liquid__icon" />
                  <span>Login</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
  );
}


