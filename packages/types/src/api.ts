import type { RepositorySnapshot } from "./snapshot.js";

export interface ConnectRepositoryRequest {
  installationId: string;
  githubOwner: string;
  githubRepo: string;
}

export interface Project {
  id: string;
  ownerUserId: string;
  githubOwner: string;
  githubRepo: string;
  defaultBranch: string;
  createdAt: string;
  latestSnapshotId: string | null;
}

export interface GenerateReadmeRequest {
  projectId: string;
  snapshotId: string;
}

export interface GenerateReadmeResponse {
  markdown: string;
  generatedAt: string;
  /** Sections rendered purely from Snapshot data, no LLM call involved */
  templatedSections: string[];
  /** Sections that went through the LLM, grounded in Snapshot data */
  narrativeSections: string[];
}

export interface HealthDashboardResponse {
  snapshot: RepositorySnapshot;
  overallScore: number;
}

// --- Context Package Generator (Claude Code / Cursor / Codex integrations) ---

export interface GenerateContextPackageRequest {
  taskTitle: string;
  taskDescription: string;
  requirements?: string[];
  constraints?: string[];
  acceptanceCriteria?: string[];
}

export interface ContextPackageResponse {
  architectureMd: string;
  databaseMd: string;
  codingStandardsMd: string;
  knownIssuesMd: string;
  taskMd: string;
  relevantFiles: string[];
}

export interface CodexTask {
  task: string;
  context: {
    architecture: string;
    files: string[];
    requirements: string[];
    constraints: string[];
  };
}

// --- Agent Feedback Loop ---

export interface NextTaskRecommendation {
  title: string;
  rationale: string;
  category: "feature-gap" | "health-gap";
}

export interface FeedbackReport {
  summary: string;
  newlyDetectedFeatures: string[];
  healthScoreDeltas: Record<string, number>;
  nextTask: NextTaskRecommendation | null;
}

// --- Roadmap ---

export interface RoadmapItem {
  id: string;
  projectId: string;
  title: string;
  status: "open" | "done";
  source: "github-issue";
  sourceIssueNumber: number | null;
  createdAt: string;
  updatedAt: string;
}
