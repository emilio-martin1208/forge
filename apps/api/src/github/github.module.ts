import { Module } from "@nestjs/common";
import { GithubWebhookController } from "./github-webhook.controller.js";
import { GithubSyncService } from "./github-sync.service.js";

@Module({
  controllers: [GithubWebhookController],
  providers: [GithubSyncService],
  exports: [GithubSyncService],
})
export class GithubModule {}
