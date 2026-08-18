import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/echoassist/AppShell";
import { PageHeader, SectionCard } from "@/components/echoassist/primitives";
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
import { api } from "@/lib/echoassist/api";
import type { PatientCreate } from "@/lib/echoassist/types";

export const Route = createFileRoute("/patients/new")({
  head: () => ({
    meta: [
      { title: "Create New Patient — EchoAssist" },
      {
        name: "description",
        content: "Add a new patient record to the EchoAssist clinical workspace.",
      },
      { property: "og:title", content: "Create New Patient — EchoAssist" },
      {
        property: "og:description",
        content: "Add a new patient record to EchoAssist.",
      },
    ],
  }),
  component: CreatePatient,
});

type Errors = Partial<Record<"name" | "age", string>>;

function CreatePatient() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<Errors>({});
  const [gender, setGender] = useState("");

  const mutation = useMutation({
    mutationFn: (input: PatientCreate) => api.createPatient(input),
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Patient created");
      navigate({ to: "/patients/$patientId", params: { patientId: patient.id } });
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(message);
    },
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const ageRaw = String(form.get("age") ?? "").trim();
    const age = Number(ageRaw);
    const next: Errors = {};

    if (!name) next.name = "Name is required.";
    if (!ageRaw || Number.isNaN(age) || age < 0 || age > 150)
      next.age = "Age must be between 0 and 150.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const id = String(form.get("id") ?? "").trim();
    const medicalHistory = String(form.get("medical_history") ?? "").trim();

    mutation.mutate({
      name,
      age,
      ...(gender ? { gender } : {}),
      ...(id ? { id } : {}),
      ...(medicalHistory ? { medical_history: medicalHistory } : {}),
    });
  }

  return (
    <AppShell title="Create New Patient">
      <PageHeader
        title="Create New Patient"
        subtitle="Patient records are used to attach and compare examinations."
      />

      <form onSubmit={onSubmit} noValidate className="max-w-2xl">
        <SectionCard title="Patient details">
          <div className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Anna Meyer"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "name-error" : undefined}
                required
              />
              {errors.name ? (
                <p id="name-error" className="text-xs font-medium text-destructive">
                  {errors.name}
                </p>
              ) : null}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  min={0}
                  max={150}
                  inputMode="numeric"
                  placeholder="e.g. 54"
                  aria-invalid={Boolean(errors.age)}
                  aria-describedby={errors.age ? "age-error" : undefined}
                  required
                />
                {errors.age ? (
                  <p id="age-error" className="text-xs font-medium text-destructive">
                    {errors.age}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="gender">
                  Gender{" "}
                  <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="id">
                Patient ID{" "}
                <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input id="id" name="id" placeholder="Leave blank to auto-generate (e.g. PAT-1001)" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="medical_history">
                Medical History{" "}
                <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="medical_history"
                name="medical_history"
                rows={5}
                placeholder="Relevant cardiac history, prior procedures, medication..."
              />
            </div>
          </div>
        </SectionCard>

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/patients" })}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating..." : "Create Patient"}
          </Button>
        </div>

        {mutation.isError ? (
          <p className="mt-3 text-right text-xs font-medium text-destructive">
            The patient could not be created. Please check the connection and try again.
          </p>
        ) : null}
      </form>
    </AppShell>
  );
}
