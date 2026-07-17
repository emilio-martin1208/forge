import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { DependencyRecord } from "@forge/types";

interface PackageJsonShape {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
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

export function detectDependencies(rootDir: string): DependencyRecord[] {
  return [
    ...parsePackageJson(rootDir),
    ...parseRequirementsTxt(rootDir),
    ...parsePyprojectToml(rootDir),
  ];
}

export function readPackageJsonName(rootDir: string): string | null {
  const pkg = readJsonSafe<{ name?: string }>(join(rootDir, "package.json"));
  return pkg?.name ?? null;
}
