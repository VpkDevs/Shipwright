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
  missingConfigs: ["build script", "start script", "dev script"],
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

  it("generates only scripts that are missing", () => {
    expect(
      generatePackageJsonScripts({
        ...baseAnalysis,
        startScript: "custom start",
        missingConfigs: ["build script"],
      })
    ).toEqual({
      build: "next build",
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

  it("does not overwrite existing package scripts", () => {
    const patched = generatePackageJsonFile(
      JSON.stringify({
        name: "demo",
        scripts: {
          start: "node server.js",
          dev: "custom dev",
        },
      }),
      {
        build: "next build",
        start: "next start",
        dev: "next dev",
      }
    );

    expect(patched).toContain('"build": "next build"');
    expect(patched).toContain('"start": "node server.js"');
    expect(patched).toContain('"dev": "custom dev"');
  });

  it("preserves existing scripts when generated scripts use the same keys", () => {
    const patched = generatePackageJsonFile(
      JSON.stringify({
        name: "demo",
        scripts: {
          build: "custom build",
        },
      }),
      {
        build: "next build",
      }
    );

    expect(patched).toContain('"build": "custom build"');
    expect(patched).not.toContain('"build": "next build"');
  });

  it("does not assume Vite scripts for generic React projects", () => {
    expect(
      generatePackageJsonScripts({
        ...baseAnalysis,
        framework: "React",
      })
    ).toEqual({});
  });

  it("returns null when there is no package.json content", () => {
    expect(generatePackageJsonFile(null, { build: "next build" })).toBeNull();
  });

  it("returns null when no scripts need to be added", () => {
    expect(generatePackageJsonFile('{"name":"demo"}', {})).toBeNull();
  });

  it("returns null when package.json cannot be parsed", () => {
    expect(generatePackageJsonFile("{", { build: "next build" })).toBeNull();
  });
});
