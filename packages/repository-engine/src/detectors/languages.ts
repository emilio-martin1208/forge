import { readFileSync } from "node:fs";
import type { LanguageStat } from "@forge/types";
import type { WalkedFile } from "../walk.js";

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".mjs": "JavaScript",
  ".cjs": "JavaScript",
  ".py": "Python",
  ".rb": "Ruby",
  ".go": "Go",
  ".rs": "Rust",
  ".java": "Java",
  ".kt": "Kotlin",
  ".swift": "Swift",
  ".php": "PHP",
  ".css": "CSS",
  ".scss": "SCSS",
  ".html": "HTML",
  ".sql": "SQL",
  ".sh": "Shell",
  ".yml": "YAML",
  ".yaml": "YAML",
  ".prisma": "Prisma Schema",
};

function countLines(absolutePath: string): number {
  try {
    const content = readFileSync(absolutePath, "utf-8");
    return content.length === 0 ? 0 : content.split("\n").length;
  } catch {
    return 0;
  }
}

export function detectLanguages(files: WalkedFile[]): LanguageStat[] {
  const stats = new Map<string, { fileCount: number; lineCount: number }>();

  for (const file of files) {
    const ext = "." + (file.path.split(".").pop() ?? "");
    const language = EXTENSION_TO_LANGUAGE[ext];
    if (!language) continue;

    const lines = countLines(file.absolutePath);
    const existing = stats.get(language) ?? { fileCount: 0, lineCount: 0 };
    existing.fileCount += 1;
    existing.lineCount += lines;
    stats.set(language, existing);
  }

  const totalLines = [...stats.values()].reduce((sum, s) => sum + s.lineCount, 0) || 1;

  return [...stats.entries()]
    .map(([name, { fileCount, lineCount }]) => ({
      name,
      fileCount,
      lineCount,
      percentage: Math.round((lineCount / totalLines) * 1000) / 10,
    }))
    .sort((a, b) => b.lineCount - a.lineCount);
}
