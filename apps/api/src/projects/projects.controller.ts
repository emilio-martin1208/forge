import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import type { ConnectRepositoryRequest } from "@forge/types";
import { ProjectsService } from "./projects.service.js";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Post()
  connect(@Req() req: { userId: string }, @Body() body: ConnectRepositoryRequest) {
    // req.userId is populated by the auth guard (GitHub OAuth session) —
    // omitted here since auth middleware is outside v1 scope; see
    // docs/architecture.md for the deferred auth design.
    return this.projects.connect(req.userId ?? "dev-user", body);
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
