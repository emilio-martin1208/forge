export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
      <span className="text-sm uppercase tracking-widest text-muted">Forge, by Shinobi Tools — The AI Software Architect</span>
      <h1 className="text-5xl sm:text-6xl font-bold max-w-2xl">
        Don&apos;t generate projects. Generate great engineers.
      </h1>
      <p className="max-w-xl text-muted">
        Connect a GitHub repository and Forge builds a deterministic understanding of it —
        languages, frameworks, routes, features, and health — then generates documentation
        grounded in what&apos;s actually there.
      </p>
      <div className="flex gap-3">
        <a
          href="/connect"
          className="gradient-accent px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition"
        >
          Connect a repository
        </a>
        <a
          href="/create"
          className="gradient-surface gradient-surface-hover px-5 py-2.5 text-sm font-medium transition"
        >
          Start from an idea
        </a>
      </div>
    </main>
  );
}
