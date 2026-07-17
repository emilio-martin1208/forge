import type { RepositorySnapshot } from "@forge/types";

// Deterministic file-relevance scoring, not embeddings — see the "Repository
// Intelligence Layer" reasoning in docs/architecture.md. Every candidate file
// already comes tagged with structural metadata the Snapshot computed
// (which framework touches it, which route it serves, which env var it
// reads); scoring is just token overlap between the task description and
// those tags. Revisit with real semantic search once this measurably misses
// on free-text tasks that don't share vocabulary with the repo's structure.

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "to", "for", "of", "in", "on", "with",
  "is", "are", "add", "implement", "create", "build", "new",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

interface FileCandidate {
  file: string;
  tags: Set<string>;
}

function buildCandidates(snapshot: RepositorySnapshot): Map<string, FileCandidate> {
  const candidates = new Map<string, FileCandidate>();

  function addTags(file: string, tags: string[]) {
    const existing = candidates.get(file) ?? { file, tags: new Set<string>() };
    for (const tag of tags) existing.tags.add(tag.toLowerCase());
    candidates.set(file, existing);
  }

  for (const route of snapshot.routes) {
    addTags(route.file, [route.framework, route.method, ...route.path.split("/")]);
  }

  for (const framework of snapshot.frameworks) {
    for (const evidence of framework.evidence) {
      if (evidence.startsWith("file:")) {
        addTags(evidence.slice("file:".length), [framework.name, framework.category]);
      }
    }
  }

  for (const envVar of snapshot.envVars) {
    for (const file of envVar.referencedIn) {
      addTags(file, [envVar.name]);
    }
  }

  for (const referenceFile of snapshot.referenceFiles) {
    addTags(referenceFile.path, ["schema", "database", "model"]);
  }

  return candidates;
}

export function selectRelevantFiles(
  snapshot: RepositorySnapshot,
  taskDescription: string,
  limit = 10,
): string[] {
  const taskTokens = tokenize(taskDescription);
  if (taskTokens.length === 0) return [];

  const candidates = buildCandidates(snapshot);
  const scored = [...candidates.values()]
    .map((candidate) => {
      const fileTokens = tokenize(candidate.file);
      const tagTokens = [...candidate.tags].flatMap(tokenize);
      const haystack = new Set([...fileTokens, ...tagTokens]);
      const score = taskTokens.filter((token) => haystack.has(token)).length;
      return { file: candidate.file, score };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score || a.file.localeCompare(b.file));

  return scored.slice(0, limit).map((c) => c.file);
}
