# Privacy Policy

**Effective date:** May 3, 2026
**Last updated:** May 3, 2026

This Privacy Policy describes how Shipwright ("we," "us," or "our"), operated by Vincent Kinney, collects, uses, and protects your information.

## 1. Information We Collect

### From GitHub OAuth
When you sign in with GitHub, we receive:
- Your GitHub username, display name, email address, and avatar URL
- A temporary OAuth access token (used only during your session to access your repositories)

### From Your Repositories
When you analyze a repository, we access:
- `package.json`, README, file tree, and environment variable names (not values)
- We do NOT access private file contents beyond what is required for analysis

### From Payments
Payments are processed by Stripe. We store:
- Your Stripe customer ID (linked to your email address)
- Your plan type and remaining credits (stored in Stripe customer metadata)
- We do NOT store credit card numbers or full payment details

### Usage Data
We collect:
- API request logs (timestamp, route, response code) for debugging and rate limiting
- These logs are retained for 30 days

## 2. How We Use Your Information

- **To provide the Service:** Analyze repos, generate content, create PRs
- **To process payments:** Create Stripe checkout sessions and manage subscriptions
- **To enforce rate limits:** Using your email address as a rate limit key
- **To improve the Service:** Aggregated, anonymized usage patterns only

## 3. Data Retention

| Data | Retention |
|------|-----------|
| GitHub profile data | Until you delete your account |
| Repository analysis results | Not persisted — generated per request |
| API logs | 30 days |
| Payment/billing data | Per Stripe's retention policy (7 years for tax records) |

## 4. Data Sharing

We do not sell your data. We share data only with:
- **GitHub:** Required for OAuth and repo access
- **Stripe:** Required for payment processing
- **Vercel/Upstash/Google:** Infrastructure providers (hosting, caching, AI generation)

All providers are contractually obligated to protect your data.

## 5. Your Rights

You may request:
- **Access:** A copy of the data we hold about you
- **Deletion:** Removal of your account and associated data
- **Correction:** Updates to inaccurate information

To exercise these rights, email: vincekinney1991@gmail.com

We will respond within 30 days.

## 6. Security

- All data in transit is encrypted via TLS
- GitHub tokens are never stored beyond your session
- We use Vercel Postgres with encrypted connections for persistent data
- Access to production systems is restricted to authorized personnel

## 7. Cookies

We use session cookies for authentication (NextAuth.js). We do not use tracking or advertising cookies.

## 8. Changes

We will notify users of material changes by updating this page. Continued use of the Service constitutes acceptance.

## 9. Contact

Questions or requests: vincekinney1991@gmail.com
