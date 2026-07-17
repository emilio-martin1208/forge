// Minimal shapes — only the fields Forge actually reads. GitHub's REST
// payloads are much larger; typing the whole thing would be maintenance
// overhead for data we never use.

export interface PullRequestSummary {
  number: number;
  title: string;
  state: "open" | "closed";
  merged_at: string | null;
  user: { login: string } | null;
  head: { sha: string; ref: string };
  base: { ref: string };
  created_at: string;
  updated_at: string;
}

export interface IssueSummary {
  number: number;
  title: string;
  state: "open" | "closed";
  user: { login: string } | null;
  body: string | null;
  created_at: string;
  updated_at: string;
  pull_request?: unknown; // presence means this "issue" is actually a PR
}

export interface ReleaseSummary {
  tag_name: string;
  name: string | null;
  published_at: string | null;
}

export interface WorkflowRunSummary {
  id: number;
  name: string | null;
  status: string;
  conclusion: string | null;
  head_sha: string;
  created_at: string;
}

export interface CompareFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

export interface CompareResult {
  files: CompareFile[];
}

// --- Webhook payload shapes (subset of fields Forge reads) ---

export interface WebhookRepository {
  full_name: string;
}

export interface PushWebhookPayload {
  ref: string;
  repository: WebhookRepository;
}

export interface PullRequestWebhookPayload {
  action: string;
  pull_request: PullRequestSummary;
  repository: WebhookRepository;
}

export interface IssueWebhookPayload {
  action: string;
  issue: IssueSummary;
  repository: WebhookRepository;
}

export interface ReleaseWebhookPayload {
  action: string;
  release: ReleaseSummary;
  repository: WebhookRepository;
}

export interface WorkflowRunWebhookPayload {
  action: string;
  workflow_run: WorkflowRunSummary;
  repository: WebhookRepository;
}
