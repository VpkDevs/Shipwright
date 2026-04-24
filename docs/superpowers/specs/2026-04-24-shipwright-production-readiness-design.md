# Shipwright Production Readiness Design

**Date:** 2026-04-24  
**Status:** Approved  
**Scope:** Testing, CI/CD, Postgres DB, Upstash Redis rate limiting, Gemini AI integration, structured logging/error handling

---

## Overview

Shipwright is an MVP Next.js 15 app that turns dormant GitHub repos into deployed products. The core pipeline (auth → analyze → generate → PR) is complete. This spec covers the six layers needed to make it production-ready.

**Implementation order (sequential, each layer stable before the next):**
1. Postgres database schema (Drizzle ORM)
2. Upstash Redis rate limiting
3. Gemini AI — repo analysis enhancement
4. Gemini AI — content generation
5. Structured logging + typed error handling
6. Vitest test suite
7. GitHub Actions CI/CD

---

## Section 1: Database Schema (Postgres + Drizzle ORM)

### ORM Choice
Drizzle ORM — lightweight, TypeScript-native, plain SQL migrations, works with Vercel Postgres.

### Tables

**`users`**
- `id` — uuid, primary key
- `github_id` — text, unique, not null
- `github_username` — text, not null
- `email` — text, nullable
- `avatar_url` — text, nullable
- `created_at` — timestamp, default now()

Synced from GitHub OAuth on first login. NextAuth sessions resolve to this table via `github_id`.

**`repositories`**
- `id` — uuid, primary key
- `user_id` — uuid, FK → users.id, not null
- `github_repo_id` — text, not null
- `owner` — text, not null
- `name` — text, not null
- `framework` — text, nullable
- `risk_score` — integer, nullable
- `last_analyzed_at` — timestamp, nullable
- `created_at` — timestamp, default now()

Cached repo metadata per user. Avoids re-analyzing on every page load.

**`pull_requests`**
- `id` — uuid, primary key
- `repo_id` — uuid, FK → repositories.id, not null
- `pr_number` — integer, nullable
- `pr_url` — text, nullable
- `branch_name` — text, not null
- `status` — text, default 'open' (open/merged/closed)
- `generated_files` — jsonb, not null (list of generated file names)
- `created_at` — timestamp, default now()

History of every PR Shipwright creates.

**`deployments`** (stubbed for future use)
- `id` — uuid, primary key
- `repo_id` — uuid, FK → repositories.id, not null
- `provider` — text, not null (vercel, etc.)
- `deploy_url` — text, nullable
- `status` — text, default 'pending'
- `deployed_at` — timestamp, nullable
- `created_at` — timestamp, default now()

### New Files
- `lib/db/schema.ts` — Drizzle table definitions
- `lib/db/index.ts` — DB client singleton
- `drizzle.config.ts` — migration config
- `drizzle/` — migration SQL files

### New Env Vars
- `DATABASE_URL` — Postgres connection string

---

## Section 2: Rate Limiting (Upstash Redis)

### Approach
Single reusable helper `lib/rate-limit.ts`. Uses `@upstash/ratelimit` sliding window algorithm. Key: `userId:routeName`.

### Limits
| Route | Limit |
|-------|-------|
| `/api/repos` | 30 req/min |
| `/api/analyze` | 10 req/min |
| `/api/generate` | 5 req/min |
| `/api/create-pr` | 3 req/min |

### Response on Exceeded
- HTTP 429
- Header: `Retry-After: N`
- Body: `{ error: "Rate limit exceeded", retryAfter: N }`

### New Files
- `lib/rate-limit.ts` — `checkRateLimit(userId, route)` helper

### New Env Vars
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

---

## Section 3 & 4: Gemini AI Integration

### SDK
`@google/generative-ai` — Google's official Node.js SDK. Model: `gemini-1.5-flash`. Free tier via Google AI Studio.

### Analysis Enhancement (`lib/gemini-analyzer.ts`)
After existing heuristic analyzer runs, pass to Gemini:
- `package.json` contents
- File tree (top-level + src/)
- Existing README (if present)

Gemini returns:
- Confirmed/corrected framework detection
- Additional env vars the heuristics missed
- Plain-English deployment readiness summary

**Fallback:** If Gemini fails or times out (5s timeout), return heuristic result as-is. Gemini enriches, never blocks.

**Data flow:** `analyze route` → heuristics → Gemini enrichment → save to DB → return enriched result.

### Content Generation (`lib/gemini-generator.ts`)
Replaces template-based generators with Gemini-powered versions. Takes enriched analysis as context and generates:
- README (comprehensive, project-specific)
- Landing page copy (headline, features, CTA)
- Vercel config with rationale comments
- Env template with descriptions per variable

**Fallback:** If Gemini fails, existing template generators are called instead.

**Data flow:** `generate route` → load cached analysis from DB → Gemini generation → return files.

### New Files
- `lib/gemini-analyzer.ts`
- `lib/gemini-generator.ts`

### New Env Vars
- `GEMINI_API_KEY`

