# Forge — Architecture

This covers Steps 1–8 (v1 vertical slice) and Steps 9–11 (v1.1: agent
integrations + GitHub sync), in the order they were actually built. Each
section states what was decided and why before any code for it was written.

## Scope

**v1 (Steps 1–8):** Connect a GitHub repo → deterministic analysis → README
Generator + Health Dashboard.

**v1.1 (Steps 9–11):** Forge as the context/orchestration layer for external
coding agents (Claude Code, Cursor, Codex) — see "Agent Integrations" below —
plus deeper GitHub sync (PRs, issues, releases, Actions) and an AI code
review pass on PR open. See "Deferred" at the bottom for what's still not
built and why.

## Step 3 — Database schema

`packages/database/prisma/schema.prisma`: `User`, `GithubInstallation`,
`Project`, `RepositorySnapshot`, `GeneratedReadme`.

**Decision: analyzer output is stored as `Json` columns on
`RepositorySnapshot`, not normalized into per-entity tables.** Every v1
read pattern is "load one snapshot whole" (render a README, render a
dashboard) — nothing queries across snapshots ("find all projects using
React"). Normalizing `languages`, `frameworks`, `routes`, etc. into their own
tables would mean five extra models and five extra joins to support queries
that don't exist yet. Revisit this the moment a feature needs to query
*across* snapshots — Portfolio Mode's benchmarking ("how does this compare to
other repos") is the most likely trigger, and normalizing at that point still
migrates cleanly because the Json shape already matches `packages/types`.

**Decision: no denormalized `latestSnapshotId` pointer on `Project`.**
Latest snapshot is `ORDER BY createdAt DESC LIMIT 1`, indexed via
`@@index([projectId, createdAt])`. A pointer field is one more place for
state to go stale (what happens to it if a snapshot is deleted?) for a query
that's already O(log n) with the index.

## Step 4 — API contract

`apps/api` (Nest.js) exposes:

- `POST /projects` — connect a repo, enqueues analysis, returns `Project`
- `GET /projects/:id` — project metadata
- `GET /projects/:id/health` — latest `RepositorySnapshot` + computed overall score
- `POST /projects/:id/readme` — generate README from latest snapshot
- `POST /webhooks/github` — GitHub push events, re-enqueues analysis

Types for every request/response live in `packages/types/src/api.ts` and are
imported directly by `apps/web` — this is the payoff of the unified-TypeScript
decision: no OpenAPI codegen step, no drift between what the API returns and
what the frontend expects.

**Auth is out of scope for this slice.** `ProjectsController.connect` reads
`req.userId` with a `"dev-user"` fallback and a comment marking where a real
auth guard goes. Wiring GitHub OAuth for user sessions is mechanical once the
GitHub App installation flow (see Deferred) exists — building it first would
mean testing it against a fake installation anyway.

## Step 5 — AI pipeline

**Decision: exactly one LLM call site in v1** —
`apps/api/src/readme/narrative.ts`, generating the description and feature
prose paragraphs of the README. Everything else in the README (badges,
folder tree, dependency table, env var table, Mermaid architecture diagram,
health scores) is rendered by `apps/api/src/readme/templates.ts` — pure
string templating over `RepositorySnapshot`, zero model calls.

This follows directly from the product's own stated philosophy: "the
repository is the source of truth, not hallucination." An LLM asked to
produce a dependency table or a version number is a reliability *regression*
compared to reading the field straight from the manifest. The narrative call
is scoped tightly — the system prompt hands the model the Snapshot as its
only source of facts and explicitly forbids describing anything not present
in it, so even the one AI-touched section is bounded by deterministic data
rather than free-associating from the repo name.

**Provider: Anthropic (`@anthropic-ai/sdk`, `claude-sonnet-5`)**, not OpenAI —
matches the rest of the Claude/Anthropic-oriented tooling already in use for
this build.

RAG, embeddings, and `pgvector` are **not** in this pipeline. See Deferred.

## Step 6 — Repository Intelligence Engine

`packages/repository-engine`, consumed by both `apps/worker` (real clones)
and this package's own test suite (fixture repo). Pipeline:

1. `walk.ts` — walks the repo respecting `.gitignore` plus a hardcoded
   ignore list (`node_modules`, `.git`, build output, caches) and a binary
   extension denylist.
2. `detectors/manifests.ts` — parses `package.json`, `requirements.txt`,
   `pyproject.toml` into a flat dependency list.
3. `detectors/frameworks.ts`, `detectors/features.ts` — data-driven
   signature tables (dependency name → framework/feature). Adding a new
   detectable framework or feature is a one-line table entry.
4. `detectors/languages.ts` — extension-based line counting.
5. `detectors/routes.ts` — convention-based extraction for Next.js App
   Router (`app/**/route.ts` file convention) and Express
   (`app.get(...)`/`router.post(...)` regex).
6. `detectors/envVars.ts` — cross-references `.env.example` against
   `process.env.X` / `os.environ` references in source, flagging
   undocumented variables.
7. `detectors/infra.ts` — Docker, CI provider, test framework/file-count
   detection.
8. `detectors/health.ts` — computes the six Health Dashboard scores as
   **transparent heuristics** (presence/completeness checks), not opaque
   model output. Each score is traceable to concrete checks a user can see
   and disagree with — that matters more at this stage than being "smart."

**Decision: no tree-sitter in v1.** Route/component/service extraction uses
file-convention and regex heuristics instead of AST parsing. Tree-sitter
earns its place once the heuristic layer is proven against real repos and
the false-negative rate on route detection actually matters — pulling in
per-language grammars and native bindings before that point is solving a
precision problem the product doesn't have evidence it has yet.

**Decision: no embeddings/pgvector/RAG in v1**, for the same reason. Feature
and framework detection is manifest pattern-matching — a retrieval problem
only shows up once a feature needs fuzzy queries (chat-with-repo, Portfolio
Mode benchmarking), which are both explicitly deferred.

Tested against a real fixture repo
(`packages/repository-engine/test/fixtures/sample-repo`) mixing Next.js App
Router, Express, Prisma, Stripe, next-auth, and Tailwind — the test suite
asserts against actual analyzer output, not mocks.

## Step 7 — UI

Three pages, dark-first (Linear/Vercel-inspired), Tailwind only — no
component library wired up yet (`packages/ui` exists as a placeholder
directory; shadcn/ui setup is one command away but three pages don't justify
standing up a design system yet):

- `/` — landing
- `/connect` — manual installation-id/owner/repo form (stand-in for the real
  GitHub App install flow — see Deferred)
- `/projects/[id]` — Health Dashboard: scores, languages, frameworks, feature
  matrix
- `/projects/[id]/readme` — triggers generation, renders the markdown

No React Query. Three pages with straightforward server/client fetches don't
need a caching layer yet — add it when there's shared, revalidated state to
manage across more than a couple of views.

## Step 8 — Implementation roadmap (post-slice)

1. Wire real GitHub App installation flow (replace the manual `/connect`
   form) — unblocks real auth and real webhook delivery.
2. GitHub OAuth session + auth guard on `apps/api` (currently stubbed).
3. Deploy: Vercel (`apps/web`), Railway (`apps/api`, `apps/worker`,
   Postgres, Redis).
4. Once the vertical slice is validated against real repos: Architecture
   Visualizer (Mermaid generation already exists inside the README pipeline
   — promote it to a standalone view), Feature Detection UI polish, Next
   Task Engine (first feature that plausibly needs an LLM call *reasoning
   over* the Snapshot rather than just describing it).
5. Only after the above: Project Creation (idea → PRD), AI Code Review,
   Portfolio Mode, Deployment Analyzer, embeddings/RAG for chat-with-repo.

## Step 9 — Agent Integrations: rejecting the multi-agent framing

The originating spec proposed five named agents (Architect, Developer,
Security, Documentation, Testing). **Decision: one `ContextPackageService`
with a template/mode parameter, not five agents.** Strip the names off and
the difference between a "Security Agent" and a "Documentation Agent" is
which slice of the Snapshot a template emphasizes — not independent state,
scheduling, or conflict resolution, which is what "agent" implies and what
would actually justify separate services. Revisit only if these need to run
independently or produce conflicting outputs that need reconciling — neither
is true today.

`apps/api/src/context/`:

- `relevance.ts` — `selectRelevantFiles(snapshot, taskDescription)`: scores
  candidate files (drawn from `routes[].file`, `frameworks[].evidence`
  `file:` entries, `envVars[].referencedIn`, `referenceFiles[].path`) against
  task-description keyword overlap. **Still no embeddings** — every
  candidate file already carries structural tags the Snapshot computed for
  free; this is metadata filtering, not semantic search. The concrete
  trigger for revisiting: measured poor hit-rate on real free-text tasks
  that share no vocabulary with detected frameworks/routes/dependencies.
- `constraints.ts` — `deriveArchitectureConstraints` /
  `deriveCodingStandards` / `deriveKnownIssues`: pure functions over
  `RepositorySnapshot`, zero LLM calls. Every bullet traces to a specific
  Snapshot field, which is what makes it safe to hand to an execution agent
  as a *constraint* rather than a suggestion — it reports what's actually in
  the repo.
- `context-package.service.ts` — assembles `architecture.md`, `database.md`
  (embeds raw `prisma/schema.prisma` content via the new `referenceFiles`
  Snapshot field — see below — falls back to a stated limitation for other
  ORMs), `coding-standards.md`, `known-issues.md`, `task.md` (per-task,
  takes title/description/requirements/constraints/acceptance criteria),
  plus a `.cursorrules` serializer and a Codex JSON task serializer. Three
  outputs, one underlying model — exactly the "one service, three
  serializers" alternative to the five-agent framing.

**New Snapshot field: `referenceFiles`** (`packages/repository-engine/src/detectors/referenceFiles.ts`).
An explicit allowlist (currently just `prisma/schema.prisma`) of small files
whose *raw content* — not just structured facts about them — a downstream
consumer needs. This is not a "store the repo" mechanism; it exists because
`database.md` generation happens after the worker's temp clone is already
deleted, and re-cloning just to read one file is wasteful. Add a path here
only when a real consumer needs the bytes, not before.

Context packages are **not persisted** (unlike README, which is a durable
artifact users revisit) — they're working documents for one active coding
session, computed on demand.

## Step 10 — GitHub sync: PRs, issues, releases, Actions

New Prisma models: `PullRequest`, `PullRequestReview`, `Issue`, `Release`,
`WorkflowRun` — plain rows, not Json-on-Project, because unlike analyzer
output these genuinely need individual querying (list open PRs, find PR #42
to attach a review).

`packages/github` (new): `getInstallationAccessToken` moved here from
`apps/worker` the moment `apps/api` needed the same GitHub App auth for
backfill and review-diff fetching — extracted at second use, not
speculatively. Also holds the REST client (`listOpenPullRequests`,
`listOpenIssues`, `listReleases`, `listWorkflowRuns`,
`fetchPullRequestDiff`, `postPullRequestComment`) and webhook signature
verification. **REST, not GraphQL** — the spec listed GraphQL as an option,
but every query here is "list N items" or "compare two SHAs," which REST
covers with far less client complexity than a GraphQL query builder would
add.

Two sync paths:
1. **Backfill on connect** (`github-sync.service.ts`) — pulls currently-open
   PRs and issues once, since webhooks only report events from the moment
   Forge is connected forward. Runs inline in the connect request (not
   queued) because it's two bounded REST list calls, not an unbounded clone;
   move it to a job if that assumption stops holding for very active repos.
   Releases and workflow runs are **not** backfilled — nothing depends on
   historical ones yet, the next webhook populates them going forward.
2. **Webhooks going forward** — `github-webhook.controller.ts` now handles
   `push` (existing), `pull_request` (opened/synchronize/reopened →
   upsert + enqueue AI review), `issues` (opened/closed/reopened →
   upsert only), `release` (published → upsert), `workflow_run` (completed →
   upsert).

**Honest partial implementation:** the spec's "issue created → update
project roadmap" is *not* wired to an actual roadmap update. There is no
Roadmap feature yet (Project Creation/milestones are still deferred).
Storing the issue is real; writing a fake update against a roadmap model
that doesn't exist would be worse than the current no-op — the webhook
handler says so explicitly in a comment rather than pretending.

## Step 11 — AI Code Review

`apps/worker/src/jobs/reviewPullRequest.ts`, triggered by the webhook's
`pull_request` handler. Fetches the diff via GitHub's compare API (not a
second clone — the diff is all the review needs), grounds the review prompt
in the project's latest Snapshot (detected frameworks, ORM, test setup) so
findings reference the codebase's actual conventions instead of generic
advice, and asks for structured JSON (`{ summary, findings[] }`) with a
regex-extraction fallback if the model doesn't return clean JSON. Persists a
`PullRequestReview` row per review (one PR can accumulate several, one per
`synchronize`), then best-effort posts the summary as a PR comment — a
failed comment post doesn't fail the job, since the review is already
readable via the API either way.

