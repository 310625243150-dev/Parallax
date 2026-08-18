import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/echoassist/AppShell";
import { PageHeader, SectionCard } from "@/components/echoassist/primitives";
import { API_BASE_URL } from "@/lib/echoassist/api";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — EchoAssist" },
      {
        name: "description",
        content: "EchoAssist workspace settings and backend connection configuration.",
      },
      { property: "og:title", content: "Settings — EchoAssist" },
      {
        property: "og:description",
        content: "Workspace settings and backend connection configuration.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppShell title="Settings">
      <PageHeader title="Settings" subtitle="Workspace and connection configuration." />
      <SectionCard title="Backend connection">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="label-xs">API base URL</dt>
            <dd className="mt-1 truncate font-mono text-sm">{API_BASE_URL}</dd>
          </div>
          <div className="min-w-0">
            <dt className="label-xs">Configured via</dt>
            <dd className="mt-1 font-mono text-sm">VITE_API_BASE_URL</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-muted-foreground">
          EchoAssist reads patients, history, comparison and analysis results from the FastAPI
          backend at this address. Connection status is checked with GET /.
        </p>
      </SectionCard>
    </AppShell>
  );
}
