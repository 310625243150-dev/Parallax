import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileAudio,
  GitCompareArrows,
  Mic,
  UploadCloud,
} from "lucide-react";

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
  StatusBadge,
} from "@/components/echoassist/primitives";
import { AudioRecorder, AudioReviewCard } from "@/components/echoassist/AudioRecorder";
import { AudioUploader } from "@/components/echoassist/AudioUploader";
import { BENCHMARK_AUDIO_REFERENCE } from "@/lib/echoassist/audioReferenceService";
import { EcgTrace } from "@/components/echoassist/Waveform";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { api, queries } from "@/lib/echoassist/api";
import { formatDateTime, initials } from "@/lib/echoassist/format";
import type { Comparison, Examination } from "@/lib/echoassist/types";

export const Route = createFileRoute("/examinations/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    patientId: typeof search["patientId"] === "string" ? search["patientId"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "New Cardiac Examination — EchoAssist" },
      {
        name: "description",
        content: "Record a cardiac auscultation, add clinical notes and run AI-assisted analysis.",
      },
      { property: "og:title", content: "New Cardiac Examination — EchoAssist" },
      {
        property: "og:description",
        content: "Record, review and analyze a cardiac auscultation examination.",
      },
    ],
  }),
  component: NewExamination,
});

const STEPS = ["Patient", "Record", "Review", "Analyze", "Results"] as const;
const LOCATIONS = ["Aortic", "Pulmonic", "Tricuspid", "Mitral", "Other"] as const;

function Stepper({ current }: { current: number }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-5" aria-label="Examination progress">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li
            key={step}
            aria-current={active ? "step" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm",
              active
                ? "border-secondary bg-secondary/10 text-foreground"
                : done
                  ? "border-success/30 bg-success/10 text-foreground"
                  : "border-border bg-card text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold",
                done
                  ? "bg-success text-success-foreground"
                  : active
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="h-3 w-3" aria-hidden /> : `0${i + 1}`}
            </span>
            <span className="truncate font-medium">{step}</span>
          </li>
        );
      })}
    </ol>
  );
}

function ProcessingScreen() {
  return (
    <SectionCard>
      <div className="mx-auto max-w-xl py-8 text-center">
        <h3 className="text-xl font-semibold tracking-tight">Analyzing cardiac audio...</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Communicating with EchoAssist AI analysis model.
        </p>
        <div className="mt-6 rounded-xl bg-primary/[0.03] p-6 text-secondary">
          <EcgTrace />
        </div>
        <p className="mt-6 text-xs text-muted-foreground" aria-live="polite">
          Please wait while the cardiac analysis completes.
        </p>
      </div>
    </SectionCard>
  );
}

