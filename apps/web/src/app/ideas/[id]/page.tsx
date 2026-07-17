import { forgeApi } from "@/lib/api";

export default async function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let idea;
  try {
    idea = await forgeApi.getIdea(id);
  } catch {
    return (
      <main className="flex-1 flex items-center justify-center px-6 text-center">
        <p className="text-muted max-w-md">Could not load this idea. It may not exist.</p>
      </main>
    );
  }

  return (
    <main className="flex-1 px-6 py-12 max-w-3xl mx-auto w-full flex flex-col gap-10">
      <header>
        <span className="text-xs uppercase tracking-wide text-muted">Project idea</span>
        <p className="text-muted mt-2 italic">&ldquo;{idea.description}&rdquo;</p>
      </header>

      <section>
        <h2 className="text-lg font-medium mb-3">PRD summary</h2>
        <p className="text-foreground/90 leading-relaxed">{idea.prdSummary}</p>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Core features</h2>
        <ul className="list-disc list-inside space-y-1 text-foreground/90">
          {idea.coreFeatures.map((feature, i) => (
            <li key={i}>{feature}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-4">Architecture options</h2>
        <div className="flex flex-col gap-4">
          {idea.architectureOptions.map((option, i) => (
            <div
              key={option.name}
              className={`rounded-lg border p-5 ${
                i === idea.recommendedIndex ? "border-accent bg-accent/10" : "border-border bg-surface"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{option.name}</h3>
                {i === idea.recommendedIndex && (
                  <span className="text-xs uppercase tracking-wide text-accent">Recommended</span>
                )}
              </div>
              <p className="text-sm text-muted mb-3">{option.stackSummary}</p>
              <p className="text-sm text-foreground/90 mb-3">{option.description}</p>
              <ul className="list-disc list-inside text-sm text-muted space-y-1 mb-3">
                {option.tradeoffs.map((tradeoff, j) => (
                  <li key={j}>{tradeoff}</li>
                ))}
              </ul>
              <p className="text-sm text-foreground/70">
                <span className="text-muted">When to choose this: </span>
                {option.whenToChoose}
              </p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted mt-4">{idea.recommendationRationale}</p>
      </section>
    </main>
  );
}
