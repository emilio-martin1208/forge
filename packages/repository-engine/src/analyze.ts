import { execSync } from "node:child_process";
import type { RepositorySnapshot } from "@forge/types";
import { walkRepository } from "./walk.js";
import { detectDependencies } from "./detectors/manifests.js";
import { detectFrameworks } from "./detectors/frameworks.js";
import { detectFeatures } from "./detectors/features.js";
import { detectEnvVars } from "./detectors/envVars.js";
import { detectDocker, detectCi, detectTesting } from "./detectors/infra.js";
import { detectLanguages } from "./detectors/languages.js";
import { detectRoutes } from "./detectors/routes.js";
import { computeHealthScores } from "./detectors/health.js";
import { detectReferenceFiles } from "./detectors/referenceFiles.js";

export interface AnalyzeOptions {
  rootDir: string;
  projectId: string;
  /** Defaults to `git rev-parse HEAD` in rootDir; pass explicitly in tests. */
  commitSha?: string;
  defaultBranch?: string;
}

function resolveCommitSha(rootDir: string, override?: string): string {
  if (override) return override;
  try {
    return execSync("git rev-parse HEAD", { cwd: rootDir }).toString().trim();
  } catch {
    return "unknown";
  }
}

/**
 * Runs the full deterministic analysis pipeline against a repository already
 * present on disk (cloned by the caller — see apps/worker) and produces a
 * RepositorySnapshot. No network calls, no LLM calls: every field here is
 * derived from files that exist in the repo.
 */
export function analyzeRepository(options: AnalyzeOptions): Omit<RepositorySnapshot, "id" | "createdAt"> {
  const { rootDir, projectId } = options;

  const walkResult = walkRepository(rootDir);
  const dependencies = detectDependencies(rootDir);
  const dependencyNames = new Set(dependencies.map((d) => d.name.toLowerCase()));
  const frameworks = detectFrameworks(rootDir, dependencies);
  const features = detectFeatures(dependencies);
  const envVars = detectEnvVars(walkResult.files);
  const docker = detectDocker(rootDir);
  const ci = detectCi(rootDir);
  const testing = detectTesting(walkResult.files, dependencyNames);
  const languages = detectLanguages(walkResult.files);
  const routes = detectRoutes(walkResult.files);
  const referenceFiles = detectReferenceFiles(walkResult.files);
  const healthScores = computeHealthScores({
    rootDir,
    files: walkResult.files,
    testing,
    docker,
    ci,
    envVars,
    frameworks,
  });

  return {
    projectId,
    commitSha: resolveCommitSha(rootDir, options.commitSha),
    defaultBranch: options.defaultBranch ?? "main",
    fileTree: {
      totalFiles: walkResult.files.length,
      totalDirectories: walkResult.totalDirectories,
      ignoredFileCount: walkResult.ignoredFileCount,
      topLevelEntries: walkResult.topLevelEntries,
    },
    languages,
    frameworks,
    dependencies,
    routes,
    envVars,
    docker,
    ci,
    testing,
    features,
    healthScores,
    referenceFiles,
  };
}
