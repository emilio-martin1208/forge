import { Controller, Get, Param } from "@nestjs/common";
import { RoadmapService } from "./roadmap.service.js";

@Controller("projects/:id/roadmap")
export class RoadmapController {
  constructor(private readonly roadmap: RoadmapService) {}

  @Get()
  list(@Param("id") id: string) {
    return this.roadmap.list(id);
  }
}
