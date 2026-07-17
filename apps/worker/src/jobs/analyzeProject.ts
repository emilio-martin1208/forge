import { Prisma, prisma } from "@forge/database";
import { analyzeRepository } from "@forge/repository-engine";
import { getInstallationAccessToken } from "@forge/github";
import { cloneRepository } from "../clone.js";

export interface AnalyzeProjectJobData {
  projectId: string;
}

// The analyzer output types (LanguageStat[], FrameworkDetection[], ...) are
// plain JSON-safe data, but Prisma's generated InputJsonValue requires an
// index signature TS can't infer from a named interface — this cast is a
// type-system limitation, not a runtime risk.
function toJson<T>(value: T): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

/**
 * The one job the worker runs in v1: clone -> analyze -> persist Snapshot.
 * Triggered on repo connect and on `push` webhook events (registered in
 * apps/api). Idempotent per commit SHA — re-running on the same HEAD just
 * writes another snapshot row, which is fine, snapshots are cheap and
 * append-only.
 */
export async function analyzeProject(data: AnalyzeProjectJobData): Promise<{ snapshotId: string }> {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: data.projectId },
    include: { installation: true },
  });

  const token = await getInstallationAccessToken(project.installation.installationId);
  const clone = cloneRepository({
    githubOwner: project.githubOwner,
    githubRepo: project.githubRepo,
    installationToken: token,
  });

  try {
    const analysis = analyzeRepository({
      rootDir: clone.path,
      projectId: project.id,
      defaultBranch: project.defaultBranch,
    });

    const snapshot = await prisma.repositorySnapshot.create({
      data: {
        projectId: analysis.projectId,
        commitSha: analysis.commitSha,
        defaultBranch: analysis.defaultBranch,
        fileTree: toJson(analysis.fileTree),
        languages: toJson(analysis.languages),
        frameworks: toJson(analysis.frameworks),
        dependencies: toJson(analysis.dependencies),
        routes: toJson(analysis.routes),
        envVars: toJson(analysis.envVars),
        docker: toJson(analysis.docker),
        ci: toJson(analysis.ci),
        testing: toJson(analysis.testing),
        features: toJson(analysis.features),
        healthScores: toJson(analysis.healthScores),
        referenceFiles: toJson(analysis.referenceFiles),
      },
    });

    return { snapshotId: snapshot.id };
  } finally {
    clone.cleanup();
  }
}
