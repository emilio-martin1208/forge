import { existsSync } from "node:fs";
import { join } from "node:path";
import type { DependencyRecord, FrameworkCategory, FrameworkDetection } from "@forge/types";

interface FrameworkSignature {
  name: string;
  category: FrameworkCategory;
  /** Dependency names that indicate this framework (exact match, lowercase) */
  dependencyNames: string[];
  /** Files whose presence alone is corroborating evidence */
  files?: string[];
}

// Data-driven on purpose: adding a new detectable framework is a one-line
// table entry, not new control flow. Ordered roughly by how decisive the
// signal is.
const SIGNATURES: FrameworkSignature[] = [
  { name: "Next.js", category: "frontend", dependencyNames: ["next"], files: ["next.config.js", "next.config.ts", "next.config.mjs"] },
  { name: "React", category: "frontend", dependencyNames: ["react"] },
  { name: "Vue", category: "frontend", dependencyNames: ["vue"] },
  { name: "Svelte", category: "frontend", dependencyNames: ["svelte"] },
  { name: "Angular", category: "frontend", dependencyNames: ["@angular/core"] },
  { name: "Remix", category: "frontend", dependencyNames: ["@remix-run/react"] },

  { name: "Express", category: "backend", dependencyNames: ["express"] },
  { name: "Fastify", category: "backend", dependencyNames: ["fastify"] },
  { name: "NestJS", category: "backend", dependencyNames: ["@nestjs/core"] },
  { name: "Django", category: "backend", dependencyNames: ["django"] },
  { name: "Flask", category: "backend", dependencyNames: ["flask"] },
  { name: "FastAPI", category: "backend", dependencyNames: ["fastapi"] },

  { name: "Prisma", category: "orm", dependencyNames: ["prisma", "@prisma/client"], files: ["prisma/schema.prisma"] },
  { name: "TypeORM", category: "orm", dependencyNames: ["typeorm"] },
  { name: "Sequelize", category: "orm", dependencyNames: ["sequelize"] },
  { name: "Mongoose", category: "orm", dependencyNames: ["mongoose"] },
  { name: "SQLAlchemy", category: "orm", dependencyNames: ["sqlalchemy"] },
  { name: "Drizzle", category: "orm", dependencyNames: ["drizzle-orm"] },

  { name: "Jest", category: "testing", dependencyNames: ["jest"] },
  { name: "Vitest", category: "testing", dependencyNames: ["vitest"] },
  { name: "Mocha", category: "testing", dependencyNames: ["mocha"] },
  { name: "Playwright", category: "testing", dependencyNames: ["@playwright/test", "playwright"] },
  { name: "Cypress", category: "testing", dependencyNames: ["cypress"] },
  { name: "pytest", category: "testing", dependencyNames: ["pytest"] },

  { name: "Tailwind CSS", category: "css", dependencyNames: ["tailwindcss"], files: ["tailwind.config.js", "tailwind.config.ts"] },
  { name: "styled-components", category: "css", dependencyNames: ["styled-components"] },

  { name: "Redux", category: "state-management", dependencyNames: ["redux", "@reduxjs/toolkit"] },
  { name: "Zustand", category: "state-management", dependencyNames: ["zustand"] },

  { name: "Vite", category: "build-tool", dependencyNames: ["vite"] },
  { name: "Webpack", category: "build-tool", dependencyNames: ["webpack"] },
  { name: "Turborepo", category: "build-tool", dependencyNames: ["turbo"] },

  { name: "React Native", category: "mobile", dependencyNames: ["react-native"] },
  { name: "Expo", category: "mobile", dependencyNames: ["expo"] },
];

export function detectFrameworks(rootDir: string, dependencies: DependencyRecord[]): FrameworkDetection[] {
  const depByName = new Map(dependencies.map((d) => [d.name.toLowerCase(), d]));
  const results: FrameworkDetection[] = [];

  for (const sig of SIGNATURES) {
    const evidence: string[] = [];
    const matchedDep = sig.dependencyNames.find((name) => depByName.has(name));
    if (matchedDep) evidence.push(`dependency:${matchedDep}`);

    for (const file of sig.files ?? []) {
      if (existsSync(join(rootDir, file))) evidence.push(`file:${file}`);
    }

    if (evidence.length === 0) continue;

    const version = matchedDep ? depByName.get(matchedDep)?.version ?? null : null;
    results.push({ name: sig.name, category: sig.category, version, evidence });
  }

  return results;
}
