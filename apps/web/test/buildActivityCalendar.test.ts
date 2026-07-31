import { describe, expect, it } from "vitest";
import { activityTier, buildActivityCalendar } from "../src/lib/buildActivityCalendar.js";

describe("buildActivityCalendar", () => {
  it("produces the requested number of full 7-day weeks", () => {
    const grid = buildActivityCalendar([], "2026-07-31", 4);
    expect(grid).toHaveLength(4);
    for (const week of grid) expect(week).toHaveLength(7);
  });

  it("ends the grid on the Saturday of today's week", () => {
    const grid = buildActivityCalendar([], "2026-07-31", 4); // 2026-07-31 is a Friday
    const lastWeek = grid[grid.length - 1]!;
    expect(lastWeek[6]!.date).toBe("2026-08-01"); // Saturday
    expect(lastWeek.some((d) => d.date === "2026-07-31")).toBe(true);
  });

  it("maps real activity counts onto the correct cells", () => {
    const grid = buildActivityCalendar([{ date: "2026-07-31", count: 5 }], "2026-07-31", 2);
    const flat = grid.flat();
    expect(flat.find((c) => c.date === "2026-07-31")?.count).toBe(5);
    expect(flat.filter((c) => c.date !== "2026-07-31").every((c) => c.count === 0)).toBe(true);
  });
});

describe("activityTier", () => {
  it("returns 0 for no activity", () => {
    expect(activityTier(0, 10)).toBe(0);
    expect(activityTier(3, 0)).toBe(0);
  });

  it("returns 4 for the busiest day", () => {
    expect(activityTier(10, 10)).toBe(4);
  });

  it("buckets proportionally between 1 and 3", () => {
    expect(activityTier(1, 10)).toBe(1);
    expect(activityTier(5, 10)).toBe(2);
    expect(activityTier(7, 10)).toBe(3);
  });
});
