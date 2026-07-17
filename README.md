# Forge — The AI Software Architect

Forge builds a deterministic understanding of a GitHub repository and generates
documentation, project-health insight, and grounded context packages for
external coding agents — all derived from what's actually in the repo, not
hallucinated.

**Implemented so far:**
- Connect a repo → Repository Intelligence Engine → README Generator + Health Dashboard (v1)
- GitHub sync (PRs, issues, releases, Actions runs) + AI code review on PR open (v1.1)
- Context Package Generator for Claude Code / Cursor / Codex + Agent Feedback Loop / next-task recommendation (v1.1)
- Project Creation: describe an idea → PRD summary + 2-3 architecture options, plus a dashboard listing connected repos and ideas (v1.2)

See [docs/architecture.md](docs/architecture.md) for the full design
rationale, what's deferred, and why — including why this is one
`ContextPackageService`, not five named "agents."

## Structure

```
apps/
  web/                  Next.js — dashboard, connect, create idea, project/idea detail
  api/                  Nest.js — REST API: projects, ideas, readme, context packages,
                          feedback loop, roadmap, GitHub webhooks + sync
  worker/               BullMQ worker — clone+analyze, PR review jobs
packages/
  types/                 Shared TypeScript types (RepositorySnapshot, API DTOs)
  database/              Prisma schema + client
  repository-engine/     Deterministic repo analyzers (the core engine)
  github/                Shared GitHub App auth + REST client (used by api + worker)
  ui/                     Placeholder for a future shared component library
docs/
  architecture.md         Full design writeup
```

## API surface

```
GET  /projects                          list connected repos
POST /projects                          connect a repo
GET  /projects/:id                      project metadata
GET  /projects/:id/health               health dashboard
POST /projects/:id/readme               generate README
GET  /projects/:id/feedback             agent feedback loop / next-task recommendation
GET  /projects/:id/roadmap              roadmap items (sourced from GitHub issues today)
POST /projects/:id/context-package      architecture.md / database.md / coding-standards.md / known-issues.md / task.md
GET  /projects/:id/cursor-rules         .cursorrules
POST /projects/:id/codex-task           Codex-format structured task JSON
POST /webhooks/github                   push, pull_request, issues, release, workflow_run

GET  /ideas                             list your project ideas
POST /ideas                             { description } -> PRD summary + architecture options
GET  /ideas/:id                         one idea's full generated output
```

## Local development

```bash
cp .env.example .env      # DATABASE_URL is already set for docker-compose;
                           # GitHub App + Anthropic keys needed for the full loop
docker compose up -d      # Postgres + Redis
npm install
npm run db:generate --workspace=@forge/database
npx prisma migrate dev --schema packages/database/prisma/schema.prisma

npm run dev               # runs web, api, worker in parallel via turbo
```

No GitHub App configured yet? `npm run seed:demo` runs the real analyzer
against this repo and inserts a Project + Snapshot under the same `dev-user`
placeholder identity the API resolves unauthenticated requests to, so
`/dashboard` and `/projects/:id` have real data to render without one.

Run the full test suite (no external services required — everything tested
is pure logic: analyzers, relevance scoring, constraint derivation, snapshot
diffing):

```bash
npm run test               # turbo run test, all workspaces
npm run typecheck          # turbo run typecheck, all workspaces
```

## What's not wired up yet

- Real GitHub App installation flow (`/connect` currently takes a manual
  installation ID)
- GitHub OAuth session / auth guard on the API
- Deployment configs (Railway/Vercel)
- PRD-generated roadmap (Project Creation) — the roadmap that exists today
  is real but only sourced from GitHub issues, not from an idea/PRD

All intentional — see the "Deferred" table in
[docs/architecture.md](docs/architecture.md).
