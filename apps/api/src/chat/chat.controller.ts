import { Body, Controller, Get, Inject, Param, Post } from "@nestjs/common";
import type { SendChatMessageRequest } from "@forge/types";
import { ChatService } from "./chat.service.js";

@Controller("projects/:id/chat")
export class ChatController {
  // @Inject() token — see the note in context-package.controller.ts.
  constructor(@Inject(ChatService) private readonly chat: ChatService) {}

  @Get()
  list(@Param("id") id: string) {
    return this.chat.listMessages(id);
  }

  @Post()
  send(@Param("id") id: string, @Body() body: SendChatMessageRequest) {
    return this.chat.sendMessage(id, body);
  }
}
