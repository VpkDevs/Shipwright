import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
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

  it("uses an in-memory fallback when Upstash is not configured", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");

    const result = await checkRateLimit("user-123", "/api/analyze");

    expect(result.success).toBe(true);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(9);
    expect(result.reset).toBeGreaterThan(0);
    expect(Redis).not.toHaveBeenCalled();
    expect(Ratelimit).not.toHaveBeenCalled();
  });

  it("enforces the in-memory fallback limit", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");

    const results = [];
    for (let i = 0; i < 11; i += 1) {
      results.push(await checkRateLimit("user-456", "/api/analyze"));
    }

    expect(results[9].success).toBe(true);
    expect(results[9].remaining).toBe(0);
    expect(results[10].success).toBe(false);
    expect(results[10].remaining).toBe(0);
    expect(results[10].retryAfter).toBeGreaterThan(0);
  });

  it("warns in production when falling back to in-memory rate limiting", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "production");
    const { checkRateLimit } = await import("@/lib/rate-limit");

    await checkRateLimit("user-789", "/api/analyze");
    await checkRateLimit("user-789", "/api/analyze");

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      "Upstash Redis is not configured; using in-memory rate limiting for this process."
    );
    warn.mockRestore();
  });

  it("returns success when limit not exceeded", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    const { checkRateLimit } = await import("@/lib/rate-limit");

    const result = await checkRateLimit("user-123", "/api/analyze");

    expect(result.success).toBe(true);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(9);
    expect(result.reset).toBe(60);
    expect(Redis).toHaveBeenCalled();
    expect(Ratelimit).toHaveBeenCalled();
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
