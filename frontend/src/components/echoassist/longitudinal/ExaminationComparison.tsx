import { useState, useMemo } from "react";
import { GitCompareArrows, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SignalQualityBadge } from "@/components/echoassist/primitives";
import type { Examination } from "@/lib/echoassist/types";
import { formatDateTime } from "@/lib/echoassist/format";
import { safeConfidencePercent } from "@/lib/echoassist/longitudinal";

export interface ExaminationComparisonProps {
  examinations: Examination[];
}

export function ExaminationComparison({ examinations }: ExaminationComparisonProps) {
  // Sort newest first
  const sorted = useMemo(() => {
    return [...examinations].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [examinations]);

  const [examIdA, setExamIdA] = useState<string>(
    sorted.length > 1 ? String(sorted[1]?.id) : String(sorted[0]?.id || ""),
  );
  const [examIdB, setExamIdB] = useState<string>(
    sorted.length > 0 ? String(sorted[0]?.id || "") : "",
  );

  const examA = useMemo(
    () => sorted.find((e) => String(e.id) === examIdA) ?? sorted[1] ?? sorted[0],
    [sorted, examIdA],
  );

  const examB = useMemo(
    () => sorted.find((e) => String(e.id) === examIdB) ?? sorted[0],
    [sorted, examIdB],
  );

  if (sorted.length < 2) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h3 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
          <GitCompareArrows className="h-5 w-5 text-secondary" />
          Comparative Examination Analysis
        </h3>
        <p className="mt-2 text-xs text-muted-foreground">
          At least two recorded examinations are required to perform a direct side-by-side
          comparison.
        </p>
      </div>
    );
  }

  const confA = examA ? safeConfidencePercent(examA.confidence) : 0;
  const confB = examB ? safeConfidencePercent(examB.confidence) : 0;
  const confDiff = Math.round((confB - confA) * 10) / 10;

  const isSameExamSelected = examA && examB && examA.id === examB.id;
  const isDiagnosisChanged = !isSameExamSelected && examA && examB && examA.diagnosis !== examB.diagnosis;
  const isQualityChanged = !isSameExamSelected && examA && examB && examA.signal_quality !== examB.signal_quality;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5 text-secondary" />
            Side-by-Side Examination Comparison
          </h3>
          <p className="text-xs text-muted-foreground">
            Select any two examinations from history to compare AI predictions, confidence scores,
            and signal quality.
          </p>
        </div>

        {isSameExamSelected ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Same examination selected
          </span>
        ) : isDiagnosisChanged ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <AlertCircle className="h-3.5 w-3.5" />
            Diagnostic shift detected
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Consistent diagnosis
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Examination A selector & card */}
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <div className="mb-4">
            <Label htmlFor="select-exam-a" className="text-xs font-semibold text-muted-foreground">
              Reference / Baseline Examination (A)
            </Label>
            <Select value={examIdA} onValueChange={setExamIdA}>
              <SelectTrigger id="select-exam-a" className="mt-1.5 bg-card">
                <SelectValue placeholder="Select Exam A" />
              </SelectTrigger>
              <SelectContent>
                {sorted.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    #{e.id} · {formatDateTime(e.timestamp)} · {e.diagnosis}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {examA ? (
            <div className="space-y-3 pt-2">
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-xs text-muted-foreground">Date & Time</span>
                <span className="text-xs font-medium text-foreground">
                  {formatDateTime(examA.timestamp)}
                </span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-xs text-muted-foreground">AI Prediction</span>
                <span className="text-xs font-semibold text-foreground">{examA.diagnosis}</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-xs text-muted-foreground">Confidence</span>
                <span className="text-xs font-semibold text-foreground">{confA}%</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2 items-center">
                <span className="text-xs text-muted-foreground">Signal Quality</span>
                <SignalQualityBadge quality={examA.signal_quality} />
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-xs text-muted-foreground">Recording Duration</span>
                <span className="text-xs text-muted-foreground">Not available</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-xs text-muted-foreground">Model Version</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {examA.model_version}
                </span>
              </div>
              {examA.notes ? (
                <div className="pt-1">
                  <span className="text-[11px] font-medium uppercase text-muted-foreground">
                    Clinical Notes
                  </span>
                  <p className="mt-1 text-xs text-foreground bg-card p-2 rounded border border-border/60">
                    {examA.notes}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Examination B selector & card */}
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <div className="mb-4">
            <Label htmlFor="select-exam-b" className="text-xs font-semibold text-muted-foreground">
              Comparison / Current Examination (B)
            </Label>
            <Select value={examIdB} onValueChange={setExamIdB}>
              <SelectTrigger id="select-exam-b" className="mt-1.5 bg-card">
                <SelectValue placeholder="Select Exam B" />
              </SelectTrigger>
              <SelectContent>
                {sorted.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    #{e.id} · {formatDateTime(e.timestamp)} · {e.diagnosis}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {examB ? (
            <div className="space-y-3 pt-2">
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-xs text-muted-foreground">Date & Time</span>
                <span className="text-xs font-medium text-foreground">
                  {formatDateTime(examB.timestamp)}
                </span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2 items-center">
                <span className="text-xs text-muted-foreground">AI Prediction</span>
                <span
                  className={`text-xs font-semibold ${isDiagnosisChanged ? "text-amber-600 dark:text-amber-400 font-bold" : "text-foreground"}`}
                >
                  {examB.diagnosis}
                </span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2 items-center">
                <span className="text-xs text-muted-foreground">Confidence</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground">{confB}%</span>
                  {confDiff !== 0 ? (
                    <span
                      className={`text-[11px] font-semibold ${
                        confDiff > 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      ({confDiff > 0 ? `+${confDiff}` : confDiff}%)
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2 items-center">
                <span className="text-xs text-muted-foreground">Signal Quality</span>
                <div className="flex items-center gap-1.5">
                  <SignalQualityBadge quality={examB.signal_quality} />
                  {isQualityChanged ? (
                    <span className="text-[11px] text-amber-600">(Changed)</span>
                  ) : null}
                </div>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-xs text-muted-foreground">Recording Duration</span>
                <span className="text-xs text-muted-foreground">Not available</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-xs text-muted-foreground">Model Version</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {examB.model_version}
                </span>
              </div>
              {examB.notes ? (
                <div className="pt-1">
                  <span className="text-[11px] font-medium uppercase text-muted-foreground">
                    Clinical Notes
                  </span>
                  <p className="mt-1 text-xs text-foreground bg-card p-2 rounded border border-border/60">
                    {examB.notes}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
