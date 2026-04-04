# Shipwright — Agentic + Monetization Implementation TODO

## Phase 1: Package Installation & Types ✅
- [x] Install `openai` and `stripe` npm packages
- [x] Update `types/index.ts` with AgentStep, PaymentStatus, AgentResult types

## Phase 2: Stripe Integration ✅
- [x] Create `lib/stripe.ts` — Stripe client setup
- [x] Create `app/api/stripe/checkout/route.ts` — Checkout session creation (accepts `plan` type, not raw priceId)
- [x] Create `app/api/stripe/webhook/route.ts` — Payment webhook handler
- [x] Create `app/api/stripe/portal/route.ts` — Customer portal
- [x] Create `app/api/credits/route.ts` — Check user payment status

## Phase 3: AI Agents ✅
- [x] Create `lib/agents/openai-agent.ts` — GPT-4o-mini agent with GitHub tool calling
- [x] Create `lib/agents/blackbox-agent.ts` — Blackbox AI code analysis agent
- [x] Create `lib/agents/orchestrator.ts` — Coordinates both agents with fallbacks

## Phase 4: AI Generators ✅
- [x] AI README generation — handled inside openai-agent.ts
- [x] AI landing page generation — handled inside orchestrator.ts (buildLandingPage)
- [x] Separate ai-readme.ts / ai-landing.ts not needed (logic merged into agents)

## Phase 5: API Routes ✅
- [x] Update `app/api/generate/route.ts` — Free template-only endpoint (isAI: false)
- [x] Create `app/api/agent/route.ts` — Agentic endpoint with payment gate (402 if no access)

## Phase 6: UI Updates ✅
- [x] Create `app/pricing/page.tsx` — Full pricing page with Ship Credit + Pro cards + FAQ
- [x] Update `app/page.tsx` — Updated features section + pricing preview section
- [x] Update `app/repos/[...slug]/page.tsx` — Payment gate UI + agent progress steps + AI vs template badge

## Phase 7: Auth & Config Fixes ✅
- [x] Fix `lib/auth.ts` — Removed invalid `scope` property, fixed GitHub OAuth scope via `authorization.params`
- [x] Fix `lib/auth.ts` — Removed invalid `redirect` event (not in NextAuth EventCallbacks)
- [x] Fix `lib/agents/orchestrator.ts` — Removed unused `generateLandingPage` import
- [x] Create `.env.example` — All required environment variables documented

## TypeScript ✅
- [x] All type errors resolved — `bun run type-check` passes clean

---

## 🚀 Setup Checklist (Before Going Live)

### Stripe Dashboard Setup
1. Go to https://dashboard.stripe.com/products
2. Create Product: **"Ship Credit"** → One-time price → **$5.00 USD**
   - Copy the Price ID → set as `STRIPE_PRICE_CREDIT`
3. Create Product: **"Pro Monthly"** → Recurring price → **$15.00/month**
   - Copy the Price ID → set as `STRIPE_PRICE_PRO`
4. Go to https://dashboard.stripe.com/webhooks → Add endpoint
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`,
     `customer.subscription.created`, `customer.subscription.updated`,
     `customer.subscription.deleted`
   - Copy Signing Secret → set as `STRIPE_WEBHOOK_SECRET`

### Environment Variables (.env.local)
```env
GITHUB_ID=your_github_oauth_client_id
GITHUB_SECRET=your_github_oauth_client_secret
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

OPENAI_API_KEY=sk-...
BLACKBOX_API_KEY=your_blackbox_api_key

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_CREDIT=price_...
STRIPE_PRICE_PRO=price_...
```

### Local Webhook Testing (Stripe CLI)
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Deploy
```bash
bun run build
bun start
