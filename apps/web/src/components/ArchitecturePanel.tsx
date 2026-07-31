import type { ArchitectureView } from "@forge/types";
import { MermaidDiagram } from "./MermaidDiagram";

export function ArchitecturePanel({ architecture }: { architecture: ArchitectureView | null }) {
  if (!architecture) {
    return <p className="text-muted">No snapshot yet — analysis may still be running.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-lg border border-border bg-surface p-6">
        <MermaidDiagram source={architecture.mermaidSource} />
      </section>

      <section>
        <h3 className="text-sm font-medium mb-3">Constraints</h3>
        {architecture.constraints.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {architecture.constraints.map((c, i) => (
              <li key={i} className="text-sm text-foreground/90 rounded-md border border-border bg-surface px-3 py-2">
                {c}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Nothing distinctive detected yet.</p>
        )}
      </section>

      <section>
        <h3 className="text-sm font-medium mb-3">Frameworks</h3>
        <div className="flex flex-wrap gap-2">
          {architecture.frameworks.map((f) => (
            <span key={f.name} className="rounded-full bg-surface border border-border px-3 py-1 text-sm">
              {f.name}
              {f.version ? <span className="text-muted"> · {f.version}</span> : null}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
