import { describe, expect, it } from "vitest";
import { diffSnapshots } from "../src/feedback/diff.js";
import { determineNextTaskGap } from "../src/feedback/recommendNextTask.js";
import { buildTestSnapshot } from "./fixtures/snapshot.js";

describe("diffSnapshots", () => {
  it("reports no newly detected features and zero deltas when there is no previous snapshot", () => {
    const current = buildTestSnapshot();
    const diff = diffSnapshots(null, current);
    expect(diff.newlyDetectedFeatures).toEqual([]);
    expect(Object.values(diff.healthScoreDeltas).every((d) => d === 0)).toBe(true);
  });

  it("detects a feature that transitioned from not-detected to detected", () => {
    const previous = buildTestSnapshot({
      features: [{ kind: "authentication", detected: false, confidence: 0, evidence: [] }],
    });
    const current = buildTestSnapshot({
      features: [{ kind: "authentication", detected: true, confidence: 0.8, evidence: ["dependency:next-auth"] }],
    });
    expect(diffSnapshots(previous, current).newlyDetectedFeatures).toEqual(["authentication"]);
  });

  it("does not re-report a feature that was already detected", () => {
    const previous = buildTestSnapshot({
      features: [{ kind: "authentication", detected: true, confidence: 0.8, evidence: [] }],
    });
    const current = buildTestSnapshot({
      features: [{ kind: "authentication", detected: true, confidence: 0.9, evidence: [] }],
    });
    expect(diffSnapshots(previous, current).newlyDetectedFeatures).toEqual([]);
  });

  it("computes health score deltas relative to the previous snapshot", () => {
    const previous = buildTestSnapshot({
      healthScores: { documentation: 40, architecture: 80, testing: 80, security: 80, maintainability: 80, deploymentReadiness: 80 },
    });
    const current = buildTestSnapshot({
      healthScores: { documentation: 70, architecture: 80, testing: 80, security: 80, maintainability: 80, deploymentReadiness: 80 },
    });
    expect(diffSnapshots(previous, current).healthScoreDeltas.documentation).toBe(30);
  });
});

describe("determineNextTaskGap", () => {
  it("prioritizes a newly detected feature with a known followup over health scores", () => {
    const current = buildTestSnapshot();
    const gap = determineNextTaskGap({ newlyDetectedFeatures: ["authentication"], healthScoreDeltas: {} }, current);
    expect(gap?.category).toBe("feature-gap");
    expect(gap?.subject).toBe("authentication");
  });

  it("falls back to the weakest health dimension when there's no feature followup", () => {
    const current = buildTestSnapshot({
      healthScores: { documentation: 30, architecture: 80, testing: 80, security: 80, maintainability: 80, deploymentReadiness: 80 },
    });
    const gap = determineNextTaskGap({ newlyDetectedFeatures: [], healthScoreDeltas: {} }, current);
    expect(gap?.category).toBe("health-gap");
    expect(gap?.subject).toBe("documentation");
  });

  it("returns null when every health dimension is already at 100", () => {
    const current = buildTestSnapshot({
      healthScores: { documentation: 100, architecture: 100, testing: 100, security: 100, maintainability: 100, deploymentReadiness: 100 },
    });
    expect(determineNextTaskGap({ newlyDetectedFeatures: [], healthScoreDeltas: {} }, current)).toBeNull();
  });

  it("does not recommend a followup for a feature with no known-followup mapping", () => {
    const current = buildTestSnapshot({
      healthScores: { documentation: 50, architecture: 80, testing: 80, security: 80, maintainability: 80, deploymentReadiness: 80 },
    });
    const gap = determineNextTaskGap({ newlyDetectedFeatures: ["analytics"], healthScoreDeltas: {} }, current);
    // "analytics" has no FEATURE_FOLLOWUPS entry, so it should fall through to the health heuristic
    expect(gap?.category).toBe("health-gap");
  });
});
