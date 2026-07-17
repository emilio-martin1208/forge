import type { RepositorySnapshot } from "@forge/types";

/** Builds a minimal-but-complete RepositorySnapshot for tests, with overrides. */
export function buildTestSnapshot(overrides: Partial<RepositorySnapshot> = {}): RepositorySnapshot {
  return {
    id: "snapshot-1",
    projectId: "project-1",
    commitSha: "abc1234",
    createdAt: new Date().toISOString(),
    defaultBranch: "main",
    fileTree: { totalFiles: 10, totalDirectories: 3, ignoredFileCount: 0, topLevelEntries: ["src", "package.json"] },
    languages: [{ name: "TypeScript", fileCount: 8, lineCount: 400, percentage: 100 }],
    frameworks: [],
    dependencies: [],
    routes: [],
    envVars: [],
    docker: { hasDockerfile: false, hasDockerCompose: false, baseImages: [] },
    ci: [],
    testing: { frameworks: [], testFileCount: 0, hasCoverageConfig: false },
    features: [],
    healthScores: {
      documentation: 80,
      architecture: 80,
      testing: 80,
      security: 80,
      maintainability: 80,
      deploymentReadiness: 80,
    },
    referenceFiles: [],
    ...overrides,
  };
}
