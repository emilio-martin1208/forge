import Anthropic from "@anthropic-ai/sdk";
import type { RepositorySnapshot } from "@forge/types";

// The ONLY LLM call site in v1. Grounded explicitly: the model is given the
// Snapshot as its sole source of facts and instructed not to introduce
// anything not present in it — enforcing "repo is source of truth" at the
// prompt level, not just as an aspiration.

const SYSTEM_PROMPT = `You write the narrative sections of a project README: a one-paragraph
description and short feature bullets. You are given a JSON "RepositorySnapshot" describing what
was actually detected in the repository. Rules:
- Only describe frameworks, features, and languages that appear in the snapshot.
- Do not invent functionality, endpoints, or integrations not present in the data.
- If the snapshot is sparse, write a shorter, more modest description rather than padding it out.
- Output GitHub-flavored markdown only, no preamble.`;

export interface NarrativeSections {
  description: string;
  featureBullets: string;
}

export async function generateNarrativeSections(
  snapshot: RepositorySnapshot,
  repoSlug: string,
): Promise<NarrativeSections> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured — narrative README sections require it");
  }

  const client = new Anthropic({ apiKey });

  const detectedFeatures = snapshot.features.filter((f) => f.detected).map((f) => f.kind);

  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          repoSlug,
          languages: snapshot.languages.map((l) => l.name),
          frameworks: snapshot.frameworks.map((f) => f.name),
          detectedFeatures,
          routeCount: snapshot.routes.length,
        }),
      },
    ],
  });

  const text = message.content.map((block) => (block.type === "text" ? block.text : "")).join("\n");
  const [description, ...rest] = text.split("\n\n");

  return {
    description: description ?? text,
    featureBullets: rest.join("\n\n") || "_No additional features detected._",
  };
}