function ResultsView({
  result,
  comparison,
  patientName,
}: {
  result: Examination;
  comparison?: Comparison | undefined;
  patientName?: string | undefined;
}) {
  return (
    <div className="grid gap-6">
      <SectionCard title="AI-Assisted Analysis" description={patientName}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_auto_minmax(0,1fr)] lg:items-center">
          <div className="min-w-0">
            <span className="label-xs">Diagnosis</span>
            <p className="mt-2 text-3xl font-semibold tracking-tight break-words">
              {result.diagnosis}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Result returned by the EchoAssist analysis model. Interpret alongside clinical
              findings.
            </p>
          </div>
          <div className="justify-self-center">
            <ConfidenceMeter confidence={result.confidence} size="lg" />
          </div>
          <div className="rounded-xl border border-border p-4">
            <span className="label-xs">Signal Quality</span>
            <p className="mt-2 text-2xl font-semibold">{result.signal_quality}</p>
            <div className="mt-2">
              <SignalQualityBadge quality={result.signal_quality} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Signal quality reported by the backend for this recording.
            </p>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <SectionCard title="Examination Details">
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              ["Model Version", result.model_version],
              ["Examination ID", result.id],
              ["Audio Reference", result.audio_reference],
              ["Timestamp", formatDateTime(result.timestamp)],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="label-xs">{label}</dt>
                <dd className="mt-1 truncate font-mono text-sm">{String(value)}</dd>
              </div>
            ))}
          </dl>
          {result.notes ? (
            <div className="mt-4 border-t border-border pt-4">
              <dt className="label-xs">Clinical Notes</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{result.notes}</dd>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard
          title="Previous Examination Comparison"
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/comparison/$patientId" params={{ patientId: result.patient_id }}>
                <GitCompareArrows className="h-4 w-4" aria-hidden />
                Full comparison
              </Link>
            </Button>
          }
        >
          {!comparison ? (
            <EmptyState
              title="No comparison data"
              message="Comparison data is currently unavailable."
            />
          ) : !comparison.has_previous ? (
            <EmptyState
              title="No previous examination available"
              message="This is the patient's first recorded examination. Future examinations can be compared against this result."
            />
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    heading: "Previous",
                    diagnosis: comparison.previous_diagnosis,
                    confidence: comparison.previous_confidence,
                  },
                  {
                    heading: "Current",
                    diagnosis: comparison.current_diagnosis ?? result.diagnosis,
                    confidence: comparison.current_confidence ?? result.confidence,
                  },
                ].map((col) => (
                  <div key={col.heading} className="rounded-lg border border-border p-4">
                    <span className="label-xs">{col.heading}</span>
                    <p className="mt-1 text-sm font-medium break-words">{col.diagnosis ?? "—"}</p>
                    <div className="mt-3">
                      <ConfidenceMeter confidence={col.confidence} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <ChangeBadge changed={comparison.change_detected} />
                {comparison.details ? (
                  <p className="min-w-0 text-sm text-muted-foreground">{comparison.details}</p>
                ) : null}
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function NewExamination() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const search = Route.useSearch();
  const patients = useQuery(queries.patients());

  const [patientId, setPatientId] = useState<string>(search.patientId ?? "");
  const [location, setLocation] = useState<string>("Mitral");
  const [notes, setNotes] = useState("");
  const [audioSource, setAudioSource] = useState<"record" | "upload" | "benchmark">("record");
  const [recording, setRecording] = useState<{
    audioReference: string;
    durationSeconds: number;
    objectUrl?: string;
  } | null>(null);
  const [step, setStep] = useState(search.patientId ? 1 : 0);

  const patient = (patients.data ?? []).find((p) => p.id === patientId);

  const analysis = useMutation({
    mutationFn: () =>
      api.analyze({
        patient_id: patientId,
        audio_reference: recording?.audioReference ?? "",
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["history", data.examination.patient_id] });
      queryClient.invalidateQueries({ queryKey: ["comparison", data.examination.patient_id] });
      setStep(4);
    },
  });

  return (
    <AppShell title="New Cardiac Examination">
      <PageHeader
        title="New Cardiac Examination"
        subtitle="Record an auscultation, review the signal and run AI-assisted analysis."
        actions={
          <Button variant="outline" asChild>
            <Link to="/patients">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Patients
            </Link>
          </Button>
        }
      />

      <div className="mb-6">
        <Stepper current={step} />
      </div>

      {patient ? (
        <div className="mb-6 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
            {initials(patient.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{patient.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {patient.id} · {patient.age} yrs · {patient.gender ?? "Unspecified"}
            </p>
          </div>
        </div>
      ) : null}

      {step === 0 ? (
        <SectionCard
          title="01 · Select patient"
          description="Examinations are always attached to a patient record"
        >
          {patients.isPending ? (
            <SkeletonRows rows={3} />
          ) : patients.isError ? (
            <ErrorState offline onRetry={() => patients.refetch()} />
          ) : (patients.data ?? []).length === 0 ? (
            <EmptyState
              title="No patients yet"
              message="Create a patient record before starting an examination."
              actionLabel="Create First Patient"
              onAction={() => navigate({ to: "/patients/new" })}
            />
          ) : (
            <div className="grid max-w-md gap-3">
              <Label htmlFor="patient">Patient</Label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger id="patient">
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
              <Button
                className="mt-2 justify-self-start"
                disabled={!patientId}
                onClick={() => setStep(1)}
              >
                Continue
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          )}
        </SectionCard>
      ) : null}

      {step === 1 ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <SectionCard title="Auscultation Location">
            <fieldset>
              <legend className="sr-only">Auscultation location</legend>
              <div className="grid gap-2">
                {LOCATIONS.map((loc) => (
                  <label
                    key={loc}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors",
                      location === loc
                        ? "border-secondary bg-secondary/10 font-medium"
                        : "border-border hover:bg-accent",
                    )}
                  >
                    <input
                      type="radio"
                      name="location"
                      value={loc}
                      checked={location === loc}
                      onChange={() => setLocation(loc)}
                      className="h-4 w-4 accent-[var(--secondary)]"
                    />
                    <span className="truncate">{loc}</span>
                    {location === loc ? (
                      <Check className="ml-auto h-4 w-4 shrink-0 text-secondary" aria-hidden />
                    ) : null}
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="mt-4 text-xs text-muted-foreground">
              Recorded as examination metadata in the audio reference.
            </p>
          </SectionCard>

          <SectionCard
            title="02 · Cardiac Auscultation Audio"
            description="Provide original auscultation audio for ML analysis"
          >
            <div className="mb-5 flex flex-wrap gap-2 border-b border-border pb-3">
              <Button
                type="button"
                variant={audioSource === "record" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setAudioSource("record")}
              >
                <Mic className="h-4 w-4" aria-hidden />
                Record Audio
              </Button>
              <Button
                type="button"
                variant={audioSource === "upload" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setAudioSource("upload")}
              >
                <UploadCloud className="h-4 w-4" aria-hidden />
                Upload WAV
              </Button>
              <Button
                type="button"
                variant={audioSource === "benchmark" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setAudioSource("benchmark")}
              >
                <FileAudio className="h-4 w-4" aria-hidden />
                Use Benchmark ({BENCHMARK_AUDIO_REFERENCE})
              </Button>
            </div>

            {audioSource === "record" ? (
              <AudioRecorder
                location={location}
                onComplete={(result) => {
                  setRecording(result);
                  setStep(2);
                }}
              />
            ) : audioSource === "upload" ? (
              <AudioUploader
                onComplete={(result) => {
                  setRecording(result);
                  setStep(2);
                }}
              />
            ) : (
              <div className="rounded-xl border border-border bg-card p-6 text-center">
                <FileAudio className="mx-auto h-10 w-10 text-secondary" />
                <h4 className="mt-3 text-sm font-semibold">Benchmark Auscultation File</h4>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {BENCHMARK_AUDIO_REFERENCE}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Verified sample file residing in backend storage for validating real ML pipeline
                  inference.
                </p>
                <Button
                  className="mt-4"
                  size="sm"
                  onClick={() => {
                    setRecording({
                      audioReference: BENCHMARK_AUDIO_REFERENCE,
                      durationSeconds: 15,
                    });
                    setStep(2);
                  }}
                >
                  Select {BENCHMARK_AUDIO_REFERENCE} & Continue
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            )}
          </SectionCard>
        </div>
      ) : null}

      {step === 2 && recording ? (
        <div className="grid gap-6">
          <SectionCard title="Audio Recording" description={`${location} auscultation`}>
            <AudioReviewCard
              audioReference={recording.audioReference}
              durationSeconds={recording.durationSeconds}
              {...(recording.objectUrl ? { objectUrl: recording.objectUrl } : {})}
              onRetake={() => {
                setRecording(null);
                setStep(1);
              }}
            />
            <div className="mt-4 border-t border-border pt-4">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="audio-reference" className="text-xs font-medium text-foreground">
                  Backend Audio Reference (Original WAV)
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-secondary hover:text-secondary"
                  onClick={() =>
                    setRecording({
                      ...recording,
                      audioReference: BENCHMARK_AUDIO_REFERENCE,
                    })
                  }
                >
                  Use Benchmark: {BENCHMARK_AUDIO_REFERENCE}
                </Button>
              </div>
              <Input
                id="audio-reference"
                value={recording.audioReference}
                onChange={(e) => setRecording({ ...recording, audioReference: e.target.value })}
                className="mt-1.5 font-mono text-sm"
                placeholder="e.g. cardiac_mitral.wav or a0001.wav"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Original, unprocessed audio reference submitted to the backend ML pipeline.
                Persistent browser-audio upload is the pending backend integration task for live
                recordings.
              </p>
            </div>
          </SectionCard>

          <SectionCard title="Clinical Notes">
            <Label htmlFor="notes" className="sr-only">
              Clinical notes
            </Label>
            <Textarea
              id="notes"
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add observations or clinical notes..."
            />
            <div className="mt-4 flex flex-wrap justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setRecording(null);
                  setStep(1);
                }}
              >
                Retake
              </Button>
              <Button
                onClick={() => {
                  setStep(3);
                  analysis.mutate();
                }}
              >
                <FileAudio className="h-4 w-4" aria-hidden />
                Analyze Examination
              </Button>
            </div>
          </SectionCard>
        </div>
      ) : null}

      {step === 3 ? (
        analysis.isError ? (
          <ErrorState
            onRetry={() => {
              analysis.reset();
              analysis.mutate();
            }}
          />
        ) : (
          <ProcessingScreen />
        )
      ) : null}

      {step === 4 && analysis.data ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <StatusBadge tone="success" icon={<Check className="h-3.5 w-3.5" aria-hidden />}>
              Analysis complete
            </StatusBadge>
            <span className="text-xs text-muted-foreground">Examination Results</span>
          </div>
          <ResultsView
            result={analysis.data.examination}
            comparison={analysis.data.comparison}
            {...(patient?.name ? { patientName: patient.name } : {})}
          />
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button variant="outline" asChild>
              <Link to="/history" search={{ patientId }}>
                View History
              </Link>
            </Button>
            <Button asChild>
              <Link to="/patients/$patientId" params={{ patientId }}>
                Back to patient
              </Link>
            </Button>
          </div>
        </>
      ) : null}
    </AppShell>
  );
}
