import Link from "next/link";
import { forgeApi } from "@/lib/api";
import { greetingForHour } from "@/lib/greeting";
import { languageGradient } from "@/lib/languageColor";
import { ActivityCalendar } from "@/components/ActivityCalendar";
import { LanguageChart } from "@/components/LanguageChart";

export default async function DashboardPage() {
  const [projects, ideas, me, activity] = await Promise.all([
    forgeApi.listProjects().catch(() => []),
    forgeApi.listIdeas().catch(() => []),
    forgeApi.getMe().catch(() => null),
    forgeApi.getActivity().catch(() => null),
  ]);

  const greeting = greetingForHour(new Date().getHours());
  const displayName = me?.name?.trim() || "there";

  return (
    <main className="flex-1 px-6 py-12 max-w-5xl mx-auto w-full flex flex-col gap-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {greeting}, <span className="gradient-accent-text">{displayName}</span>
          </h1>
          <p className="text-muted mt-1">Here&apos;s what Forge knows about your work.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/create" className="gradient-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition">
            New idea
          </Link>
          <Link href="/connect" className="gradient-surface gradient-surface-hover px-4 py-2 text-sm transition">
            Connect repo
          </Link>
        </div>
      </header>

      {activity && (
        <>
          <section className="grid grid-cols-3 gap-4">
            <StatCard label="Current streak" value={activity.currentStreak} unit="days" highlight />
            <StatCard label="Longest streak" value={activity.longestStreak} unit="days" />
            <StatCard label="Active days" value={activity.totalActiveDays} unit="total" />
          </section>

          <section>
            <h2 className="text-lg font-medium mb-4">Activity</h2>
            <div className="gradient-surface p-6 overflow-x-auto">
              <ActivityCalendar activityByDate={activity.activityByDate} />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-4">Favorite languages</h2>
            <div className="gradient-surface p-6">
              <LanguageChart languages={activity.languageBreakdown} />
            </div>
          </section>
        </>
      )}

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
                className="gradient-surface gradient-surface-hover p-4 transition flex items-center gap-3"
              >
                <Monogram label={project.githubRepo} />
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {project.githubOwner}/{project.githubRepo}
                  </p>
                  <p className="text-sm text-muted mt-1">
                    {project.latestSnapshotId ? "Analyzed" : "Analysis pending…"}
                  </p>
                </div>
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
                className="gradient-surface gradient-surface-hover p-4 transition flex items-center gap-3"
              >
                <Monogram label={idea.description} />
                <div className="min-w-0">
                  <p className="font-medium line-clamp-1">{idea.description}</p>
                  <p className="text-sm text-muted mt-1">
                    {idea.architectureOptions.length} architecture option{idea.architectureOptions.length === 1 ? "" : "s"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value, unit, highlight }: { label: string; value: number; unit: string; highlight?: boolean }) {
  return (
    <div className={`p-5 ${highlight ? "gradient-active" : "gradient-surface"}`}>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="text-3xl font-bold mt-1">
        {value} <span className="text-sm font-normal text-muted">{unit}</span>
      </p>
    </div>
  );
}

function Monogram({ label }: { label: string }) {
  return (
    <div
      className="w-10 h-10 shrink-0 flex items-center justify-center text-sm font-bold text-white"
      style={{ backgroundImage: languageGradient(label) }}
    >
      {label.trim().charAt(0).toUpperCase()}
    </div>
  );
}

function EmptyState({ message, ctaHref, ctaLabel }: { message: string; ctaHref: string; ctaLabel: string }) {
  return (
    <div className="gradient-surface p-8 text-center">
      <p className="text-muted mb-3">{message}</p>
      <Link href={ctaHref} className="text-sm gradient-accent-text hover:underline">
        {ctaLabel} →
      </Link>
    </div>
  );
}
