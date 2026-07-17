import { describe, expect, it } from "vitest";
import { InvalidIdeaResponseError, parseIdeaResponse } from "../src/ideas/parseIdeaResponse.js";

const validOption = {
  name: "Monolith",
  stackSummary: "Next.js + Postgres",
  description: "A single deployable app.",
  tradeoffs: ["Simple to deploy", "Harder to scale independently"],
  whenToChoose: "Small team, early stage.",
};

function validResponse(overrides: Record<string, unknown> = {}) {
  return {
    prdSummary: "A tool for X.",
    coreFeatures: ["Feature A", "Feature B"],
    architectureOptions: [validOption],
    recommendedIndex: 0,
    recommendationRationale: "Simplest for the described scale.",
    ...overrides,
  };
}

describe("parseIdeaResponse", () => {
  it("parses a clean JSON response", () => {
    const result = parseIdeaResponse(JSON.stringify(validResponse()));
    expect(result.prdSummary).toBe("A tool for X.");
    expect(result.architectureOptions).toHaveLength(1);
  });

  it("extracts JSON even when the model wraps it in prose", () => {
    const wrapped = `Here you go:\n${JSON.stringify(validResponse())}\nHope that helps!`;
    expect(() => parseIdeaResponse(wrapped)).not.toThrow();
  });

  it("throws InvalidIdeaResponseError when there is no JSON object at all", () => {
    expect(() => parseIdeaResponse("sorry, I can't help with that")).toThrow(InvalidIdeaResponseError);
  });

  it("throws when architectureOptions is empty", () => {
    expect(() => parseIdeaResponse(JSON.stringify(validResponse({ architectureOptions: [] })))).toThrow(
      InvalidIdeaResponseError,
    );
  });

  it("throws when recommendedIndex is out of bounds", () => {
    expect(() => parseIdeaResponse(JSON.stringify(validResponse({ recommendedIndex: 5 })))).toThrow(
      InvalidIdeaResponseError,
    );
  });

  it("throws when a required field is missing from an architecture option", () => {
    const malformed = validResponse({ architectureOptions: [{ name: "Monolith" }] });
    expect(() => parseIdeaResponse(JSON.stringify(malformed))).toThrow(InvalidIdeaResponseError);
  });

  it("throws when coreFeatures contains a non-string", () => {
    const malformed = validResponse({ coreFeatures: ["ok", 5] });
    expect(() => parseIdeaResponse(JSON.stringify(malformed))).toThrow(InvalidIdeaResponseError);
  });
});
