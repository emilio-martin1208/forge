import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@forge/database";
import type { GenerateReadmeResponse } from "@forge/types";
import {
  renderArchitectureMermaid,
  renderBadges,
  renderDependencyTable,
  renderEnvVarsTable,
  renderFolderTree,
  renderHealthScores,
} from "../shared/templates.js";
import { toSnapshotDto } from "../shared/snapshotMapper.js";
import { generateNarrativeSections } from "./narrative.js";

@Injectable()
export class ReadmeService {
  async generate(projectId: string): Promise<GenerateReadmeResponse> {
    const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId } });
    const snapshotRow = await prisma.repositorySnapshot.findFirst({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
    if (!snapshotRow) {
      throw new NotFoundException(`No snapshot yet for project ${projectId} — analysis may still be running`);
    }

    const snapshot = toSnapshotDto(snapshotRow);
    const repoSlug = `${project.githubOwner}/${project.githubRepo}`;

    const narrative = await generateNarrativeSections(snapshot, repoSlug);

    const markdown = [
      `# ${project.githubRepo}`,
      "",
      renderBadges(snapshot, repoSlug),
      "",
      narrative.description,
      "",
      "## Features",
      narrative.featureBullets,
      "",
      "## Architecture",
      renderArchitectureMermaid(snapshot),
      "",
      "## Folder Structure",
      renderFolderTree(snapshot),
      "",
      "## Dependencies",
      renderDependencyTable(snapshot),
      "",
      "## Environment Variables",
      renderEnvVarsTable(snapshot),
      "",
      "## Project Health",
      renderHealthScores(snapshot),
      "",
      "## License",
      "See [LICENSE](./LICENSE).",
    ].join("\n");

    await prisma.generatedReadme.create({
      data: { projectId, snapshotId: snapshot.id, markdown },
    });

    return {
      markdown,
      generatedAt: new Date().toISOString(),
      templatedSections: [
        "badges",
        "architecture",
        "folder-structure",
        "dependencies",
        "environment-variables",
        "project-health",
        "license",
      ],
      narrativeSections: ["description", "features"],
    };
  }
}
