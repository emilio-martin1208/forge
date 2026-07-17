import { Body, Controller, Get, Inject, Param, Post, Req } from "@nestjs/common";
import type { ConnectRepositoryRequest } from "@forge/types";
import { ProjectsService } from "./projects.service.js";
import { getDevUserId } from "../shared/devUser.js";

@Controller("projects")
export class ProjectsController {
  // @Inject() token — see the note in context-package.controller.ts.
  constructor(@Inject(ProjectsService) private readonly projects: ProjectsService) {}

  @Post()
  async connect(@Req() req: { userId?: string }, @Body() body: ConnectRepositoryRequest) {
    // req.userId is populated by the auth guard (GitHub OAuth session) —
    // omitted here since auth middleware is outside v1 scope; see
    // docs/architecture.md for the deferred auth design. getDevUserId()
    // resolves to a real User row rather than an unresolvable string literal.
    const ownerUserId = req.userId ?? (await getDevUserId());
    return this.projects.connect(ownerUserId, body);
  }

  @Get()
  async list(@Req() req: { userId?: string }) {
    const ownerUserId = req.userId ?? (await getDevUserId());
    return this.projects.list(ownerUserId);
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.projects.getById(id);
  }

  @Get(":id/health")
  getHealth(@Param("id") id: string) {
    return this.projects.getHealthDashboard(id);
  }
}
