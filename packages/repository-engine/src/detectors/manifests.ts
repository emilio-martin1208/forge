import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { DependencyRecord } from "@forge/types";

interface PackageJsonShape {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  workspaces?: string[] | { packages?: string[] };
}

function readJsonSafe<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    return null;
  }
}

function readTextSafe(path: string): string | null {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return null;
  }
}

function parsePackageJson(rootDir: string): DependencyRecord[] {
  const pkg = readJsonSafe<PackageJsonShape>(join(rootDir, "package.json"));
  if (!pkg) return [];
  const deps: DependencyRecord[] = [];
  for (const [name, version] of Object.entries(pkg.dependencies ?? {})) {
    deps.push({ name, version, ecosystem: "npm", isDev: false });
  }
  for (const [name, version] of Object.entries(pkg.devDependencies ?? {})) {
    deps.push({ name, version, ecosystem: "npm", isDev: true });
  }
  return deps;
}

// requirements.txt lines look like: "django==4.2.1", "requests>=2.0", "flask"
function parseRequirementsTxt(rootDir: string): DependencyRecord[] {
  const text = readTextSafe(join(rootDir, "requirements.txt"));
  if (!text) return [];
  const deps: DependencyRecord[] = [];
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith("-")) continue;
    const match = line.match(/^([A-Za-z0-9_.\-]+)\s*(==|>=|<=|~=|>|<)?\s*([A-Za-z0-9_.\-]*)/);
    if (!match) continue;
    const [, name, , version] = match;
    if (!name) continue;
    deps.push({ name: name.toLowerCase(), version: version || "*", ecosystem: "pip", isDev: false });
  }
  return deps;
}

// pyproject.toml: only the [project.dependencies] / [tool.poetry.dependencies]
// array-of-strings / table forms are parsed — enough to detect frameworks
// without pulling in a full TOML parser dependency.
function parsePyprojectToml(rootDir: string): DependencyRecord[] {
  const text = readTextSafe(join(rootDir, "pyproject.toml"));
  if (!text) return [];
  const deps: DependencyRecord[] = [];

  const depsBlock = text.match(/dependencies\s*=\s*\[([\s\S]*?)\]/);
  if (depsBlock?.[1]) {
    const entries = depsBlock[1].match(/"([^"]+)"/g) ?? [];
    for (const raw of entries) {
      const spec = raw.replace(/"/g, "");
      const match = spec.match(/^([A-Za-z0-9_.\-]+)/);
      if (match?.[1]) {
        deps.push({ name: match[1].toLowerCase(), version: "*", ecosystem: "pip", isDev: false });
      }
    }
  }

  const poetryBlock = text.match(/\[tool\.poetry\.dependencies\]([\s\S]*?)(\n\[|$)/);
  if (poetryBlock?.[1]) {
    for (const line of poetryBlock[1].split("\n")) {
      const match = line.match(/^([A-Za-z0-9_.\-]+)\s*=/);
      if (match?.[1] && match[1].toLowerCase() !== "python") {
        deps.push({ name: match[1].toLowerCase(), version: "*", ecosystem: "pip", isDev: false });
      }
    }
  }

  return deps;
}

// npm/yarn/pnpm workspaces ("apps/*", "packages/*") each carry their own
// dependencies — a monorepo's real frameworks (Next.js, Nest.js, Prisma,
// test runners) usually live in those manifests, not the root one. Only
// simple `dir/*` glob patterns are expanded (a one-level readdir), not full
// glob syntax — every real-world workspaces field uses exactly this shape,
// and pulling in a glob library for anything fancier isn't earning its keep.
function resolveWorkspaceDirs(rootDir: string): string[] {
  const pkg = readJsonSafe<PackageJsonShape>(join(rootDir, "package.json"));
  if (!pkg?.workspaces) return [];
  const patterns = Array.isArray(pkg.workspaces) ? pkg.workspaces : pkg.workspaces.packages ?? [];

  const dirs: string[] = [];
  for (const pattern of patterns) {
    if (pattern.endsWith("/*")) {
      const parent = join(rootDir, pattern.slice(0, -2));
      if (!existsSync(parent)) continue;
      for (const entry of readdirSync(parent, { withFileTypes: true })) {
        if (entry.isDirectory()) dirs.push(join(parent, entry.name));
      }
    } else {
      const dir = join(rootDir, pattern);
      if (existsSync(dir)) dirs.push(dir);
    }
  }
  return dirs;
}

export function detectDependencies(rootDir: string): DependencyRecord[] {
  const allDeps = [
    ...parsePackageJson(rootDir),
    ...parseRequirementsTxt(rootDir),
    ...parsePyprojectToml(rootDir),
    ...resolveWorkspaceDirs(rootDir).flatMap((dir) => parsePackageJson(dir)),
  ];

  // De-duplicate by (ecosystem, name), keeping the first occurrence — root
  // manifest wins over workspace manifests over later workspace manifests,
  // which is an arbitrary but stable tie-break for version-string display;
  // detection (is this dependency present at all) doesn't depend on which
  // version string wins.
  const seen = new Map<string, DependencyRecord>();
  for (const dep of allDeps) {
    const key = `${dep.ecosystem}:${dep.name}`;
    if (!seen.has(key)) seen.set(key, dep);
  }
  return [...seen.values()];
}

export function readPackageJsonName(rootDir: string): string | null {
  const pkg = readJsonSafe<{ name?: string }>(join(rootDir, "package.json"));
  return pkg?.name ?? null;
}
