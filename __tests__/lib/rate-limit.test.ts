import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

vi.mock("@upstash/ratelimit", () => {
  const mockRatelimit = vi.fn(function (this: any) {
    this.limit = vi.fn(async () => ({
      success: true,
      limit: 10,
      remaining: 9,
      resetAfterMs: 60000,
    }));
  });
  mockRatelimit.slidingWindow = vi.fn(() => ({}));
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
  });

  it("returns success when limit not exceeded", async () => {
    const result = await checkRateLimit("user-123", "/api/analyze");
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("calculates retryAfter in seconds", async () => {
    const result = await checkRateLimit("user-123", "/api/analyze");
    expect(result.retryAfter).toBeDefined();
    expect(typeof result.retryAfter).toBe("number");
  });

  it("includes limit and reset info", async () => {
    const result = await checkRateLimit("user-123", "/api/analyze");
    expect(result.limit).toBeGreaterThan(0);
    expect(result.reset).toBeGreaterThan(0);
  });
});
