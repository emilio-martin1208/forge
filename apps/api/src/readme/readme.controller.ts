import { Controller, Param, Post } from "@nestjs/common";
import { ReadmeService } from "./readme.service.js";

@Controller("projects/:id/readme")
export class ReadmeController {
  constructor(private readonly readme: ReadmeService) {}

  @Post()
  generate(@Param("id") id: string) {
    return this.readme.generate(id);
  }
}
