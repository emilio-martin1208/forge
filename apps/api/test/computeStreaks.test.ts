import { describe, expect, it } from "vitest";
import { computeStreaks } from "../src/activity/computeStreaks.js";

describe("computeStreaks", () => {
  it("returns zeros when there's no activity at all", () => {
    expect(computeStreaks(new Set(), "2026-07-31")).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  it("counts a current streak ending today", () => {
    const dates = new Set(["2026-07-29", "2026-07-30", "2026-07-31"]);
    expect(computeStreaks(dates, "2026-07-31").currentStreak).toBe(3);
  });

  it("keeps the streak alive if yesterday had activity but today doesn't yet", () => {
    const dates = new Set(["2026-07-29", "2026-07-30"]);
    expect(computeStreaks(dates, "2026-07-31").currentStreak).toBe(2);
  });

  it("resets current streak to 0 once there's a gap before today", () => {
    const dates = new Set(["2026-07-20", "2026-07-29"]);
    expect(computeStreaks(dates, "2026-07-31").currentStreak).toBe(0);
  });

  it("finds the longest streak even when it isn't the current one", () => {
    const dates = new Set(["2026-07-01", "2026-07-02", "2026-07-03", "2026-07-04", "2026-07-30"]);
    const result = computeStreaks(dates, "2026-07-31");
    expect(result.longestStreak).toBe(4);
    expect(result.currentStreak).toBe(1);
  });

  it("treats a single active day today as a streak of 1", () => {
    expect(computeStreaks(new Set(["2026-07-31"]), "2026-07-31")).toEqual({ currentStreak: 1, longestStreak: 1 });
  });
});
