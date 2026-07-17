import type { ArchitectureOption } from "@forge/types";

export interface ParsedIdeaResponse {
  prdSummary: string;
  coreFeatures: string[];
  architectureOptions: ArchitectureOption[];
  recommendedIndex: number;
  recommendationRationale: string;
}

export class InvalidIdeaResponseError extends Error {}

// Unlike the PR review pipeline (which degrades to a summary-only review if
// the model's JSON is malformed), there's no deterministic fallback here —
// the entire output IS the LLM's generation, there's no Snapshot to fall
// back on. So this throws instead of silently returning something wrong.
export function parseIdeaResponse(text: string): ParsedIdeaResponse {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new InvalidIdeaResponseError("No JSON object found in model response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (err) {
    throw new InvalidIdeaResponseError(`Model response was not valid JSON: ${(err as Error).message}`);
  }

  if (!isValidShape(parsed)) {
    throw new InvalidIdeaResponseError("Model response JSON did not match the expected shape");
  }

  return parsed;
}

function isValidArchitectureOption(value: unknown): value is ArchitectureOption {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.name === "string" &&
    typeof v.stackSummary === "string" &&
    typeof v.description === "string" &&
    Array.isArray(v.tradeoffs) &&
    v.tradeoffs.every((t) => typeof t === "string") &&
    typeof v.whenToChoose === "string"
  );
}

function isValidShape(value: unknown): value is ParsedIdeaResponse {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.prdSummary === "string" &&
    Array.isArray(v.coreFeatures) &&
    v.coreFeatures.every((f) => typeof f === "string") &&
    Array.isArray(v.architectureOptions) &&
    v.architectureOptions.length > 0 &&
    v.architectureOptions.every(isValidArchitectureOption) &&
    typeof v.recommendedIndex === "number" &&
    v.recommendedIndex >= 0 &&
    v.recommendedIndex < v.architectureOptions.length &&
    typeof v.recommendationRationale === "string"
  );
}
