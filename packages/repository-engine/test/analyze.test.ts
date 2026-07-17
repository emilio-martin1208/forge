import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { analyzeRepository } from "../src/analyze.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(__dirname, "fixtures", "sample-repo");

describe("analyzeRepository", () => {
  const snapshot = analyzeRepository({
    rootDir: FIXTURE_ROOT,
    projectId: "test-project",
    commitSha: "deadbeef",
    defaultBranch: "main",
  });

  it("detects languages by extension with line counts", () => {
    const ts = snapshot.languages.find((l) => l.name === "TypeScript");
    expect(ts).toBeDefined();
    expect(ts!.fileCount).toBeGreaterThan(0);
  });

  it("detects frameworks from package.json dependencies", () => {
    const names = snapshot.frameworks.map((f) => f.name);
    expect(names).toContain("Next.js");
    expect(names).toContain("Express");
    expect(names).toContain("Prisma");
    expect(names).toContain("Tailwind CSS");
  });

  it("finds Prisma framework version from the matched dependency", () => {
    const prisma = snapshot.frameworks.find((f) => f.name === "Prisma");
    expect(prisma?.version).toBe("5.16.1");
    expect(prisma?.evidence).toContain("dependency:prisma");
  });

  it("detects the authentication and payments features via dependency signatures", () => {
    const auth = snapshot.features.find((f) => f.kind === "authentication");
    const payments = snapshot.features.find((f) => f.kind === "payments");
    expect(auth?.detected).toBe(true);
    expect(payments?.detected).toBe(true);

    const chat = snapshot.features.find((f) => f.kind === "chat");
    expect(chat?.detected).toBe(false);
  });

  it("extracts env vars and flags the undocumented one", () => {
    const byName = new Map(snapshot.envVars.map((v) => [v.name, v]));
    expect(byName.get("DATABASE_URL")?.documentedInExample).toBe(true);
    expect(byName.get("STRIPE_SECRET_KEY")?.documentedInExample).toBe(true);
    expect(byName.get("SAMPLE_UNDOCUMENTED_SECRET")?.documentedInExample).toBe(false);
    expect(byName.get("SAMPLE_UNDOCUMENTED_SECRET")?.referencedIn).toContain(
      "app/api/health/route.ts",
    );
  });

  it("detects the Next.js App Router GET route", () => {
    const route = snapshot.routes.find((r) => r.framework === "Next.js (App Router)");
    expect(route).toBeDefined();
    expect(route?.method).toBe("GET");
    expect(route?.path).toBe("/api/health");
  });

  it("detects the Express routes via method-call regex", () => {
    const expressRoutes = snapshot.routes.filter((r) => r.framework === "Express");
    expect(expressRoutes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ method: "GET", path: "/ping" }),
        expect.objectContaining({ method: "POST", path: "/webhooks/stripe" }),
      ]),
    );
  });

  it("detects Docker and CI presence", () => {
    expect(snapshot.docker.hasDockerfile).toBe(true);
    expect(snapshot.docker.baseImages).toContain("node:20-alpine");
    expect(snapshot.ci.map((c) => c.provider)).toContain("github-actions");
  });

  it("detects the vitest test file and framework", () => {
    expect(snapshot.testing.frameworks).toContain("vitest");
    expect(snapshot.testing.testFileCount).toBeGreaterThan(0);
  });

  it("computes non-zero health scores across all dimensions", () => {
    for (const score of Object.values(snapshot.healthScores)) {
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    }
    // README + LICENSE present -> documentation score should clear the baseline
    expect(snapshot.healthScores.documentation).toBeGreaterThanOrEqual(60);
  });

  it("ignores node_modules and other always-ignored directories", () => {
    expect(snapshot.fileTree.topLevelEntries).not.toContain("node_modules");
  });

  it("captures prisma/schema.prisma as a reference file", () => {
    const schema = snapshot.referenceFiles.find((f) => f.path === "prisma/schema.prisma");
    expect(schema).toBeDefined();
    expect(schema?.content).toContain("model User");
  });

  it("does not capture files outside the reference file allowlist", () => {
    expect(snapshot.referenceFiles.find((f) => f.path === "package.json")).toBeUndefined();
  });
});
