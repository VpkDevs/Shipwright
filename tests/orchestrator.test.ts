import * as blackboxAgent from "@/lib/agents/blackbox-agent";
import * as openaiAgent from "@/lib/agents/openai-agent";
import { clearOrchestratorCache, runOrchestrator } from "@/lib/agents/orchestrator";
import { RepoAnalyzer } from "@/lib/analyzer";
import type { RepoAnalysis } from "@/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dummyAnalysis: RepoAnalysis = {
  framework: "Node.js",
  packageManager: "npm",
  backendType: "Frontend",
  hasDocker: false,
  envVarsDetected: [],
  buildScript: null,
  missingConfigs: [],
  deploymentRiskScore: 0,
  description: "Dummy",
};

describe("runOrchestrator", () => {
  beforeEach(() => {
    clearOrchestratorCache();

    // stub analysis to avoid GitHub calls
    vi.spyOn(RepoAnalyzer.prototype, "analyze").mockResolvedValue(dummyAnalysis);

    // stub agents
    vi.spyOn(openaiAgent, "runOpenAIAgent").mockResolvedValue({
      readme: "# README",
      landingPageCopy: JSON.stringify({ headline: "h", subheadline: "s", features: ["f"] }),
      deploymentRecommendations: ["rec1"],
      enhancedDescription: "desc",
    });

    vi.spyOn(blackboxAgent, "runBlackboxAgent").mockResolvedValue({
      codeInsights: "Looks good",
      vercelConfig: "{}",
      envTemplate: "",
      riskAssessment: "low",
      suggestedScripts: {},
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("runs analysis and both agents then returns a result", async () => {
    const res = await runOrchestrator({ owner: "o", repo: "r", githubToken: "t" });
    expect(res.analysis).toEqual(dummyAnalysis);
    expect(res.aiReadme).toContain("README");
    expect(res.provider).toBe("openai");
  });

  it("caches results on repeated calls", async () => {
    const spyAnalysis = vi.spyOn(RepoAnalyzer.prototype, "analyze");

    const first = await runOrchestrator({ owner: "o", repo: "r", githubToken: "t" });
    const second = await runOrchestrator({ owner: "o", repo: "r", githubToken: "t" });
    expect(first).toEqual(second);
    expect(spyAnalysis).toHaveBeenCalledTimes(1); // second call used cache
  });
});
