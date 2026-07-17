import { describe, expect, it } from "vitest";
import { issueStateToRoadmapStatus } from "../src/roadmap/roadmapStatus.js";

describe("issueStateToRoadmapStatus", () => {
  it("maps an open issue to an open roadmap item", () => {
    expect(issueStateToRoadmapStatus("open")).toBe("open");
  });

  it("maps a closed issue to a done roadmap item", () => {
    expect(issueStateToRoadmapStatus("closed")).toBe("done");
  });
});
