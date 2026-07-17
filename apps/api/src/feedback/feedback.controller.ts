import { Controller, Get, Inject, Param } from "@nestjs/common";
import { FeedbackService } from "./feedback.service.js";

@Controller("projects/:id/feedback")
export class FeedbackController {
  // @Inject() token — see the note in context-package.controller.ts.
  constructor(@Inject(FeedbackService) private readonly feedback: FeedbackService) {}

  @Get()
  generate(@Param("id") id: string) {
    return this.feedback.generate(id);
  }
}
