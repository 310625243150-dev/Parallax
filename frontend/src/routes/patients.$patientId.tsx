import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, GitCompareArrows, History, Stethoscope } from "lucide-react";

import { AppShell } from "@/components/echoassist/AppShell";
import {
  ConfidenceMeter,
  EmptyState,
  ErrorState,
  PageHeader,
  SectionCard,
  SignalQualityBadge,
  SkeletonCards,
  SkeletonRows,
  StatCard,
} from "@/components/echoassist/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { queries } from "@/lib/echoassist/api";
import { formatDate, formatDateTime, initials, toPercent } from "@/lib/echoassist/format";

export const Route = createFileRoute("/patients/$patientId")({
  head: () => ({
    meta: [
      { title: "Patient Profile — EchoAssist" },
      {
        name: "description",
        content:
          "Patient profile with latest diagnosis, confidence, signal quality and examination history.",
      },
      { property: "og:title", content: "Patient Profile — EchoAssist" },
      {
        property: "og:description",
        content: "Latest diagnosis, confidence and examination history for a patient.",
      },
    ],
  }),
  component: PatientProfile,
});

function PatientProfile() {
  const { patientId } = Route.useParams();
  const patient = useQuery(queries.patient(patientId));
  const history = useQuery(queries.history(patientId));

  const exams = [...(history.data ?? [])].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  const latest = exams[0];

  return (
    <AppShell title="Patient Profile">
      {patient.isPending ? (
        <div className="rounded-xl border border-border bg-card p-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-3 h-4 w-72" />
        </div>
      ) : patient.isError ? (
        <ErrorState offline onRetry={() => patient.refetch()} />
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
              <div className="flex min-w-0 items-start gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-accent text-base font-semibold text-accent-foreground">
                  {initials(patient.data?.name)}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-semibold tracking-tight">
                    {patient.data?.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {patient.data?.id} · {patient.data?.age} yrs ·{" "}
                    {patient.data?.gender ?? "Unspecified"}
                  </p>
                  <p className="mt-3 max-w-2xl text-sm">
                    <span className="label-xs block">Medical history</span>
                    <span className="text-muted-foreground">
                      {patient.data?.medical_history || "No medical history recorded."}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button asChild>
                  <Link to="/examinations/new" search={{ patientId }}>
                    <Stethoscope className="h-4 w-4" aria-hidden />
                    Start New Examination
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/history" search={{ patientId }}>
                    <History className="h-4 w-4" aria-hidden />
                    View History
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/comparison/$patientId" params={{ patientId }}>
                    <GitCompareArrows className="h-4 w-4" aria-hidden />
                    Compare
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            {history.isPending ? (
              <SkeletonCards />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Latest Diagnosis"
                  value={<span className="text-base">{latest?.diagnosis ?? "—"}</span>}
                  hint={latest ? "AI-assisted analysis" : "No examination yet"}
                  tone="info"
                  icon={<Activity className="h-4 w-4" aria-hidden />}
                />
                <StatCard
                  label="Latest Confidence"
                  value={latest ? `${toPercent(latest.confidence) ?? "—"}%` : "—"}
                  hint="Model confidence"
                />
                <StatCard
                  label="Last Examination"
                  value={<span className="text-base">{formatDate(latest?.timestamp)}</span>}
                  hint={latest ? formatDateTime(latest.timestamp) : "No records"}
                />
                <StatCard
                  label="Signal Quality"
                  value={<span className="text-base">{latest?.signal_quality ?? "—"}</span>}
                  hint={latest ? "Recorded signal" : "No records"}
                />
              </div>
            )}
          </div>

          <div className="mt-6">
            <PageHeader title="Examination History" />
            <SectionCard>
              {history.isPending ? (
                <SkeletonRows rows={3} />
              ) : history.isError ? (
                <ErrorState onRetry={() => history.refetch()} />
              ) : exams.length === 0 ? (
                <EmptyState
                  title="No examinations recorded"
                  message="Start a cardiac examination to record the first analysis for this patient."
                />
              ) : (
                <ul className="space-y-3">
                  {exams.map((exam) => (
                    <li key={exam.id} className="rounded-lg border border-border p-4">
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium">{exam.diagnosis}</p>
                            <SignalQualityBadge quality={exam.signal_quality} />
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDateTime(exam.timestamp)} · Model {exam.model_version} ·{" "}
                            {exam.audio_reference}
                          </p>
                          {exam.notes ? (
                            <p className="mt-2 text-sm text-muted-foreground">{exam.notes}</p>
                          ) : null}
                          <div className="mt-3 max-w-xs">
                            <ConfidenceMeter confidence={exam.confidence} size="sm" />
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild className="shrink-0">
                          <Link to="/history" search={{ patientId }}>
                            View Examination
                          </Link>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        </>
      )}
    </AppShell>
  );
}
