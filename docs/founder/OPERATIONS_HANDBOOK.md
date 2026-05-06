# Operations Handbook — Shipwright

## Weekly Review Checklist (every Monday, ~20 minutes)

### Metrics to pull
- [ ] Stripe dashboard: new MRR, churn, trial conversions this week
  - URL: https://dashboard.stripe.com/dashboard
- [ ] Vercel analytics: unique visitors, page views, /pricing funnel
  - URL: https://vercel.com/vpkdevs/shipwright/analytics
- [ ] GitHub: new stars, forks, issues opened
  - URL: https://github.com/VpkDevs/Shipwright

### Decision rule
| Signal | Action |
|--------|--------|
| <3 new sign-ups/week | Increase direct outreach (10 DMs to target developers) |
| >10% churn | Email churned users — find the reason |
| >5 support emails/week on same topic | Ship a fix or FAQ update |
| Generation error rate >5% | Check Gemini API + rate limit logs |
| 0 new paying customers in 7 days | Run "First Dollar Sprint" protocol (see FIRST_DOLLAR_SPRINT.md) |

## Monitoring Setup (Manual until BETTER_UPTIME_API_KEY obtained)

**Uptime check:** https://stats.uptimerobot.com — free tier
- Create monitor for: `https://YOUR_DOMAIN/api/auth/session`
- Alert: email to vincekinney1991@gmail.com on downtime

**Error tracking:** Check Vercel logs daily
- URL: https://vercel.com/vpkdevs/shipwright/logs
- Filter for: status 500, unhandled exceptions

**Payment alerts:** Stripe → Settings → Notifications
- Enable: failed payments, disputed charges, payout completed

## North Star Metric
**Monthly Generations** — how many repos Shipwright processes per month.

Secondary: Conversion rate (sign-up → first generation → first purchase)

## Compound Growth Target
- Month 1: 50 generations, $50 MRR
- Month 3: 200 generations, $250 MRR  
- Month 6: 1,000 generations, $1,500 MRR
- Month 12: 5,000 generations, $8,000 MRR

At $8K MRR: Shipwright is a real business. At $15K MRR: full-time viable.

## Monthly Investor Update Template (for when needed)

```
Subject: Shipwright Update — [Month] [Year]

MRR: $[X] (↑/↓ X% from last month)
Users: [X] total, [X] new this month
Generations: [X] this month
Churn: [X]%

What worked:
- [1-2 items]

What didn't:
- [1-2 items]

Next month focus:
- [1-2 items]

Ask:
- [If any]
```
