import { Queue } from "bullmq";
import { createRequire } from "node:module";

// Same CJS/ESM default-export type mismatch as packages/repository-engine's
// `ignore` import — see the comment there. createRequire sidesteps it.
const require = createRequire(import.meta.url);
const IORedis = require("ioredis") as typeof import("ioredis").default;

export const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null, // required by BullMQ
});

export const ANALYZE_PROJECT_QUEUE = "analyze-project";
export const REVIEW_PULL_REQUEST_QUEUE = "review-pull-request";

export const analyzeProjectQueue = new Queue(ANALYZE_PROJECT_QUEUE, { connection });
