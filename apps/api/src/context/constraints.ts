import type { RepositorySnapshot } from "@forge/types";

// Every bullet here traces back to a specific Snapshot field — no LLM
// involved. This is what makes it safe to hand straight to an execution
// agent (Claude Code, Cursor, Codex) as a constraint instead of a suggestion:
// it's reporting what IS in the repo, not what an LLM guessed should be.

export function deriveArchitectureConstraints(snapshot: RepositorySnapshot): string[] {
  const constraints: string[] = [];

  const orm = snapshot.frameworks.find((f) => f.category === "orm");
  if (orm) {
    constraints.push(`Database access goes through ${orm.name} — do not write raw SQL or bypass it.`);
  }

  const frontend = snapshot.frameworks.find((f) => f.category === "frontend");
  if (frontend?.name === "Next.js" && snapshot.routes.some((r) => r.framework === "Next.js (App Router)")) {
    constraints.push("Uses Next.js App Router — new routes live under `app/**/route.ts`, not `pages/api/`.");
  }

  const backend = snapshot.frameworks.find((f) => f.category === "backend" && f.name !== "Next.js");
  if (backend) {
    constraints.push(`Backend framework is ${backend.name} — follow its existing routing/middleware conventions.`);
  }

  const stateManagement = snapshot.frameworks.find((f) => f.category === "state-management");
  if (stateManagement) {
    constraints.push(`Client state uses ${stateManagement.name} — don't introduce a second state library.`);
  }

  return constraints;
}

export function deriveCodingStandards(snapshot: RepositorySnapshot): string[] {
  const standards: string[] = [];
  const depNames = new Set(snapshot.dependencies.map((d) => d.name.toLowerCase()));

  if (depNames.has("eslint")) standards.push("ESLint is configured — new code must pass `npm run lint`.");
  if (depNames.has("prettier")) standards.push("Prettier is configured — run it before finishing.");
  if (snapshot.dependencies.some((d) => d.name === "typescript")) {
    standards.push("TypeScript strict mode conventions apply — avoid `any`, prefer explicit types.");
  }
  if (snapshot.testing.frameworks.length > 0) {
    standards.push(
      `Tests use ${snapshot.testing.frameworks.join(", ")} — new logic needs a corresponding test file.`,
    );
  }

  return standards;
}

export function deriveKnownIssues(snapshot: RepositorySnapshot): string[] {
  const issues: string[] = [];

  for (const [dimension, score] of Object.entries(snapshot.healthScores)) {
    if (score < 60) {
      issues.push(`${dimension} health score is ${score}/100 — treat this as existing technical debt, not something to silently fix as a side effect.`);
    }
  }

  const undocumented = snapshot.envVars.filter((v) => !v.documentedInExample && v.referencedIn.length > 0);
  if (undocumented.length > 0) {
    issues.push(
      `Undocumented environment variables in use: ${undocumented.map((v) => v.name).join(", ")}.`,
    );
  }

  if (!snapshot.docker.hasDockerfile) issues.push("No Dockerfile detected — local setup is not containerized.");
  if (snapshot.ci.length === 0) issues.push("No CI configuration detected.");

  return issues;
}
