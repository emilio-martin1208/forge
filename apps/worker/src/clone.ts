import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface ClonedRepo {
  path: string;
  cleanup: () => void;
}

/**
 * Shallow-clones a repo into a throwaway temp directory using an
 * installation access token as the HTTPS credential. Shallow (--depth 1)
 * because v1 analysis only needs the working tree at HEAD, not history —
 * git-history-derived signals (commit velocity, contributor count) are a
 * deferred feature, not something we pay clone-depth cost for today.
 */
export function cloneRepository(params: {
  githubOwner: string;
  githubRepo: string;
  installationToken: string;
}): ClonedRepo {
  const { githubOwner, githubRepo, installationToken } = params;
  const dir = mkdtempSync(join(tmpdir(), "forge-repo-"));
  const url = `https://x-access-token:${installationToken}@github.com/${githubOwner}/${githubRepo}.git`;

  execFileSync("git", ["clone", "--depth", "1", url, dir], { stdio: "pipe" });

  return {
    path: dir,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}
