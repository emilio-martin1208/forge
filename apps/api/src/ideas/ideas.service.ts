import { Injectable, NotFoundException } from "@nestjs/common";
import Anthropic from "@anthropic-ai/sdk";
import { Prisma, prisma } from "@forge/database";
import type { GenerateIdeaRequest, ProjectIdea } from "@forge/types";
import { parseIdeaResponse } from "./parseIdeaResponse.js";

const SYSTEM_PROMPT = `You turn a short software idea description into a starting point for engineering
planning: a one-paragraph PRD summary, a short list of core features, and 2-3 distinct architecture
options with honest tradeoffs.

Rules:
- Base everything ONLY on the description given. Do not assume scale, team size, or constraints
  that weren't stated — if something matters and wasn't specified, note the assumption you're
  making inside the relevant field rather than inventing certainty.
- Architecture options must be genuinely different choices (e.g. monolith vs. service-oriented vs.
  serverless), not the same stack with cosmetic differences.
- Recommend exactly one option and say why, referencing the description — not a generic "most
  popular" justification.
- Output ONLY a JSON object, no prose outside it, matching exactly:
{"prdSummary": string, "coreFeatures": string[], "architectureOptions": [{"name": string, "stackSummary": string, "description": string, "tradeoffs": string[], "whenToChoose": string}], "recommendedIndex": number, "recommendationRationale": string}`;

function toJson<T>(value: T): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

function toIdeaDto(row: {
  id: string;
  ownerUserId: string;
  description: string;
  prdSummary: string;
  coreFeatures: unknown;
  architectureOptions: unknown;
  recommendedIndex: number;
  recommendationRationale: string;
  createdAt: Date;
}): ProjectIdea {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    description: row.description,
    prdSummary: row.prdSummary,
    coreFeatures: row.coreFeatures as string[],
    architectureOptions: row.architectureOptions as ProjectIdea["architectureOptions"],
    recommendedIndex: row.recommendedIndex,
    recommendationRationale: row.recommendationRationale,
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class IdeasService {
  async generate(ownerUserId: string, request: GenerateIdeaRequest): Promise<ProjectIdea> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured — idea generation requires it");
    }

    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: request.description }],
    });

    const text = message.content.map((block) => (block.type === "text" ? block.text : "")).join("\n");
    const parsed = parseIdeaResponse(text);

    const row = await prisma.projectIdea.create({
      data: {
        ownerUserId,
        description: request.description,
        prdSummary: parsed.prdSummary,
        coreFeatures: toJson(parsed.coreFeatures),
        architectureOptions: toJson(parsed.architectureOptions),
        recommendedIndex: parsed.recommendedIndex,
        recommendationRationale: parsed.recommendationRationale,
      },
    });

    return toIdeaDto(row);
  }

  async list(ownerUserId: string): Promise<ProjectIdea[]> {
    const rows = await prisma.projectIdea.findMany({
      where: { ownerUserId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toIdeaDto);
  }

  async getById(id: string): Promise<ProjectIdea> {
    const row = await prisma.projectIdea.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`Idea ${id} not found`);
    return toIdeaDto(row);
  }
}
