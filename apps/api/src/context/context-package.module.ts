import { Module } from "@nestjs/common";
import { ContextPackageController } from "./context-package.controller.js";
import { ContextPackageService } from "./context-package.service.js";

@Module({
  controllers: [ContextPackageController],
  providers: [ContextPackageService],
})
export class ContextPackageModule {}
