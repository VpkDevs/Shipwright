# Business Setup — Shipwright

## Entity Recommendation

**Recommendation: Wyoming LLC**
- Cost: $100 filing fee + $60/year renewal
- No state income tax
- Strong privacy (no public member list required)
- Formation URL: https://wyomingllc.com OR https://sos.wyo.gov/business/register.aspx
- Estimated time: ~20 minutes online
- Name to file: "Shipwright LLC" or "Shipwright Software LLC"

**Why Wyoming over Delaware:**
Delaware is optimized for VC-funded startups that need a C-Corp for investment rounds. For a bootstrapped SaaS, Wyoming LLC wins: lower cost, less administrative overhead, equally respected by Stripe and payment processors.

**What you need to file:**
1. Business name: "Shipwright LLC"
2. Registered agent in Wyoming ($0–$50/year via Northwest Registered Agent: https://www.northwestregisteredagent.com)
3. Payment: ~$100 by credit card
4. EIN (free, online): https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online
   - Required for Stripe business verification, banking

**After filing:**
- Open a business bank account (see Banking section below)
- Update Stripe account with LLC name + EIN
- File taxes as a single-member LLC (pass-through, just Schedule C on your personal return)

## Banking Recommendation

**Recommendation: Mercury (https://mercury.com)**
- No monthly fees, no minimum balance
- Free ACH + wire transfers
- API access for automating treasury/bookkeeping
- Developer-friendly (used by majority of tech startups)
- Requires: EIN + business registration documents + personal ID verification

**Alternative if Mercury rejects (rare):** Relay (https://relayfi.com) — same tier, slightly lower bar

## Minimum Viable Finance Setup

1. **Separate business bank account** — never mix personal + business
2. **Stripe payouts** — set payout schedule to weekly to your Mercury account
3. **Tax reserve** — move 25-30% of every Stripe payout to a "tax" sub-account in Mercury
4. **Bookkeeping** — use Wave (free: https://www.waveapps.com) or Harpoon for time-based tracking

## Tax Calendar

| Date | Action |
|------|--------|
| Quarterly (Apr 15, Jun 15, Sep 15, Jan 15) | Pay estimated federal + state taxes |
| Jan 31 | Issue 1099s if paying contractors >$600 |
| Mar 15 | S-corp election deadline (not needed as LLC) |
| Apr 15 | Annual personal return with Schedule C |

**Rule of thumb:** Set aside 30% of net profit every month. Pay quarterly estimates. Never owe a surprise bill.
