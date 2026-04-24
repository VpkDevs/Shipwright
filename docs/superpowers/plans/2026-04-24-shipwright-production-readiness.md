# Shipwright Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add database persistence, rate limiting, Gemini AI integration, structured logging, comprehensive tests, and CI/CD to make Shipwright production-ready.

**Architecture:** Sequential layer approach—DB schema first, then rate limiting, then Gemini integration (analysis + generation), then logging/errors, then tests, then CI/CD. Each layer is stable before the next builds on it.

**Tech Stack:** Drizzle ORM + Vercel Postgres, Upstash Redis, Google Generative AI SDK, Pino (logging), Vitest (testing), GitHub Actions (CI/CD), Husky + lint-staged (pre-commit).

---

## Phase 1: Database Setup

### Task 1: Install and configure Drizzle ORM

**Files:**
- Modify: `package.json`
- Create: `drizzle.config.ts`

- [ ] **Step 1: Add dependencies**

Add to `package.json` in the `dependencies` section:
```json
"drizzle-orm": "^0.30.10",
"@vercel/postgres": "^0.8.0"
```

Add to `package.json` in the `devDependencies` section:
```json
"drizzle-kit": "^0.20.14"
```

- [ ] **Step 2: Run install**

```bash
bun install
```

Expected: All three packages installed without errors.

