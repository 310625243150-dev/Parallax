import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  Activity,
  Bell,
  CircleHelp,
  ClipboardList,
  History,
  LayoutDashboard,
  Menu,
  Settings,
  Stethoscope,
  Users,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { queries } from "@/lib/echoassist/api";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/examinations", label: "Examinations", icon: ClipboardList },
  { to: "/history", label: "History", icon: History },
  { to: "/longitudinal-analysis", label: "Longitudinal Analysis", icon: Activity },
] as const;

const NAV_BOTTOM = [
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/help", label: "Help", icon: CircleHelp },
] as const;

export function BackendIndicator() {
  const { isPending, isError } = useQuery(queries.health());

  const state = isPending
    ? { label: "Checking connection", dot: "bg-warning", text: "text-muted-foreground" }
    : isError
      ? { label: "Backend Offline", dot: "bg-destructive", text: "text-destructive" }
      : { label: "Backend Online", dot: "bg-success", text: "text-foreground" };

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5"
    >
      <span className={cn("h-2 w-2 rounded-full", state.dot)} aria-hidden />
      <span className={cn("text-xs font-medium", state.text)}>{state.label}</span>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <Link
        to="/"
        onClick={onNavigate}
        className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sidebar-primary">
          <Stethoscope className="h-5 w-5 text-sidebar-primary-foreground" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-base font-semibold tracking-tight text-sidebar-accent-foreground">
            EchoAssist
          </span>
          <span className="block truncate text-[11px] text-sidebar-foreground/70">
            Cardiac auscultation
          </span>
        </span>
      </Link>

      <nav aria-label="Main" className="flex-1 space-y-1 px-3 py-4">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{
              className:
                "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_3px_0_0_0_var(--sidebar-primary)]",
            }}
            activeOptions={{ exact: false }}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </nav>

      <div className="space-y-1 border-t border-sidebar-border px-3 py-4">
        {NAV_BOTTOM.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-dvh bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border lg:block">
        <SidebarContent />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-primary/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 shadow-raised">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
          <Button
            variant="secondary"
            size="icon"
            aria-label="Close navigation"
            className="absolute top-4 right-4"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation"
                className="lg:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" aria-hidden />
              </Button>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">
                  {title}
                </h1>
                <p className="truncate text-xs text-muted-foreground">{pathname}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden sm:block">
                <BackendIndicator />
              </div>
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="h-4 w-4" aria-hidden />
              </Button>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                DR
              </span>
            </div>
          </div>
          <div className="border-t border-border px-4 py-2 sm:hidden">
            <BackendIndicator />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">{children}</main>

        <footer className="mx-auto w-full max-w-[1400px] px-4 pb-8 sm:px-6">
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            EchoAssist provides AI-assisted analysis and is not a substitute for professional
            medical diagnosis.
          </p>
        </footer>
      </div>
    </div>
  );
}
