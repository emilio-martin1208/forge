import { Injectable } from "@nestjs/common";
import { prisma } from "@forge/database";
import { getInstallationAccessToken, listOpenIssues, listOpenPullRequests } from "@forge/github";

/**
 * Backfill for state that predates Forge's connection to a repo — webhooks
 * only tell us about events from here forward, so a repo with 12 already-open
 * PRs needs a one-time pull on connect. Releases/workflow runs are NOT
 * backfilled: the next webhook event populates them, and backfilling
 * something with no attached business logic yet (see docs/architecture.md)
 * isn't worth the extra API calls on every connect.
 */
@Injectable()
export class GithubSyncService {
  async backfillPullRequestsAndIssues(projectId: string): Promise<{ pullRequests: number; issues: number }> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: { installation: true },
    });

    const token = await getInstallationAccessToken(project.installation.installationId);

    const [pullRequests, issues] = await Promise.all([
      listOpenPullRequests(project.githubOwner, project.githubRepo, token),
      listOpenIssues(project.githubOwner, project.githubRepo, token),
    ]);

    await Promise.all(
      pullRequests.map((pr) =>
        prisma.pullRequest.upsert({
          where: { projectId_number: { projectId, number: pr.number } },
          create: {
            projectId,
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
            mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
            updatedAt: new Date(pr.updated_at),
          },
        }),
      ),
    );

    await Promise.all(
      issues.map((issue) =>
        prisma.issue.upsert({
          where: { projectId_number: { projectId, number: issue.number } },
          create: {
            projectId,
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
        }),
      ),
    );

    return { pullRequests: pullRequests.length, issues: issues.length };
  }
}
