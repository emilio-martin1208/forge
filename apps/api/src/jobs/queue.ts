import { Queue } from "bullmq";
import { createRequire } from "node:module";

// Producer-side only: apps/api enqueues, apps/worker consumes. They share a
// queue name + Redis connection but never import each other directly — the
// queue *is* the boundary between "accept the request fast" and "do the
// slow clone/analyze work," which is the whole reason it exists.
//
// createRequire sidesteps a CJS/ESM default-export type mismatch in ioredis
// — see the same fix in packages/repository-engine/src/walk.ts.
const require = createRequire(import.meta.url);
const IORedis = require("ioredis") as typeof import("ioredis").default;

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const ANALYZE_PROJECT_QUEUE = "analyze-project";
export const REVIEW_PULL_REQUEST_QUEUE = "review-pull-request";

export const analyzeProjectQueue = new Queue(ANALYZE_PROJECT_QUEUE, { connection });
export const reviewPullRequestQueue = new Queue(REVIEW_PULL_REQUEST_QUEUE, { connection });
