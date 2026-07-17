import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { prisma } from "@forge/database";
import type { ConnectRepositoryRequest, HealthDashboardResponse, Project } from "@forge/types";
import { analyzeProjectQueue } from "../jobs/queue.js";
import { toSnapshotDto } from "../shared/snapshotMapper.js";
import { GithubSyncService } from "../github/github-sync.service.js";

function toProjectDto(row: {
  id: string;
  ownerUserId: string;
  githubOwner: string;
  githubRepo: string;
  defaultBranch: string;
  createdAt: Date;
  snapshots: { id: string }[];
}): Project {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    githubOwner: row.githubOwner,
    githubRepo: row.githubRepo,
    defaultBranch: row.defaultBranch,
    createdAt: row.createdAt.toISOString(),
    latestSnapshotId: row.snapshots[0]?.id ?? null,
  };
}

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  // @Inject() token — see the note in context-package.controller.ts.
  constructor(@Inject(GithubSyncService) private readonly githubSync: GithubSyncService) {}

  async connect(ownerUserId: string, request: ConnectRepositoryRequest): Promise<Project> {
    const installation = await prisma.githubInstallation.findUniqueOrThrow({
      where: { installationId: request.installationId },
    });

    const project = await prisma.project.upsert({
      where: { githubOwner_githubRepo: { githubOwner: request.githubOwner, githubRepo: request.githubRepo } },
      create: {
        ownerUserId,
        installationId: installation.id,
        githubOwner: request.githubOwner,
        githubRepo: request.githubRepo,
      },
      update: {},
      include: { snapshots: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    // Clone + analyze is unbounded (minutes on a large repo) — always a
    // background job. The PR/issue backfill below is two bounded REST list
    // calls (sub-second in practice), so it runs inline rather than paying
    // for a second queue; if that assumption stops holding for very active
    // repos, move it to a job the same way analysis already is.
    await analyzeProjectQueue.add("analyze", { projectId: project.id });

    try {
      await this.githubSync.backfillPullRequestsAndIssues(project.id);
    } catch (err) {
      this.logger.warn(`GitHub backfill failed for project ${project.id}: ${(err as Error).message}`);
    }

    return toProjectDto(project);
  }

  async list(ownerUserId: string): Promise<Project[]> {
    const projects = await prisma.project.findMany({
      where: { ownerUserId },
      include: { snapshots: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    });
    return projects.map(toProjectDto);
  }

  async getById(projectId: string): Promise<Project> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { snapshots: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    return toProjectDto(project);
  }

  async getHealthDashboard(projectId: string): Promise<HealthDashboardResponse> {
    const snapshotRow = await prisma.repositorySnapshot.findFirst({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
    if (!snapshotRow) {
      throw new NotFoundException(`No snapshot yet for project ${projectId} — analysis may still be running`);
    }

    const healthScores = snapshotRow.healthScores as Record<string, number>;
    const overallScore =
      Object.values(healthScores).reduce((sum, s) => sum + s, 0) / Object.values(healthScores).length;

    return {
      snapshot: toSnapshotDto(snapshotRow),
      overallScore: Math.round(overallScore),
    };
  }
}
