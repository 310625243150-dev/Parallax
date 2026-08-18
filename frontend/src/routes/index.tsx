import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Stethoscope, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EcgTrace } from "@/components/echoassist/Waveform";
import { BackendIndicator } from "@/components/echoassist/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EchoAssist — AI-assisted cardiac auscultation" },
      {
        name: "description",
        content:
          "Record, analyze and compare cardiac auscultation examinations from one clinical workspace.",
      },
      { property: "og:title", content: "EchoAssist — AI-assisted cardiac auscultation" },
      {
        property: "og:description",
        content:
          "Clinical workspace for recording, analyzing and comparing cardiac auscultation examinations.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-[1200px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary">
              <Stethoscope className="h-5 w-5 text-primary-foreground" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold tracking-tight">EchoAssist</p>
              <p className="truncate text-xs text-muted-foreground">
                AI-assisted cardiac auscultation
              </p>
            </div>
          </div>
          <BackendIndicator />
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <span className="label-xs">Clinical workspace</span>
            <h1 className="mt-3 text-4xl leading-tight font-semibold tracking-tight text-foreground sm:text-5xl">
              Understand cardiac sounds with AI assistance.
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground">
              Record, analyze and compare cardiac auscultation examinations from one clinical
              workspace.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/examinations/new" search={{ patientId: undefined }}>
                  Start Examination
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/patients">
                  <Users className="h-4 w-4" aria-hidden />
                  View Patients
                </Link>
              </Button>
            </div>

            <p className="mt-8 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              EchoAssist provides AI-assisted analysis and is not a substitute for professional
              medical diagnosis.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <p className="truncate text-sm font-semibold">Auscultation signal</p>
              <span className="shrink-0 text-xs text-muted-foreground">Illustrative trace</span>
            </div>
            <div className="mt-4 rounded-xl bg-primary/[0.04] p-4 text-secondary">
              <EcgTrace />
            </div>
            <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-5">
              {[
                ["Locations", "Aortic · Mitral"],
                ["Analysis", "AI-assisted"],
                ["Comparison", "Vs. history"],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="label-xs truncate">{label}</dt>
                  <dd className="mt-1 truncate text-sm font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Patient records",
              body: "Create patients and keep every examination attached to the right record.",
            },
            {
              title: "AI-assisted analysis",
              body: "Submit an audio reference and review diagnosis, confidence and signal quality.",
            },
            {
              title: "Longitudinal comparison",
              body: "See how the current examination relates to the previous recorded one.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-border bg-card p-5 shadow-card"
            >
              <h2 className="text-sm font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
