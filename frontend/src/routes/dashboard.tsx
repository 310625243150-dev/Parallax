import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Activity, CalendarDays, Plug, Stethoscope, Users } from "lucide-react";

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
import { queries } from "@/lib/echoassist/api";
import type { Examination } from "@/lib/echoassist/types";
import { formatDate, formatDateTime, greeting, initials, isSameDay } from "@/lib/echoassist/format";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — EchoAssist" },
      {
        name: "description",
        content: "Clinical overview of patients, recent cardiac examinations and backend status.",
      },
      { property: "og:title", content: "Dashboard — EchoAssist" },
      {
        property: "og:description",
        content: "Clinical overview of patients and recent cardiac examinations.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const health = useQuery(queries.health());
  const patients = useQuery(queries.patients());
  const list = patients.data ?? [];

  const histories = useQueries({
    queries: list.slice(0, 8).map((p) => queries.history(p.id)),
  });

  const examinations: Array<Examination & { patientName?: string | undefined }> = histories
    .flatMap((h, index) =>
      (h.data ?? []).map((exam) => ({ ...exam, patientName: list[index]?.name })),
    )
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

  const todayCount = examinations.filter((e) => isSameDay(e.timestamp)).length;

  const latestByPatient = new Map<string, Examination>();
  for (const exam of examinations) {
    if (!latestByPatient.has(exam.patient_id)) latestByPatient.set(exam.patient_id, exam);
  }

  return (
    <AppShell title="Dashboard">
      <PageHeader
        title={`${greeting()}, Doctor`}
        subtitle="Here's your EchoAssist overview."
        actions={
          <Button asChild>
            <Link to="/examinations/new" search={{ patientId: undefined }}>
              <Stethoscope className="h-4 w-4" aria-hidden />
              Start New Examination
            </Link>
          </Button>
        }
      />

      {patients.isPending ? (
        <SkeletonCards />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Patients"
            value={patients.isError ? "—" : list.length}
            hint="Records in EchoAssist"
            tone="info"
            icon={<Users className="h-4 w-4" aria-hidden />}
          />
          <StatCard
            label="Today's Examinations"
            value={patients.isError ? "—" : todayCount}
            hint="Recorded today"
            tone="info"
            icon={<CalendarDays className="h-4 w-4" aria-hidden />}
          />
          <StatCard
            label="Recent Examinations"
            value={patients.isError ? "—" : examinations.length}
            hint="Across loaded patients"
            tone="info"
            icon={<Activity className="h-4 w-4" aria-hidden />}
          />
          <StatCard
            label="Backend Status"
            value={health.isPending ? "Checking" : health.isError ? "Offline" : "Online"}
            hint="GET /"
            tone={health.isPending ? "warning" : health.isError ? "danger" : "success"}
            icon={<Plug className="h-4 w-4" aria-hidden />}
          />
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <SectionCard
          title="Recent Patients"
          description="Most recently added patient records"
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/patients">View all</Link>
            </Button>
          }
        >
          {patients.isPending ? (
            <SkeletonRows rows={4} />
          ) : patients.isError ? (
            <ErrorState offline onRetry={() => patients.refetch()} />
          ) : list.length === 0 ? (
            <EmptyState
              title="No patients yet"
              message="Create your first patient record to begin recording examinations."
            />
          ) : (
            <div className="space-y-3">
              {list.slice(0, 6).map((patient) => {
                const latest = latestByPatient.get(patient.id);
                return (
                  <div
                    key={patient.id}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-lg border border-border p-4"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                      {initials(patient.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{patient.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {patient.id} · {patient.age} yrs · {patient.gender}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        Last exam: {formatDate(latest?.timestamp)} ·{" "}
                        {latest?.diagnosis ?? "No diagnosis yet"}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild className="shrink-0">
                      <Link to="/patients/$patientId" params={{ patientId: patient.id }}>
                        View Patient
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Recent Examinations" description="Latest AI-assisted analyses">
          {patients.isPending || histories.some((h) => h.isPending) ? (
            <SkeletonRows rows={3} />
          ) : examinations.length === 0 ? (
            <EmptyState
              title="No examinations recorded"
              message="Examinations appear here once an analysis has been completed."
            />
          ) : (
            <ul className="space-y-3">
              {examinations.slice(0, 5).map((exam) => (
                <li key={exam.id} className="rounded-lg border border-border p-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {exam.patientName ?? exam.patient_id}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{exam.diagnosis}</p>
                    </div>
                    <SignalQualityBadge quality={exam.signal_quality} />
                  </div>
                  <div className="mt-3">
                    <ConfidenceMeter confidence={exam.confidence} size="sm" />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDateTime(exam.timestamp)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
