import { Injectable, NotFoundException } from "@nestjs/common";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@forge/database";
import type { ChatMessage, SendChatMessageRequest } from "@forge/types";
import { toSnapshotDto } from "../shared/snapshotMapper.js";
import { summarizeSnapshotForChat } from "./summarizeSnapshotForChat.js";

const SYSTEM_PROMPT_PREFIX = `You are Forge's assistant for one specific repository. You are given a
compact summary of what Forge's deterministic analyzer actually found — languages, frameworks,
routes, detected features, dependencies, environment variables, test setup, and health scores.

Answer using ONLY this data. If something isn't in it, say so plainly ("that's not visible in the
current snapshot" or similar) rather than guessing at implementation details you can't actually see
— you are reasoning over Forge's structured analysis of the repo, not reading its source directly.

Keep answers concise and direct.

Repository summary:
`;

const MAX_HISTORY_MESSAGES = 20;

function toMessageDto(row: {
  id: string;
  projectId: string;
  role: string;
  content: string;
  createdAt: Date;
}): ChatMessage {
  return {
    id: row.id,
    projectId: row.projectId,
    role: row.role as ChatMessage["role"],
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class ChatService {
  async listMessages(projectId: string): Promise<ChatMessage[]> {
    const rows = await prisma.chatMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toMessageDto);
  }

  async sendMessage(projectId: string, request: SendChatMessageRequest): Promise<ChatMessage> {
    const snapshotRow = await prisma.repositorySnapshot.findFirst({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
    if (!snapshotRow) {
      throw new NotFoundException(`No snapshot yet for project ${projectId} — analysis may still be running`);
    }

    // Checked before persisting anything: a missing key is a static config
    // problem, not a transient failure, so there's no point leaving an
    // unanswered user message sitting in history every time someone tries.
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured — chat requires it");
    }

    const snapshot = toSnapshotDto(snapshotRow);
    await prisma.chatMessage.create({ data: { projectId, role: "user", content: request.message } });

    const history = await prisma.chatMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: MAX_HISTORY_MESSAGES,
    });
    const orderedHistory = history.reverse();

    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1000,
      system: SYSTEM_PROMPT_PREFIX + JSON.stringify(summarizeSnapshotForChat(snapshot)),
      messages: orderedHistory.map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      })),
    });

    const text = message.content.map((block) => (block.type === "text" ? block.text : "")).join("\n");

    const assistantRow = await prisma.chatMessage.create({
      data: { projectId, role: "assistant", content: text || "(no response)" },
    });

    return toMessageDto(assistantRow);
  }
}
