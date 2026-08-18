import { useState, useMemo, type FormEvent } from "react";
import { Search, Users, AlertCircle, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Patient } from "@/lib/echoassist/types";

export interface PatientSearchProps {
  patients: Patient[];
  selectedPatientId?: string;
  onSelectPatient: (patientId: string) => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function PatientSearch({
  patients,
  selectedPatientId,
  onSelectPatient,
  isLoading,
  isError,
  onRetry,
}: PatientSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPatients = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q),
    );
  }, [patients, searchTerm]);

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    if (filteredPatients.length > 0 && filteredPatients[0]) {
      onSelectPatient(filteredPatients[0].id);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Select Patient for Analysis</h2>
          <p className="text-xs text-muted-foreground">
            Search by Patient ID or Name to review longitudinal cardiac trends.
          </p>
        </div>

        {isError ? (
          <div className="flex items-center gap-2 text-xs font-medium text-destructive">
            <AlertCircle className="h-4 w-4" aria-hidden />
            <span>Backend offline or unable to load patients.</span>
            {onRetry ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="h-7 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Retry
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSearchSubmit} className="mt-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Patient Name or ID (e.g. PAT-1001 or John Doe)..."
            className="pl-9 pr-8"
            aria-label="Search patients"
          />
          {searchTerm ? (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <Button type="submit" disabled={isLoading || filteredPatients.length === 0}>
          <Search className="h-4 w-4 mr-1.5" />
          Search
        </Button>
      </form>

      {isLoading ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          {searchTerm ? (
            <p>No patients match &quot;{searchTerm}&quot;. Check the ID or name and try again.</p>
          ) : (
            <p>No patient records found in the database.</p>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Available Patients ({filteredPatients.length})
          </p>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-h-48 overflow-y-auto pr-1">
            {filteredPatients.map((p) => {
              const isSelected = p.id === selectedPatientId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectPatient(p.id)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    isSelected
                      ? "border-secondary bg-secondary/10 font-medium text-foreground shadow-sm"
                      : "border-border bg-card hover:border-secondary/40 hover:bg-accent/40 text-muted-foreground"
                  }`}
                >
                  <div
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                      isSelected
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{p.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {p.id} · {p.age} yrs · {p.gender ?? "Unspecified"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
