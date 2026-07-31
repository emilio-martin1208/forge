import { Controller, Get, Req } from "@nestjs/common";
import { prisma } from "@forge/database";
import type { CurrentUser } from "@forge/types";
import { getDevUserId } from "../shared/devUser.js";

@Controller("me")
export class MeController {
  @Get()
  async getMe(@Req() req: { userId?: string }): Promise<CurrentUser> {
    const userId = req.userId ?? (await getDevUserId());
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return {
      id: user.id,
      name: user.name,
      githubId: user.githubId,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
