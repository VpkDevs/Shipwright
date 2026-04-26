import { afterEach, describe, expect, it, vi } from "vitest";

describe("Rate Limiting", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns rate limit metadata when Upstash is configured", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.com");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");

    const mockLimit = vi.fn(async () => ({
      success: true,
      limit: 10,
      remaining: 9,
      resetAfterMs: 60000,
    }));

    const mockRatelimit = vi.fn(function (this: any) {
      this.limit = mockLimit;
    });
    (mockRatelimit as any).slidingWindow = vi.fn(() => ({}));

    vi.doMock("@upstash/ratelimit", () => ({
      Ratelimit: mockRatelimit,
    }));
    vi.doMock("@upstash/redis", () => ({
      Redis: vi.fn(),
    }));
    vi.doMock("@/lib/logger", () => ({
      log: { warn: vi.fn() },
    }));

    const { checkRateLimit } = await import("@/lib/rate-limit");
    const result = await checkRateLimit("user-123", "/api/analyze");

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(9);
    expect(result.limit).toBe(10);
    expect(result.retryAfter).toBe(60);
  });

  it("allows requests when Upstash is not configured", async () => {
    const mockRedis = vi.fn();
    const mockRatelimit = vi.fn();
    (mockRatelimit as any).slidingWindow = vi.fn(() => ({}));

    vi.doMock("@upstash/ratelimit", () => ({
      Ratelimit: mockRatelimit,
    }));
    vi.doMock("@upstash/redis", () => ({
      Redis: mockRedis,
    }));
    vi.doMock("@/lib/logger", () => ({
      log: { warn: vi.fn() },
    }));

    const { checkRateLimit } = await import("@/lib/rate-limit");
    const result = await checkRateLimit("user-123", "/api/analyze");

    expect(result.success).toBe(true);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(10);
    expect(result.reset).toBe(0);
    expect(mockRedis).not.toHaveBeenCalled();
    expect(mockRatelimit).not.toHaveBeenCalled();
  });

  it("allows requests when Upstash rate limiting throws", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.com");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");

    const warn = vi.fn();
    const mockRatelimit = vi.fn(function (this: any) {
      this.limit = vi.fn(async () => {
        throw new Error("upstash unavailable");
      });
    });
    (mockRatelimit as any).slidingWindow = vi.fn(() => ({}));

    vi.doMock("@upstash/ratelimit", () => ({
      Ratelimit: mockRatelimit,
    }));
    vi.doMock("@upstash/redis", () => ({
      Redis: vi.fn(),
    }));
    vi.doMock("@/lib/logger", () => ({
      log: { warn },
    }));

    const { checkRateLimit } = await import("@/lib/rate-limit");
    const result = await checkRateLimit("user-123", "/api/analyze");

    expect(result.success).toBe(true);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(10);
    expect(warn).toHaveBeenCalled();
  });
});
