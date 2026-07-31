import { Injectable } from "@nestjs/common";
import { prisma } from "@forge/database";
import type { ActivityResponse, LanguageStat } from "@forge/types";
import { computeStreaks } from "./computeStreaks.js";
import { aggregateLanguages } from "./aggregateLanguages.js";

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

@Injectable()
export class ActivityService {
  /**
   * No separate "session" or "usage event" tracking exists — activity is
   * derived from real timestamps already stored for other reasons (a
   * snapshot ran, a README got generated, a chat message was sent, an idea
   * was created). Honest and sparse for a new account rather than a
   * fabricated-looking streak.
   */
  async getActivity(ownerUserId: string): Promise<ActivityResponse> {
    const projects = await prisma.project.findMany({
      where: { ownerUserId },
      select: { id: true, createdAt: true },
    });
    const projectIds = projects.map((p) => p.id);

    const [snapshots, chatMessages, readmes, ideas] = await Promise.all([
      prisma.repositorySnapshot.findMany({
        where: { projectId: { in: projectIds } },
        select: { projectId: true, createdAt: true, languages: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.chatMessage.findMany({
        where: { projectId: { in: projectIds } },
        select: { createdAt: true },
      }),
      prisma.generatedReadme.findMany({
        where: { projectId: { in: projectIds } },
        select: { createdAt: true },
      }),
      prisma.projectIdea.findMany({
        where: { ownerUserId },
        select: { createdAt: true },
      }),
    ]);

    const countsByDate = new Map<string, number>();
    const bump = (date: Date) => {
      const key = toDateKey(date);
      countsByDate.set(key, (countsByDate.get(key) ?? 0) + 1);
    };
    projects.forEach((p) => bump(p.createdAt));
    snapshots.forEach((s) => bump(s.createdAt));
    chatMessages.forEach((m) => bump(m.createdAt));
    readmes.forEach((r) => bump(r.createdAt));
    ideas.forEach((i) => bump(i.createdAt));

    const activityByDate = [...countsByDate.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const today = toDateKey(new Date());
    const { currentStreak, longestStreak } = computeStreaks(new Set(countsByDate.keys()), today);

    // snapshots are ordered createdAt desc, so the first one seen per
    // project is its latest — used for the language breakdown.
    const latestLanguagesByProject = new Map<string, LanguageStat[]>();
    for (const snap of snapshots) {
      if (!latestLanguagesByProject.has(snap.projectId)) {
        latestLanguagesByProject.set(snap.projectId, snap.languages as unknown as LanguageStat[]);
      }
    }
    const languageBreakdown = aggregateLanguages([...latestLanguagesByProject.values()]);

    return {
      activityByDate,
      currentStreak,
      longestStreak,
      totalActiveDays: countsByDate.size,
      languageBreakdown,
    };
  }
}