## Deferred (explicitly, with reasons)

| Feature | Why deferred |
|---|---|
| Project Creation (idea → PRD/schema/API) | No repo to ground it in — still the one feature in the spec that doesn't depend on the Repository Intelligence Engine. |
| Embeddings / RAG / pgvector | Metadata filtering (Step 9) and manifest pattern-matching (Step 6) still cover every v1.1 need. |
| Full Roadmap / Milestones feature | "Issue created → update roadmap" is a stub for exactly this reason — see Step 10. |
| Portfolio Mode, Deployment Analyzer | Both plausibly need cross-repo comparison, which is the trigger for normalizing Snapshot Json into real tables (see Step 3) — neither exists yet. |
| Inline PR review comments (line-anchored) | Current review posts one summary comment via the Issues API, not the Pull Request Review API's line-anchored comments — simpler client, and findings already carry a `file` field for a user to navigate to manually. Upgrade once summary-comment UX proves insufficient. |
| GitHub OAuth user sessions / auth guard | Still stubbed (`"dev-user"` fallback) — same reasoning as v1: build it once the GitHub App install flow replaces the manual `/connect` form, not before. |
| `packages/ui` design system (shadcn) | No new UI shipped in v1.1 (this pass was backend-only, deliberately — see the scoping conversation before this section was built); still not enough surface area to justify it. |
| tree-sitter structural extraction | Still convention/regex-based (Step 6) — unchanged by v1.1. |
