import type { HealthDashboardResponse } from "@forge/types";
import { RadialScore } from "./RadialScore";
import { DonutChart } from "./DonutChart";

export function OverviewPanel({ dashboard }: { dashboard: HealthDashboardResponse | null }) {
  if (!dashboard) {
    return (
      <p className="text-muted max-w-md">
        No snapshot yet for this project. Analysis runs asynchronously right after connect — refresh
        in a few seconds.
      </p>
    );
  }

  const { snapshot, overallScore } = dashboard;

  return (
    <div className="flex flex-col gap-10">
      <p className="text-sm text-muted -mt-2">commit {snapshot.commitSha.slice(0, 7)}</p>

      <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <RadialScore label="Overall" value={overallScore} highlight />
        {Object.entries(snapshot.healthScores).map(([key, value]) => (
          <RadialScore key={key} label={key.replace(/([A-Z])/g, " $1").trim()} value={value} />
        ))}
      </section>

      <section>
        <h3 className="text-sm font-medium mb-3">Languages</h3>
        <div className="gradient-surface p-6">
          <DonutChart
            data={snapshot.languages.map((l) => ({ name: l.name, percentage: l.percentage }))}
            centerLabel={`${snapshot.languages.length}`}
          />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium mb-3">Frameworks detected</h3>
        <div className="flex flex-wrap gap-2">
          {snapshot.frameworks.map((f) => (
            <span key={f.name} className="gradient-surface px-3 py-1 text-sm">
              {f.name}
              {f.version ? <span className="text-muted"> · {f.version}</span> : null}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium mb-3">Feature matrix</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {snapshot.features.map((f) => (
            <div
              key={f.kind}
              className={`px-3 py-2 text-sm flex items-center justify-between ${
                f.detected ? "gradient-active" : "gradient-surface text-muted"
              }`}
            >
              <span className="capitalize">{f.kind.replace("-", " ")}</span>
              <span>{f.detected ? "✓" : "—"}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
