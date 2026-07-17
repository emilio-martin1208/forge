import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { createRequire } from "node:module";
import type { Ignore } from "ignore";

// `ignore` ships a CJS `module.exports = factory` with a `.d.ts` that
// declares `export default factory` — under NodeNext + esModuleInterop that
// mismatch makes the default import resolve to a non-callable namespace.
// createRequire sidesteps the broken type resolution; the `typeof import`
// keeps the call site fully typed.
const require = createRequire(import.meta.url);
const ignore = require("ignore") as typeof import("ignore").default;

// Directories we never descend into, regardless of .gitignore contents.
// These are large, generated, or binary-heavy and analyzing them wastes
// time without adding signal about the project itself.
const ALWAYS_IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "out",
  ".next",
  ".turbo",
  ".venv",
  "venv",
  "__pycache__",
  ".pytest_cache",
  "vendor",
  "target", // rust/java build output
  "coverage",
  ".cache",
]);

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg",
  ".woff", ".woff2", ".ttf", ".eot",
  ".mp4", ".mov", ".mp3", ".wav",
  ".zip", ".tar", ".gz", ".7z",
  ".pdf", ".exe", ".dll", ".so", ".dylib",
  ".lock", // package-lock.json etc are text but not meaningful source signal
]);

export interface WalkedFile {
  /** Path relative to repo root, forward-slash separated */
  path: string;
  absolutePath: string;
  sizeBytes: number;
}

export interface WalkResult {
  files: WalkedFile[];
  totalDirectories: number;
  ignoredFileCount: number;
  topLevelEntries: string[];
}

function loadGitignore(rootDir: string): Ignore {
  const ig = ignore();
  try {
    const contents = readFileSync(join(rootDir, ".gitignore"), "utf-8");
    ig.add(contents);
  } catch {
    // no .gitignore — fine, ALWAYS_IGNORE_DIRS still applies
  }
  return ig;
}

/**
 * Walks a repository directory, respecting .gitignore plus a hardcoded
 * ignore list for directories that are never useful to analyze (build
 * output, dependency caches, VCS internals).
 */
export function walkRepository(rootDir: string): WalkResult {
  const ig = loadGitignore(rootDir);
  const files: WalkedFile[] = [];
  let totalDirectories = 0;
  let ignoredFileCount = 0;

  const topLevelEntries = readdirSync(rootDir).filter(
    (entry) => !ALWAYS_IGNORE_DIRS.has(entry) && entry !== ".git",
  );

  function walk(dir: string) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = join(dir, entry.name);
      const relPath = relative(rootDir, absolutePath).split(sep).join("/");

      if (entry.isDirectory()) {
        if (ALWAYS_IGNORE_DIRS.has(entry.name)) continue;
        if (ig.ignores(relPath + "/")) continue;
        totalDirectories += 1;
        walk(absolutePath);
        continue;
      }

      if (!entry.isFile()) continue;
      if (ig.ignores(relPath)) {
        ignoredFileCount += 1;
        continue;
      }
      const ext = extnameLower(entry.name);
      if (BINARY_EXTENSIONS.has(ext)) {
        ignoredFileCount += 1;
        continue;
      }

      const size = statSync(absolutePath).size;
      files.push({ path: relPath, absolutePath, sizeBytes: size });
    }
  }

  walk(rootDir);

  return { files, totalDirectories, ignoredFileCount, topLevelEntries };
}

function extnameLower(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx === -1 ? "" : filename.slice(idx).toLowerCase();
}
