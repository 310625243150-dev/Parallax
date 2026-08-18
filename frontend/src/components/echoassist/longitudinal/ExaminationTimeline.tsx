import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Clock, FileAudio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignalQualityBadge } from "@/components/echoassist/primitives";
import type { Examination } from "@/lib/echoassist/types";
import { formatDateTime } from "@/lib/echoassist/format";
import { safeConfidencePercent } from "@/lib/echoassist/longitudinal";

export interface ExaminationTimelineProps {
  examinations: Examination[];
}

export function ExaminationTimeline({ examinations }: ExaminationTimelineProps) {
  const [ascending, setAscending] = useState(true);

  const sorted = useMemo(() => {
    return [...examinations].sort((a, b) => {
      const diff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      return ascending ? diff : -diff;
    });
  }, [examinations, ascending]);

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-card text-center text-xs text-muted-foreground">
        No examinations recorded for timeline display.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-secondary" />
            Chronological Examination Timeline
          </h3>
          <p className="text-xs text-muted-foreground">
            Step-by-step diagnostic journey across all recorded auscultation sessions.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setAscending(!ascending)}
          className="text-xs"
        >
          {ascending ? (
            <>
              <ArrowDown className="h-3.5 w-3.5 mr-1" />
              Oldest → Newest
            </>
          ) : (
            <>
              <ArrowUp className="h-3.5 w-3.5 mr-1" />
              Newest → Oldest
            </>
          )}
        </Button>
      </div>

      <div className="mt-8 relative pl-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
        {sorted.map((exam, index) => {
          const conf = safeConfidencePercent(exam.confidence);
          const isAbnormal =
            exam.diagnosis.toLowerCase().includes("abnormal") ||
            exam.diagnosis.toLowerCase().includes("murmur") ||
            exam.diagnosis.toLowerCase().includes("regurgitation") ||
            exam.diagnosis.toLowerCase().includes("stenosis");

          return (
            <div key={exam.id} className="relative pb-8 last:pb-0">
              {/* Timeline Marker Dot */}
              <div
                className={`absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-card ${
                  isAbnormal
                    ? "bg-rose-500 ring-2 ring-rose-500/20"
                    : "bg-emerald-500 ring-2 ring-emerald-500/20"
                }`}
                aria-hidden
              />

              <div className="rounded-lg border border-border bg-card p-4 transition-all hover:border-secondary/50">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {formatDateTime(exam.timestamp)}
                    </span>
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      ID #{exam.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <SignalQualityBadge quality={exam.signal_quality} />
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {exam.model_version}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-4 rounded-md bg-muted/40 p-3">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Diagnostic Prediction
                    </span>
                    <p
                      className={`text-base font-bold ${isAbnormal ? "text-rose-600 dark:text-rose-400" : "text-foreground"}`}
                    >
                      {exam.diagnosis}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      AI Confidence
                    </span>
                    <p className="text-base font-bold text-foreground">{conf}%</p>
                  </div>
                </div>

                {exam.notes ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    <strong className="font-medium text-foreground">Clinical Note:</strong>{" "}
                    {exam.notes}
                  </p>
                ) : null}

                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                  <FileAudio className="h-3.5 w-3.5" />
                  <span className="truncate">{exam.audio_reference}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
