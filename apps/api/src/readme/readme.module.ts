import { Module } from "@nestjs/common";
import { ReadmeController } from "./readme.controller.js";
import { ReadmeService } from "./readme.service.js";

@Module({
  controllers: [ReadmeController],
  providers: [ReadmeService],
})
export class ReadmeModule {}
