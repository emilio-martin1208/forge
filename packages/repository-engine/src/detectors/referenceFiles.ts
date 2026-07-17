import { readFileSync } from "node:fs";
import type { ReferenceFile } from "@forge/types";
import type { WalkedFile } from "../walk.js";

// Explicit allowlist, not a general capture mechanism — see the ReferenceFile
// doc comment in packages/types. Add a path here only when a downstream
// feature (currently: context-package generation) needs the raw content of
// that specific file, not the structured facts already captured elsewhere.
const REFERENCE_FILE_PATHS = new Set(["prisma/schema.prisma"]);

const MAX_SIZE_BYTES = 100_000;

export function detectReferenceFiles(files: WalkedFile[]): ReferenceFile[] {
  const results: ReferenceFile[] = [];

  for (const file of files) {
    if (!REFERENCE_FILE_PATHS.has(file.path)) continue;
    if (file.sizeBytes > MAX_SIZE_BYTES) continue;

    try {
      results.push({ path: file.path, content: readFileSync(file.absolutePath, "utf-8") });
    } catch {
      // unreadable — skip, this is best-effort supplementary data
    }
  }

  return results;
}
