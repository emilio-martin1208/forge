import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { CiProvider, DockerInfo, TestingInfo } from "@forge/types";
import type { WalkedFile } from "../walk.js";

export function detectDocker(rootDir: string): DockerInfo {
  const hasDockerfile = existsSync(join(rootDir, "Dockerfile"));
  const hasDockerCompose =
    existsSync(join(rootDir, "docker-compose.yml")) || existsSync(join(rootDir, "docker-compose.yaml"));

  const baseImages: string[] = [];
  if (hasDockerfile) {
    try {
      const content = readFileSync(join(rootDir, "Dockerfile"), "utf-8");
      for (const line of content.split("\n")) {
        const match = line.match(/^\s*FROM\s+([^\s]+)/i);
        if (match?.[1]) baseImages.push(match[1]);
      }
    } catch {
      // unreadable Dockerfile — presence still counts
    }
  }

  return { hasDockerfile, hasDockerCompose, baseImages };
}

export function detectCi(rootDir: string): CiProvider[] {
  const providers: CiProvider[] = [];

  const workflowsDir = join(rootDir, ".github", "workflows");
  if (existsSync(workflowsDir)) {
    try {
      const files = readdirSync(workflowsDir)
        .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
        .map((f) => `.github/workflows/${f}`);
      if (files.length > 0) providers.push({ provider: "github-actions", files });
    } catch {
      // unreadable dir
    }
  }

  if (existsSync(join(rootDir, ".circleci", "config.yml"))) {
    providers.push({ provider: "circleci", files: [".circleci/config.yml"] });
  }
  if (existsSync(join(rootDir, ".gitlab-ci.yml"))) {
    providers.push({ provider: "gitlab-ci", files: [".gitlab-ci.yml"] });
  }
  if (existsSync(join(rootDir, ".travis.yml"))) {
    providers.push({ provider: "travis", files: [".travis.yml"] });
  }

  return providers;
}

const TEST_FRAMEWORK_DEP_NAMES = ["jest", "vitest", "mocha", "pytest", "@playwright/test", "cypress"];
const TEST_FILE_PATTERN = /(\.test\.|\.spec\.|_test\.py$|test_.*\.py$)/;

export function detectTesting(files: WalkedFile[], dependencyNames: Set<string>): TestingInfo {
  const frameworks = TEST_FRAMEWORK_DEP_NAMES.filter((name) => dependencyNames.has(name));
  const testFileCount = files.filter(
    (f) => TEST_FILE_PATTERN.test(f.path) || f.path.includes("/tests/") || f.path.includes("/__tests__/"),
  ).length;
  const hasCoverageConfig = files.some((f) =>
    ["jest.config", ".nycrc", "vitest.config", "pytest.ini", "setup.cfg"].some((marker) => f.path.includes(marker)),
  );

  return { frameworks, testFileCount, hasCoverageConfig };
}
