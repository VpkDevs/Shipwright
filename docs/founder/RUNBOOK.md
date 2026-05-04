# Shipwright RUNBOOK

**Last updated:** May 3, 2026
**On-call:** Vincent Kinney (vincekinney1991@gmail.com)

---

## Common Incidents & Fixes

### 🔴 P0: Site Down / 500 on All Routes
1. Check Vercel dashboard → Deployments → latest deploy status
   - URL: https://vercel.com/vpkdevs/shipwright
2. Check Vercel Functions logs for unhandled errors
3. Check Upstash Redis: https://console.upstash.com (rate limiter health)
4. Check Vercel Postgres: https://vercel.com/storage (connection limits)
5. **Quick fix:** Re-deploy from Vercel dashboard → "Redeploy" latest commit

### 🔴 P0: Stripe Webhooks Failing
Symptom: Users purchase but credits don't appear
1. Go to https://dashboard.stripe.com/webhooks
2. Check the shipwright endpoint → look at failed events
3. Common causes:
   - `STRIPE_WEBHOOK_SECRET` env var mismatch → update in Vercel + redeploy
   - Webhook endpoint returning non-200 → check Vercel function logs
4. Replay failed events from Stripe dashboard → "Resend" button

### 🟡 P1: Generation Failing (Gemini Timeout)
Symptom: Users click Generate, get an error
1. Check Gemini API status: https://status.google.com
2. Check `GEMINI_API_KEY` is set in Vercel env vars
3. The route has a 5-second timeout + template fallback — users should still get content
4. If templates are also failing: check Vercel function logs for the `/api/generate` route

### 🟡 P1: Rate Limiting Too Aggressive
Symptom: Legitimate users getting 429 errors
1. Check rate limit config in `lib/rate-limit.ts`
2. Current limits: 10 req/hour on `/api/generate`, 20 req/hour on `/api/analyze`
3. Fix: increase limits in code → `vercel --prod`

### 🟡 P1: GitHub OAuth Callback Error
Symptom: Users can't sign in
1. Go to https://github.com/settings/developers → your OAuth app
2. Verify: Authorization callback URL matches `https://YOUR_DOMAIN/api/auth/callback/github`
3. Verify: `GITHUB_ID` and `GITHUB_SECRET` match in Vercel env vars
4. Verify: `NEXTAUTH_URL` matches your production domain

### 🟢 P2: Database Migration Needed
When adding new DB columns/tables:
```bash
bun run db:push
# or
npx drizzle-kit push
```

---

## Key URLs

| Service | URL |
|---------|-----|
| Vercel dashboard | https://vercel.com/vpkdevs/shipwright |
| Vercel logs | https://vercel.com/vpkdevs/shipwright/logs |
| Stripe dashboard | https://dashboard.stripe.com |
| Stripe webhooks | https://dashboard.stripe.com/webhooks |
| Upstash Redis | https://console.upstash.com |
| Vercel Postgres | https://vercel.com/storage |
| GitHub OAuth app | https://github.com/settings/developers |
| GitHub repo | https://github.com/VpkDevs/Shipwright |

---

## Deployment Process

```bash
# Standard deploy
git push origin main
# Auto-deploys via GitHub Actions CI/CD

# Emergency hotfix
git commit -m "fix: [description]"
vercel --prod
```

---

## Monitoring Checklist (Daily — 2 minutes)

- [ ] Vercel: any failed deployments in last 24h?
- [ ] Stripe: any failed webhooks or payments?
- [ ] Upstash: Redis connection count normal?
- [ ] GitHub Actions: CI passing on main?

---

## Escalation

If unresolvable within 30 minutes:
1. Post maintenance notice on https://twitter.com (from @vpkdevs)
2. Draft: "Shipwright is experiencing issues. We're investigating. Will update within 1 hour."
3. Focus on data integrity first — no lost payments, no corrupt generations
