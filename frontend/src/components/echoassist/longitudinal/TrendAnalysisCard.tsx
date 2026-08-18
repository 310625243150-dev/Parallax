import { TrendingUp, TrendingDown, Minus, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import type { Examination } from "@/lib/echoassist/types";
import { calculateTrendMetrics } from "@/lib/echoassist/longitudinal";

export interface TrendAnalysisCardProps {
  examinations: Examination[];
}

export function TrendAnalysisCard({ examinations }: TrendAnalysisCardProps) {
  const metrics = calculateTrendMetrics(examinations);

  if (!metrics) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Longitudinal Trend Analysis
        </h3>
        <p className="mt-2 text-xs text-muted-foreground">
          No examination data available to calculate trend metrics.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: typeof metrics.trendStatus) => {
    switch (status) {
      case "Improving":
        return {
          icon: <TrendingUp className="h-4 w-4 text-emerald-600" />,
          bgColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
          label: "AI Trend: Improving",
        };
      case "Needs Attention":
        return {
          icon: <AlertTriangle className="h-4 w-4 text-rose-600" />,
          bgColor: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
          label: "AI Trend: Needs Attention",
        };
      case "Baseline Established":
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-sky-600" />,
          bgColor: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
          label: "AI Trend: Baseline Established",
        };
      case "Stable":
      default:
        return {
          icon: <Minus className="h-4 w-4 text-blue-600" />,
          bgColor: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
          label: "AI Trend: Stable",
        };
    }
  };

  const statusBadge = getStatusBadge(metrics.trendStatus);

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            Model Output Trend Analysis
          </h3>
          <p className="text-xs text-muted-foreground">
            Deterministic heuristic summary of model prediction outputs across {metrics.totalExaminations} examinations.
          </p>
        </div>

        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge.bgColor}`}
        >
          {statusBadge.icon}
          <span>{statusBadge.label}</span>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-muted/40 p-3.5 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">{metrics.trendDetails}</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-lg border border-border/80 p-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Current Prediction
          </span>
          <p className="mt-1 truncate text-sm font-semibold text-foreground">
            {metrics.currentPrediction}
          </p>
        </div>

        <div className="rounded-lg border border-border/80 p-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Previous Prediction
          </span>
          <p className="mt-1 truncate text-sm font-semibold text-foreground">
            {metrics.previousPrediction ?? "— (First exam)"}
          </p>
        </div>

        <div className="rounded-lg border border-border/80 p-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Average Confidence
          </span>
          <p className="mt-1 text-sm font-semibold text-foreground">{metrics.avgConfidence}%</p>
        </div>

        <div className="rounded-lg border border-border/80 p-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Highest Confidence
          </span>
          <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {metrics.highestConfidence}%
          </p>
        </div>

        <div className="rounded-lg border border-border/80 p-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Lowest Confidence
          </span>
          <p className="mt-1 text-sm font-semibold text-amber-600 dark:text-amber-400">
            {metrics.lowestConfidence}%
          </p>
        </div>

        <div className="rounded-lg border border-border/80 p-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Avg Signal Score
          </span>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {metrics.avgSignalQualityScore} / 100
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 text-secondary mt-0.5" />
        <p>
          <strong>Clinical Notice:</strong> Trend indicators summarize AI examination history and
          are not a clinical diagnosis. Medical decisions must always combine clinical examination,
          patient history, and clinician judgment.
        </p>
      </div>
    </div>
  );
}
