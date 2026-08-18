import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/echoassist/AppShell";
import { PageHeader, SectionCard } from "@/components/echoassist/primitives";

const STEPS = [
  {
    title: "1. Create or open a patient",
    body: "Every examination is attached to a patient record so results can be compared over time.",
  },
  {
    title: "2. Record the auscultation",
    body: "Select the auscultation location, record the cardiac sound and review the waveform before continuing.",
  },
  {
    title: "3. Analyze",
    body: "EchoAssist submits the audio reference for AI-assisted analysis and returns diagnosis, confidence and signal quality.",
  },
  {
    title: "4. Compare",
    body: "The backend compares the current examination with the previous recorded examination for that patient.",
  },
];

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help — EchoAssist" },
      {
        name: "description",
        content:
          "How to record, analyze and compare cardiac auscultation examinations in EchoAssist.",
      },
      { property: "og:title", content: "Help — EchoAssist" },
      {
        property: "og:description",
        content: "How the EchoAssist examination workflow works.",
      },
    ],
  }),
  component: HelpPage,
});

function HelpPage() {
  return (
    <AppShell title="Help">
      <PageHeader title="Help" subtitle="How the EchoAssist examination workflow works." />
      <div className="grid gap-4 sm:grid-cols-2">
        {STEPS.map((step) => (
          <SectionCard key={step.title} title={step.title}>
            <p className="text-sm text-muted-foreground">{step.body}</p>
          </SectionCard>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        EchoAssist provides AI-assisted analysis and is not a substitute for professional medical
        diagnosis.
      </p>
    </AppShell>
  );
}
