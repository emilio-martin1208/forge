import { Body, Controller, Get, Header, Inject, Param, Post } from "@nestjs/common";
import type { GenerateContextPackageRequest } from "@forge/types";
import { ContextPackageService } from "./context-package.service.js";

@Controller("projects/:id")
export class ContextPackageController {
  // Explicit @Inject() token rather than relying on tsx-emitted decorator
  // metadata — tsx (esbuild) never emits `design:paramtypes`, which is what
  // Nest's DI normally infers constructor dependencies from. This makes
  // injection tsx-safe regardless of what emits it. See docs/architecture.md.
  constructor(@Inject(ContextPackageService) private readonly contextPackage: ContextPackageService) {}

  @Post("context-package")
  generate(@Param("id") id: string, @Body() body: GenerateContextPackageRequest) {
    return this.contextPackage.generate(id, body);
  }

  @Get("cursor-rules")
  @Header("Content-Type", "text/plain")
  cursorRules(@Param("id") id: string) {
    return this.contextPackage.generateCursorRules(id);
  }

  @Post("codex-task")
  codexTask(@Param("id") id: string, @Body() body: GenerateContextPackageRequest) {
    return this.contextPackage.generateCodexTask(id, body);
  }
}
