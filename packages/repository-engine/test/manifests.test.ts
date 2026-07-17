import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { detectDependencies } from "../src/detectors/manifests.js";
import { detectFrameworks } from "../src/detectors/frameworks.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MONOREPO_ROOT = join(__dirname, "fixtures", "monorepo");

describe("detectDependencies with npm workspaces", () => {
  const deps = detectDependencies(MONOREPO_ROOT);

  it("includes dependencies from the root package.json", () => {
    expect(deps.find((d) => d.name === "turbo")).toBeDefined();
  });

  it("includes dependencies from apps/* workspace packages", () => {
    expect(deps.find((d) => d.name === "next")).toBeDefined();
  });

  it("includes dependencies from packages/* workspace packages", () => {
    expect(deps.find((d) => d.name === "fastify")).toBeDefined();
    expect(deps.find((d) => d.name === "vitest")).toBeDefined();
  });

  it("de-duplicates a dependency declared in both root and a workspace, keeping the root version", () => {
    const turboEntries = deps.filter((d) => d.name === "turbo");
    expect(turboEntries).toHaveLength(1);
    expect(turboEntries[0]?.version).toBe("2.3.3");
  });

  it("feeds through to framework detection finding workspace-only frameworks", () => {
    const frameworks = detectFrameworks(MONOREPO_ROOT, deps);
    expect(frameworks.map((f) => f.name)).toEqual(expect.arrayContaining(["Next.js", "Fastify", "Vitest"]));
  });
});
