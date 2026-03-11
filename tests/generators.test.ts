import { buildLandingPage } from "@/lib/agents/orchestrator";
import { generateLandingPage } from "@/lib/generators/landing";
import type { RepoAnalysis } from "@/types";
import { describe, expect, it } from "vitest";

const sampleAnalysis: RepoAnalysis = {
  framework: "Next.js",
  packageManager: "npm",
  backendType: "Frontend",
  hasDocker: true,
  envVarsDetected: [],
  buildScript: "next build",
  missingConfigs: [],
  deploymentRiskScore: 5,
  description: "A sample project",
};

describe("landing page generators", () => {
  it("generateLandingPage produces valid HTML with badges and description", () => {
    const html = generateLandingPage("repo-name", sampleAnalysis, "Custom desc");
    expect(html).toContain("repo-name");
    expect(html).toContain("Custom desc");
    expect(html).toContain("Docker");
    expect(html).toMatch(/<html[^>]*>/);
  });

  it("buildLandingPage respects AI copy and features list", () => {
    const jsonCopy = JSON.stringify({
      headline: "AI Headline",
      subheadline: "AI Sub",
      features: ["One", "Two"],
    });
    const html = buildLandingPage("repo2", sampleAnalysis, jsonCopy, "Fallback");
    expect(html).toContain("AI Headline");
    expect(html).toContain("AI Sub");
    expect(html).toContain("One");
    expect(html).toContain("Two");
  });

  it("buildLandingPage falls back to defaults when JSON is invalid", () => {
    const html = buildLandingPage("repoX", sampleAnalysis, "not json", "desc");
    expect(html).toContain("repoX");
    // default features should appear
    expect(html).toContain("Fast and performant");
  });
});
