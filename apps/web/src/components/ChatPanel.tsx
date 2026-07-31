"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@forge/types";
import { forgeApi } from "@/lib/api";

export function ChatPanel({ projectId, initialMessages }: { projectId: string; initialMessages: ChatMessage[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setError(null);
    setSending(true);
    setInput("");

    const optimisticUserMessage: ChatMessage = {
      id: `pending-${Date.now()}`,
      projectId,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);

    try {
      const reply = await forgeApi.sendChatMessage(projectId, { message: text });
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-4">
        {messages.length === 0 && (
          <p className="text-muted text-sm">
            Ask about this repo — grounded only in what Forge&apos;s analyzer actually found. It won&apos;t
            guess at things outside the snapshot.
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm whitespace-pre-wrap ${
              message.role === "user" ? "self-end bg-accent text-white" : "self-start bg-surface border border-border"
            }`}
          >
            {message.content}
          </div>
        ))}
        {sending && <div className="self-start text-sm text-muted">Thinking…</div>}
        {error && <div className="self-start text-sm text-red-400">{error}</div>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 pt-3 border-t border-border">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this repository…"
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={sending || input.trim().length === 0}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
