import { Injectable } from "@nestjs/common";
import { prisma } from "@forge/database";
import type { RoadmapItem } from "@forge/types";

@Injectable()
export class RoadmapService {
  async list(projectId: string): Promise<RoadmapItem[]> {
    const rows = await prisma.roadmapItem.findMany({
      where: { projectId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    return rows.map((row) => ({
      id: row.id,
      projectId: row.projectId,
      title: row.title,
      status: row.status as RoadmapItem["status"],
      source: row.source as RoadmapItem["source"],
      sourceIssueNumber: row.sourceIssueNumber,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }
}
