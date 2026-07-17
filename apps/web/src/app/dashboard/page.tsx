import Link from "next/link";
import { forgeApi } from "@/lib/api";

export default async function DashboardPage() {
  const [projects, ideas] = await Promise.all([
    forgeApi.listProjects().catch(() => []),
    forgeApi.listIdeas().catch(() => []),
  ]);

  return (
    <main className="flex-1 px-6 py-12 max-w-5xl mx-auto w-full flex flex-col gap-12">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex gap-3">
          <Link href="/create" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition">
            New idea
          </Link>
          <Link href="/connect" className="rounded-md border border-border px-4 py-2 text-sm hover:bg-surface transition">
            Connect repo
          </Link>
        </div>
      </header>

      <section>
        <h2 className="text-lg font-medium mb-4">Connected repositories</h2>
        {projects.length === 0 ? (
          <EmptyState message="No repositories connected yet." ctaHref="/connect" ctaLabel="Connect a repository" />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="rounded-lg border border-border bg-surface p-4 hover:border-accent transition"
              >
                <p className="font-medium">
                  {project.githubOwner}/{project.githubRepo}
                </p>
                <p className="text-sm text-muted mt-1">
                  {project.latestSnapshotId ? "Analyzed" : "Analysis pending…"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium mb-4">Project ideas</h2>
        {ideas.length === 0 ? (
          <EmptyState message="No ideas yet." ctaHref="/create" ctaLabel="Describe a new idea" />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {ideas.map((idea) => (
              <Link
                key={idea.id}
                href={`/ideas/${idea.id}`}
                className="rounded-lg border border-border bg-surface p-4 hover:border-accent transition"
              >
                <p className="font-medium line-clamp-1">{idea.description}</p>
                <p className="text-sm text-muted mt-1">
                  {idea.architectureOptions.length} architecture option{idea.architectureOptions.length === 1 ? "" : "s"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function EmptyState({ message, ctaHref, ctaLabel }: { message: string; ctaHref: string; ctaLabel: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-8 text-center">
      <p className="text-muted mb-3">{message}</p>
      <Link href={ctaHref} className="text-sm text-accent hover:underline">
        {ctaLabel} →
      </Link>
    </div>
  );
}
