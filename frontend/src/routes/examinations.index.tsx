import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Stethoscope } from "lucide-react";

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
import { queries } from "@/lib/echoassist/api";
import { formatDateTime } from "@/lib/echoassist/format";

export const Route = createFileRoute("/examinations/")({
  head: () => ({
    meta: [
      { title: "Examinations — EchoAssist" },
      {
        name: "description",
        content: "All recorded cardiac auscultation examinations and their AI-assisted results.",
      },
      { property: "og:title", content: "Examinations — EchoAssist" },
      {
        property: "og:description",
        content: "All recorded cardiac auscultation examinations and their results.",
      },
    ],
  }),
  component: ExaminationsPage,
});

function ExaminationsPage() {
  const patients = useQuery(queries.patients());
  const list = patients.data ?? [];
  const histories = useQueries({ queries: list.map((p) => queries.history(p.id)) });

  const rows = histories
    .flatMap((h, i) => (h.data ?? []).map((exam) => ({ exam, patient: list[i] })))
    .sort((a, b) => (a.exam.timestamp < b.exam.timestamp ? 1 : -1));

  const loading = patients.isPending || histories.some((h) => h.isPending);

  return (
    <AppShell title="Examinations">
      <PageHeader
        title="Examinations"
        subtitle="Every recorded auscultation examination across your patients."
        actions={
          <Button asChild>
            <Link to="/examinations/new" search={{ patientId: undefined }}>
              <Stethoscope className="h-4 w-4" aria-hidden />
              Start New Examination
            </Link>
          </Button>
        }
      />

      <SectionCard>
        {loading ? (
          <SkeletonRows rows={5} />
        ) : patients.isError ? (
          <ErrorState offline onRetry={() => patients.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No examinations recorded"
            message="Completed analyses will be listed here."
          />
        ) : (
          <ul className="space-y-3">
            {rows.map(({ exam, patient }) => (
              <li key={exam.id} className="rounded-lg border border-border p-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {patient?.name ?? exam.patient_id}
                      </p>
                      <SignalQualityBadge quality={exam.signal_quality} />
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{exam.diagnosis}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(exam.timestamp)} · {exam.model_version}
                    </p>
                  </div>
                  <ConfidenceMeter confidence={exam.confidence} size="sm" />
                  {patient ? (
                    <Button variant="outline" size="sm" asChild className="shrink-0">
                      <Link to="/patients/$patientId" params={{ patientId: patient.id }}>
                        Open patient
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </AppShell>
  );
}
