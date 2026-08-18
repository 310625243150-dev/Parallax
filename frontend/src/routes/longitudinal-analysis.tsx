import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Stethoscope, Clock, BarChart3, GitCompareArrows, FileText } from "lucide-react";
import { AppShell } from "@/components/echoassist/AppShell";
import {
  PageHeader,
  SectionCard,
  EmptyState,
  ErrorState,
  SkeletonCards,
  SkeletonRows,
} from "@/components/echoassist/primitives";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queries } from "@/lib/echoassist/api";
import { PatientSearch } from "@/components/echoassist/longitudinal/PatientSearch";
import { PatientSummaryCard } from "@/components/echoassist/longitudinal/PatientSummaryCard";
import { ConfidenceChart } from "@/components/echoassist/longitudinal/ConfidenceChart";
import { PredictionTimelineChart } from "@/components/echoassist/longitudinal/PredictionTimelineChart";
import { SignalQualityChart } from "@/components/echoassist/longitudinal/SignalQualityChart";
import { TrendAnalysisCard } from "@/components/echoassist/longitudinal/TrendAnalysisCard";
import { ExaminationComparison } from "@/components/echoassist/longitudinal/ExaminationComparison";
import { ExaminationTimeline } from "@/components/echoassist/longitudinal/ExaminationTimeline";
import { ExaminationHistoryTable } from "@/components/echoassist/longitudinal/ExaminationHistoryTable";
import { ExportControls } from "@/components/echoassist/longitudinal/ExportControls";

export const Route = createFileRoute("/longitudinal-analysis")({
  validateSearch: (search: Record<string, unknown>) => ({
    patientId: typeof search["patientId"] === "string" ? search["patientId"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Longitudinal Analysis — EchoAssist" },
      {
        name: "description",
        content:
          "Comprehensive longitudinal cardiac auscultation analysis, confidence trends, prediction timeline and comparative history.",
      },
      { property: "og:title", content: "Longitudinal Analysis — EchoAssist" },
      {
        property: "og:description",
        content: "Longitudinal cardiac auscultation trends and comparative analysis.",
      },
    ],
  }),
  component: LongitudinalAnalysisPage,
});

function LongitudinalAnalysisPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const selectedPatientId = search.patientId ?? "";

  const patientsQuery = useQuery(queries.patients());
  const patientQuery = useQuery({
    ...queries.patient(selectedPatientId),
    enabled: Boolean(selectedPatientId),
  });
  const historyQuery = useQuery({
    ...queries.history(selectedPatientId),
    enabled: Boolean(selectedPatientId),
  });

  const patients = patientsQuery.data ?? [];
  const patient = patientQuery.data;
  const history = historyQuery.data ?? [];

  function handleSelectPatient(id: string) {
    navigate({
      to: "/longitudinal-analysis",
      search: { patientId: id },
    });
  }

  return (
    <AppShell title="Longitudinal Analysis">
      <PageHeader
        title="Longitudinal Analysis"
        subtitle="Track cardiac auscultation evolution, AI confidence trends, and diagnostic progression over time."
        actions={patient ? <ExportControls patient={patient} examinations={history} /> : null}
      />

      <div className="space-y-6">
        {/* 1. Patient Search & Quick Switcher */}
        <PatientSearch
          patients={patients}
          selectedPatientId={selectedPatientId}
          onSelectPatient={handleSelectPatient}
          isLoading={patientsQuery.isPending}
          isError={patientsQuery.isError}
          onRetry={() => patientsQuery.refetch()}
        />

        {/* 2. Main Content Area */}
        {!selectedPatientId ? (
          <SectionCard>
            <EmptyState
              title="No Patient Selected"
              message="Select or search for a patient above to view their longitudinal cardiac examination trends."
              icon={<Activity className="h-8 w-8 text-secondary" />}
            />
          </SectionCard>
        ) : patientQuery.isPending || historyQuery.isPending ? (
          <div className="space-y-6">
            <SkeletonCards />
            <SkeletonRows rows={4} />
          </div>
        ) : patientQuery.isError || historyQuery.isError ? (
          <SectionCard>
            <ErrorState
              offline
              onRetry={() => {
                patientQuery.refetch();
                historyQuery.refetch();
              }}
            />
          </SectionCard>
        ) : !patient ? (
          <SectionCard>
            <EmptyState
              title="Patient Not Found"
              message={`No patient record found matching ID "${selectedPatientId}".`}
              actionLabel="View All Patients"
              onAction={() => navigate({ to: "/patients" })}
            />
          </SectionCard>
        ) : history.length === 0 ? (
          <div className="space-y-6">
            <PatientSummaryCard patient={patient} examinations={[]} />
            <SectionCard>
              <EmptyState
                title="No Examination History"
                message={`No cardiac examinations have been recorded yet for ${patient.name}.`}
                actionLabel="Start First Examination"
                onAction={() =>
                  navigate({
                    to: "/examinations/new",
                    search: { patientId: patient.id },
                  })
                }
              />
            </SectionCard>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Patient Overview Card */}
            <PatientSummaryCard patient={patient} examinations={history} />

            {/* Heuristic Trend Analysis Card */}
            <TrendAnalysisCard examinations={history} />

            {/* Tabs for Organized Analysis Sections */}
            <Tabs defaultValue="charts" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-muted/60 p-1">
                <TabsTrigger value="charts" className="flex items-center gap-1.5 text-xs">
                  <BarChart3 className="h-4 w-4" />
                  Trend Charts
                </TabsTrigger>
                <TabsTrigger value="comparison" className="flex items-center gap-1.5 text-xs">
                  <GitCompareArrows className="h-4 w-4" />
                  Side-by-Side
                </TabsTrigger>
                <TabsTrigger value="timeline" className="flex items-center gap-1.5 text-xs">
                  <Clock className="h-4 w-4" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="table" className="flex items-center gap-1.5 text-xs">
                  <FileText className="h-4 w-4" />
                  History Logs
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Charts */}
              <TabsContent value="charts" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <ConfidenceChart examinations={history} />
                  <PredictionTimelineChart examinations={history} />
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                  <SignalQualityChart examinations={history} />

                  <SectionCard title="Recording Duration & Signal Metrics">
                    <div className="space-y-4">
                      <div className="rounded-lg border border-dashed border-border p-5 text-center">
                        <p className="text-xs font-medium text-foreground">
                          Recording Duration Metric
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Recording duration is currently{" "}
                          <strong className="text-foreground">Not available</strong> in the backend
                          examination schema.
                        </p>
                        <p className="mt-2 text-[11px] text-muted-foreground italic">
                          (Durations are not fabricated to maintain clinical data integrity.)
                        </p>
                      </div>

                      <div className="rounded-lg bg-muted/40 p-4 text-xs space-y-2">
                        <p className="font-semibold text-foreground">Signal Quality Distribution</p>
                        <div className="grid grid-cols-3 gap-2 text-center pt-1">
                          <div className="rounded bg-card p-2 border border-border">
                            <span className="text-[10px] uppercase text-muted-foreground block">
                              Good
                            </span>
                            <span className="font-bold text-emerald-600">
                              {
                                history.filter((e) =>
                                  e.signal_quality?.toLowerCase().includes("good"),
                                ).length
                              }
                            </span>
                          </div>
                          <div className="rounded bg-card p-2 border border-border">
                            <span className="text-[10px] uppercase text-muted-foreground block">
                              Acceptable
                            </span>
                            <span className="font-bold text-amber-600">
                              {
                                history.filter((e) =>
                                  ["fair", "acceptable", "moderate"].some((q) =>
                                    e.signal_quality?.toLowerCase().includes(q),
                                  ),
                                ).length
                              }
                            </span>
                          </div>
                          <div className="rounded bg-card p-2 border border-border">
                            <span className="text-[10px] uppercase text-muted-foreground block">
                              Poor
                            </span>
                            <span className="font-bold text-rose-600">
                              {
                                history.filter((e) =>
                                  ["poor", "fail", "low"].some((q) =>
                                    e.signal_quality?.toLowerCase().includes(q),
                                  ),
                                ).length
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                </div>
              </TabsContent>

              {/* Tab 2: Comparison */}
              <TabsContent value="comparison">
                <ExaminationComparison examinations={history} />
              </TabsContent>

              {/* Tab 3: Timeline */}
              <TabsContent value="timeline">
                <ExaminationTimeline examinations={history} />
              </TabsContent>

              {/* Tab 4: History Table */}
              <TabsContent value="table">
                <ExaminationHistoryTable examinations={history} patientId={patient.id} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </AppShell>
  );
}
