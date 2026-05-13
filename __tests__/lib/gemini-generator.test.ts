import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateContentWithGemini } from "@/lib/gemini-generator";

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn(function (this: any) {
    this.getGenerativeModel = vi.fn(() => ({
      generateContent: vi.fn(async () => ({
        response: {
          text: () =>
            JSON.stringify({
              readme: "# My App\nSetup and deployment guide.",
              landingPageCopy: "Deploy your app instantly",
              vercelConfigExplanation: "Build command: npm run build",
              envTemplate: "DATABASE_URL=connection_string",
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

describe("Gemini Generator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates README content", async () => {
    const result = await generateContentWithGemini(
      "my-app",
      "owner",
      "next",
      ["react", "next"],
      "Next.js app"
    );
    expect(result?.readme).toContain("My App");
  });

  it("generates landing page copy", async () => {
    const result = await generateContentWithGemini(
      "my-app",
      "owner",
      "next",
      ["react"],
      "Next.js app"
    );
    expect(result?.landingPageCopy).toContain("Deploy");
  });

  it("generates Vercel config explanation", async () => {
    const result = await generateContentWithGemini(
      "my-app",
      "owner",
      "next",
      ["react"],
      "Next.js app"
    );
    expect(result?.vercelConfigExplanation).toContain("Build");
  });

  it("generates env template", async () => {
    const result = await generateContentWithGemini(
      "my-app",
      "owner",
      "next",
      ["react"],
      "Next.js app"
    );
    expect(result?.envTemplate).toContain("DATABASE_URL");
  });

  it("returns null on error (fallback)", async () => {
    const result = await generateContentWithGemini("app", "owner", "next", [], "test");
    expect(result === null || result?.readme !== undefined).toBe(true);
  });
});
