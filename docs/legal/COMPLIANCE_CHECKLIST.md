# Compliance Checklist

**Last reviewed:** May 3, 2026

## Payment Processing (Stripe)
- [x] Terms of Service include payment terms and refund policy
- [x] Privacy Policy mentions Stripe as a data processor
- [x] Pricing page links to ToS before purchase
- [ ] Stripe webhook signature verified on all events (✓ implemented in code)
- [ ] Stripe Radar (fraud) — review in dashboard after first transactions

## Data Privacy (GDPR-adjacent / US)
- [x] Privacy Policy published at `/privacy`
- [x] Data retention periods documented
- [x] Right to deletion process defined (email request → 30-day response)
- [x] No advertising or tracking cookies used
- [x] GitHub OAuth scope limited to `repo user` (minimum necessary)
- [ ] GDPR: If any EU users sign up, add cookie consent banner

## GitHub OAuth
- [x] Required OAuth scopes documented in Privacy Policy
- [x] Access token not persisted beyond session
- [x] `allowDangerousEmailAccountLinking: true` — review if email collision becomes an issue

## Security (from Dependabot alert)
- [ ] **URGENT:** 2 high + 3 moderate vulnerabilities on main branch
  - URL: https://github.com/VpkDevs/Shipwright/security/dependabot
  - Fix: Run `bun update` on main branch and review

## SaaS Compliance
- [x] ToS includes limitation of liability clause
- [x] ToS includes "as is" disclaimer
- [x] No PII beyond name/email/GitHub username collected
- [ ] Add cookie policy if adding analytics (PostHog, etc.)

## Status: Pre-Launch
Legal docs are committed. Routes `/terms` and `/privacy` are live once deployed.
Review Dependabot vulnerabilities before public launch.
