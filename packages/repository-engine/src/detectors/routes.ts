import { readFileSync } from "node:fs";
import type { RouteRecord } from "@forge/types";
import type { WalkedFile } from "../walk.js";

// v1 route detection is convention + regex based, not AST-based. It covers
// the two most common Node backend shapes (Next.js App Router file
// convention, Express-style method calls). Framework-agnostic structural
// extraction (tree-sitter queries across languages) is the natural v2
// upgrade once this signal layer is proven against real repos — see
// docs/architecture.md.

function detectNextAppRouterRoutes(files: WalkedFile[]): RouteRecord[] {
  const routes: RouteRecord[] = [];
  const routeFiles = files.filter((f) => /\/app\/.*\/route\.(ts|js)$/.test(`/${f.path}`));

  for (const file of routeFiles) {
    const urlPath =
      "/" +
      file.path
        .replace(/^(?:.*\/)?app\//, "")
        .replace(/\/route\.(ts|js)$/, "")
        .replace(/\[([^\]]+)\]/g, ":$1");

    let content = "";
    try {
      content = readFileSync(file.absolutePath, "utf-8");
    } catch {
      // unreadable — still record the path with UNKNOWN methods below
    }

    const methods = (["GET", "POST", "PUT", "PATCH", "DELETE"] as const).filter((m) =>
      new RegExp(`export\\s+(async\\s+)?function\\s+${m}\\b|export\\s+const\\s+${m}\\s*=`).test(content),
    );

    for (const method of methods.length > 0 ? methods : (["UNKNOWN"] as const)) {
      routes.push({ method, path: urlPath || "/", file: file.path, framework: "Next.js (App Router)" });
    }
  }

  return routes;
}

const EXPRESS_METHOD_PATTERN =
  /\b(?:app|router)\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]+)["'`]/g;

function detectExpressRoutes(files: WalkedFile[]): RouteRecord[] {
  const routes: RouteRecord[] = [];
  const candidateFiles = files.filter((f) => /\.(ts|js)$/.test(f.path) && !f.path.includes("node_modules"));

  for (const file of candidateFiles) {
    let content: string;
    try {
      content = readFileSync(file.absolutePath, "utf-8");
    } catch {
      continue;
    }
    if (!content.includes("express")) continue;

    EXPRESS_METHOD_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = EXPRESS_METHOD_PATTERN.exec(content)) !== null) {
      const [, method, path] = match;
      if (!method || !path) continue;
      routes.push({
        method: method.toUpperCase() as RouteRecord["method"],
        path,
        file: file.path,
        framework: "Express",
      });
    }
  }

  return routes;
}

export function detectRoutes(files: WalkedFile[]): RouteRecord[] {
  return [...detectNextAppRouterRoutes(files), ...detectExpressRoutes(files)];
}
