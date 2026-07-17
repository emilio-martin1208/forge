import { BadRequestException, Body, Controller, Headers, Post } from "@nestjs/common";
import { prisma } from "@forge/database";
import { verifyWebhookSignature } from "@forge/github";
import type {
  IssueWebhookPayload,
  PullRequestWebhookPayload,
  PushWebhookPayload,
  ReleaseWebhookPayload,
  WorkflowRunWebhookPayload,
} from "@forge/github";
import { analyzeProjectQueue, reviewPullRequestQueue } from "../jobs/queue.js";

function splitRepoSlug(fullName: string): { githubOwner: string; githubRepo: string } {
  const [githubOwner, githubRepo] = fullName.split("/");
  if (!githubOwner || !githubRepo) {
    throw new BadRequestException(`Malformed repository full_name: ${fullName}`);
  }
  return { githubOwner, githubRepo };
}

async function findProjectBySlug(fullName: string) {
  const { githubOwner, githubRepo } = splitRepoSlug(fullName);
  return prisma.project.findUnique({ where: { githubOwner_githubRepo: { githubOwner, githubRepo } } });
}

@Controller("webhooks/github")
export class GithubWebhookController {
  @Post()
  async handle(
    @Headers("x-hub-signature-256") signature: string | undefined,
    @Headers("x-github-event") event: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    // Signature check happens against the raw body in a real deployment
    // (Nest's rawBody option must be enabled) — verifyWebhookSignature is
    // wired here to make the requirement explicit even though this stub
    // receives the already-parsed JSON body.
    if (!verifyWebhookSignature(JSON.stringify(body), signature)) {
      throw new BadRequestException("Invalid webhook signature");
    }

    switch (event) {
      case "push":
        return this.handlePush(body as unknown as PushWebhookPayload);
      case "pull_request":
        return this.handlePullRequest(body as unknown as PullRequestWebhookPayload);
      case "issues":
        return this.handleIssue(body as unknown as IssueWebhookPayload);
      case "release":
        return this.handleRelease(body as unknown as ReleaseWebhookPayload);
      case "workflow_run":
        return this.handleWorkflowRun(body as unknown as WorkflowRunWebhookPayload);
      default:
        return { ignored: true, event };
    }
  }

  private async handlePush(payload: PushWebhookPayload) {
    const project = await findProjectBySlug(payload.repository.full_name);
    if (!project) return { ignored: true, reason: "unknown repository" };

    await analyzeProjectQueue.add("analyze", { projectId: project.id });
    return { queued: true, projectId: project.id };
  }

  private async handlePullRequest(payload: PullRequestWebhookPayload) {
    if (!["opened", "synchronize", "reopened"].includes(payload.action)) {
      return { ignored: true, action: payload.action };
    }

    const project = await findProjectBySlug(payload.repository.full_name);
    if (!project) return { ignored: true, reason: "unknown repository" };

    const pr = payload.pull_request;
    const record = await prisma.pullRequest.upsert({
      where: { projectId_number: { projectId: project.id, number: pr.number } },
      create: {
        projectId: project.id,
        number: pr.number,
        title: pr.title,
        state: pr.state,
        authorLogin: pr.user?.login ?? null,
        headSha: pr.head.sha,
        headBranch: pr.head.ref,
        baseBranch: pr.base.ref,
        mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
        createdAt: new Date(pr.created_at),
        updatedAt: new Date(pr.updated_at),
      },
      update: {
        title: pr.title,
        state: pr.state,
        headSha: pr.head.sha,
        updatedAt: new Date(pr.updated_at),
      },
    });

    // "Pull request opened -> trigger AI review" per the product spec.
    // Also re-review on `synchronize` (new commits pushed to the PR) since
    // a review against a stale diff isn't useful.
    await reviewPullRequestQueue.add("review", { pullRequestId: record.id });
    return { queued: true, pullRequestId: record.id };
  }

  private async handleIssue(payload: IssueWebhookPayload) {
    if (!["opened", "closed", "reopened"].includes(payload.action)) {
      return { ignored: true, action: payload.action };
    }

    const project = await findProjectBySlug(payload.repository.full_name);
    if (!project) return { ignored: true, reason: "unknown repository" };

    const issue = payload.issue;
    await prisma.issue.upsert({
      where: { projectId_number: { projectId: project.id, number: issue.number } },
      create: {
        projectId: project.id,
        number: issue.number,
        title: issue.title,
        state: issue.state,
        authorLogin: issue.user?.login ?? null,
        body: issue.body,
        createdAt: new Date(issue.created_at),
        updatedAt: new Date(issue.updated_at),
      },
      update: {
        title: issue.title,
        state: issue.state,
        body: issue.body,
        updatedAt: new Date(issue.updated_at),
      },
    });

    // "Issue created -> update project roadmap" from the spec is a stub:
    // there is no Roadmap feature yet (Project Creation / milestones are
    // still deferred — see docs/architecture.md). Storing the issue is real;
    // wiring it into a roadmap update is a no-op until that feature exists.
    // Building a fake roadmap write against a model that doesn't exist would
    // be worse than not having this line.
    return { synced: true, issueNumber: issue.number };
  }

  private async handleRelease(payload: ReleaseWebhookPayload) {
    if (payload.action !== "published") return { ignored: true, action: payload.action };

    const project = await findProjectBySlug(payload.repository.full_name);
    if (!project) return { ignored: true, reason: "unknown repository" };

    const release = payload.release;
    await prisma.release.upsert({
      where: { projectId_tagName: { projectId: project.id, tagName: release.tag_name } },
      create: {
        projectId: project.id,
        tagName: release.tag_name,
        name: release.name,
        publishedAt: release.published_at ? new Date(release.published_at) : null,
      },
      update: {
        name: release.name,
        publishedAt: release.published_at ? new Date(release.published_at) : null,
      },
    });

    return { synced: true, tagName: release.tag_name };
  }

  private async handleWorkflowRun(payload: WorkflowRunWebhookPayload) {
    if (payload.action !== "completed") return { ignored: true, action: payload.action };

    const project = await findProjectBySlug(payload.repository.full_name);
    if (!project) return { ignored: true, reason: "unknown repository" };

    const run = payload.workflow_run;
    await prisma.workflowRun.upsert({
      where: { projectId_githubRunId: { projectId: project.id, githubRunId: String(run.id) } },
      create: {
        projectId: project.id,
        githubRunId: String(run.id),
        workflowName: run.name,
        status: run.status,
        conclusion: run.conclusion,
        headSha: run.head_sha,
        githubCreatedAt: new Date(run.created_at),
      },
      update: {
        status: run.status,
        conclusion: run.conclusion,
      },
    });

    return { synced: true, runId: run.id };
  }
}
