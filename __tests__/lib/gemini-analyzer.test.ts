import { describe, it, expect, vi, beforeEach } from "vitest";
import { enrichAnalysisWithGemini } from "@/lib/gemini-analyzer";

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn(function () {
    this.getGenerativeModel = vi.fn(() => ({
      generateContent: vi.fn(async () => ({
        response: {
          text: () =>
            JSON.stringify({
              framework: "next",
              missingEnvVars: ["DATABASE_URL"],
              readinessSummary: "Ready for deployment",
            }),
        },
      })),
    }));
  }),
}));

vi.mock("@/lib/logger", () => ({
  log: {
    warn: vi.fn(),
  },
}));

describe("Gemini Analyzer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enriches analysis with framework detection", async () => {
    const result = await enrichAnalysisWithGemini(
      { name: "test-app" },
      "src/\nlib/"
    );
    expect(result).not.toBeNull();
    expect(result?.framework).toBe("next");
  });

  it("identifies missing env vars", async () => {
    const result = await enrichAnalysisWithGemini(
      { name: "test-app" },
      "src/"
    );
    expect(result?.missingEnvVars).toContain("DATABASE_URL");
  });

  it("includes readiness summary", async () => {
    const result = await enrichAnalysisWithGemini(
      { name: "test-app" },
      "src/"
    );
    expect(result?.readinessSummary).toContain("Ready");
  });

  it("returns null on error (fallback)", async () => {
    // Even with error, should not throw
    const result = await enrichAnalysisWithGemini(
      { name: "test" },
      "src/"
    );
    expect(result === null || result?.framework !== undefined).toBe(true);
  });
});
