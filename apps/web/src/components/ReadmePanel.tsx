"use client";

import { useState } from "react";
import type { GenerateReadmeResponse } from "@forge/types";
import { forgeApi } from "@/lib/api";

export function ReadmePanel({ projectId }: { projectId: string }) {
  const [result, setResult] = useState<GenerateReadmeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      setResult(await forgeApi.generateReadme(projectId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate README");
    } finally {
      setLoading(false);
    }
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="text-muted max-w-md">
          Generates a README from the latest snapshot — badges, folder tree, dependencies, and health
          scores are templated directly from it; only the description and feature prose go through an
          LLM call.
        </p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate README"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">
          {result.templatedSections.length} templated · {result.narrativeSections.length} AI-narrated
        </span>
        <button onClick={handleGenerate} disabled={loading} className="text-xs text-accent hover:underline disabled:opacity-50">
          {loading ? "Regenerating…" : "Regenerate"}
        </button>
      </div>
      <pre className="rounded-lg border border-border bg-surface p-6 whitespace-pre-wrap text-sm font-mono overflow-x-auto">
        {result.markdown}
      </pre>
    </div>
  );
}
