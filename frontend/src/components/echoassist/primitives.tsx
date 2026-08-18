import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  CircleDashed,
  Inbox,
  MinusCircle,
  WifiOff,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toPercent } from "@/lib/echoassist/format";

/* ---------------------------------- Page --------------------------------- */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 grid gap-4 sm:flex sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string | undefined;
  description?: string | undefined;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card shadow-card", className)}>
      {title ? (
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-card-foreground">{title}</h3>
            {description ? (
              <p className="truncate text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

/* --------------------------------- Badges -------------------------------- */

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const TONE: Record<Tone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/40 bg-warning/15 text-warning-foreground",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
  info: "border-secondary/30 bg-secondary/10 text-secondary",
};

export function StatusBadge({
  children,
  tone = "neutral",
  icon,
}: {
  children: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        TONE[tone],
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export function signalTone(quality?: string | null): Tone {
  const q = (quality ?? "").toLowerCase();
  if (q.includes("good") || q.includes("high") || q.includes("excellent")) return "success";
  if (q.includes("medium") || q.includes("moderate") || q.includes("fair")) return "warning";
  if (q.includes("low") || q.includes("poor") || q.includes("bad")) return "danger";
  return "neutral";
}

export function SignalQualityBadge({ quality }: { quality?: string | null | undefined }) {
  const tone = signalTone(quality);
  const Icon = tone === "success" ? CheckCircle2 : tone === "danger" ? CircleAlert : AlertTriangle;
  return (
    <StatusBadge tone={tone} icon={<Icon className="h-3.5 w-3.5" aria-hidden />}>
      {quality ?? "Unknown"}
    </StatusBadge>
  );
}

export function ChangeBadge({ changed }: { changed?: boolean | null | undefined }) {
  if (changed === null || changed === undefined) {
    return (
      <StatusBadge icon={<CircleDashed className="h-3.5 w-3.5" aria-hidden />}>
        Not available
      </StatusBadge>
    );
  }
  return changed ? (
    <StatusBadge tone="danger" icon={<AlertTriangle className="h-3.5 w-3.5" aria-hidden />}>
      Change Detected
    </StatusBadge>
  ) : (
    <StatusBadge tone="success" icon={<MinusCircle className="h-3.5 w-3.5" aria-hidden />}>
      No Significant Change
    </StatusBadge>
  );
}

/* ------------------------------- Confidence ------------------------------ */

export function ConfidenceMeter({
  confidence,
  size = "md",
  label = "Model confidence",
}: {
  confidence?: number | null | undefined;
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  const pct = toPercent(confidence);
  if (size === "sm") {
    return (
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-semibold tabular-nums">{pct === null ? "—" : `${pct}%`}</span>
        </div>
        <div
          className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="meter"
          aria-valuenow={pct ?? 0}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        >
          <div
            className="h-full rounded-full bg-secondary transition-[width] duration-500"
            style={{ width: `${pct ?? 0}%` }}
          />
        </div>
      </div>
    );
  }

  const dimension = size === "lg" ? 168 : 120;
  const stroke = size === "lg" ? 12 : 10;
  const radius = (dimension - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - (pct ?? 0) / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative"
        style={{ width: dimension, height: dimension }}
        role="meter"
        aria-valuenow={pct ?? 0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <svg width={dimension} height={dimension} className="-rotate-90">
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-muted"
          />
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="stroke-secondary transition-[stroke-dashoffset] duration-700"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span
            className={cn("font-semibold tabular-nums", size === "lg" ? "text-4xl" : "text-2xl")}
          >
            {pct === null ? "—" : `${pct}%`}
          </span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

/* ------------------------------ State screens ---------------------------- */

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  icon,
}: {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
        {icon ?? <Inbox className="h-5 w-5" aria-hidden />}
      </span>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      {message ? <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p> : null}
      {actionLabel && onAction ? (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}

export function ErrorState({
  offline,
  onRetry,
}: {
  offline?: boolean | undefined;
  onRetry?: (() => void) | undefined;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/25 bg-destructive/5 px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
        {offline ? (
          <WifiOff className="h-5 w-5" aria-hidden />
        ) : (
          <CircleAlert className="h-5 w-5" aria-hidden />
        )}
      </span>
      <h3 className="mt-4 text-base font-semibold">
        {offline ? "Unable to connect to EchoAssist" : "Something went wrong"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {offline
          ? "Please check that the EchoAssist backend is running."
          : "The request could not be completed. You can try again."}
      </p>
      {onRetry ? (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          {offline ? "Retry" : "Try Again"}
        </Button>
      ) : null}
    </div>
  );
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-lg border border-border bg-card p-4"
        >
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-7 w-16" />
          <Skeleton className="mt-3 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <span className="label-xs truncate">{label}</span>
        {icon ? (
          <span
            className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg border", TONE[tone])}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
