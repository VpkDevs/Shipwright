// Simple in-memory rate limiter for API routes
// For production, consider using Upstash Redis or similar

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configurations (requests per minute)
export const RATE_LIMITS = {
  analyze: { maxRequests: 10, windowSeconds: 60 },
  generate: { maxRequests: 5, windowSeconds: 60 },
  agent: { maxRequests: 3, windowSeconds: 60 },
  repos: { maxRequests: 30, windowSeconds: 60 },
  auth: { maxRequests: 5, windowSeconds: 60 },
  default: { maxRequests: 20, windowSeconds: 60 },
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Check if request should be rate limited
 * Returns { allowed: true, remaining, reset } if allowed
 * Returns { allowed: false, remaining: 0, reset } if blocked
 */
export function checkRateLimit(
  key: string,
  type: RateLimitType = "default"
): { allowed: boolean; remaining: number; reset: number } {
  const config = RATE_LIMITS[type] ?? RATE_LIMITS.default;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // New window
    const resetTime = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      reset: resetTime,
    };
  }

  if (entry.count >= config.maxRequests) {
    // Rate limited
    return {
      allowed: false,
      remaining: 0,
      reset: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    reset: entry.resetTime,
  };
}

/**
 * Get client IP from request headers
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

/**
 * Create rate limit key from request
 */
export function createRateLimitKey(headers: Headers, type: RateLimitType): string {
  const ip = getClientIp(headers);
  return `${type}:${ip}`;
}

/**
 * Rate limit error response
 */
export function rateLimitResponse(remaining: number, reset: number) {
  const retryAfter = Math.ceil((reset - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      message: `Too many requests. Please try again in ${retryAfter} seconds.`,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(Math.ceil(reset / 1000)),
        "Retry-After": String(retryAfter),
      },
    }
  );
}

/**
 * Middleware helper to apply rate limiting to API routes
 */
export async function withRateLimit(
  headers: Headers,
  type: RateLimitType,
  handler: () => Promise<Response>
): Promise<Response> {
  const key = createRateLimitKey(headers, type);
  const result = checkRateLimit(key, type);

  if (!result.allowed) {
    const response = rateLimitResponse(result.remaining, result.reset);
    return response;
  }

  const response = await handler();

  // Add rate limit headers to response
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(result.reset / 1000)));

  return response;
}

// Cleanup old entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 60 * 1000); // Cleanup every minute
}
