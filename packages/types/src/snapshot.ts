/**
 * RepositorySnapshot is the single artifact the Repository Intelligence Engine
 * produces. Every downstream feature (README generator, health dashboard,
 * feature matrix, and eventually code review / next-task engine) reads this
 * and only this — it never re-derives facts about the repo on its own.
 */

export type Ecosystem = "npm" | "pip" | "cargo" | "go" | "gem" | "maven" | "unknown";

export interface LanguageStat {
  name: string;
  fileCount: number;
  lineCount: number;
  /** 0-100, share of total analyzed lines */
  percentage: number;
}

export type FrameworkCategory =
  | "frontend"
  | "backend"
  | "orm"
  | "testing"
  | "css"
  | "state-management"
  | "build-tool"
  | "mobile"
  | "other";

export interface FrameworkDetection {
  name: string;
  category: FrameworkCategory;
  version: string | null;
  /** How we know: e.g. "dependency:next", "file:next.config.js" */
  evidence: string[];
}

export interface DependencyRecord {
  name: string;
  version: string;
  ecosystem: Ecosystem;
  isDev: boolean;
}

export interface RouteRecord {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "UNKNOWN";
  path: string;
  file: string;
  framework: string;
}

export interface EnvVarRecord {
  name: string;
  referencedIn: string[];
  documentedInExample: boolean;
}

export interface DockerInfo {
  hasDockerfile: boolean;
  hasDockerCompose: boolean;
  baseImages: string[];
}

export interface CiProvider {
  provider: "github-actions" | "circleci" | "gitlab-ci" | "travis" | "unknown";
  files: string[];
}

export interface TestingInfo {
  frameworks: string[];
  testFileCount: number;
  hasCoverageConfig: boolean;
}

export type FeatureKind =
  | "authentication"
  | "payments"
  | "notifications"
  | "admin-dashboard"
  | "search"
  | "chat"
  | "ai"
  | "email"
  | "analytics";

export interface FeatureDetection {
  kind: FeatureKind;
  detected: boolean;
  confidence: number; // 0-1
  evidence: string[];
}

export interface HealthScores {
  documentation: number;
  architecture: number;
  testing: number;
  security: number;
  maintainability: number;
  deploymentReadiness: number;
}

export interface FileTreeSummary {
  totalFiles: number;
  totalDirectories: number;
  ignoredFileCount: number;
  topLevelEntries: string[];
}

/**
 * Raw content of a small, explicit allowlist of high-signal files (currently
 * just `prisma/schema.prisma`). This is NOT a general "store the repo"
 * mechanism — it exists so context-package generation (database.md for
 * Claude Code / Cursor / Codex) doesn't need to re-clone a repo whose temp
 * checkout was already cleaned up after analysis. Only add a path here when
 * a real downstream consumer needs the raw bytes, not the structured facts
 * already captured elsewhere in the Snapshot.
 */
export interface ReferenceFile {
  path: string;
  content: string;
}

export interface RepositorySnapshot {
  id: string;
  projectId: string;
  commitSha: string;
  createdAt: string; // ISO 8601
  defaultBranch: string;
  fileTree: FileTreeSummary;
  languages: LanguageStat[];
  frameworks: FrameworkDetection[];
  dependencies: DependencyRecord[];
  routes: RouteRecord[];
  envVars: EnvVarRecord[];
  docker: DockerInfo;
  ci: CiProvider[];
  testing: TestingInfo;
  features: FeatureDetection[];
  healthScores: HealthScores;
  referenceFiles: ReferenceFile[];
}
