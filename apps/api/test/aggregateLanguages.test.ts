import { describe, expect, it } from "vitest";
import { aggregateLanguages } from "../src/activity/aggregateLanguages.js";

describe("aggregateLanguages", () => {
  it("sums line counts for the same language across multiple snapshots", () => {
    const result = aggregateLanguages([
      [{ name: "TypeScript", fileCount: 5, lineCount: 300, percentage: 100 }],
      [{ name: "TypeScript", fileCount: 3, lineCount: 100, percentage: 100 }],
    ]);
    expect(result).toEqual([{ name: "TypeScript", totalLines: 400, percentage: 100 }]);
  });

  it("computes percentage relative to the grand total across all languages", () => {
    const result = aggregateLanguages([
      [
        { name: "TypeScript", fileCount: 5, lineCount: 300, percentage: 75 },
        { name: "CSS", fileCount: 2, lineCount: 100, percentage: 25 },
      ],
    ]);
    expect(result).toEqual([
      { name: "TypeScript", totalLines: 300, percentage: 75 },
      { name: "CSS", totalLines: 100, percentage: 25 },
    ]);
  });

  it("sorts by total lines descending", () => {
    const result = aggregateLanguages([
      [
        { name: "CSS", fileCount: 1, lineCount: 10, percentage: 10 },
        { name: "TypeScript", fileCount: 1, lineCount: 90, percentage: 90 },
      ],
    ]);
    expect(result.map((r) => r.name)).toEqual(["TypeScript", "CSS"]);
  });

  it("returns an empty array for no snapshots", () => {
    expect(aggregateLanguages([])).toEqual([]);
  });
});
