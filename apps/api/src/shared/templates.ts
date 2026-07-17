import type { RepositorySnapshot } from "@forge/types";

// Everything in this file is pure string templating over Snapshot data —
// zero LLM calls. Badges, folder trees, and dependency tables are facts,
// not prose; generating them with an LLM would just add latency, cost, and
// a chance of the model getting a version number wrong.

export function renderBadges(snapshot: RepositorySnapshot, repoSlug: string): string {
  const badges: string[] = [];
  const primaryLanguage = snapshot.languages[0];
  if (primaryLanguage) {
    badges.push(
      `![Top language](https://img.shields.io/badge/language-${encodeURIComponent(primaryLanguage.name)}-blue)`,
    );
  }
  for (const framework of snapshot.frameworks.slice(0, 4)) {
    badges.push(
      `![${framework.name}](https://img.shields.io/badge/-${encodeURIComponent(framework.name)}-black)`,
    );
  }
  badges.push(`![CI](https://github.com/${repoSlug}/actions/workflows/ci.yml/badge.svg)`);
  return badges.join(" ");
}

export function renderFolderTree(snapshot: RepositorySnapshot): string {
  const entries = snapshot.fileTree.topLevelEntries.sort();
  const lines = entries.map((e) => `├── ${e}`);
  return ["```", ...lines, "```"].join("\n");
}

export function renderDependencyTable(snapshot: RepositorySnapshot): string {
  const header = "| Package | Version | Type |\n|---|---|---|";
  const rows = snapshot.dependencies
    .filter((d) => !d.isDev)
    .slice(0, 25)
    .map((d) => `| ${d.name} | ${d.version} | ${d.ecosystem} |`);
  return [header, ...rows].join("\n");
}

export function renderEnvVarsTable(snapshot: RepositorySnapshot): string {
  if (snapshot.envVars.length === 0) return "_No environment variables detected._";
  const header = "| Variable | Documented in `.env.example` |\n|---|---|";
  const rows = snapshot.envVars.map((v) => `| \`${v.name}\` | ${v.documentedInExample ? "✅" : "⚠️ missing"} |`);
  return [header, ...rows].join("\n");
}

export function renderArchitectureMermaid(snapshot: RepositorySnapshot): string {
  const frontend = snapshot.frameworks.find((f) => f.category === "frontend")?.name;
  const backend = snapshot.frameworks.find((f) => f.category === "backend")?.name;
  const orm = snapshot.frameworks.find((f) => f.category === "orm")?.name;

  const lines = ["```mermaid", "flowchart TD"];
  if (frontend) lines.push(`  A[${frontend}] --> B`);
  lines.push(`  B[API] --> C${orm ? `[${orm}]` : ""}`);
  if (backend && !frontend) lines.push(`  A2[${backend}] --> C`);
  lines.push("  C --> D[(Database)]");
  lines.push("```");
  return lines.join("\n");
}

export function renderHealthScores(snapshot: RepositorySnapshot): string {
  const header = "| Dimension | Score |\n|---|---|";
  const rows = Object.entries(snapshot.healthScores).map(([key, value]) => `| ${key} | ${value}/100 |`);
  return [header, ...rows].join("\n");
}
