import Anthropic from "@anthropic-ai/sdk";
import { Prisma, prisma } from "@forge/database";
import { fetchPullRequestDiff, getInstallationAccessToken, postPullRequestComment } from "@forge/github";

export interface ReviewPullRequestJobData {
  pullRequestId: string;
}

interface ReviewFinding {
  category: "security" | "duplication" | "missing-tests" | "architecture-violation" | "naming" | "dead-code" | "other";
  severity: "low" | "medium" | "high";
  file: string;
  description: string;
}

interface ReviewResult {
  summary: string;
  findings: ReviewFinding[];
}

const SYSTEM_PROMPT = `You are reviewing a GitHub pull request diff for a repository Forge already has a
structural understanding of. You are given:
1. The repository's detected frameworks, ORM, and testing setup (ground truth, not to be second-guessed).
2. The diff itself (unified patch format, may be truncated for large PRs).

Flag only what's visible in the diff: security issues, duplicated logic, missing tests for new
logic, naming inconsistencies with the rest of the codebase, and architecture violations (e.g. a
component reaching directly into a database when the codebase's convention, per the provided
context, goes through a service layer).

Do not invent findings about code outside the diff. If the diff looks fine, say so — do not
manufacture issues to fill a quota.

Respond with ONLY a JSON object matching this shape, no prose outside it:
{"summary": string, "findings": [{"category": string, "severity": "low"|"medium"|"high", "file": string, "description": string}]}`;

const MAX_PATCH_CHARS = 20_000;

function truncateDiff(files: { filename: string; patch?: string }[]): string {
  let remaining = MAX_PATCH_CHARS;
  const chunks: string[] = [];
  for (const file of files) {
    if (remaining <= 0) break;
    const patch = (file.patch ?? "(binary or no patch available)").slice(0, remaining);
    chunks.push(`--- ${file.filename} ---\n${patch}`);
    remaining -= patch.length;
  }
  return chunks.join("\n\n");
}

function parseReviewResult(text: string): ReviewResult {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("no JSON object in response");
    const parsed = JSON.parse(jsonMatch[0]) as ReviewResult;
    return { summary: parsed.summary ?? "", findings: parsed.findings ?? [] };
  } catch {
    // Model didn't return clean JSON — degrade to a summary-only review
    // rather than failing the job outright.
    return { summary: text.slice(0, 2000), findings: [] };
  }
}

function toJson<T>(value: T): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

export async function reviewPullRequest(data: ReviewPullRequestJobData): Promise<{ reviewId: string }> {
  const pullRequest = await prisma.pullRequest.findUniqueOrThrow({
    where: { id: data.pullRequestId },
    include: { project: { include: { installation: true } } },
  });

  const snapshot = await prisma.repositorySnapshot.findFirst({
    where: { projectId: pullRequest.projectId },
    orderBy: { createdAt: "desc" },
  });

  const token = await getInstallationAccessToken(pullRequest.project.installation.installationId);
  const diff = await fetchPullRequestDiff(
    pullRequest.project.githubOwner,
    pullRequest.project.githubRepo,
    pullRequest.baseBranch,
    pullRequest.headSha,
    token,
  );

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured — PR review requires it");
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1200,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          frameworks: snapshot ? (snapshot.frameworks as { name: string; category: string }[]) : [],
          testingFrameworks: snapshot ? (snapshot.testing as { frameworks: string[] }).frameworks : [],
          diff: truncateDiff(diff.files),
        }),
      },
    ],
  });

  const text = message.content.map((block) => (block.type === "text" ? block.text : "")).join("\n");
  const result = parseReviewResult(text);

  const review = await prisma.pullRequestReview.create({
    data: {
      pullRequestId: pullRequest.id,
      commitSha: pullRequest.headSha,
      summary: result.summary,
      findings: toJson(result.findings),
    },
  });

  try {
    const findingsList =
      result.findings.length > 0
        ? result.findings.map((f) => `- **${f.severity}** (${f.category}) \`${f.file}\`: ${f.description}`).join("\n")
        : "_No issues flagged._";
    await postPullRequestComment(
      pullRequest.project.githubOwner,
      pullRequest.project.githubRepo,
      pullRequest.number,
      `**Forge review**\n\n${result.summary}\n\n${findingsList}`,
      token,
    );
  } catch (err) {
    // Posting the comment is best-effort — the review is already persisted
    // and readable via the API even if GitHub rejects the comment write.
    console.error(`[worker] failed to post review comment on PR #${pullRequest.number}:`, err);
  }

  return { reviewId: review.id };
}
