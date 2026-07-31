import { describe, expect, it } from "vitest";
import { greetingForHour } from "../src/lib/greeting.js";

describe("greetingForHour", () => {
  it("greets morning hours", () => {
    expect(greetingForHour(8)).toBe("Good morning");
  });
  it("greets afternoon hours", () => {
    expect(greetingForHour(14)).toBe("Good afternoon");
  });
  it("greets evening/night hours", () => {
    expect(greetingForHour(20)).toBe("Good evening");
    expect(greetingForHour(2)).toBe("Good evening");
  });
});
