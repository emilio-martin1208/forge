import { describe, expect, it } from "vitest";
import { selectRelevantFiles } from "../src/context/relevance.js";
import { buildTestSnapshot } from "./fixtures/snapshot.js";

describe("selectRelevantFiles", () => {
  const snapshot = buildTestSnapshot({
    routes: [
      { method: "POST", path: "/checkout", file: "app/api/checkout/route.ts", framework: "Next.js (App Router)" },
      { method: "GET", path: "/ping", file: "src/server/health.ts", framework: "Express" },
    ],
    frameworks: [
      { name: "Stripe", category: "backend", version: "15.0.0", evidence: ["dependency:stripe", "file:src/lib/stripe.ts"] },
      { name: "Prisma", category: "orm", version: "5.0.0", evidence: ["dependency:prisma", "file:prisma/schema.prisma"] },
    ],
    envVars: [
      { name: "STRIPE_SECRET_KEY", referencedIn: ["src/lib/stripe.ts", "app/api/checkout/route.ts"], documentedInExample: true },
    ],
    referenceFiles: [{ path: "prisma/schema.prisma", content: "model User {}" }],
  });

  it("ranks files matching task keywords above unrelated files", () => {
    const files = selectRelevantFiles(snapshot, "Implement Stripe checkout payment flow");
    expect(files).toContain("app/api/checkout/route.ts");
    expect(files).toContain("src/lib/stripe.ts");
    expect(files).not.toContain("src/server/health.ts");
  });

  it("matches database-related tasks to the captured schema file", () => {
    const files = selectRelevantFiles(snapshot, "Add a new database model for orders");
    expect(files).toContain("prisma/schema.prisma");
  });

  it("returns an empty list when the task description has no matching signal", () => {
    const files = selectRelevantFiles(snapshot, "xyzzy plugh");
    expect(files).toEqual([]);
  });

  it("respects the limit parameter", () => {
    const files = selectRelevantFiles(snapshot, "checkout stripe payment route health server", 1);
    expect(files.length).toBeLessThanOrEqual(1);
  });
});
