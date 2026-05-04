# Shipwright Launch Sequence

A numbered, paste-ready recipe. Do these in order. No improvisation needed.

---

## PRE-LAUNCH (T-48h)

**1. Run `vercel login` → `vercel --prod` in the project root**
- Vercel CLI is already installed globally
- Link to existing Vercel project if you have one, or create new
- Set all env vars (copy from `.env.example`) in Vercel dashboard → Settings → Environment Variables
- Required vars: `GITHUB_ID`, `GITHUB_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (set to your Vercel URL), `DATABASE_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_CREDIT`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_PRO_ANNUAL`, `STRIPE_PRICE_TEAM`
- Confirm: `curl https://YOUR_URL.vercel.app` returns 200

**2. Create Stripe products + price IDs**
- Go to https://dashboard.stripe.com/products
- Create "Ship Credit" → $5 one-time → copy price ID → set as `STRIPE_PRICE_CREDIT` in Vercel
- Create "Shipwright Pro" → $15/month recurring → copy price ID → set as `STRIPE_PRICE_PRO`
- Create "Shipwright Pro Annual" → $150/year recurring → `STRIPE_PRICE_PRO_ANNUAL`
- Create "Shipwright Team" → $250/month recurring → `STRIPE_PRICE_TEAM`

**3. Register Stripe webhook endpoint**
- Go to https://dashboard.stripe.com/webhooks → Add endpoint
- URL: `https://YOUR_URL.vercel.app/api/stripe/webhook`
- Events to listen for: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
- Copy webhook signing secret → set as `STRIPE_WEBHOOK_SECRET` in Vercel env vars
- Redeploy after setting: `vercel --prod`

**4. Update GitHub OAuth callback URL**
- Go to https://github.com/settings/applications → your OAuth App
- Update Authorization callback URL to: `https://YOUR_URL.vercel.app/api/auth/callback/github`
- Update `NEXTAUTH_URL` in Vercel env vars to match

**5. Run Drizzle database migration**
```bash
bun run db:push
```
(or `npx drizzle-kit push` if the script isn't defined — check package.json)

**6. Smoke test the full flow**
- Sign in with your own GitHub account
- Select a repo → analyze → click Generate (should hit payment gate → redirect to /pricing)
- Buy a $5 credit with Stripe test card `4242 4242 4242 4242`
- Confirm credit shows up: GET `/api/credits`
- Generate content → confirm credit consumed
- Create PR → confirm it appears in GitHub

---

## LAUNCH DAY (T-0)

**7. Post on Twitter/X — first post (copy-paste this):**
```
I built something that's been bugging me for months.

You know that feeling when you have a cool project on GitHub but it's just... sitting there? Never deployed. No README worth reading. No landing page.

Shipwright fixes that. You connect your repo, it analyzes the stack, and in minutes you get:
- A Vercel deploy config
- A real README
- A landing page
- An .env template
- A PR with all of it

$5 for one shot. $15/mo for unlimited.

→ shipwright.app [UPDATE WITH REAL URL]

Who has a dormant repo that needs this?
```

**8. Post on Indie Hackers — paste this in "New Product" section at https://www.indiehackers.com/products:**
```
Product: Shipwright
Tagline: Turn dormant GitHub repos into live products in minutes
URL: [YOUR URL]
Stage: Launched

Description:
Shipwright analyzes your GitHub repos and generates everything you need to deploy: Vercel config, README, landing page, env template — all packaged into a single pull request. Sign in with GitHub, pick a repo, and it runs. $5/credit or $15/mo unlimited.

Built this because I kept having half-finished projects and dreading the deployment setup. Now I ship in 15 minutes instead of 2 days.
```

**9. Submit to Product Hunt — go to https://www.producthunt.com/posts/new:**
```
Name: Shipwright
Tagline: Turn your dormant GitHub repos into live products in minutes
Description: Shipwright analyzes any GitHub repo and generates Vercel deployment configs, README files, landing pages, and .env templates — then opens a pull request with everything. AI-powered. $5/shot or $15/mo unlimited. Built for solo devs who build but struggle to ship.
Topics: Developer Tools, GitHub, Productivity, Artificial Intelligence
First comment (hunter comment):
"I built Shipwright because I had 20+ repos that were "90% done" but never shipped. The deployment config, README, and landing page always felt like the hard part after the fun part was done. Now I just point it at a repo and get a PR back in minutes. Happy to answer any questions!"
```

**10. Post in r/SideProject (https://reddit.com/r/SideProject):**
```
Title: I built a tool that takes any GitHub repo and generates deployment config + README + landing page as a PR

Body: Been building side projects for years, and the deployment/documentation phase always killed my momentum. Built Shipwright to fix this — you sign in with GitHub, it analyzes your repo (framework, env vars, risk score), and generates everything you need to deploy: vercel.json, .env.example, README.md, a landing page — all packaged as a pull request.

Stack: Next.js 15, Gemini AI, Stripe, Vercel Postgres.
$5 for one repo, $15/mo unlimited.

[URL]

Would love feedback. What's your biggest blocker when trying to ship?
```

---

## POST-LAUNCH (T+24h to T+72h)

**11. Reply to every comment on all platforms** — minimum 4 hours of active engagement

**12. DM 10 developers in your Twitter/GitHub network who have inactive repos:**
```
Hey [name] — I built a thing that auto-generates deployment configs and READMEs for GitHub repos. Saw your [repo name] has been sitting there — want me to run it on your repo? Free trial.
```
(Your 10 targets: find devs with repos that have commits but no deployment — GitHub search: `user:FRIEND pushed:>2024-01-01 NOT deployed`)

**13. Post "Day 1 update" thread on Twitter:**
```
Shipwright Day 1 update:
- [X] signups
- [X] generations
- First dollar: [yes/no] at [time]

What I learned: [1-2 sentences]

Still building in public. Follow along.
```

**14. Email yourself a reminder:** check Stripe dashboard, Vercel logs, and Upstash rate limit hits at T+6h, T+24h, T+72h.

---

## SUCCESS CRITERIA

Launch is successful if within 7 days:
- 3+ paying customers (any plan)
- 50+ signups
- Zero P0 production incidents

If 3 paying customers by day 7 → bump to 10 target by day 30.
If 0 paying customers by day 5 → DM 20 more developers directly (step 12 × 2).
