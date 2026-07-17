import { readFileSync } from "node:fs";
import type { EnvVarRecord } from "@forge/types";
import type { WalkedFile } from "../walk.js";

const ENV_REFERENCE_PATTERNS = [
  /process\.env\.([A-Z0-9_]+)/g,
  /process\.env\[["']([A-Z0-9_]+)["']\]/g,
  /os\.environ\.get\(["']([A-Z0-9_]+)["']/g,
  /os\.environ\[["']([A-Z0-9_]+)["']\]/g,
  /os\.getenv\(["']([A-Z0-9_]+)["']/g,
];

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py"]);

function parseEnvExample(content: string): Set<string> {
  const names = new Set<string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Z0-9_]+)\s*=/);
    if (match?.[1]) names.add(match[1]);
  }
  return names;
}

export function detectEnvVars(files: WalkedFile[]): EnvVarRecord[] {
  const documented = new Set<string>();
  const exampleFile = files.find((f) => /^\.env\.example$|^\.env\.sample$/.test(f.path.split("/").pop() ?? ""));
  if (exampleFile) {
    try {
      for (const name of parseEnvExample(readFileSync(exampleFile.absolutePath, "utf-8"))) {
        documented.add(name);
      }
    } catch {
      // unreadable — treat as undocumented
    }
  }

  const referencedIn = new Map<string, Set<string>>();
  for (const file of files) {
    const ext = "." + (file.path.split(".").pop() ?? "");
    if (!SOURCE_EXTENSIONS.has(ext)) continue;

    let content: string;
    try {
      content = readFileSync(file.absolutePath, "utf-8");
    } catch {
      continue;
    }

    for (const pattern of ENV_REFERENCE_PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1];
        if (!name) continue;
        if (!referencedIn.has(name)) referencedIn.set(name, new Set());
        referencedIn.get(name)!.add(file.path);
      }
    }
  }

  const allNames = new Set([...documented, ...referencedIn.keys()]);
  return [...allNames].sort().map((name) => ({
    name,
    referencedIn: [...(referencedIn.get(name) ?? [])],
    documentedInExample: documented.has(name),
  }));
}
