import type { RoadmapItem } from "@forge/types";

export function RoadmapPanel({ items }: { items: RoadmapItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-muted max-w-md">
        No roadmap items yet — these sync from GitHub issues on the connected repo. Nothing's been
        synced (or nothing's open) yet.
      </p>
    );
  }

  const open = items.filter((i) => i.status === "open");
  const done = items.filter((i) => i.status === "done");

  return (
    <div className="flex flex-col gap-8">
      <RoadmapSection title="Open" items={open} />
      {done.length > 0 && <RoadmapSection title="Done" items={done} />}
    </div>
  );
}

function RoadmapSection({ title, items }: { title: string; items: RoadmapItem[] }) {
  return (
    <section>
      <h3 className="text-sm font-medium mb-3">
        {title} <span className="text-muted">({items.length})</span>
      </h3>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-md border px-3 py-2 text-sm flex items-center justify-between ${
              item.status === "done" ? "border-border text-muted" : "border-border bg-surface"
            }`}
          >
            <span className={item.status === "done" ? "line-through" : ""}>{item.title}</span>
            {item.sourceIssueNumber && <span className="text-xs text-muted">#{item.sourceIssueNumber}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}
