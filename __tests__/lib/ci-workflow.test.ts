import { generateCiWorkflow } from "@/lib/generators/ci-workflow";
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
  buildScript: "next build",
  startScript: "next start",
  testScript: "vitest run",
  missingConfigs: [],
  deploymentIssues: [],
  recommendedActions: [],
  readinessSummary: "Next.js app using npm; no deployment blockers detected.",
  deploymentRiskScore: 0,
  description: "Next.js project with npm and Frontend",
};

describe("generateCiWorkflow", () => {
  it("uses npm ci when package-lock.json is present", () => {
    const workflow = generateCiWorkflow(baseAnalysis, {});

    expect(workflow).toContain("run: npm ci");
    expect(workflow).toContain("run: npm run test");
    expect(workflow).toContain("run: npm run build");
  });

  it("includes a build step when Shipwright generated a build script", () => {
    const workflow = generateCiWorkflow(
      {
        ...baseAnalysis,
        buildScript: null,
        testScript: null,
      },
      { build: "next build" }
    );

    expect(workflow).toContain("run: npm run build");
    expect(workflow).not.toContain("run: npm run test");
  });

  it("enables Corepack for pnpm projects", () => {
    const workflow = generateCiWorkflow(
      {
        ...baseAnalysis,
        packageManager: "pnpm",
        lockfile: "pnpm-lock.yaml",
      },
      {}
    );

    expect(workflow).toContain("run: corepack enable");
    expect(workflow).toContain("run: pnpm install --frozen-lockfile");
    expect(workflow).toContain("run: pnpm test");
  });

  it("sets up Bun for bun projects", () => {
    const workflow = generateCiWorkflow(
      {
        ...baseAnalysis,
        packageManager: "bun",
        lockfile: "bun.lock",
      },
      {}
    );

    expect(workflow).toContain("uses: oven-sh/setup-bun@v2");
    expect(workflow).toContain("run: bun install --frozen-lockfile");
    expect(workflow).toContain("run: bun run test");
  });
});
