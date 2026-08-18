import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignalQualityBadge } from "@/components/echoassist/primitives";
import type { Examination } from "@/lib/echoassist/types";
import { formatDateTime } from "@/lib/echoassist/format";
import { safeConfidencePercent } from "@/lib/echoassist/longitudinal";

export interface ExaminationHistoryTableProps {
  examinations: Examination[];
  patientId: string;
}

export function ExaminationHistoryTable({ examinations, patientId }: ExaminationHistoryTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Sort newest first
  const sorted = [...examinations].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-card text-center text-xs text-muted-foreground">
        No examination records available in history.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      <div className="border-b border-border p-5">
        <h3 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5 text-secondary" />
          Examination History Table
        </h3>
        <p className="text-xs text-muted-foreground">
          Detailed chronological logs of all examinations for this patient.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Date & Time</th>
              <th className="px-4 py-3">Prediction</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3">Signal Quality</th>
              <th className="px-4 py-3">Recording Duration</th>
              <th className="px-4 py-3">Doctor Notes</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((exam) => {
              const isExpanded = expandedId === exam.id;
              const conf = safeConfidencePercent(exam.confidence);

              return (
                <tr key={exam.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                    {formatDateTime(exam.timestamp)}
                    <span className="block font-mono text-[10px] text-muted-foreground">
                      ID #{exam.id}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">{exam.diagnosis}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-foreground">{conf}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <SignalQualityBadge quality={exam.signal_quality} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">Not available</td>
                  <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">
                    {exam.notes || "—"}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setExpandedId(isExpanded ? null : exam.id)}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-3.5 w-3.5 mr-1" />
                            Hide
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3.5 w-3.5 mr-1" />
                            Details
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 px-2 text-xs" asChild>
                        <Link to="/history" search={{ patientId }}>
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {expandedId !== null
        ? (() => {
            const activeExam = sorted.find((e) => e.id === expandedId);
            if (!activeExam) return null;
            return (
              <div className="border-t border-border bg-muted/30 p-4">
                <h4 className="text-xs font-semibold text-foreground mb-2">
                  Detailed Examination Information (ID #{activeExam.id})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground block">
                      Audio Reference
                    </span>
                    <span className="font-mono text-foreground">{activeExam.audio_reference}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground block">
                      Model Version
                    </span>
                    <span className="font-mono text-foreground">{activeExam.model_version}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground block">
                      Signal Quality
                    </span>
                    <span className="font-medium text-foreground">{activeExam.signal_quality}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground block">
                      Confidence Score
                    </span>
                    <span className="font-medium text-foreground">
                      {safeConfidencePercent(activeExam.confidence)}%
                    </span>
                  </div>
                </div>
                {activeExam.notes ? (
                  <div className="mt-3">
                    <span className="text-[10px] uppercase text-muted-foreground block">
                      Clinical Notes
                    </span>
                    <p className="mt-1 text-xs text-foreground bg-card p-2 rounded border border-border">
                      {activeExam.notes}
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })()
        : null}
    </div>
  );
}
