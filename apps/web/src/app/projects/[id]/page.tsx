import Link from "next/link";
import { forgeApi } from "@/lib/api";

export default async function ProjectDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let dashboard;
  try {
    dashboard = await forgeApi.getHealthDashboard(id);
  } catch {
    return (
      <main className="flex-1 flex items-center justify-center px-6 text-center">
        <p className="text-muted max-w-md">
          No snapshot yet for this project. Analysis runs asynchronously right after connect —
          refresh in a few seconds.
        </p>
      </main>
    );
  }

  const { snapshot, overallScore } = dashboard;

  return (
    <main className="flex-1 px-6 py-12 max-w-4xl mx-auto w-full flex flex-col gap-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Project Health</h1>
          <p className="text-sm text-muted">commit {snapshot.commitSha.slice(0, 7)}</p>
        </div>
        <Link
          href={`/projects/${id}/readme`}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-surface transition"
        >
          Generate README
        </Link>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <ScoreCard label="Overall" value={overallScore} highlight />
        {Object.entries(snapshot.healthScores).map(([key, value]) => (
          <ScoreCard key={key} label={key.replace(/([A-Z])/g, " $1").trim()} value={value} />
        ))}
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Languages</h2>
        <div className="flex flex-wrap gap-2">
          {snapshot.languages.map((l) => (
            <span key={l.name} className="rounded-full border border-border px-3 py-1 text-sm text-muted">
              {l.name} · {l.percentage}%
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Frameworks detected</h2>
        <div className="flex flex-wrap gap-2">
          {snapshot.frameworks.map((f) => (
            <span key={f.name} className="rounded-full bg-surface border border-border px-3 py-1 text-sm">
              {f.name}
              {f.version ? <span className="text-muted"> · {f.version}</span> : null}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Feature matrix</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {snapshot.features.map((f) => (
            <div
              key={f.kind}
              className={`rounded-md border px-3 py-2 text-sm flex items-center justify-between ${
                f.detected ? "border-accent/50 bg-accent/10" : "border-border text-muted"
              }`}
            >
              <span className="capitalize">{f.kind.replace("-", " ")}</span>
              <span>{f.detected ? "✓" : "—"}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function ScoreCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-4 flex flex-col gap-1 ${
        highlight ? "border-accent bg-accent/10" : "border-border bg-surface"
      }`}
    >
      <span className="text-xs uppercase tracking-wide text-muted capitalize">{label}</span>
      <span className="text-2xl font-semibold">{value}</span>
    </div>
  );
}
