# Startup Credits — All 7 Applications

Copy-paste these applications. Submit them in order. Estimated total time: ~45 minutes.

---

## 1. AWS Activate (Up to $100,000 in credits)
**URL:** https://aws.amazon.com/activate/
**Application text:**

```
Company: Shipwright LLC
Website: [YOUR URL]
Stage: Pre-seed / Bootstrapped
Category: Developer Tools / SaaS

Description:
Shipwright is a developer tool that analyzes GitHub repositories and generates deployment configurations, README files, landing pages, and environment variable templates — packaged as automated pull requests. We use AI inference (currently Google Gemini) to generate content and plan to leverage AWS Bedrock for multi-model orchestration as we scale.

Primary AWS services needed:
- AWS Bedrock (Claude, Titan) for AI generation at scale
- Amazon SES for transactional email
- Amazon RDS as a database alternative/backup

Current team: 1 (solo founder)
Monthly active users target: 1,000 by month 6
Revenue model: $5/credit + $15/mo SaaS subscription
```

---

## 2. Vercel Startup Program (Pro plan + credits)
**URL:** https://vercel.com/support/contact?topic=startup-program
**Email subject:** Startup Program Application — Shipwright
**Application text:**

```
Hi Vercel team,

I'm the founder of Shipwright (https://[YOUR URL]), a developer tool that analyzes GitHub repos and generates deployment configs, READMEs, and landing pages as pull requests.

Shipwright is built entirely on Vercel (Next.js 15 App Router, Vercel Postgres, Edge Functions) and is a strong showcase for the Vercel platform. We generate vercel.json configurations for our users' repos, directly driving Vercel adoption.

I'd like to apply for the Vercel Startup Program. We're a solo-founder bootstrapped product, currently pre-revenue, targeting indie developers and small teams.

Our stack: Next.js 15, Vercel Postgres, Upstash Redis, NextAuth.js
GitHub: https://github.com/VpkDevs/Shipwright

Happy to provide any additional information.

Thanks,
Vince Kinney
vincekinney1991@gmail.com
```

---

## 3. GitHub for Startups (Free GitHub Teams)
**URL:** https://github.com/solutions/startups
**Application text:**

```
Company: Shipwright LLC
Founder GitHub: @vpkdevs
Website: [YOUR URL]
Stage: Pre-seed, bootstrapped

What we build:
Shipwright is a GitHub-native developer tool. We use the GitHub API (Octokit) to analyze repositories, generate deployment content, and create pull requests programmatically. Every core feature of our product depends on the GitHub API — we're deeply integrated into the GitHub ecosystem and directly drive GitHub API usage and pull request creation.

We're applying for GitHub for Startups to access GitHub Teams for our private development workflow as we scale from solo project to multi-contributor.
```

---

## 4. Anthropic API Credits
**URL:** https://www.anthropic.com/contact-sales OR https://console.anthropic.com (check for startup program)
**Application text:**

```
Company: Shipwright LLC
Website: [YOUR URL]
Use case: Developer tool — AI-generated README, landing page, and deployment documentation

Description:
Shipwright helps developers ship their GitHub projects by automatically generating deployment configs, professional READMEs, and landing pages using AI. We currently use Google Gemini 1.5 Flash for content generation and are looking to upgrade to Claude (Sonnet or Haiku) for our Pro tier to provide higher-quality output.

Our use case is a strong showcase for Claude's writing and code analysis capabilities — each generation requires understanding a codebase from its package.json, file tree, and README, then producing professional technical documentation.

Monthly generation volume target: 500-2,000 generations/month by month 6
```

Note: `@anthropic-ai/sdk` is already in the Shipwright dependencies (`package.json`). Once an API key is obtained, swap the generation tier to Claude on Pro plan.

---

## 5. Google for Startups (Up to $200,000 in GCP credits)
**URL:** https://cloud.google.com/startup
**Application text:**

```
Company: Shipwright LLC
Website: [YOUR URL]
Product stage: Launched, pre-revenue

Description:
Shipwright is a developer tool that uses Google Gemini 1.5 Flash to analyze GitHub repositories and generate deployment documentation. We're directly integrated with Google's AI infrastructure — Gemini is our primary AI provider.

Primary Google Cloud services used:
- Gemini API (GEMINI_API_KEY) — our core AI generation service
- Future: Vertex AI for higher-volume inference

We're a perfect fit for Google for Startups given our direct, production use of Google AI services.

Founders: 1 (Vincent Kinney, vincekinney1991@gmail.com)
```

---

## 6. Cloudflare for Startups ($250,000 in credits)
**URL:** https://www.cloudflare.com/forstartups/
**Application text:**

```
Company: Shipwright LLC
Website: [YOUR URL]
Stage: Bootstrapped, early revenue

Description:
Shipwright is a developer SaaS tool targeting indie developers. We generate deployment configurations and documentation for GitHub repositories using AI.

Cloudflare services we'd use:
- Cloudflare Pages (as CDN/edge layer for static assets)
- Cloudflare Workers for edge-based rate limiting (supplement Upstash)
- Cloudflare R2 for storing generated content caches

We're a small team (1 person) and the credits would help us scale infrastructure without burning runway before reaching profitability.
```

---

## 7. Stripe Atlas (Registered US entity + $500 in AWS credits)
**URL:** https://stripe.com/atlas
**Note:** Only apply if you don't have a US entity yet.

```
If you need to form a US entity, Stripe Atlas forms a Delaware C-Corp for $500 and includes:
- $500 in AWS credits
- Stripe processing fee waiver for 12 months
- Access to legal templates

Recommendation: Use Wyoming LLC instead (cheaper long-term) UNLESS you plan to raise VC money.
If you do raise: convert the Wyoming LLC to a Delaware C-Corp at that point.

Skip Stripe Atlas if forming Wyoming LLC.
```

---

## Summary

| Program | Value | Time | Required Action |
|---------|-------|------|----------------|
| AWS Activate | Up to $100K | ~10 min | Submit application above |
| Vercel Startup | Pro + credits | ~5 min | Email above |
| GitHub for Startups | Free Teams | ~5 min | Submit application above |
| Anthropic Credits | AI credits | ~5 min | Email/apply above |
| Google for Startups | Up to $200K GCP | ~10 min | Submit application above |
| Cloudflare for Startups | $250K credits | ~5 min | Submit application above |
| Stripe Atlas | $500 AWS + entity | ~20 min | Only if no LLC yet |

**Total estimated time: ~45 minutes**
**Total potential value: $550,000+ in credits**
