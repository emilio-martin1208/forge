import { describe, expect, it } from "vitest";
import { deriveArchitectureConstraints, deriveCodingStandards, deriveKnownIssues } from "../src/context/constraints.js";
import { buildTestSnapshot } from "./fixtures/snapshot.js";

describe("deriveArchitectureConstraints", () => {
  it("flags ORM usage as a constraint", () => {
    const snapshot = buildTestSnapshot({
      frameworks: [{ name: "Prisma", category: "orm", version: "5.0.0", evidence: ["dependency:prisma"] }],
    });
    const constraints = deriveArchitectureConstraints(snapshot);
    expect(constraints.some((c) => c.includes("Prisma"))).toBe(true);
  });

  it("returns an empty list when nothing distinctive is detected", () => {
    expect(deriveArchitectureConstraints(buildTestSnapshot())).toEqual([]);
  });
});

describe("deriveCodingStandards", () => {
  it("flags configured lint/format tooling and test frameworks", () => {
    const snapshot = buildTestSnapshot({
      dependencies: [
        { name: "eslint", version: "9.0.0", ecosystem: "npm", isDev: true },
        { name: "prettier", version: "3.0.0", ecosystem: "npm", isDev: true },
      ],
      testing: { frameworks: ["vitest"], testFileCount: 5, hasCoverageConfig: false },
    });
    const standards = deriveCodingStandards(snapshot);
    expect(standards.some((s) => s.includes("ESLint"))).toBe(true);
    expect(standards.some((s) => s.includes("Prettier"))).toBe(true);
    expect(standards.some((s) => s.includes("vitest"))).toBe(true);
  });
});

describe("deriveKnownIssues", () => {
  it("flags health score dimensions below 60", () => {
    const snapshot = buildTestSnapshot({
      healthScores: {
        documentation: 40,
        architecture: 80,
        testing: 80,
        security: 80,
        maintainability: 80,
        deploymentReadiness: 80,
      },
    });
    const issues = deriveKnownIssues(snapshot);
    expect(issues.some((i) => i.includes("documentation"))).toBe(true);
    expect(issues.some((i) => i.includes("architecture"))).toBe(false);
  });

  it("flags undocumented env vars", () => {
    const snapshot = buildTestSnapshot({
      envVars: [{ name: "SECRET_TOKEN", referencedIn: ["src/index.ts"], documentedInExample: false }],
    });
    expect(deriveKnownIssues(snapshot).some((i) => i.includes("SECRET_TOKEN"))).toBe(true);
  });

  it("flags missing Docker and CI", () => {
    const issues = deriveKnownIssues(buildTestSnapshot());
    expect(issues.some((i) => i.includes("Dockerfile"))).toBe(true);
    expect(issues.some((i) => i.includes("CI"))).toBe(true);
  });
});
