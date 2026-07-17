"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { forgeApi } from "@/lib/api";

export default function ConnectPage() {
  const router = useRouter();
  const [installationId, setInstallationId] = useState("");
  const [githubOwner, setGithubOwner] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const project = await forgeApi.connectRepository({ installationId, githubOwner, githubRepo });
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect repository");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8">
        <h1 className="text-xl font-semibold mb-1">Connect a repository</h1>
        <p className="text-sm text-muted mb-6">
          Requires a Forge GitHub App installation. Until the install callback is wired up (see
          docs/architecture.md), paste the installation ID manually.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Installation ID" value={installationId} onChange={setInstallationId} placeholder="12345678" />
          <Field label="GitHub owner" value={githubOwner} onChange={setGithubOwner} placeholder="octocat" />
          <Field label="Repository name" value={githubRepo} onChange={setGithubRepo} placeholder="hello-world" />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition disabled:opacity-50"
          >
            {submitting ? "Connecting…" : "Connect"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field(props: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-muted">{props.label}</span>
      <input
        required
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        className="rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
      />
    </label>
  );
}
