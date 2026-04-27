# Roadmap: Build on Production-Ready Foundation

## Current State
- ✅ Database (Drizzle ORM + Vercel Postgres)
- ✅ Rate limiting (Upstash Redis)
- ✅ AI generation (Google Gemini 1.5 Flash)
- ✅ Logging (Pino)
- ✅ Error handling (typed errors + HOF wrapper)
- ✅ Tests (Vitest, 80% coverage)
- ✅ CI/CD (GitHub Actions)
- ✅ Security fixes and code cleanup

## Phase 1: Payment Infrastructure (Stripe)

### 1.1 Add Stripe to dependencies
```json
"stripe": "^20.3.1",
```

### 1.2 Create `lib/stripe.ts`
- Stripe client initialization
- `getOrCreateCustomer(email, name)` — idempotently get/create Stripe customer
- `getShipCredits(customerId)` — query customer metadata for remaining credits
- `consumeCredit(customerId)` — decrement and update customer credits
- `hasActiveProSubscription(customerId)` — check if customer has active pro/team subscription
- Price ID constants: `STRIPE_PRICES = { credit, pro, proAnnual, team }`

### 1.3 Create `/api/stripe/webhook/route.ts`
- Webhook handler for `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted` events
- Update user's subscription status in database (or Stripe metadata if not persisting)

