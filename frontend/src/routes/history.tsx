import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Activity, ChevronDown, GitCompareArrows } from "lucide-react";

import { AppShell } from "@/components/echoassist/AppShell";
import {
  ConfidenceMeter,
  EmptyState,
  ErrorState,
  PageHeader,
  SectionCard,
  SignalQualityBadge,
  SkeletonRows,
} from "@/components/echoassist/primitives";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queries } from "@/lib/echoassist/api";
import { formatDateTime, toPercent } from "@/lib/echoassist/format";

export const Route = createFileRoute("/history")({
  validateSearch: (search: Record<string, unknown>) => ({
    patientId: typeof search["patientId"] === "string" ? search["patientId"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Examination History — EchoAssist" },
      {
        name: "description",
        content:
          "Chronological history of cardiac auscultation examinations, confidence and signal quality.",
      },
      { property: "og:title", content: "Examination History — EchoAssist" },
      {
        property: "og:description",
        content: "Chronological history of cardiac auscultation examinations.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const patients = useQuery(queries.patients());
  const patientId = search.patientId ?? "";
  const [expanded, setExpanded] = useState<number | null>(null);

  const history = useQuery({
    ...queries.history(patientId),
    enabled: Boolean(patientId),
  });

  const exams = [...(history.data ?? [])].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

  return (
    <AppShell title="Examination History">
      <PageHeader
        title="Examination History"
        subtitle="Review every recorded examination for a patient."
        actions={
          patientId ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link to="/longitudinal-analysis" search={{ patientId }}>
                  <Activity className="h-4 w-4 mr-1.5" />
                  Longitudinal Analysis
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/comparison/$patientId" params={{ patientId }}>
                  <GitCompareArrows className="h-4 w-4" aria-hidden />
                  Compare
                </Link>
              </Button>
            </div>
          ) : null
        }
      />

      <SectionCard>
        <div className="grid max-w-md gap-2">
          <Label htmlFor="patient-filter">Patient</Label>
          <Select
            value={patientId}
            onValueChange={(value) => navigate({ to: "/history", search: { patientId: value } })}
          >
            <SelectTrigger id="patient-filter">
              <SelectValue placeholder="Select a patient" />
            </SelectTrigger>
            <SelectContent>
              {(patients.data ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} · {p.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6">
          {!patientId ? (
            <EmptyState
              title="Select a patient"
              message="Choose a patient to see their examination timeline."
            />
          ) : history.isPending ? (
            <SkeletonRows rows={4} />
          ) : history.isError ? (
            <ErrorState offline onRetry={() => history.refetch()} />
          ) : exams.length === 0 ? (
            <EmptyState
              title="No examinations recorded"
              message="This patient has no recorded examinations yet."
              actionLabel="Start Examination"
              onAction={() => navigate({ to: "/examinations/new", search: { patientId } })}
            />
          ) : (
            <ol className="relative space-y-4 border-l border-border pl-6">
              {exams.map((exam, i) => (
                <li key={exam.id} className="relative">
                  <span
                    className="absolute -left-[31px] top-4 grid h-3 w-3 place-items-center rounded-full border-2 border-card bg-secondary"
                    aria-hidden
                  />
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          {i === 0 ? "Latest · " : ""}
                          {formatDateTime(exam.timestamp)}
                        </p>
                        <p className="mt-1 truncate text-sm font-medium">{exam.diagnosis}</p>
                      </div>
                      <SignalQualityBadge quality={exam.signal_quality} />
                    </div>

                    <div className="mt-3 max-w-xs">
                      <ConfidenceMeter confidence={exam.confidence} size="sm" />
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpanded(expanded === exam.id ? null : exam.id)}
                      aria-expanded={expanded === exam.id}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-secondary hover:underline"
                    >
                      Details
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${expanded === exam.id ? "rotate-180" : ""}`}
                        aria-hidden
                      />
                    </button>

                    {expanded === exam.id ? (
                      <dl className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
                        {[
                          ["Examination ID", String(exam.id)],
                          ["Model Version", exam.model_version],
                          ["Audio Reference", exam.audio_reference],
                          ["Confidence", `${toPercent(exam.confidence) ?? "—"}%`],
                        ].map(([label, value]) => (
                          <div key={label} className="min-w-0">
                            <dt className="label-xs">{label}</dt>
                            <dd className="mt-0.5 truncate font-mono text-xs">{value}</dd>
                          </div>
                        ))}
                        <div className="sm:col-span-2">
                          <dt className="label-xs">Notes</dt>
                          <dd className="mt-0.5 text-sm text-muted-foreground">
                            {exam.notes || "No notes recorded."}
                          </dd>
                        </div>
                      </dl>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </SectionCard>
    </AppShell>
  );
}
