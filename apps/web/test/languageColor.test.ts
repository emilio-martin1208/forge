import { describe, expect, it } from "vitest";
import { hashToHue } from "../src/lib/languageColor.js";

describe("hashToHue", () => {
  it("is deterministic for the same input", () => {
    expect(hashToHue("TypeScript")).toBe(hashToHue("TypeScript"));
  });

  it("returns a value within 0-359", () => {
    for (const name of ["TypeScript", "Python", "Go", "Rust", ""]) {
      const hue = hashToHue(name);
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThan(360);
    }
  });

  it("gives different common languages different hues", () => {
    const hues = new Set(["TypeScript", "Python", "Go", "Rust", "CSS"].map(hashToHue));
    expect(hues.size).toBeGreaterThan(1);
  });
});
