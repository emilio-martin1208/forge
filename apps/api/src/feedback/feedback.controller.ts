import { Controller, Get, Param } from "@nestjs/common";
import { FeedbackService } from "./feedback.service.js";

@Controller("projects/:id/feedback")
export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  @Get()
  generate(@Param("id") id: string) {
    return this.feedback.generate(id);
  }
}