### Updated Files
- `app/api/analyze/route.ts` — call Gemini enrichment after heuristics
- `app/api/generate/route.ts` — call Gemini generator with DB-cached analysis
- `.env.example` — add GEMINI_API_KEY, DATABASE_URL, UPSTASH vars

---

## Section 5: Structured Logging + Error Handling

### Logging
`pino` — fast, JSON-native, Next.js serverless compatible.

Single export `lib/logger.ts` with `log.info()`, `log.warn()`, `log.error()`. Each API route logs: request received, key milestones, outcome. No sensitive data (tokens, keys, user content) ever logged.

### Typed Errors (`lib/errors.ts`)
Error classes:
- `GithubApiError` — 502, wraps Octokit errors
- `GeminiError` — 502, wraps Gemini SDK errors
- `RateLimitError` — 429, includes retryAfter
- `DatabaseError` — 500, internal only
- `ValidationError` — 400, includes field info

Each carries:
- `statusCode` — HTTP status to return
- `userMessage` — safe to show in UI
- `internalMessage` — logged only, never returned

### Route Wrapper (`lib/with-error-handler.ts`)
`withErrorHandler(handler)` HOF wraps every API route. Compatible with Next.js 15 App Router signature: `(req: Request) => Promise<Response>`.
- Typed errors → correct HTTP status + userMessage as JSON
- Unknown errors → log full stack, return generic 500 JSON
- Eliminates repetitive try/catch in every route file

### Updated Files
- All `app/api/*/route.ts` files — wrapped with `withErrorHandler`, use typed errors

---

## Section 6: Test Suite (Vitest)

### Framework
Vitest — TypeScript-native, no config overhead, fast.

### Structure
```
__tests__/
  lib/
    analyzer.test.ts
    gemini-analyzer.test.ts
    gemini-generator.test.ts
    rate-limit.test.ts
    errors.test.ts
  api/
    repos.test.ts
    analyze.test.ts
    generate.test.ts
    create-pr.test.ts
```

### Coverage
- Unit tests: `lib/` — framework detection edge cases, risk scoring, fallback behavior, error classes
- API tests: route handlers called directly with mocked dependencies — auth guard (401), rate limit (429), happy path, error path
- No E2E tests (V2 scope)
- Coverage target: 80% on `lib/` and `app/api/`, reported not enforced

### Test Doubles
`vi.mock()` for: Gemini SDK, Upstash, Octokit, Drizzle DB. No real network calls in tests.

### New Files
- `vitest.config.ts`
- All `__tests__/**/*.test.ts` files

### New Dependencies
- `vitest` (dev)
- `@vitest/coverage-v8` (dev)

---

## Section 7: CI/CD (GitHub Actions)

### `ci.yml` — on push + PR to `main`
Steps (fail-fast):
1. Checkout + setup Bun
2. `bun install`
3. `bun run type-check`
4. `bun run lint`
5. `bun run test`
6. `bun run build`

PRs cannot merge if CI is red.

### `deploy.yml` — on push to `main`, after CI passes
- Vercel CLI deploy to production (`vercel --prod`)
- Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

### Pre-commit Hooks
`husky` + `lint-staged` — on commit, runs Biome format+lint on staged files only.

### Dependabot
Update `.github/dependabot.yml` — add `bun` ecosystem, weekly schedule for npm + GitHub Actions.

### New Files
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `.husky/pre-commit`
- `.github/dependabot.yml` (updated)

### New Dependencies
- `husky` (dev)
- `lint-staged` (dev)

---

## New Dependencies Summary

| Package | Type | Purpose |
|---------|------|---------|
| `drizzle-orm` | prod | ORM |
| `drizzle-kit` | dev | Migrations CLI |
| `@vercel/postgres` | prod | Postgres client |
| `@upstash/ratelimit` | prod | Rate limiting |
| `@upstash/redis` | prod | Redis client |
| `@google/generative-ai` | prod | Gemini SDK |
| `pino` | prod | Logging |
| `vitest` | dev | Test runner |
| `@vitest/coverage-v8` | dev | Coverage |
| `husky` | dev | Git hooks |
| `lint-staged` | dev | Staged file linting |

---

## New Env Vars Summary

| Var | Required | Purpose |
|-----|----------|---------|
| `DATABASE_URL` | Yes | Postgres connection |
| `UPSTASH_REDIS_REST_URL` | Yes | Upstash Redis |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Upstash Redis |
| `GEMINI_API_KEY` | Yes | Google AI Studio |

---

## Files Modified Summary

| File | Change |
|------|--------|
| `app/api/analyze/route.ts` | Add Gemini enrichment, rate limiting, error handler |
| `app/api/generate/route.ts` | Add Gemini generation, DB cache, rate limiting, error handler |
| `app/api/repos/route.ts` | Add rate limiting, error handler |
| `app/api/create-pr/route.ts` | Add rate limiting, error handler |
| `.env.example` | Add new vars |
| `package.json` | Add new dependencies + scripts |

---

## Out of Scope (V2)

- E2E tests (Playwright)
- Multiple cloud providers beyond Vercel
- Dashboard/Settings pages (currently stubbed)
- Deployment status tracking (deployments table stubbed only)
- Sentry/monitoring integration
