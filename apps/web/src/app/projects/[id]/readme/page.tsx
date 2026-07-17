"use client";

import { use, useEffect, useState } from "react";
import { forgeApi } from "@/lib/api";
import type { GenerateReadmeResponse } from "@forge/types";

export default function ReadmePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [result, setResult] = useState<GenerateReadmeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    forgeApi
      .generateReadme(id)
      .then(setResult)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to generate README"));
  }, [id]);

  if (error) {
    return (
      <main className="flex-1 flex items-center justify-center px-6 text-center">
        <p className="text-muted max-w-md">{error}</p>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="flex-1 flex items-center justify-center px-6 text-center">
        <p className="text-muted">Generating README from the latest snapshot…</p>
      </main>
    );
  }

  return (
    <main className="flex-1 px-6 py-12 max-w-3xl mx-auto w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Generated README</h1>
        <span className="text-xs text-muted">
          {result.templatedSections.length} templated · {result.narrativeSections.length} AI-narrated
        </span>
      </div>
      <pre className="rounded-lg border border-border bg-surface p-6 whitespace-pre-wrap text-sm font-mono overflow-x-auto">
        {result.markdown}
      </pre>
    </main>
  );
}