### 1.4 Create `/api/stripe/checkout/route.ts`
- Accept POST with `{ plan: "credit" | "pro" | "proAnnual" | "team", repoFullName?: string }`
- Validate plan via allowlist (don't trust client price IDs)
- Get/create Stripe customer from session email
- Create checkout session with:
  - Mode: `payment` for one-time credits, `subscription` for plans
  - Metadata: `repoFullName`, `userId`, `planType`
  - Success/cancel URLs
- Return checkout URL (client redirects to Stripe Checkout)

### 1.5 Create `/api/stripe/portal/route.ts`
- GET endpoint to create billing portal session
- Client gets session URL and redirects (user manages subscriptions, invoices, etc.)

### 1.6 Create `/api/credits/route.ts`
- GET — return current `PaymentStatus` (plan, remaining credits, pro expiry)
- Session-authenticated only

---

## Phase 2: Agent Orchestration & Multi-AI

### 2.1 Add dependencies
```json
"openai": "^6.23.0",
```

### 2.2 Create `lib/agents/orchestrator.ts`
- Main agentic pipeline with step callbacks
- Workflow:
  1. Static analysis (RepoAnalyzer — free, no API cost)
  2. Blackbox AI (code analysis, config generation)
  3. OpenAI GPT-4o-mini (README, landing page, recommendations)
  4. Merge results, fallback to templates if any step fails
- Step tracking: `AgentStep { id, label, status, detail }`
- In-memory cache with TTL (5 min default)
- Type: `OrchestratorOptions { owner, repo, githubToken, description?, onStep?, logger? }`
- Return: `AgentResult { analysis, aiReadme, aiLandingPage, vercelJson, packageJsonScripts, envTemplate, deploymentRecommendations, githubActionsWorkflow, steps, provider }`

### 2.3 Create `lib/agents/blackbox-agent.ts`
- Blackbox API integration for code analysis
- Extract:
  - Missing environment variables
  - Config files (vercel.json, next.config.js, etc.)
  - Framework-specific build/deployment patterns
- Return structured data for orchestrator merging
- 5-second timeout with template fallback

### 2.4 Create `lib/agents/openai-agent.ts`
- OpenAI GPT-4o-mini with tool calling
- Tools:
  - `get_file_content(path)` — fetch specific file for context
  - `list_files(pattern)` — list files matching pattern
  - `analyze_code_structure()` — summarize repo architecture
- Generate:
  - Professional README with features, setup, examples
  - Marketing landing page copy
  - Deployment recommendations
- Fallback to templates if timeout/error

### 2.5 Update types in `types/index.ts`
- `AgentStepStatus = "pending" | "running" | "done" | "error"`
- `AgentStep { id, label, status, detail? }`
- `AgentResult { analysis, aiReadme, aiLandingPage, vercelJson, packageJsonScripts, envTemplate, deploymentRecommendations, githubActionsWorkflow, steps, provider }`
- `PaymentStatus { plan, credits, proExpiresAt?, stripeCustomerId? }`
- `PlanType = "none" | "credit" | "pro"`

---

## Phase 3: Payment-Gated AI Generation

### 3.1 Update `/api/generate/route.ts`
- Add payment gate before orchestration:
  ```
  1. Verify session
  2. Get PaymentStatus (credits/subscription)
  3. If no pro AND no credits → return 402 Payment Required
  4. If has credits or pro → proceed with orchestration
  5. If succeeded AND had credits → consume one credit
  ```
- Integrate orchestrator with `onStep` callback for real-time progress
- Return full `AgentResult` with steps for UI to display

### 3.2 Update `/api/analyze/route.ts`
- Keep free (no payment gate)
- Returns just `RepoAnalysis` (framework, risks, etc.)

### 3.3 Create `/api/agent/route.ts`
- Simplified payment-gated route that accepts `{ owner, repo, description? }`
- Runs full orchestrator with streaming step updates (optional: use SSE)
- Meant for direct orchestrator invocations outside the `/generate` flow

---

## Phase 4: Component Refactoring (Client-Side Architecture)

### 4.1 Create `lib/analytics.ts`
- Track user events: `trackEvent(name, properties)`
- Events: `"homepage_cta_clicked"`, `"pricing_cta_clicked"`, `"pricing_plan_selected"`, `"repo_paywall_clicked"`, `"checkout_started"`
- `/api/analytics` endpoint stores events in database or external service

### 4.2 Create `lib/cache.ts`
- In-memory cache with TTL: `setCache`, `getCache`, `deleteCache`, `clearCache`
- Async helpers: `cachedAsync(key, fn, ttl)` — wraps async functions
- Auto-cleanup expired entries every minute

### 4.3 Create `lib/hooks.ts`
- `useDebounce(value, delay)` — debounce a value
- `useDebouncedCallback(fn, delay)` — debounce a function
- `useThrottledCallback(fn, delay)` — throttle a function
- `useFetch(url, options)` — data fetching with loading/error state
- `useLocalStorage(key, initial)` — persistent state with SSR support

### 4.4 Extract `app/page.client.tsx`
- Homepage logic moved to client component
- Keeps: metrics display, features, testimonials, CTAs
- Adds: analytics tracking, dark mode toggle integration
- Uses: custom fonts (Space Grotesk, IBM Plex Mono), gradient styling

### 4.5 Extract `app/pricing/PricingClient.tsx`
- Pricing page moved to client component
- Shows: Ship Credits ($5), Pro ($15/mo), Pro Annual ($150/yr), Team ($250/mo)
- Features per plan: credits, repos, AI generations, support, etc.
- Handles: "Choose Plan" buttons → Stripe checkout

### 4.6 Extract `app/repos/ReposClient.tsx`
- Repository list with:
  - Real-time filtering (name, owner, description)
  - Language filter
  - Sorting (stars, updated, name)
  - Stats cards (total repos, languages, stars)
  - Online/offline detection
  - Cache display time

### 4.7 Extract `app/repos/[...slug]/RepoPageClient.tsx`
- Enhanced detail view with:
  - Payment status badge (None / Credit / Pro)
  - AI vs Template badge
  - Live agent progress display (step tracking with status icons)
  - Generated content preview (tabs: README, landing, vercel.json, env template)
  - PR creation dialog (one-click button)
  - Copy buttons + ZIP download for content

---

## Phase 5: Enhanced UI & UX

### 5.1 Create `components/LoadingButton.tsx`
- Button with loading state and spinner
- Disabled while loading, shows loading text

### 5.2 Create `components/Skeletons.tsx`
- Skeleton loaders for:
  - Card skeleton
  - List item skeleton
  - Repository list skeleton
  - Agent step skeleton

### 5.3 Create `components/ErrorBoundary.tsx`
- React error boundary wrapper
- Fallback UI with error message + retry button

### 5.4 Update `app/globals.css`
- Add: landing panel styles, landing sheen gradient, dark/light theme vars
- Expand: spacing, colors, shadows for premium look

### 5.5 Update `lib/theme.ts`
- Add theme toggle (dark/light mode)
- Persist to localStorage via `useLocalStorage`

---

## Phase 6: Observability & SEO

### 6.1 Create `lib/seo.ts`
- `generateMetadata(title, description, image)` — Next.js metadata helper
- Open Graph and Twitter card support
- Structured data (JSON-LD) for organizations, articles

### 6.2 Add public assets
- `/public/og-image.svg` — OG image for social sharing
- `/public/logo.svg` — brand logo
- `/public/favicon.svg` — favicon
- `/public/robots.txt` — SEO robots
- `/public/sitemap.xml` — XML sitemap

### 6.3 Create `lib/analytics-store.ts`
- In-memory event store (before persisting to DB/external service)
- Batch events for efficient API calls
- Auto-flush on interval

---

## Phase 7: Testing

### 7.1 Expand test coverage
- `tests/agents/orchestrator.test.ts` — pipeline orchestration
- `tests/agents/blackbox-agent.test.ts` — Blackbox API mocking
- `tests/agents/openai-agent.test.ts` — OpenAI API mocking
- `tests/analytics.test.ts` — event tracking
- `tests/stripe.test.ts` — customer management, credit logic
- `tests/pricing.test.ts` — plan display, checkout flow

### 7.2 Add integration tests
- E2E flows: auth → repo selection → analysis → payment → generation → PR creation

---

## Implementation Strategy

**Start with Phase 1 (Stripe)** to establish payment foundation:
1. Wire up Stripe (client init, webhook, checkout, portal, credits API)
2. Update `/api/generate` with payment gate
3. Test payment flows

**Then Phase 2–3 (Agents)**:
1. Add OpenAI + Blackbox
2. Build orchestrator with fallbacks
3. Integrate into `/api/generate` with real-time steps

**Then Phase 4–5 (UX)**:
1. Extract components to client-side
2. Add analytics, caching, hooks
3. Enhance styling and interactivity

**Then Phase 6–7 (Polish)**:
1. Add SEO, analytics store
2. Expand test suite
3. Deploy

---

## Dependencies Summary

**New in PR #1:**
- `openai@^6.23.0` — GPT-4o-mini agent
- `stripe@^20.3.1` — payment processing

**Already in main:**
- `@anthropic-ai/sdk@^0.21.0`
- `@google/generative-ai@^0.14.0` (Gemini)
- `@upstash/ratelimit@^2.0.0`
- `@upstash/redis@^1.35.0`
- `drizzle-orm@^0.45.2`
- `pino@^10.3.1`
- `zod@^3.23.0`
- `next-auth@^4.24.0`

---

## Key Decisions from PR #1

1. **Stripe Metadata** — Store credits/subscription status in Stripe customer metadata (no DB writes needed)
2. **In-Memory Caching** — Simple TTL-based cache for orchestrator results (5-min default)
3. **Graceful Fallbacks** — All AI steps timeout after 5s, fall back to templates
4. **Real-Time Steps** — Agent progress sent via `onStep` callback for live UI updates
5. **Client Components** — Heavy use of `"use client"` to enable interactivity and hooks
6. **Analytics Non-Blocking** — Track events with `keepalive: true` to prevent blocking page navigation
7. **SSR Safe** — All client-side hooks check `typeof window` for SSR compat
