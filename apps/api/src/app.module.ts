import { Module } from "@nestjs/common";
import { ProjectsModule } from "./projects/projects.module.js";
import { ReadmeModule } from "./readme/readme.module.js";
import { GithubModule } from "./github/github.module.js";
import { ContextPackageModule } from "./context/context-package.module.js";
import { FeedbackModule } from "./feedback/feedback.module.js";
import { RoadmapModule } from "./roadmap/roadmap.module.js";

@Module({
  imports: [ProjectsModule, ReadmeModule, GithubModule, ContextPackageModule, FeedbackModule, RoadmapModule],
})
export class AppModule {}
