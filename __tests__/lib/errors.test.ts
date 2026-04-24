import { describe, it, expect } from "vitest";
import {
  GithubApiError,
  GeminiError,
  RateLimitError,
  ValidationError,
  DatabaseError,
} from "@/lib/errors";

describe("Error Classes", () => {
  it("GithubApiError returns 502 with safe user message", () => {
    const error = new GithubApiError("API returned 500");
    expect(error.statusCode).toBe(502);
    expect(error.userMessage).toBe("GitHub API error. Please try again.");
    expect(error.internalMessage).toBe("API returned 500");
  });

  it("GeminiError returns 502 with fallback message", () => {
    const error = new GeminiError("Model unavailable");
    expect(error.statusCode).toBe(502);
    expect(error.userMessage).toContain("defaults");
  });

  it("RateLimitError returns 429 with retryAfter", () => {
    const error = new RateLimitError(60);
    expect(error.statusCode).toBe(429);
    expect(error.retryAfter).toBe(60);
  });

  it("ValidationError returns 400 with field info", () => {
    const error = new ValidationError("email", "invalid format");
    expect(error.statusCode).toBe(400);
    expect(error.field).toBe("email");
    expect(error.userMessage).toContain("email");
  });

  it("DatabaseError returns 500 with generic user message", () => {
    const error = new DatabaseError("Connection failed");
    expect(error.statusCode).toBe(500);
    expect(error.userMessage).toBe("Database error occurred.");
  });
});
