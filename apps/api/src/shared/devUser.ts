import { prisma } from "@forge/database";

/**
 * Placeholder for real auth — GitHub OAuth session / auth guard is still
 * deferred (see docs/architecture.md). Every unauthenticated request needs
 * *a* real User row to satisfy foreign keys on Project/ProjectIdea; upserting
 * one here is the correct stand-in, not a bare `"dev-user"` string literal
 * passed straight into a `User.id` foreign key that no row actually has.
 */
export async function getDevUserId(): Promise<string> {
  const user = await prisma.user.upsert({
    where: { githubId: "dev-user" },
    create: { githubId: "dev-user", name: "Dev User" },
    update: {},
  });
  return user.id;
}
