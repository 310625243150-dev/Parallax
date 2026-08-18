import { Link } from "@tanstack/react-router";
import { User, Calendar, Activity, Stethoscope, GitCompareArrows } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Patient, Examination } from "@/lib/echoassist/types";
import { formatDateTime, initials } from "@/lib/echoassist/format";

export interface PatientSummaryCardProps {
  patient: Patient;
  examinations: Examination[];
}

export function PatientSummaryCard({ patient, examinations }: PatientSummaryCardProps) {
  const sorted = [...examinations].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const lastExam = sorted[0];

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-secondary/15 text-base font-semibold text-secondary">
            {initials(patient.name)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-bold tracking-tight text-foreground">
                {patient.name}
              </h2>
              <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                {patient.id}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {patient.age} years old · {patient.gender ?? "Unspecified gender"}
            </p>
            {patient.medical_history ? (
              <p className="mt-2 text-xs text-muted-foreground">
                <strong className="font-medium text-foreground">Medical History:</strong>{" "}
                {patient.medical_history}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/examinations/new" search={{ patientId: patient.id }}>
              <Stethoscope className="h-4 w-4 mr-1.5" />
              New Examination
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/comparison/$patientId" params={{ patientId: patient.id }}>
              <GitCompareArrows className="h-4 w-4 mr-1.5" />
              Direct Comparison
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
        <div className="rounded-lg bg-muted/40 p-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-secondary" />
            Total Examinations
          </span>
          <p className="mt-1.5 text-xl font-semibold text-foreground">{examinations.length}</p>
        </div>

        <div className="rounded-lg bg-muted/40 p-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-secondary" />
            Last Examination
          </span>
          <p className="mt-1.5 text-xs font-semibold text-foreground truncate">
            {lastExam ? formatDateTime(lastExam.timestamp) : "No records yet"}
          </p>
        </div>

        <div className="rounded-lg bg-muted/40 p-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-secondary" />
            Age & Gender
          </span>
          <p className="mt-1.5 text-xs font-semibold text-foreground">
            {patient.age} yrs · {patient.gender ?? "Unspecified"}
          </p>
        </div>

        <div className="rounded-lg bg-muted/40 p-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-secondary" />
            Latest Diagnosis
          </span>
          <p className="mt-1.5 text-xs font-semibold text-foreground truncate">
            {lastExam ? lastExam.diagnosis : "None"}
          </p>
        </div>
      </div>
    </div>
  );
}
