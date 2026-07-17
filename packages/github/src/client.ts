import type {
  CompareResult,
  IssueSummary,
  PullRequestSummary,
  ReleaseSummary,
  WorkflowRunSummary,
} from "./types.js";

const GITHUB_API = "https://api.github.com";

async function githubFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export function listOpenPullRequests(owner: string, repo: string, token: string) {
  return githubFetch<PullRequestSummary[]>(`/repos/${owner}/${repo}/pulls?state=open&per_page=50`, token);
}

export async function listOpenIssues(owner: string, repo: string, token: string): Promise<IssueSummary[]> {
  const all = await githubFetch<IssueSummary[]>(`/repos/${owner}/${repo}/issues?state=open&per_page=50`, token);
  // GitHub's Issues API returns PRs too — filter them out, PRs are synced separately.
  return all.filter((issue) => !issue.pull_request);
}

export function listReleases(owner: string, repo: string, token: string) {
  return githubFetch<ReleaseSummary[]>(`/repos/${owner}/${repo}/releases?per_page=20`, token);
}

export function listWorkflowRuns(owner: string, repo: string, token: string) {
  return githubFetch<{ workflow_runs: WorkflowRunSummary[] }>(
    `/repos/${owner}/${repo}/actions/runs?per_page=20`,
    token,
  ).then((r) => r.workflow_runs);
}

export function fetchPullRequestDiff(owner: string, repo: string, base: string, head: string, token: string) {
  return githubFetch<CompareResult>(`/repos/${owner}/${repo}/compare/${base}...${head}`, token);
}

export async function postPullRequestComment(
  owner: string,
  repo: string,
  prNumber: number,
  body: string,
  token: string,
): Promise<void> {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/issues/${prNumber}/comments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) {
    throw new Error(`Failed to post PR comment: ${res.status} ${await res.text()}`);
  }
}
