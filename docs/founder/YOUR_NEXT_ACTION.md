# Your Next Action — Shipwright

*This file is the single source of truth for what to do right now.*
*Update it after completing each item.*

**Last updated:** May 3, 2026 (post-Atlas run)

---

## RIGHT NOW (blocking launch)

1. **Deploy to Vercel** (~10 min)
   - Run: `vercel login` then `vercel --prod` in the project directory
   - Set all env vars from `.env.example` in the Vercel dashboard
   - Confirm: `curl https://YOUR_URL.vercel.app` returns 200
   - **Blocks everything else**

2. **Create Stripe products** (~15 min)
   - https://dashboard.stripe.com/products
   - Create 4 products (Credit $5, Pro $15/mo, Pro Annual $150/yr, Team $250/mo)
   - Copy price IDs → set as Vercel env vars → redeploy
   - **Blocks: anyone buying anything**

3. **Register Stripe webhook** (~5 min)
   - https://dashboard.stripe.com/webhooks
   - Endpoint: `https://YOUR_URL/api/stripe/webhook`
   - Events: checkout.session.completed + subscription lifecycle
   - **Blocks: credits being added after purchase**

4. **Update GitHub OAuth callback URL** (~3 min)
   - https://github.com/settings/developers → your OAuth app
   - Set callback to: `https://YOUR_URL/api/auth/callback/github`
   - **Blocks: users signing in on production**

---

## THIS WEEK (non-blocking, do in order)

5. Post launch content (see LAUNCH_SEQUENCE.md steps 7-10)
6. Run database migration: `bun run db:push` (or `npx drizzle-kit push`)
7. Fix GitHub Dependabot vulnerabilities: https://github.com/VpkDevs/Shipwright/security/dependabot
8. File Wyoming LLC: https://sos.wyo.gov/business/register.aspx (~$100, 20 min)
9. Submit all 7 startup credit applications (see STARTUP_CREDITS.md, ~45 min)

---

## THIS MONTH

10. Open Mercury bank account: https://mercury.com (~15 min, requires EIN)
11. Set up UptimeRobot monitor: https://uptimerobot.com (free tier)
12. Send 10 direct developer outreach DMs (see FIRST_DOLLAR_SPRINT.md)
13. Submit to Product Hunt (see LAUNCH_SEQUENCE.md step 9)
14. Post on Indie Hackers (see LAUNCH_SEQUENCE.md step 8)

---

## PR TO CREATE

All Atlas work is on branch `claude/recursing-hypatia-634049`.

Create a PR to merge into main:
```
gh pr create --title "feat: payment gate, pricing page, legal, SEO + launch docs" \
  --body "Atlas run: adds Stripe payment gate to /api/generate, /pricing page, /terms, /privacy, SEO metadata, 30-day content calendar, launch sequence, startup credits, business setup, RUNBOOK, and support playbook."
```
