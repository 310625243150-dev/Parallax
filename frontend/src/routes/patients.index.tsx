import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, UserPlus, Users } from "lucide-react";

import { AppShell } from "@/components/echoassist/AppShell";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  SectionCard,
  SkeletonRows,
  StatusBadge,
} from "@/components/echoassist/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queries } from "@/lib/echoassist/api";
import { formatDate, initials } from "@/lib/echoassist/format";
import type { Examination } from "@/lib/echoassist/types";

export const Route = createFileRoute("/patients/")({
  head: () => ({
    meta: [
      { title: "Patients — EchoAssist" },
      {
        name: "description",
        content: "Manage patient records and cardiac examination history in EchoAssist.",
      },
      { property: "og:title", content: "Patients — EchoAssist" },
      {
        property: "og:description",
        content: "Manage patient records and cardiac examination history.",
      },
    ],
  }),
  component: PatientsPage,
});

function PatientsPage() {
  const navigate = useNavigate();
  const patients = useQuery(queries.patients());
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("all");

  const list = useMemo(() => patients.data ?? [], [patients.data]);
  const histories = useQueries({
    queries: list.map((p) => queries.history(p.id)),
  });

  const latest = useMemo(() => {
    const map = new Map<string, Examination | undefined>();
    list.forEach((p, i) => {
      const items = [...(histories[i]?.data ?? [])].sort((a, b) =>
        a.timestamp < b.timestamp ? 1 : -1,
      );
      map.set(p.id, items[0]);
    });
    return map;
  }, [list, histories]);

  const filtered = list.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
    const matchesGender = gender === "all" || (p.gender ?? "").toLowerCase() === gender;
    return matchesQuery && matchesGender;
  });

  return (
    <AppShell title="Patients">
      <PageHeader
        title="Patients"
        subtitle="Manage patient records and examination history."
        actions={
          <Button asChild>
            <Link to="/patients/new">
              <UserPlus className="h-4 w-4" aria-hidden />
              New Patient
            </Link>
          </Button>
        }
      />

      <SectionCard>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative min-w-0">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patients by name or ID"
              aria-label="Search patients"
              className="pl-9"
            />
          </div>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger className="sm:w-48" aria-label="Filter by gender">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All genders</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-5">
          {patients.isPending ? (
            <SkeletonRows rows={6} />
          ) : patients.isError ? (
            <ErrorState offline onRetry={() => patients.refetch()} />
          ) : list.length === 0 ? (
            <EmptyState
              icon={<Users className="h-5 w-5" aria-hidden />}
              title="No patients yet"
              message="Patient records you create will appear here."
              actionLabel="Create First Patient"
              onAction={() => navigate({ to: "/patients/new" })}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No matching patients"
              message="Adjust your search or filter to see more results."
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <caption className="sr-only">Patient records</caption>
                  <thead>
                    <tr className="border-b border-border text-left">
                      {["Patient", "ID", "Age", "Gender", "Last Examination", "Status", ""].map(
                        (h) => (
                          <th key={h} scope="col" className="label-xs px-3 py-2">
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => {
                      const exam = latest.get(p.id);
                      return (
                        <tr key={p.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                                {initials(p.name)}
                              </span>
                              <span className="truncate font-medium">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">{p.id}</td>
                          <td className="px-3 py-3 tabular-nums">{p.age}</td>
                          <td className="px-3 py-3">{p.gender ?? "Unspecified"}</td>
                          <td className="px-3 py-3 text-muted-foreground">
                            {formatDate(exam?.timestamp)}
                          </td>
                          <td className="px-3 py-3">
                            {exam ? (
                              <StatusBadge tone="info">{exam.diagnosis}</StatusBadge>
                            ) : (
                              <StatusBadge>No examination</StatusBadge>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <Button variant="outline" size="sm" asChild>
                              <Link to="/patients/$patientId" params={{ patientId: p.id }}>
                                Open
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="space-y-3 md:hidden">
                {filtered.map((p) => {
                  const exam = latest.get(p.id);
                  return (
                    <li key={p.id} className="rounded-lg border border-border p-4">
                      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                          {initials(p.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{p.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {p.id} · {p.age} yrs · {p.gender ?? "Unspecified"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {exam ? (
                          <StatusBadge tone="info">{exam.diagnosis}</StatusBadge>
                        ) : (
                          <StatusBadge>No examination</StatusBadge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(exam?.timestamp)}
                        </span>
                      </div>
                      <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                        <Link to="/patients/$patientId" params={{ patientId: p.id }}>
                          Open
                        </Link>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </SectionCard>
    </AppShell>
  );
}
