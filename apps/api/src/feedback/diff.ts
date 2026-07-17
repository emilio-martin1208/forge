import type { RepositorySnapshot } from "@forge/types";

export interface SnapshotDiff {
  newlyDetectedFeatures: string[];
  healthScoreDeltas: Record<string, number>;
}

/**
 * Pure diff between two snapshots of the same project. No LLM, no GitHub
 * calls — just comparing two already-persisted structured facts. This is
 * what "Forge reviews, understands, and improves the system continuously"
 * actually reduces to at the data layer: two Snapshot reads and a subtract.
 */
export function diffSnapshots(previous: RepositorySnapshot | null, current: RepositorySnapshot): SnapshotDiff {
  const newlyDetectedFeatures = current.features
    .filter((f) => f.detected)
    .filter((f) => !previous?.features.some((pf) => pf.kind === f.kind && pf.detected))
    .map((f) => f.kind);

  const healthScoreDeltas: Record<string, number> = {};
  for (const [dimension, score] of Object.entries(current.healthScores)) {
    const previousScore = previous
      ? (previous.healthScores as unknown as Record<string, number>)[dimension]
      : undefined;
    healthScoreDeltas[dimension] = score - (previousScore ?? score);
  }

  return { newlyDetectedFeatures, healthScoreDeltas };
}
