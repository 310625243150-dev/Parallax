import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { AppShell } from "@/components/echoassist/AppShell";
import {
  ChangeBadge,
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
import { formatDateTime, initials } from "@/lib/echoassist/format";

export const Route = createFileRoute("/comparison/$patientId")({
  head: () => ({
    meta: [
      { title: "Examination Comparison — EchoAssist" },
      {
        name: "description",
        content: "Compare the current cardiac examination with the previous recorded examination.",
      },
      { property: "og:title", content: "Examination Comparison — EchoAssist" },
      {
        property: "og:description",
        content: "Compare the current examination with the previous recorded one.",
      },
    ],
  }),
  component: ComparisonPage,
});

function ComparisonPage() {
  const { patientId } = Route.useParams();
  const patient = useQuery(queries.patient(patientId));
  const history = useQuery(queries.history(patientId));
  const comparison = useQuery(queries.comparison(patientId));

  const exams = [...(history.data ?? [])].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  const current = exams[0];
  const previous = exams[1];
  const data = comparison.data;

  return (
    <AppShell title="Examination Comparison">
      <PageHeader
        title="Examination Comparison"
        subtitle="Current examination compared with the previous recorded examination."
        actions={
          <Button variant="outline" asChild>
            <Link to="/patients/$patientId" params={{ patientId }}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to patient
            </Link>
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
          {initials(patient.data?.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{patient.data?.name ?? patientId}</p>
          <p className="truncate text-xs text-muted-foreground">
            {patientId}
            {patient.data
              ? ` · ${patient.data.age} yrs · ${patient.data.gender ?? "Unspecified"}`
              : ""}
          </p>
        </div>
      </div>

      {comparison.isPending ? (
        <SkeletonRows rows={3} />
      ) : comparison.isError ? (
        <ErrorState offline onRetry={() => comparison.refetch()} />
      ) : !data?.has_previous ? (
        <EmptyState
          title="No previous examination available"
          message="This is the patient's first recorded examination. Future examinations can be compared against this result."
        />
      ) : (
        <div className="grid gap-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Previous Examination">
              <span className="label-xs">Diagnosis</span>
              <p className="mt-1 text-xl font-semibold break-words">
                {data.previous_diagnosis ?? "—"}
              </p>
              <div className="mt-4 max-w-xs">
                <ConfidenceMeter confidence={data.previous_confidence} size="sm" />
              </div>
              <dl className="mt-4 grid gap-3 border-t border-border pt-4">
                <div className="min-w-0">
                  <dt className="label-xs">Date</dt>
                  <dd className="mt-0.5 text-sm">{formatDateTime(previous?.timestamp)}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="label-xs">Signal Quality</dt>
                  <dd className="mt-1">
                    <SignalQualityBadge quality={previous?.signal_quality} />
                  </dd>
                </div>
              </dl>
            </SectionCard>

            <SectionCard title="Current Examination">
              <span className="label-xs">Diagnosis</span>
              <p className="mt-1 text-xl font-semibold break-words">
                {data.current_diagnosis ?? current?.diagnosis ?? "—"}
              </p>
              <div className="mt-4 max-w-xs">
                <ConfidenceMeter
                  confidence={data.current_confidence ?? current?.confidence}
                  size="sm"
                />
              </div>
              <dl className="mt-4 grid gap-3 border-t border-border pt-4">
                <div className="min-w-0">
                  <dt className="label-xs">Date</dt>
                  <dd className="mt-0.5 text-sm">{formatDateTime(current?.timestamp)}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="label-xs">Signal Quality</dt>
                  <dd className="mt-1">
                    <SignalQualityBadge quality={current?.signal_quality} />
                  </dd>
                </div>
              </dl>
            </SectionCard>
          </div>

          <SectionCard title="Clinical Change">
            <div className="flex flex-wrap items-center gap-3">
              <ChangeBadge changed={data.change_detected} />
              <p className="min-w-0 text-sm text-muted-foreground">
                {data.details ?? "No further comparison details were provided."}
              </p>
            </div>
          </SectionCard>
        </div>
      )}
    </AppShell>
  );
}
