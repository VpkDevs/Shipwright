# Shipwright - Agentic + Monetization Implementation TODO

## Phase 1: Package Installation and Types

- [x] Install `openai` and `stripe`
- [x] Update `types/index.ts` with `AgentStep`, `PaymentStatus`, and `AgentResult`

## Phase 2: Stripe Integration

- [x] Create `lib/stripe.ts`
- [x] Create `app/api/stripe/checkout/route.ts`
- [x] Create `app/api/stripe/webhook/route.ts`
- [x] Create `app/api/stripe/portal/route.ts`
- [x] Create `app/api/credits/route.ts`

## Phase 3: AI Agents

- [x] Create `lib/agents/openai-agent.ts`
- [x] Create `lib/agents/blackbox-agent.ts`
- [x] Create `lib/agents/orchestrator.ts`
- [x] Add orchestrator caching to avoid duplicate runs

## Phase 4: AI Generators

- [x] Handle AI README generation inside `openai-agent.ts`
- [x] Handle AI landing page generation inside `orchestrator.ts`
- [x] Keep AI README and landing generation merged into the agents layer
- [x] Accept JSON blobs from LLM responses

## Phase 5: API Routes

- [x] Update `app/api/generate/route.ts` for free template output
- [x] Create `app/api/agent/route.ts` with payment gating

## Phase 6: UI Updates

- [x] Create `app/pricing/page.tsx`
- [x] Update `app/page.tsx`
- [x] Update `app/repos/[...slug]/page.tsx`

## Phase 7: Auth and Config Fixes

- [x] Fix GitHub OAuth scope handling in `lib/auth.ts`
- [x] Remove invalid NextAuth redirect event usage
- [x] Remove the unused `generateLandingPage` import from the orchestrator
- [x] Document required environment variables in `.env.example`

## Validation

- [x] `bun run type-check` passes clean
- [x] Test suite passes

## Setup Checklist Before Going Live

### Stripe Dashboard Setup

1. Go to [Stripe Products](https://dashboard.stripe.com/products).
1. Create a product named `Ship Credit` with a one-time `$5.00 USD` price.

   - Copy the price ID into `STRIPE_PRICE_CREDIT`

1. Create a product named `Pro Monthly` with a recurring `$15.00/month` price.

   - Copy the price ID into `STRIPE_PRICE_PRO`

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks) and add an endpoint.

   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events:
     `checkout.session.completed`, `payment_intent.succeeded`,
     `customer.subscription.created`, `customer.subscription.updated`,
     `customer.subscription.deleted`
   - Copy the signing secret into `STRIPE_WEBHOOK_SECRET`

### Environment Variables

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

### Local Webhook Testing

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Deploy

```bash
bun run build
bun start
```
