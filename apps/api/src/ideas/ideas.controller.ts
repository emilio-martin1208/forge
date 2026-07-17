import { Body, Controller, Get, Inject, Param, Post, Req } from "@nestjs/common";
import type { GenerateIdeaRequest } from "@forge/types";
import { IdeasService } from "./ideas.service.js";
import { getDevUserId } from "../shared/devUser.js";

@Controller("ideas")
export class IdeasController {
  // @Inject() token — see the note in context-package.controller.ts.
  constructor(@Inject(IdeasService) private readonly ideas: IdeasService) {}

  @Post()
  async generate(@Req() req: { userId?: string }, @Body() body: GenerateIdeaRequest) {
    const ownerUserId = req.userId ?? (await getDevUserId());
    return this.ideas.generate(ownerUserId, body);
  }

  @Get()
  async list(@Req() req: { userId?: string }) {
    const ownerUserId = req.userId ?? (await getDevUserId());
    return this.ideas.list(ownerUserId);
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.ideas.getById(id);
  }
}
