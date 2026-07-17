import { Controller, Inject, Param, Post } from "@nestjs/common";
import { ReadmeService } from "./readme.service.js";

@Controller("projects/:id/readme")
export class ReadmeController {
  // @Inject() token: tsx never emits decorator metadata Nest's DI would
  // otherwise infer this from — see the note in context-package.controller.ts.
  constructor(@Inject(ReadmeService) private readonly readme: ReadmeService) {}

  @Post()
  generate(@Param("id") id: string) {
    return this.readme.generate(id);
  }
}
