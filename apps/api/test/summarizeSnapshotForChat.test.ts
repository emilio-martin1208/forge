import { describe, expect, it } from "vitest";
import { summarizeSnapshotForChat } from "../src/chat/summarizeSnapshotForChat.js";
import { buildTestSnapshot } from "./fixtures/snapshot.js";

describe("summarizeSnapshotForChat", () => {
  it("excludes dev dependencies", () => {
    const snapshot = buildTestSnapshot({
      dependencies: [
        { name: "express", version: "4.0.0", ecosystem: "npm", isDev: false },
        { name: "vitest", version: "2.0.0", ecosystem: "npm", isDev: true },
      ],
    });
    const summary = summarizeSnapshotForChat(snapshot);
    expect(summary.dependencies).toEqual(["express"]);
  });

  it("only includes detected features", () => {
    const snapshot = buildTestSnapshot({
      features: [
        { kind: "authentication", detected: true, confidence: 0.9, evidence: [] },
        { kind: "payments", detected: false, confidence: 0, evidence: [] },
      ],
    });
    const summary = summarizeSnapshotForChat(snapshot);
    expect(summary.detectedFeatures).toEqual(["authentication"]);
  });

  it("caps routes at 50", () => {
    const routes = Array.from({ length: 80 }, (_, i) => ({
      method: "GET" as const,
      path: `/route-${i}`,
      file: `src/route-${i}.ts`,
      framework: "Express",
    }));
    const summary = summarizeSnapshotForChat(buildTestSnapshot({ routes }));
    expect(summary.routes).toHaveLength(50);
  });
});
