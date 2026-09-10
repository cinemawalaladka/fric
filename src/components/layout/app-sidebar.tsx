"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import type { SidebarNavItem } from "@/lib/constants";
import { getCurrentUserRoles } from "@/app/actions/dashboard";
import {
  GraduationCap,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";

const VERIFICATION_RORoles = ["HOD", "RESEARCH_COMMITTEE_MEMBER", "GOVERNOR", "PROVOST", "RESEARCH_VERIFIER"];

function hasAnyRole(userRoles: string[], targetRoles: string[]) {
  return userRoles.some((role) => targetRoles.includes(role));
}

interface AppSidebarProps {
  navItems: SidebarNavItem[];
  role: "Faculty" | "Research Verifier" | "Super Admin";
  userName?: string;
  userEmail?: string;
  accentColor?: string;
  onLogout: () => void;
}

function SidebarLink({
  item,
  isActive,
  collapsed,
}: {
  item: SidebarNavItem;
  isActive: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon as LucideIcon;

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 border border-transparent",
        isActive
          ? "sidebar-link-active"
          : "text-slate-600 hover:text-red-950 hover:bg-gradient-to-r hover:from-red-50/80 hover:via-rose-50/40 hover:to-transparent hover:border-red-100/80 hover:shadow-2xs hover:translate-x-0.5",
        collapsed && "justify-center px-2 py-2.5"
      )}
      title={collapsed ? item.title : undefined}
    >
      <div
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg transition-all shrink-0",
          isActive
            ? "bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white shadow-[0_2px_8px_rgba(220,38,38,0.32)]"
            : "bg-slate-100/80 text-slate-500 group-hover:bg-red-100/80 group-hover:text-red-600 group-hover:scale-105"
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>

      {!collapsed && (
        <>
          <span className={cn("truncate flex-1 font-medium", isActive && "font-bold text-red-950")}>
            {item.title}
          </span>
          {item.badge && item.badge > 0 && (
            <span className="ml-auto flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-600/15 text-red-700 text-[10px] font-bold px-1.5 shadow-2xs">
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

function SidebarContent({
  navItems,
  role,
  userName,
  userEmail,
  pathname,
  collapsed,
  onCollapse,
  onLogout,
}: AppSidebarProps & {
  pathname: string;
  collapsed: boolean;
  onCollapse?: () => void;
  onLogout: () => void;
}) {
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isAdminCookie, setIsAdminCookie] = useState(false);

  // Re-fetch roles from DB on every pathname change, window focus, and every 30s
  useEffect(() => {
    let cancelled = false;

    const fetchRoles = () => {
      getCurrentUserRoles().then((res) => {
        if (!cancelled && res.success && res.roles) {
          setUserRoles(res.roles);
          setIsAdminCookie(!!res.isAdminCookie);
        }
      });
    };

    fetchRoles();

    const handleFocus = () => fetchRoles();
    window.addEventListener("focus", handleFocus);

    const interval = setInterval(fetchRoles, 30000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [pathname]);

  const userInitial = userName ? userName.trim().charAt(0).toUpperCase() : "U";

  return (
    <div className="flex flex-col h-full max-h-screen min-h-0 overflow-hidden bg-gradient-to-b from-white/95 via-slate-50/70 to-white/95 backdrop-blur-xl select-none">
      {/* Header with High-Resolution PPSU Logo */}
      <div
        className={cn(
          "flex items-center px-4 h-16 shrink-0 border-b border-slate-200/60 bg-white/60 backdrop-blur-md transition-all",
          collapsed ? "justify-center px-1" : "justify-between"
        )}
      >
        {!collapsed ? (
          <div className="flex items-center justify-between w-full min-w-0">
            <Link href="/" className="flex items-center group">
              <img
                src="/ppsuimage/ppsulogo.png"
                alt="P P Savani University"
                className="h-10 w-auto max-w-[170px] object-contain drop-shadow-xs transition-transform group-hover:scale-103"
              />
            </Link>

            {onCollapse && (
              <button
                onClick={onCollapse}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={onCollapse}
            className="flex flex-col items-center justify-center p-1.5 rounded-xl hover:bg-red-50/80 transition-all cursor-pointer group"
            title="Expand Sidebar"
          >
            <img
              src="/ppsuimage/ppsulogo.png"
              alt="PPSU"
              className="h-7 w-auto object-contain transition-transform group-hover:scale-110"
            />
            <ChevronRight className="h-3 w-3 text-slate-400 group-hover:text-red-600 mt-0.5" />
          </button>
        )}
      </div>

      {/* Role Switcher Widget for Multi-Role Users */}
      {!isAdminCookie && userRoles.length > 1 && !collapsed && (
        <div className="px-3 py-2 border-b border-slate-200/50 bg-gradient-to-r from-slate-100/50 to-red-50/30 shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1 px-1">
            Active Portals:
          </span>
          <div className="space-y-1">
            {userRoles.includes("FACULTY") && (
              <Link
                href="/faculty/dashboard"
                className={cn(
                  "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                  pathname.startsWith("/faculty")
                    ? "bg-red-600/10 text-red-700 font-semibold border border-red-500/20 shadow-2xs"
                    : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
                )}
              >
                <GraduationCap className="h-3.5 w-3.5 text-red-600" />
                <span>Faculty Portal</span>
              </Link>
            )}
            {hasAnyRole(userRoles, VERIFICATION_RORoles) && (
              <Link
                href="/verifier/dashboard"
                className={cn(
                  "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                  pathname.startsWith("/verifier")
                    ? "bg-amber-500/10 text-amber-700 font-semibold border border-amber-500/20 shadow-2xs"
                    : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
                )}
              >
                <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                <span>Verifier Portal</span>
              </Link>
            )}
            {userRoles.includes("SUPER_ADMIN") && (
              <Link
                href="/admin/dashboard"
                className={cn(
                  "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                  pathname.startsWith("/admin")
                    ? "bg-rose-600/10 text-rose-700 font-semibold border border-rose-500/20 shadow-2xs"
                    : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
                )}
              >
                <Zap className="h-3.5 w-3.5 text-rose-600" />
                <span>Admin Panel</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Navigation Links - Scrollable Area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
        {navItems.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            isActive={pathname === item.href || (item.href !== "/admin/dashboard" && item.href !== "/faculty/dashboard" && item.href !== "/verifier/dashboard" && pathname.startsWith(item.href + "/"))}
            collapsed={collapsed}
          />
        ))}
      </div>

      {/* Fixed Sticky Liquid Glass Footer */}
      <div className={cn("shrink-0 border-t border-slate-200/60 bg-white/80 backdrop-blur-lg p-3 space-y-2", collapsed && "p-2")}>
        {!collapsed && userName && (
          <div className="liquid-glass-panel rounded-xl p-2.5 flex items-center gap-2.5 transition-all hover:border-red-200/60">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-600 via-rose-600 to-red-800 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(220,38,38,0.28)]">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate leading-tight">{userName}</p>
              <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">{userEmail}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className={cn(
            "w-full text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-500/10 hover:border-red-500/20 border border-transparent rounded-xl transition-all h-8.5 cursor-pointer",
            collapsed ? "justify-center px-0" : "justify-start px-3"
          )}
          title="Sign out of FRIC portal"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0 text-red-500/80" />
          {!collapsed && <span className="ml-2 font-semibold text-red-600">Logout</span>}
        </Button>
      </div>
    </div>
  );
}

export function AppSidebar(props: AppSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop Sidebar with Glassy Container */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen max-h-screen sticky top-0 z-30 border-r border-slate-200/70 bg-white/70 backdrop-blur-xl shadow-xs transition-all duration-300 overflow-hidden shrink-0",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent
          {...props}
          pathname={pathname}
          collapsed={collapsed}
          onCollapse={() => setCollapsed(!collapsed)}
        />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger className="lg:hidden fixed top-3 left-3 z-40 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-sm">
          <Menu className="h-5 w-5 text-slate-700" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-white/95 backdrop-blur-xl border-r border-slate-200">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SidebarContent
            {...props}
            pathname={pathname}
            collapsed={false}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

export function DashboardHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1
          className="text-2xl sm:text-3xl font-bold text-slate-900"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {title}
        </h1>
        {description && (
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendValue,
  className,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}) {
  return (
    <div className={cn("glass-card stat-card rounded-xl p-5", className)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {trend && trendValue && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              trend === "up" && "text-emerald-500 bg-emerald-500/10",
              trend === "down" && "text-red-500 bg-red-500/10",
              trend === "neutral" && "text-muted-foreground bg-muted"
            )}
          >
            {trendValue}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
