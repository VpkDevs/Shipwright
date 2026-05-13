# Support Playbook — Shipwright

**Support channel:** vincekinney1991@gmail.com
**Target response time:** 24 hours
**Escalation:** N/A (solo founder — you ARE the escalation)

---

## FAQ — Top 20 (Use as auto-responder content)

**Q1: I generated content but it looks generic. Can I regenerate?**
Yes — go back to your repo page and click "Generate Content" again. For better output, add a description to your repo on GitHub (Settings → Description) or add a `description` field to your `package.json` before regenerating.

**Q2: My credits didn't appear after purchasing.**
Check your email for a Stripe receipt — if the payment completed, the credit should be there within 60 seconds. If it's been more than 5 minutes, email us with your GitHub username and we'll add it manually within 24 hours.

**Q3: The PR Shipwright created looks wrong. What do I do?**
Close the PR and regenerate. The generated content is a starting point — feel free to edit the PR before merging. All generated files (README, vercel.json, etc.) are just text and can be modified freely.

**Q4: Can I use Shipwright on private repos?**
Yes — the GitHub OAuth scope includes private repos. We access only what's needed for analysis.

**Q5: Does Shipwright commit directly to my main branch?**
No. Shipwright always creates a new branch (e.g., `shipwright/deploy-config`) and opens a pull request. You review and merge — we never touch your main branch directly.

**Q6: What frameworks does Shipwright support?**
Next.js, React (Create React App / Vite), Vue, Nuxt, Express, FastAPI, Django, Rails, and "unknown" (generic template). More frameworks are added regularly.

**Q7: I got a 402 error when trying to generate.**
You need a Ship Credit ($5) or a Pro subscription to generate content. Visit /pricing to purchase.

**Q8: Can I get a refund?**
Yes — 30-day money-back guarantee on first purchases. Email vincekinney1991@gmail.com with your GitHub username and Stripe receipt.

**Q9: The analysis says my framework is "unknown" but I'm using [framework].**
This means Shipwright couldn't detect your framework from your `package.json` or file structure. If you have an unusual setup, add a `shipwright.config.json` to your repo:
```json
{ "framework": "next.js", "deploymentTarget": "vercel" }
```
(Support for this config file is coming — for now, the generated content will use a generic template)

**Q10: The GitHub PR fails to create.**
This usually means your GitHub OAuth token expired. Sign out and sign back in, then try again.

**Q11: How do I cancel my Pro subscription?**
Go to /pricing → "Manage Billing" (links to Stripe Portal) → Cancel subscription.

**Q12: Is my repository code stored anywhere?**
No. We read your repo to perform analysis (package.json, file tree, README) but don't store the content. The analysis results are cached briefly (< 5 min) in Redis for performance, then discarded.

**Q13: Does Shipwright work on monorepos?**
Partially — it analyzes the root package.json. Multi-package monorepos may get less accurate results. This is on the roadmap.

**Q14: Can I use Shipwright for multiple repos on a single credit?**
No — each credit is one generation (one repo). Pro and Pro Annual plans include unlimited generations.

**Q15: The generated landing page looks too basic.**
The landing page copy is designed to be a starting point. It uses your repo's framework, description, and detected features. Edit the HTML at `landing/index.html` in the PR before merging.

**Q16: I accidentally merged the PR with the wrong content.**
Revert the merge on GitHub (the PR page has a "Revert" button). Then regenerate and create a new PR.

**Q17: Can Shipwright deploy my app for me?**
Not yet — Shipwright creates the deploy configuration and PR. You still need to connect your repo to Vercel/Netlify and trigger the first deploy. One-click deploy is on the roadmap.

**Q18: Does Pro include team members?**
Pro is single-user. The Team plan ($250/mo) includes up to 10 team members with shared repo history.

**Q19: Is there an API I can use programmatically?**
Not yet as a public API. The `/api/analyze` and `/api/generate` endpoints require GitHub OAuth authentication.

**Q20: My Vercel deployment is failing after merging the Shipwright PR.**
The generated `vercel.json` might have incorrect settings for your specific setup. Common issue: `outputDirectory` set incorrectly. Check the Vercel deployment logs and adjust the `vercel.json` as needed. Email us your error and we'll help debug.

---

## Response Templates

**Generic response:**
```
Hi [name],

Thanks for reaching out about Shipwright!

[ANSWER]

Let me know if you have any other questions.

— Vince
```

**Refund:**
```
Hi [name],

Happy to process a refund — you're well within our 30-day guarantee.

I'll initiate the refund on Stripe now. It typically takes 5-10 business days to appear on your statement depending on your bank.

Let me know if there's anything I can do to improve Shipwright for you.

— Vince
```

**Bug report:**
```
Hi [name],

Thanks for the detailed report — this is exactly the kind of feedback that makes Shipwright better.

I've logged this as a bug and will fix it in the next update. I'll let you know when it's resolved.

In the meantime, [WORKAROUND IF ANY].

— Vince
```
