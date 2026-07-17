import { Injectable, NotFoundException } from "@nestjs/common";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@forge/database";
import type { FeedbackReport } from "@forge/types";
import { toSnapshotDto } from "../shared/snapshotMapper.js";
import { diffSnapshots } from "./diff.js";
import { determineNextTaskGap } from "./recommendNextTask.js";

const SYSTEM_PROMPT = `You phrase a single next-task recommendation for a software project based on one
specific detected gap you're given. Write 1-2 sentences of rationale explaining why this is the
next highest-value task. Do not invent additional issues beyond the gap given. Output plain text,
no preamble, no markdown.`;

@Injectable()
export class FeedbackService {
  async generate(projectId: string): Promise<FeedbackReport> {
    const snapshotRows = await prisma.repositorySnapshot.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 2,
    });

    if (snapshotRows.length === 0) {
      throw new NotFoundException(`No snapshot yet for project ${projectId} — analysis may still be running`);
    }

    const current = toSnapshotDto(snapshotRows[0]!);
    const previous = snapshotRows[1] ? toSnapshotDto(snapshotRows[1]) : null;

    const diff = diffSnapshots(previous, current);
    const gap = determineNextTaskGap(diff, current);

    const summary = previous
      ? this.buildChangeSummary(diff)
      : "First analysis of this repository — nothing to compare against yet.";

    return {
      summary,
      newlyDetectedFeatures: diff.newlyDetectedFeatures,
      healthScoreDeltas: diff.healthScoreDeltas,
      nextTask: gap
        ? {
            title: this.gapToTitle(gap.category, gap.subject),
            rationale: await this.phraseRationale(gap.detail),
            category: gap.category,
          }
        : null,
    };
  }

  private buildChangeSummary(diff: ReturnType<typeof diffSnapshots>): string {
    const parts: string[] = [];
    if (diff.newlyDetectedFeatures.length > 0) {
      parts.push(`Newly detected: ${diff.newlyDetectedFeatures.join(", ")}.`);
    }
    const improved = Object.entries(diff.healthScoreDeltas).filter(([, delta]) => delta > 0);
    const regressed = Object.entries(diff.healthScoreDeltas).filter(([, delta]) => delta < 0);
    if (improved.length > 0) {
      parts.push(`Improved: ${improved.map(([dim, delta]) => `${dim} +${delta}`).join(", ")}.`);
    }
    if (regressed.length > 0) {
      parts.push(`Regressed: ${regressed.map(([dim, delta]) => `${dim} ${delta}`).join(", ")}.`);
    }
    return parts.length > 0 ? parts.join(" ") : "No structural change detected since the last analysis.";
  }

  private gapToTitle(category: "feature-gap" | "health-gap", subject: string): string {
    return category === "feature-gap"
      ? `Follow up on the new ${subject} feature`
      : `Improve ${subject}`;
  }

  /** Best-effort: falls back to the deterministic gap detail if no API key is configured, so this endpoint stays usable without one — unlike README/PR review, agents may poll this programmatically. */
  private async phraseRationale(gapDetail: string): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return gapDetail;

    try {
      const client = new Anthropic({ apiKey });
      const message = await client.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: gapDetail }],
      });
      const text = message.content.map((block) => (block.type === "text" ? block.text : "")).join(" ").trim();
      return text || gapDetail;
    } catch {
      return gapDetail;
    }
  }
}
