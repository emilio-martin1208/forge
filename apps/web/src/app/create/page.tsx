"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { forgeApi } from "@/lib/api";

export default function CreateIdeaPage() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const idea = await forgeApi.generateIdea({ description });
      router.push(`/ideas/${idea.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate architecture options");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
      <div className="w-full max-w-xl rounded-lg border border-border bg-surface p-8">
        <h1 className="text-xl font-semibold mb-1">Describe what you want to build</h1>
        <p className="text-sm text-muted mb-6">
          Forge will draft a PRD summary and 2-3 architecture options grounded only in what you
          describe — treat these as a starting point to validate, not a final spec.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. A tool for small teams to split expenses on shared trips, with per-person balances and settle-up suggestions."
            rows={6}
            className="rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent resize-none"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting || description.trim().length === 0}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition disabled:opacity-50"
          >
            {submitting ? "Generating…" : "Generate architecture options"}
          </button>
        </form>
      </div>
    </main>
  );
}
