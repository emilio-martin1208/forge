import { Controller, Get, Inject, Param } from "@nestjs/common";
import { RoadmapService } from "./roadmap.service.js";

@Controller("projects/:id/roadmap")
export class RoadmapController {
  // @Inject() token — see the note in context-package.controller.ts.
  constructor(@Inject(RoadmapService) private readonly roadmap: RoadmapService) {}

  @Get()
  list(@Param("id") id: string) {
    return this.roadmap.list(id);
  }
}
