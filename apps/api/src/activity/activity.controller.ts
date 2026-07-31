import { Controller, Get, Inject, Req } from "@nestjs/common";
import { ActivityService } from "./activity.service.js";
import { getDevUserId } from "../shared/devUser.js";

@Controller("activity")
export class ActivityController {
  // @Inject() token — see the note in context-package.controller.ts.
  constructor(@Inject(ActivityService) private readonly activity: ActivityService) {}

  @Get()
  async getActivity(@Req() req: { userId?: string }) {
    const userId = req.userId ?? (await getDevUserId());
    return this.activity.getActivity(userId);
  }
}
