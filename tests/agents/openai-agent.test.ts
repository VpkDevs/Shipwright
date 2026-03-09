import { describe, expect, it } from "vitest";
import {
  parseAgentResponse,
  generateFallbackResult,
} from "@/lib/agents/openai-agent";
import type { RepoAnalysis } from "@/types";

const baseAnalysis: RepoAnalysis = {
  framework: "Next.js",
  packageManager: "npm",
  backendType: "Frontend",
  hasDocker: false,
  envVarsDetected: [],
  buildScript: null,
  missingConfigs: [],
  deploymentRiskScore: 10,
  description: "Example project",
};

describe("openai-agent parseAgentResponse", () => {
  it("extracts README, landing copy and recommendations when present", () => {
    const content = [
      "```markdown",
      "# My Project",
      "",
      "Some description.",
      "```",
      "",
      'headline: "Custom Headline"',
      'subheadline: "Custom Subheadline"',
      'features: ["Feat A", "Feat B", "Feat C"]',
      "",
      "1. First recommendation",
      "2. Second recommendation",
      "3. Third recommendation",
    ].join("\n");

    const result = parseAgentResponse(content, baseAnalysis, "my-repo");
    expect(result.readme).toContain("# My Project");

    const landing = JSON.parse(result.landingPageCopy) as {
      headline: string;
      subheadline: string;
      features: string[];
    };
    expect(landing.headline).toBe("Custom Headline");
    expect(landing.subheadline).toBe("Custom Subheadline");
    expect(landing.features).toEqual(["Feat A", "Feat B", "Feat C"]);

    expect(result.deploymentRecommendations).toEqual([
      "First recommendation",
      "Second recommendation",
      "Third recommendation",
    ]);
  });

  it("falls back sensibly when content is missing", () => {
    const emptyContent = "";
    const result = parseAgentResponse(
      emptyContent,
      baseAnalysis,
      "fallback-repo"
    );

    expect(result.readme).toContain("# fallback-repo");

    const landing = JSON.parse(result.landingPageCopy) as {
      headline: string;
      subheadline: string;
      features: string[];
    };
    expect(landing.headline).toContain("fallback-repo");
    expect(result.deploymentRecommendations.length).toBe(3);
  });
});

describe("openai-agent generateFallbackResult", () => {
  it("produces deterministic fallback content", () => {
    const result = generateFallbackResult(baseAnalysis, "fallback-repo");

    expect(result.readme).toContain("# fallback-repo");

    const landing = JSON.parse(result.landingPageCopy) as {
      headline: string;
      subheadline: string;
      features: string[];
    };
    expect(landing.headline).toBe("Ship fallback-repo to production");
    expect(landing.features).toEqual([
      "Fast deployment",
      "Production ready",
      "Easy configuration",
    ]);
  });
});

