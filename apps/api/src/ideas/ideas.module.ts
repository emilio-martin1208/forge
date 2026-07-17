import { Module } from "@nestjs/common";
import { IdeasController } from "./ideas.controller.js";
import { IdeasService } from "./ideas.service.js";

@Module({
  controllers: [IdeasController],
  providers: [IdeasService],
})
export class IdeasModule {}
