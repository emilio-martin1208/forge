/**
 * Local-only demo seed: runs the real repository-engine analyzer against
 * this repo itself (no GitHub App required) and inserts a Project +
 * RepositorySnapshot so the web UI has something real to render. Not part
 * of the app runtime — run manually with `npm run seed:demo`.
 */
import { Prisma, prisma } from "@forge/database";
import { analyzeRepository } from "@forge/repository-engine";

function toJson<T>(value: T): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

async function main() {
  // Same identity the API resolves unauthenticated requests to
  // (getDevUserId(), apps/api/src/shared/devUser.ts) — otherwise this
  // seeded project belongs to a different user than the dashboard queries
  // for and silently never shows up.
  const user = await prisma.user.upsert({
    where: { githubId: "dev-user" },
    create: { githubId: "dev-user", name: "Dev User" },
    update: {},
  });

  const installation = await prisma.githubInstallation.upsert({
    where: { installationId: "demo-installation" },
    create: { installationId: "demo-installation", accountLogin: "emilio-martin1208", accountType: "User" },
    update: {},
  });

  const project = await prisma.project.upsert({
    where: { githubOwner_githubRepo: { githubOwner: "emilio-martin1208", githubRepo: "forge" } },
    create: {
      ownerUserId: user.id,
      installationId: installation.id,
      githubOwner: "emilio-martin1208",
      githubRepo: "forge",
      defaultBranch: "main",
    },
    update: { ownerUserId: user.id },
  });

  const analysis = analyzeRepository({
    rootDir: process.cwd(),
    projectId: project.id,
    defaultBranch: "main",
  });

  const snapshot = await prisma.repositorySnapshot.create({
    data: {
      projectId: analysis.projectId,
      commitSha: analysis.commitSha,
      defaultBranch: analysis.defaultBranch,
      fileTree: toJson(analysis.fileTree),
      languages: toJson(analysis.languages),
      frameworks: toJson(analysis.frameworks),
      dependencies: toJson(analysis.dependencies),
      routes: toJson(analysis.routes),
      envVars: toJson(analysis.envVars),
      docker: toJson(analysis.docker),
      ci: toJson(analysis.ci),
      testing: toJson(analysis.testing),
      features: toJson(analysis.features),
      healthScores: toJson(analysis.healthScores),
      referenceFiles: toJson(analysis.referenceFiles),
    },
  });

  console.log(`Seeded project ${project.id} with snapshot ${snapshot.id}`);
  console.log(`Dashboard: http://localhost:3000/projects/${project.id}`);
  console.log(`README:    http://localhost:3000/projects/${project.id}/readme`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