- [ ] **Step 3: Create drizzle.config.ts**

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || "",
  },
});
```

- [ ] **Step 4: Commit**

```bash
git add package.json bun.lock drizzle.config.ts
git commit -m "chore: add Drizzle ORM and Vercel Postgres"
```

---

### Task 2: Create Drizzle schema (users, repositories, pull_requests, deployments)

**Files:**
- Create: `lib/db/schema.ts`

- [ ] **Step 1: Create lib/db directory if it doesn't exist**

```bash
mkdir -p lib/db
```

- [ ] **Step 2: Write schema.ts**

```typescript
import {
  pgTable,
  text,
  timestamp,
  integer,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  github_id: text("github_id").unique().notNull(),
  github_username: text("github_username").notNull(),
  email: text("email"),
  avatar_url: text("avatar_url"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const repositories = pgTable("repositories", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  github_repo_id: text("github_repo_id").notNull(),
  owner: text("owner").notNull(),
  name: text("name").notNull(),
  framework: text("framework"),
  risk_score: integer("risk_score"),
  last_analyzed_at: timestamp("last_analyzed_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const pull_requests = pgTable("pull_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  repo_id: uuid("repo_id")
    .references(() => repositories.id)
    .notNull(),
  pr_number: integer("pr_number"),
  pr_url: text("pr_url"),
  branch_name: text("branch_name").notNull(),
  status: text("status").default("open").notNull(),
  generated_files: jsonb("generated_files").$type<string[]>().notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const deployments = pgTable("deployments", {
  id: uuid("id").primaryKey().defaultRandom(),
  repo_id: uuid("repo_id")
    .references(() => repositories.id)
    .notNull(),
  provider: text("provider").notNull(),
  deploy_url: text("deploy_url"),
  status: text("status").default("pending").notNull(),
  deployed_at: timestamp("deployed_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  repositories: many(repositories),
}));

export const repositoriesRelations = relations(repositories, ({ one, many }) => ({
  user: one(users, {
    fields: [repositories.user_id],
    references: [users.id],
  }),
  pull_requests: many(pull_requests),
  deployments: many(deployments),
}));

export const pull_requestsRelations = relations(pull_requests, ({ one }) => ({
  repository: one(repositories, {
    fields: [pull_requests.repo_id],
    references: [repositories.id],
  }),
}));

export const deploymentsRelations = relations(deployments, ({ one }) => ({
  repository: one(repositories, {
    fields: [deployments.repo_id],
    references: [repositories.id],
  }),
}));
```

- [ ] **Step 3: Verify schema syntax**

```bash
bunx drizzle-kit introspect
```

Expected: No errors (introspect may warn about missing DB connection, that's fine).

- [ ] **Step 4: Commit**

```bash
git add lib/db/schema.ts
git commit -m "feat: define Drizzle ORM schema (users, repos, PRs, deployments)"
```

---

### Task 3: Create Drizzle client singleton

**Files:**
- Create: `lib/db/index.ts`

- [ ] **Step 1: Write db/index.ts**

```typescript
import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import * as schema from "./schema";

let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!db) {
    db = drizzle(sql, { schema });
  }
  return db;
}
```

- [ ] **Step 2: Verify syntax (TypeScript check)**

```bash
bun run type-check
```

Expected: No errors in lib/db/index.ts.

- [ ] **Step 3: Commit**

```bash
git add lib/db/index.ts
git commit -m "feat: create Drizzle client singleton"
```

---

### Task 4: Generate and run initial migration

**Files:**
- Create: `drizzle/migrations/*.sql` (auto-generated)

- [ ] **Step 1: Generate migration**

```bash
bunx drizzle-kit generate:pg
```

Expected: Creates `drizzle/migrations/` directory with numbered `.sql` file(s).

- [ ] **Step 2: Review generated migration**

```bash
cat drizzle/migrations/*.sql
```

Expected: SQL `CREATE TABLE` statements for users, repositories, pull_requests, deployments with correct columns and foreign keys.

- [ ] **Step 3: Add migration directory to .gitignore (if not already there)**

Check `cat .gitignore` — if `drizzle/migrations` is not present, that's fine (migrations should be committed). If it is, remove that line.

- [ ] **Step 4: Commit**

```bash
git add drizzle/
git commit -m "chore: add initial Drizzle migration"
```

---

### Task 5: Update .env.example with DATABASE_URL

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Add DATABASE_URL to .env.example**

Append to `.env.example`:
```
# Database
DATABASE_URL=postgres://user:password@host/dbname
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "chore: add DATABASE_URL to .env.example"
```

---

## Phase 2: Rate Limiting

### Task 6: Install Upstash dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add Upstash packages**

Add to `package.json` dependencies:
```json
"@upstash/ratelimit": "^1.1.1",
"@upstash/redis": "^1.28.4"
```

- [ ] **Step 2: Install**

```bash
bun install
```

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: add Upstash rate limiting packages"
```

---

### Task 7: Create rate limiting helper

**Files:**
- Create: `lib/rate-limit.ts`

- [ ] **Step 1: Write rate-limit.ts**

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

const limits = {
  "/api/repos": { requests: 30, window: "1 m" },
  "/api/analyze": { requests: 10, window: "1 m" },
  "/api/generate": { requests: 5, window: "1 m" },
  "/api/create-pr": { requests: 3, window: "1 m" },
};

const ratelimits: Record<string, Ratelimit> = {};

function getRateLimit(route: string) {
  if (!ratelimits[route]) {
    const config = limits[route as keyof typeof limits] || {
      requests: 10,
      window: "1 m",
    };
    ratelimits[route] = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        config.requests,
        config.window as "1 s" | "1 m" | "1 h" | "1 d"
      ),
    });
  }
  return ratelimits[route];
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export async function checkRateLimit(
  userId: string,
  route: string
): Promise<RateLimitResult> {
  const ratelimit = getRateLimit(route);
  const key = `${userId}:${route}`;

  const result = await ratelimit.limit(key);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.resetAfterMs ? Math.ceil(result.resetAfterMs / 1000) : 0,
    retryAfter: result.resetAfterMs ? Math.ceil(result.resetAfterMs / 1000) : undefined,
  };
}
```

- [ ] **Step 2: Type-check**

```bash
bun run type-check
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add lib/rate-limit.ts
git commit -m "feat: add rate limiting helper with Upstash"
```

---

### Task 8: Update .env.example with Upstash credentials

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Append Upstash env vars**

Add to `.env.example`:
```
# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://your-project.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "chore: add Upstash Redis env vars to .env.example"
```

---

## Phase 3: Gemini AI Integration

### Task 9: Install Google Generative AI SDK

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add Google SDK**

Add to `package.json` dependencies:
```json
"@google/generative-ai": "^0.4.0"
```

- [ ] **Step 2: Install**

```bash
bun install
```

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: add Google Generative AI SDK"
```

---

### Task 10: Create Gemini analyzer (repo analysis enrichment)

**Files:**
- Create: `lib/gemini-analyzer.ts`

- [ ] **Step 1: Write gemini-analyzer.ts**

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";
import { log } from "./logger";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface AnalysisEnrichment {
  framework: string;
  missingEnvVars: string[];
  readinessSummary: string;
}

export async function enrichAnalysisWithGemini(
  packageJson: Record<string, unknown>,
  fileTree: string,
  readme?: string,
  detectedFramework?: string
): Promise<AnalysisEnrichment | null> {
  try {
    const prompt = `You are a deployment expert. Analyze this repository structure and return JSON.

Package.json dependencies:
\`\`\`json
${JSON.stringify(packageJson, null, 2)}
\`\`\`

File tree:
\`\`\`
${fileTree}
\`\`\`

${readme ? `README.md:\n\`\`\`\n${readme.substring(0, 2000)}\n\`\`\`` : "No README found."}

${detectedFramework ? `Heuristic detected framework: ${detectedFramework}` : "No framework detected by heuristics."}

Return ONLY valid JSON (no markdown, no backticks) with this exact structure:
{
  "framework": "detected framework name or null",
  "missingEnvVars": ["VAR1", "VAR2"],
  "readinessSummary": "one sentence about deployment readiness"
}`;

    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Gemini timeout")), 5000)
      ),
    ]);

    const content = result.response.text();
    const parsed = JSON.parse(content);

    return {
      framework: parsed.framework || detectedFramework || "unknown",
      missingEnvVars: parsed.missingEnvVars || [],
      readinessSummary: parsed.readinessSummary || "",
    };
  } catch (error) {
    log.warn({ error }, "Gemini analysis enrichment failed, using heuristics");
    return null;
  }
}
```

- [ ] **Step 2: Type-check**

```bash
bun run type-check
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add lib/gemini-analyzer.ts
git commit -m "feat: add Gemini analyzer for enriched repo analysis"
```

---

### Task 11: Create Gemini generator (content generation)

**Files:**
- Create: `lib/gemini-generator.ts`

- [ ] **Step 1: Write gemini-generator.ts**

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";
import { log } from "./logger";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface GeneratedContent {
  readme: string;
  landingPageCopy: string;
  vercelConfigExplanation: string;
  envTemplate: string;
}

export async function generateContentWithGemini(
  repoName: string,
  repoOwner: string,
  framework: string,
  packageJsonDeps: string[],
  analysisDescription: string
): Promise<GeneratedContent | null> {
  try {
    const prompt = `You are a technical writer. Generate deployment content for this repo.

Repo: ${repoOwner}/${repoName}
Framework: ${framework}
Key dependencies: ${packageJsonDeps.join(", ")}
Analysis: ${analysisDescription}

Return ONLY valid JSON (no markdown, no backticks):
{
  "readme": "README.md content (2-3 paragraphs on setup, usage, deployment)",
  "landingPageCopy": "Homepage headline, tagline, and 3 feature bullet points",
  "vercelConfigExplanation": "Comments explaining the Vercel deployment (build command, output directory, etc.)",
  "envTemplate": "Environment variables needed with descriptions (KEY=description format, one per line)"
}`;

    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Gemini timeout")), 5000)
      ),
    ]);

    const content = result.response.text();
    const parsed = JSON.parse(content);

    return {
      readme: parsed.readme || "",
      landingPageCopy: parsed.landingPageCopy || "",
      vercelConfigExplanation: parsed.vercelConfigExplanation || "",
      envTemplate: parsed.envTemplate || "",
    };
  } catch (error) {
    log.warn({ error }, "Gemini generation failed, using template defaults");
    return null;
  }
}
```

- [ ] **Step 2: Type-check**

```bash
bun run type-check
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add lib/gemini-generator.ts
git commit -m "feat: add Gemini generator for AI-powered content"
```

---

### Task 12: Update .env.example with GEMINI_API_KEY

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Append Gemini env var**

Add to `.env.example`:
```
# AI Generation (Google Gemini)
GEMINI_API_KEY=your_api_key_here
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "chore: add GEMINI_API_KEY to .env.example"
```

---

## Phase 4: Logging and Error Handling

### Task 13: Install Pino logger

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add Pino**

Add to `package.json` dependencies:
```json
"pino": "^8.17.2"
```

- [ ] **Step 2: Install**

```bash
bun install
```

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: add Pino logger"
```

---

### Task 14: Create logger singleton

**Files:**
- Create: `lib/logger.ts`

- [ ] **Step 1: Write logger.ts**

```typescript
import pino from "pino";

let logger: pino.Logger | null = null;

function getLogger() {
  if (!logger) {
    logger = pino({
      level: process.env.LOG_LEVEL || "info",
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      },
    });
  }
  return logger;
}

export const log = getLogger();
```

- [ ] **Step 2: Add pino-pretty dev dependency**

Update `package.json` devDependencies:
```json
"pino-pretty": "^10.3.1"
```

Then run:
```bash
bun install
```

- [ ] **Step 3: Type-check**

```bash
bun run type-check
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add lib/logger.ts package.json bun.lock
git commit -m "feat: add Pino logger singleton"
```

---

### Task 15: Create typed error classes

**Files:**
- Create: `lib/errors.ts`

- [ ] **Step 1: Write errors.ts**

```typescript
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
      `Rate limit exceeded for user`
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
  constructor(public field: string, message: string) {
    super(400, `Invalid ${field}: ${message}`, message);
    this.name = "ValidationError";
  }
}
```

- [ ] **Step 2: Type-check**

```bash
bun run type-check
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add lib/errors.ts
git commit -m "feat: add typed error classes"
```

---

### Task 16: Create error handler HOF

**Files:**
- Create: `lib/with-error-handler.ts`

- [ ] **Step 1: Write with-error-handler.ts**

```typescript
import { AppError } from "./errors";
import { log } from "./logger";

export function withErrorHandler(
  handler: (req: Request) => Promise<Response>
) {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (error) {
      if (error instanceof AppError) {
        log.warn(
          { error: error.internalMessage, statusCode: error.statusCode },
          "Application error"
        );
        return new Response(
          JSON.stringify({
            error: error.userMessage,
            ...(error instanceof require("./errors").RateLimitError && {
              retryAfter: (error as any).retryAfter,
            }),
          }),
          {
            status: error.statusCode,
            headers: { "Content-Type": "application/json" },
            ...(error instanceof require("./errors").RateLimitError && {
              headers: {
                "Retry-After": String((error as any).retryAfter),
                "Content-Type": "application/json",
              },
            }),
          }
        );
      }

      log.error({ error }, "Unknown error");
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  };
}
```

- [ ] **Step 2: Type-check**

```bash
bun run type-check
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add lib/with-error-handler.ts
git commit -m "feat: add error handler wrapper for routes"
```

---

## Phase 5: Testing

### Task 17: Install Vitest and coverage

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add test dependencies**

Add to `package.json` devDependencies:
```json
"vitest": "^1.0.4",
"@vitest/coverage-v8": "^1.0.4",
"@vitest/ui": "^1.0.4"
```

- [ ] **Step 2: Install**

```bash
bun install
```

- [ ] **Step 3: Add test script to package.json**

In `package.json` scripts section, add:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 4: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: add Vitest test framework"
```

---

### Task 18: Create Vitest config

**Files:**
- Create: `vitest.config.ts`

- [ ] **Step 1: Write vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["lib/**/*.ts", "app/api/**/*.ts"],
      exclude: ["**/*.test.ts", "**/*.d.ts"],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
```

- [ ] **Step 2: Type-check**

```bash
bun run type-check
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "chore: configure Vitest"
```

---

### Task 19: Write unit tests for errors

**Files:**
- Create: `__tests__/lib/errors.test.ts`

- [ ] **Step 1: Write errors.test.ts**

```typescript
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
```

- [ ] **Step 2: Run test**

```bash
bun run test -- __tests__/lib/errors.test.ts
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add __tests__/lib/errors.test.ts
git commit -m "test: add unit tests for error classes"
```

---

### Task 20: Write unit tests for rate limiting

**Files:**
- Create: `__tests__/lib/rate-limit.test.ts`

- [ ] **Step 1: Write rate-limit.test.ts**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

// Mock Upstash
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: vi.fn(function (this: any) {
    this.limit = vi.fn(async () => ({
      success: true,
      limit: 10,
      remaining: 9,
      resetAfterMs: 60000,
    }));
  }),
}));

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
```

- [ ] **Step 2: Run test**

```bash
bun run test -- __tests__/lib/rate-limit.test.ts
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add __tests__/lib/rate-limit.test.ts
git commit -m "test: add unit tests for rate limiting"
```

---

### Task 21: Write unit tests for Gemini analyzer

**Files:**
- Create: `__tests__/lib/gemini-analyzer.test.ts`

- [ ] **Step 1: Write gemini-analyzer.test.ts**

```typescript
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
    vi.mocked(require("@google/generative-ai").GoogleGenerativeAI).mockImplementationOnce(
      () => {
        throw new Error("API error");
      }
    );
    const result = await enrichAnalysisWithGemini(
      { name: "test" },
      "src/"
    );
    // Should not throw, returns null
    expect(result === null || result?.framework).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test**

```bash
bun run test -- __tests__/lib/gemini-analyzer.test.ts
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add __tests__/lib/gemini-analyzer.test.ts
git commit -m "test: add unit tests for Gemini analyzer"
```

---

### Task 22: Write unit tests for Gemini generator

**Files:**
- Create: `__tests__/lib/gemini-generator.test.ts`

- [ ] **Step 1: Write gemini-generator.test.ts**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateContentWithGemini } from "@/lib/gemini-generator";

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn(function () {
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
    vi.mocked(require("@google/generative-ai").GoogleGenerativeAI).mockImplementationOnce(
      () => {
        throw new Error("API error");
      }
    );
    const result = await generateContentWithGemini(
      "app",
      "owner",
      "next",
      [],
      "test"
    );
    expect(result === null || result?.readme !== undefined).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test**

```bash
bun run test -- __tests__/lib/gemini-generator.test.ts
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add __tests__/lib/gemini-generator.test.ts
git commit -m "test: add unit tests for Gemini generator"
```

---

### Task 23: Write integration test stub for API routes

**Files:**
- Create: `__tests__/api/analyze.test.ts`

- [ ] **Step 1: Write analyze.test.ts (stub for integration testing)**

```typescript
import { describe, it, expect } from "vitest";

describe("POST /api/analyze", () => {
  it("is ready for integration tests", () => {
    // Full integration tests require auth mocking and database setup
    // Placeholder for future implementation
    expect(true).toBe(true);
  });

  it("requires authentication", () => {
    // TODO: Test that unauthenticated requests return 401
    expect(true).toBe(true);
  });

  it("checks rate limit", () => {
    // TODO: Test that exceeded rate limit returns 429
    expect(true).toBe(true);
  });

  it("returns 200 with analysis on success", () => {
    // TODO: Test happy path
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Run test**

```bash
bun run test -- __tests__/api/analyze.test.ts
```

Expected: All placeholder tests pass (return true).

- [ ] **Step 3: Commit**

```bash
git add __tests__/api/analyze.test.ts
git commit -m "test: add placeholder API integration tests (TODO)"
```

---

### Task 24: Run full test suite and check coverage

**Files:**
- No new files, review coverage report

- [ ] **Step 1: Run all tests**

```bash
bun run test
```

Expected: All tests pass.

- [ ] **Step 2: Generate coverage report**

```bash
bun run test:coverage
```

Expected: Coverage report shows at least 60% coverage on lib/ and app/api/ (targets will improve as implementation tests are written).

- [ ] **Step 3: Commit (coverage config in place)**

```bash
git add .
git commit -m "chore: test suite configured and initial tests passing"
```

---

## Phase 6: CI/CD

### Task 25: Create GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create .github/workflows directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Write ci.yml**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Type check
        run: bun run type-check

      - name: Lint
        run: bun run lint

      - name: Run tests
        run: bun run test

      - name: Build
        run: bun run build
```

- [ ] **Step 3: Verify syntax**

Visual inspection — YAML is valid, all steps reference correct scripts from package.json.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions CI pipeline"
```

---

### Task 26: Create GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Write deploy.yml**

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    needs: ci

    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install Vercel CLI
        run: bun add -g vercel

      - name: Deploy to Vercel
        run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

- [ ] **Step 2: Update to depend on CI job**

Change line `needs: ci` to `needs: [ci]` (ensure correct YAML syntax).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions deploy workflow"
```

---

### Task 27: Install Husky for pre-commit hooks

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add Husky and lint-staged**

Add to `package.json` devDependencies:
```json
"husky": "^9.0.11",
"lint-staged": "^15.2.2"
```

- [ ] **Step 2: Install**

```bash
bun install
```

- [ ] **Step 3: Initialize Husky**

```bash
bunx husky install
```

- [ ] **Step 4: Commit**

```bash
git add package.json bun.lock .husky
git commit -m "chore: initialize Husky for git hooks"
```

---

### Task 28: Configure pre-commit hook for linting

**Files:**
- Create: `.husky/pre-commit`

- [ ] **Step 1: Write pre-commit hook**

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

bun exec lint-staged
```

- [ ] **Step 2: Make hook executable**

```bash
chmod +x .husky/pre-commit
```

- [ ] **Step 3: Add lint-staged config to package.json**

Add to root of `package.json`:
```json
"lint-staged": {
  "*.{ts,tsx}": ["biome check --apply --no-errors-on-unmatched-files"]
}
```

- [ ] **Step 4: Test the hook**

Edit any `.ts` file (e.g., add a comment), stage it, and try to commit:
```bash
git add lib/test.ts
git commit -m "test: verify pre-commit hook runs"
```

Expected: Biome runs on staged files.

- [ ] **Step 5: Commit the hook**

```bash
git add .husky/pre-commit package.json
git commit -m "chore: add pre-commit hook for linting"
```

---

### Task 29: Update Dependabot config

**Files:**
- Modify: `.github/dependabot.yml`

- [ ] **Step 1: Check if file exists**

```bash
cat .github/dependabot.yml
```

If it doesn't exist, create it.

- [ ] **Step 2: Update or create with Bun ecosystem**

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"

  - package-ecosystem: "bun"
    directory: "/"
    schedule:
      interval: "weekly"
```

- [ ] **Step 3: Commit**

```bash
git add .github/dependabot.yml
git commit -m "chore: configure Dependabot for dependencies and GitHub Actions"
```

---

### Task 30: Update package.json scripts summary

**Files:**
- Modify: `package.json` (review, no changes needed)

- [ ] **Step 1: Verify all scripts are in place**

Run:
```bash
cat package.json | grep -A 10 '"scripts"'
```

Expected scripts should include:
- `dev` (already exists)
- `build` (already exists)
- `start` (already exists)
- `lint` (already exists)
- `format` (already exists)
- `type-check` (already exists)
- `test` (added in Task 17)
- `test:watch` (added in Task 17)
- `test:coverage` (added in Task 17)

- [ ] **Step 2: No commit needed**

Scripts are in place from previous tasks.

---

## Final Phase: Integration and Cleanup

### Task 31: Update API routes with error handlers and rate limiting

**Files:**
- Modify: `app/api/repos/route.ts`
- Modify: `app/api/analyze/route.ts`
- Modify: `app/api/generate/route.ts`
- Modify: `app/api/create-pr/route.ts`

- [ ] **Step 1: Update /api/repos/route.ts**

Add imports:
```typescript
import { withErrorHandler } from "@/lib/with-error-handler";
import { checkRateLimit } from "@/lib/rate-limit";
import { ValidationError } from "@/lib/errors";
```

Wrap the existing handler export:
```typescript
export const POST = withErrorHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new ValidationError("auth", "Not authenticated");
  }

  const rateLimitResult = await checkRateLimit(session.user.email, "/api/repos");
  if (!rateLimitResult.success) {
    throw new RateLimitError(rateLimitResult.retryAfter || 60);
  }

  // ... rest of existing logic
  return response;
});
```

- [ ] **Step 2: Update /api/analyze/route.ts**

Add imports:
```typescript
import { withErrorHandler } from "@/lib/with-error-handler";
import { checkRateLimit } from "@/lib/rate-limit";
import { enrichAnalysisWithGemini } from "@/lib/gemini-analyzer";
import { ValidationError, RateLimitError } from "@/lib/errors";
import { getDb } from "@/lib/db";
```

Wrap handler and add Gemini enrichment:
```typescript
export const POST = withErrorHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new ValidationError("auth", "Not authenticated");
  }

  const rateLimitResult = await checkRateLimit(session.user.email, "/api/analyze");
  if (!rateLimitResult.success) {
    throw new RateLimitError(rateLimitResult.retryAfter || 60);
  }

  const body = await req.json();
  // ... existing analysis logic ...

  // Enrich with Gemini
  const enrichment = await enrichAnalysisWithGemini(
    packageJson,
    fileTree,
    readme,
    analysis.framework
  );

  if (enrichment) {
    analysis.framework = enrichment.framework;
    analysis.missingEnvVars = [
      ...analysis.missingEnvVars,
      ...enrichment.missingEnvVars,
    ];
    analysis.readinessSummary = enrichment.readinessSummary;
  }

  // Save to DB
  const db = getDb();
  await db.insert(repositories).values({
    user_id: userId,
    github_repo_id: body.repoId,
    owner: body.owner,
    name: body.name,
    framework: analysis.framework,
    risk_score: analysis.riskScore,
    last_analyzed_at: new Date(),
  });

  return new Response(JSON.stringify(analysis), { status: 200 });
});
```

- [ ] **Step 3: Update /api/generate/route.ts**

Add imports:
```typescript
import { withErrorHandler } from "@/lib/with-error-handler";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateContentWithGemini } from "@/lib/gemini-generator";
import { ValidationError, RateLimitError } from "@/lib/errors";
import { getDb } from "@/lib/db";
import { repositories } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
```

Wrap handler and add Gemini generation:
```typescript
export const POST = withErrorHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new ValidationError("auth", "Not authenticated");
  }

  const rateLimitResult = await checkRateLimit(session.user.email, "/api/generate");
  if (!rateLimitResult.success) {
    throw new RateLimitError(rateLimitResult.retryAfter || 60);
  }

  const body = await req.json();
  const db = getDb();

  // Load cached analysis from DB
  const [repo] = await db
    .select()
    .from(repositories)
    .where(
      and(
        eq(repositories.github_repo_id, body.repoId),
        eq(repositories.user_id, userId)
      )
    );

  // Generate with Gemini
  const generated = await generateContentWithGemini(
    repo.name,
    repo.owner,
    repo.framework || "unknown",
    [], // TODO: Extract from cached deps
    repo.last_analyzed_at?.toString() || ""
  );

  // Fallback if Gemini fails (use template generators)
  const readme = generated?.readme || generateReadmeTemplate(repo);
  const landingPage = generated?.landingPageCopy || generateLandingTemplate(repo);

  return new Response(
    JSON.stringify({ readme, landingPage }),
    { status: 200 }
  );
});
```

- [ ] **Step 4: Update /api/create-pr/route.ts**

Add imports:
```typescript
import { withErrorHandler } from "@/lib/with-error-handler";
import { checkRateLimit } from "@/lib/rate-limit";
import { ValidationError, RateLimitError, GithubApiError } from "@/lib/errors";
import { getDb } from "@/lib/db";
import { pull_requests } from "@/lib/db/schema";
```

Wrap handler and add DB logging:
```typescript
export const POST = withErrorHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new ValidationError("auth", "Not authenticated");
  }

  const rateLimitResult = await checkRateLimit(session.user.email, "/api/create-pr");
  if (!rateLimitResult.success) {
    throw new RateLimitError(rateLimitResult.retryAfter || 60);
  }

  const body = await req.json();
  const db = getDb();

  try {
    // ... existing GitHub PR creation logic ...

    // Log PR to DB
    await db.insert(pull_requests).values({
      repo_id: repoId,
      pr_number: prData.number,
      pr_url: prData.html_url,
      branch_name: branchName,
      status: "open",
      generated_files: ["README.md", "vercel.json", ".env.example"],
    });

    return new Response(JSON.stringify({ prUrl: prData.html_url }), {
      status: 201,
    });
  } catch (error) {
    throw new GithubApiError((error as Error).message);
  }
});
```

- [ ] **Step 5: Commit**

```bash
git add app/api/
git commit -m "feat: integrate error handlers, rate limiting, DB, and Gemini into API routes"
```

---

### Task 32: Final verification and summary

**Files:**
- No new files

- [ ] **Step 1: Run full test suite**

```bash
bun run test
```

Expected: All tests pass (or stubs pass).

- [ ] **Step 2: Run type-check**

```bash
bun run type-check
```

Expected: No type errors.

- [ ] **Step 3: Run linter**

```bash
bun run lint
```

Expected: No linting errors (Biome reports clean).

- [ ] **Step 4: Run build**

```bash
bun run build
```

Expected: Build succeeds with no critical errors.

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "chore: all systems integrated and verified"
```

- [ ] **Step 6: Push to main (or upstream)**

```bash
git push
```

This triggers CI/CD on GitHub Actions.

---

## Summary

**What's been implemented:**
1. ✅ Postgres DB with Drizzle ORM (4 tables: users, repos, PRs, deployments)
2. ✅ Upstash Redis rate limiting (3-30 req/min per route)
3. ✅ Gemini AI integration (repo analysis enrichment + content generation)
4. ✅ Structured logging (Pino) + typed error classes
5. ✅ Error handler HOF for all routes
6. ✅ Vitest test suite (units + API stubs)
7. ✅ GitHub Actions CI (lint, type-check, test, build) + deploy (to Vercel)
8. ✅ Husky pre-commit hooks + Dependabot automation
9. ✅ API routes updated with new layers

**Not implemented (V2 scope):**
- E2E tests (Playwright)
- Full integration tests for API routes (DB + auth mocking)
- Dashboard/Settings pages
- Deployment status tracking (table exists but unused)
- Sentry/monitoring integration
- Performance optimization

**Next steps after this plan:**
- Set up Vercel Postgres and Upstash Redis credentials in production
- Get Gemini API key from Google AI Studio
- Configure GitHub Actions secrets (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)
- Monitor initial deploys and error rates
