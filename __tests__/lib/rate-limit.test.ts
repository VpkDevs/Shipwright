import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@upstash/ratelimit", () => {
  const mockRatelimit = vi.fn(function (this: any) {
    this.limit = vi.fn(async () => ({
      success: true,
      limit: 10,
      remaining: 9,
      resetAfterMs: 60000,
    }));
  });
  (mockRatelimit as any).slidingWindow = vi.fn(() => ({}));
  return {
    Ratelimit: mockRatelimit,
  };
});

vi.mock("@upstash/redis", () => ({
  Redis: vi.fn(),
}));

describe("Rate Limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  });

  it("falls back locally when Upstash is not configured", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");

    const result = await checkRateLimit("user-123", "/api/analyze");

    expect(result.success).toBe(true);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(10);
    expect(result.reset).toBe(0);
  });

  it("returns success when limit not exceeded", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    const { checkRateLimit } = await import("@/lib/rate-limit");

    const result = await checkRateLimit("user-123", "/api/analyze");

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("calculates retryAfter in seconds", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    const { checkRateLimit } = await import("@/lib/rate-limit");

    const result = await checkRateLimit("user-123", "/api/analyze");

    expect(result.retryAfter).toBeDefined();
    expect(typeof result.retryAfter).toBe("number");
  });
});
