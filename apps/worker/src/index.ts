import { Worker } from "bullmq";
import { ANALYZE_PROJECT_QUEUE, REVIEW_PULL_REQUEST_QUEUE, connection } from "./queue.js";
import { analyzeProject, type AnalyzeProjectJobData } from "./jobs/analyzeProject.js";
import { reviewPullRequest, type ReviewPullRequestJobData } from "./jobs/reviewPullRequest.js";

const analyzeWorker = new Worker<AnalyzeProjectJobData>(
  ANALYZE_PROJECT_QUEUE,
  async (job) => analyzeProject(job.data),
  { connection, concurrency: 2 },
);

analyzeWorker.on("completed", (job, result) => {
  console.log(`[worker] analyzed project ${job.data.projectId} -> snapshot ${result.snapshotId}`);
});

analyzeWorker.on("failed", (job, err) => {
  console.error(`[worker] analysis failed for project ${job?.data.projectId}:`, err);
});

const reviewWorker = new Worker<ReviewPullRequestJobData>(
  REVIEW_PULL_REQUEST_QUEUE,
  async (job) => reviewPullRequest(job.data),
  { connection, concurrency: 2 },
);

reviewWorker.on("completed", (job, result) => {
  console.log(`[worker] reviewed PR ${job.data.pullRequestId} -> review ${result.reviewId}`);
});

reviewWorker.on("failed", (job, err) => {
  console.error(`[worker] review failed for PR ${job?.data.pullRequestId}:`, err);
});

console.log("[worker] listening on queues:", ANALYZE_PROJECT_QUEUE, REVIEW_PULL_REQUEST_QUEUE);
