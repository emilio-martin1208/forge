import { existsSync } from "node:fs";
import { join } from "node:path";
import type {
  CiProvider,
  DockerInfo,
  EnvVarRecord,
  FrameworkDetection,
  HealthScores,
  TestingInfo,
} from "@forge/types";
import type { WalkedFile } from "../walk.js";

// These are v1 heuristic scores — presence/completeness checks, not the
// deeper static-analysis metrics (cyclomatic complexity, duplication %)
// listed in the product spec for the full Health Dashboard. Heuristics are
// deliberately transparent (each score = sum of concrete checks) so a user
// can see *why* they got a 60, rather than trusting an opaque model output.
// Swap in real static-analysis tooling per-language once this vertical
// slice validates the product loop.

function clamp(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function scoreDocumentation(files: WalkedFile[]): number {
  const readme = files.find((f) => /^readme\.md$/i.test(f.path));
  let score = 0;
  if (readme) score += 40;
  if (files.some((f) => /^license(\.md)?$/i.test(f.path))) score += 20;
  if (files.some((f) => /^contributing\.md$/i.test(f.path))) score += 20;
  if (files.some((f) => f.path.startsWith("docs/"))) score += 20;
  return clamp(score);
}

function scoreTesting(testing: TestingInfo, sourceFileCount: number): number {
  if (sourceFileCount === 0) return 0;
  const ratio = testing.testFileCount / sourceFileCount;
  let score = Math.min(ratio * 200, 70); // ~35% test-file ratio maxes this component
  if (testing.frameworks.length > 0) score += 15;
  if (testing.hasCoverageConfig) score += 15;
  return clamp(score);
}

function scoreSecurity(rootDir: string, envVars: EnvVarRecord[]): number {
  let score = 40; // baseline
  const gitignoreExists = existsSync(join(rootDir, ".gitignore"));
  if (gitignoreExists) score += 20;
  const undocumented = envVars.filter((v) => !v.documentedInExample && v.referencedIn.length > 0);
  if (envVars.length > 0 && undocumented.length === 0) score += 20;
  if (existsSync(join(rootDir, ".github", "dependabot.yml")) || existsSync(join(rootDir, "renovate.json"))) {
    score += 20;
  }
  return clamp(score);
}

function scoreMaintainability(files: WalkedFile[]): number {
  let score = 20;
  if (files.some((f) => /^\.eslintrc/.test(f.path) || f.path === "eslint.config.js" || f.path === "eslint.config.mjs")) score += 25;
  if (files.some((f) => /^\.prettierrc/.test(f.path))) score += 15;
  if (files.some((f) => f.path === "tsconfig.json")) score += 20;
  if (files.some((f) => f.path === "ruff.toml" || f.path === ".flake8" || f.path === "pyproject.toml")) score += 20;
  return clamp(score);
}

function scoreArchitecture(files: WalkedFile[]): number {
  let score = 30;
  if (files.some((f) => f.path.startsWith("src/"))) score += 25;
  if (files.some((f) => f.path.startsWith("tests/") || f.path.includes("__tests__/"))) score += 15;
  if (files.some((f) => /^package\.json$/.test(f.path))) score += 15;
  if (files.some((f) => f.path === "packages" || f.path.startsWith("packages/"))) score += 15;
  return clamp(score);
}

function scoreDeploymentReadiness(docker: DockerInfo, ci: CiProvider[], envVars: EnvVarRecord[]): number {
  let score = 10;
  if (docker.hasDockerfile) score += 30;
  if (ci.length > 0) score += 30;
  if (envVars.some((v) => v.documentedInExample)) score += 30;
  return clamp(score);
}

export function computeHealthScores(input: {
  rootDir: string;
  files: WalkedFile[];
  testing: TestingInfo;
  docker: DockerInfo;
  ci: CiProvider[];
  envVars: EnvVarRecord[];
  frameworks: FrameworkDetection[];
}): HealthScores {
  const sourceFileCount = input.files.filter((f) =>
    /\.(ts|tsx|js|jsx|py|go|rb|rs|java)$/.test(f.path),
  ).length;

  return {
    documentation: scoreDocumentation(input.files),
    architecture: scoreArchitecture(input.files),
    testing: scoreTesting(input.testing, sourceFileCount),
    security: scoreSecurity(input.rootDir, input.envVars),
    maintainability: scoreMaintainability(input.files),
    deploymentReadiness: scoreDeploymentReadiness(input.docker, input.ci, input.envVars),
  };
}
