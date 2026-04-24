export class AppError extends Error {
  constructor(
    public statusCode: number,
    public userMessage: string,
    public internalMessage: string
  ) {
    super(internalMessage);
    this.name = "AppError";
  }
}

export class GithubApiError extends AppError {
  constructor(message: string) {
    super(502, "GitHub API error. Please try again.", message);
    this.name = "GithubApiError";
  }
}

export class GeminiError extends AppError {
  constructor(message: string) {
    super(502, "Content generation failed. Using defaults.", message);
    this.name = "GeminiError";
  }
}

export class RateLimitError extends AppError {
  public retryAfter: number;

  constructor(retryAfter: number) {
    super(
      429,
      `Rate limit exceeded. Retry after ${retryAfter} seconds.`,
      "Rate limit exceeded for user"
    );
    this.retryAfter = retryAfter;
    this.name = "RateLimitError";
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(500, "Database error occurred.", message);
    this.name = "DatabaseError";
  }
}

export class ValidationError extends AppError {
  constructor(
    public field: string,
    message: string
  ) {
    super(400, `Invalid ${field}: ${message}`, message);
    this.name = "ValidationError";
  }
}
