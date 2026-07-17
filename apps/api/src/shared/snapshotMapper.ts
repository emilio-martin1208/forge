import type { RepositorySnapshot as SnapshotRow } from "@forge/database";
import type { RepositorySnapshot } from "@forge/types";

/**
 * Maps a Prisma RepositorySnapshot row (Json columns, untyped) to the typed
 * RepositorySnapshot the rest of the app works with. Centralized because
 * every feature that reads a snapshot (health dashboard, README generator,
 * context packages, feedback loop) needs this same cast — duplicating the
 * per-field `as never` here in each service was the actual over-engineering
 * risk, not this function.
 */
export function toSnapshotDto(row: SnapshotRow): RepositorySnapshot {
  return {
    id: row.id,
    projectId: row.projectId,
    commitSha: row.commitSha,
    createdAt: row.createdAt.toISOString(),
    defaultBranch: row.defaultBranch,
    fileTree: row.fileTree as never,
    languages: row.languages as never,
    frameworks: row.frameworks as never,
    dependencies: row.dependencies as never,
    routes: row.routes as never,
    envVars: row.envVars as never,
    docker: row.docker as never,
    ci: row.ci as never,
    testing: row.testing as never,
    features: row.features as never,
    healthScores: row.healthScores as never,
    referenceFiles: row.referenceFiles as never,
  };
}
