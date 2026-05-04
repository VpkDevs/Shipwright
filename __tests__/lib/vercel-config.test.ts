import {
  generatePackageJsonFile,
  generatePackageJsonScripts,
} from "@/lib/generators/vercel-config";
import type { RepoAnalysis } from "@/types";
import { describe, expect, it } from "vitest";

const baseAnalysis: RepoAnalysis = {
  framework: "Next.js",
  packageManager: "npm",
  backendType: "Frontend",
  hasDocker: false,
  hasReadme: true,
  hasEnvExample: true,
  lockfile: "package-lock.json",
  envVarsDetected: [],
  buildScript: null,
  startScript: null,
  testScript: null,
  missingConfigs: ["build script", "start script"],
  deploymentIssues: [],
  recommendedActions: [],
  readinessSummary: "Next.js app using npm; 1 blocker must be fixed before deployment.",
  deploymentRiskScore: 30,
  description: "Next.js project with npm and Frontend",
};

describe("vercel config generators", () => {
  it("generates missing Next.js package scripts", () => {
    expect(generatePackageJsonScripts(baseAnalysis)).toEqual({
      build: "next build",
      start: "next start",
      dev: "next dev",
    });
  });

  it("patches package.json with generated scripts", () => {
    const patched = generatePackageJsonFile(
      JSON.stringify({
        name: "demo",
        scripts: {
          test: "vitest run",
        },
      }),
      {
        build: "next build",
      }
    );

    expect(patched).toContain('"test": "vitest run"');
    expect(patched).toContain('"build": "next build"');
  });

  it("returns null when package.json cannot be parsed", () => {
    expect(generatePackageJsonFile("{", { build: "next build" })).toBeNull();
  });
});
