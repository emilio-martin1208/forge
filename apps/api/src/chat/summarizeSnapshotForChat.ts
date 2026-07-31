import type { RepositorySnapshot } from "@forge/types";

/**
 * Compact projection of a Snapshot for the chat system prompt — same idea as
 * the JSON payloads sent to narrative.ts / reviewPullRequest.ts: enough
 * structure for the model to answer real questions, not the full Snapshot
 * (which would burn tokens on fields like every dev dependency or every
 * ignored file that a conversation is unlikely to need).
 */
export function summarizeSnapshotForChat(snapshot: RepositorySnapshot) {
  return {
    languages: snapshot.languages.map((l) => `${l.name} (${l.percentage}%)`),
    frameworks: snapshot.frameworks.map((f) => `${f.name}${f.version ? ` ${f.version}` : ""}`),
    routes: snapshot.routes.slice(0, 50).map((r) => `${r.method} ${r.path} — ${r.file}`),
    detectedFeatures: snapshot.features.filter((f) => f.detected).map((f) => f.kind),
    dependencies: snapshot.dependencies.filter((d) => !d.isDev).map((d) => d.name),
    envVars: snapshot.envVars.map((v) => v.name),
    testing: snapshot.testing,
    healthScores: snapshot.healthScores,
    docker: snapshot.docker,
    ciProviders: snapshot.ci.map((c) => c.provider),
    topLevelFolders: snapshot.fileTree.topLevelEntries,
  };
}
