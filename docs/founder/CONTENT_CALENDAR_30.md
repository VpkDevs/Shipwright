# Shipwright — 30-Day Content Calendar

**Platform:** Twitter/X (primary), cross-post to LinkedIn
**Tone:** Builder-to-builder. Direct. Show the work. No hype.
**Frequency:** 1 post/day minimum. Threads on days marked [THREAD]

---

## WEEK 1 — Launch Week

**Day 1 (Launch)** — Main launch post (see LAUNCH_SEQUENCE.md step 7)

**Day 2** [THREAD]
```
Thread: How Shipwright actually works under the hood 🧵

1/ When you pick a repo, it fetches your package.json, file tree, and README via the GitHub API (read-only, no write access until you approve the PR)

2/ It runs static analysis — framework detection, package manager, env var scanning, Dockerfile detection, build script check — all in parallel with Promise.all()

3/ Google Gemini 1.5 Flash gets the analysis and generates your README and landing page copy. 5-second timeout with template fallback so it never hangs.

4/ Everything gets packaged into a single GitHub PR — you review before merging. You stay in control.

5/ Total time: ~30 seconds for analysis + generation. Under 15 minutes from repo to live product.
```

**Day 3**
```
The hardest part of building Shipwright wasn't the AI.

It was the payment gate.

The Stripe integration was done in day 1. But the gate — the code that actually blocks free usage — took 3 extra days to wire up correctly.

Because wiring it wrong means your users can generate forever for free.

Ship the moneymaker before you ship the features.
```

**Day 4**
```
Stats after 48 hours:

→ [X] signups
→ [X] repos analyzed  
→ [X] generations completed
→ [X] PRs created
→ Revenue: $[X]

Building in public from here.
```

**Day 5**
```
Most common framework in repos analyzed so far: [UPDATE AFTER LAUNCH]

Most common missing config: [UPDATE AFTER LAUNCH]

Turns out most dormant repos aren't dormant because the code is bad. They're dormant because nobody wants to write the README.

That's fixable.
```

**Day 6**
```
What Shipwright generates vs. what you'd do manually:

Manual:
- Write README: ~2 hours
- Figure out vercel.json: 30 min of docs
- Write landing page: ~3 hours
- Set up env template: 20 min
- Create PR with all of it: 15 min

Shipwright:
- All of it: ~30 seconds

The time savings aren't the point. The activation energy savings are.
```

**Day 7** [THREAD]
```
Week 1 retro 🧵

What worked:
- [fill in after launch]

What didn't:
- [fill in after launch]

What I'm fixing this week:
- [fill in after launch]

Revenue: $[X] | Signups: [X] | Churn: [X]
```

---

## WEEK 2 — Social Proof + Education

**Day 8**
```
Someone just used Shipwright to finally ship a Next.js app that had been sitting on GitHub for 8 months.

That's the whole point.

Not moving fast. Moving at all.
```

**Day 9**
```
The risk score in Shipwright's analysis is underrated.

It tells you: how likely is this repo to fail its first deploy?

High score = missing build script, lots of env vars, no Docker config.
Low score = already structured for deployment.

Most repos score 40-60. Fixable in a day.
```

**Day 10**
```
Quick tip: if Shipwright generates a README that feels generic, it's because your repo has no README and minimal package.json description.

Add 2-3 sentences to your package.json "description" field before running it.

The AI uses that as the starting point. Better input = better output.
```

**Day 11**
```
Pricing question I get asked a lot:

"Why not just make it free?"

Because Gemini API calls cost money. Each generation runs analysis + 2 AI calls with a 5-second timeout. At scale, this adds up.

$5/generation. $15/month unlimited. The math works for builders who ship more than 3 repos/month.
```

**Day 12**
```
Shipwright works on repos that aren't web apps, too.

CLI tools, libraries, scripts — as long as there's a package.json (or similar), it can analyze the structure and generate useful docs.

The vercel.json won't apply, but the README + env template + landing page will.
```

**Day 13**
```
Something I didn't expect: people use Shipwright not just for deployment, but to understand their own repos.

The analysis output — framework, risk score, missing configs — acts like a health check.

"Oh. I'm missing a build script. That's why I kept forgetting to add it."
```

**Day 14** [THREAD]
```
The tech stack behind Shipwright 🧵

1/ Frontend: Next.js 15 App Router + TypeScript + Tailwind. Everything is server components by default — only client components where needed (auth check, button interactions).

2/ Auth: NextAuth.js with GitHub OAuth. The access token from GitHub OAuth is used directly to make GitHub API calls — no re-auth needed.

3/ AI: Google Gemini 1.5 Flash. Fast, cheap, good enough for README/landing page copy. Anthropic and OpenAI integrations planned for higher-quality output on Pro.

4/ Payments: Stripe. Credits stored in customer metadata — no extra DB writes. Subscriptions checked via live Stripe API per request (no sync lag).

5/ Rate limiting: Upstash Redis with sliding window. 10 requests/hour per user on /api/generate.

6/ DB: Vercel Postgres + Drizzle ORM. Stores repo history and PR records.
```

---

## WEEK 3 — Depth + Community

**Day 15**
```
Feature drop: if the generation fails (Gemini timeout, API error), Shipwright falls back to deterministic templates.

You always get something. Never a blank page.

The fallback templates are framework-aware — Next.js gets a different template than a Node.js API.
```

**Day 16**
```
The one thing I'd tell every indie builder right now:

Deploy first. Polish later.

I've seen too many repos sit for years because the landing page wasn't "good enough." 

Shipwright generates a landing page in 30 seconds. It's not perfect. Ship it anyway.
```

**Day 17**
```
Shipwright is open about what it can't do:

→ It can't deploy FOR you (yet) — it creates the PR, you merge it
→ It doesn't touch your application code
→ Generated content needs your review before merging

It's a co-pilot, not an autopilot. Your repo, your call.
```

**Day 18**
```
Asked a developer friend to try Shipwright cold with no instructions.

Time to first analysis: 45 seconds (sign-in included)
Time to generated PR: 2 min 10 sec
His reaction: "Wait, this is it? That's all I had to do?"

That's the benchmark I'm building toward.
```

**Day 19**
```
Comparing Shipwright to just asking ChatGPT to write your README:

ChatGPT: you paste in your code, explain your project, prompt engineer, iterate
Shipwright: sign in with GitHub, pick repo, done

The difference isn't the output quality (it's similar).
The difference is activation energy.
```

**Day 20**
```
Milestone: [X] repos shipped via Shipwright.

That's [X] READMEs written, [X] landing pages generated, [X] PRs opened.

All repos that were sitting dormant.

Thanks for trusting the tool.
```

**Day 21** [THREAD]
```
3 weeks of building Shipwright in public. What I learned 🧵

1/ [fill from real data]
2/ [fill from real data]
3/ [fill from real data]
4/ The one feature users actually asked for vs. the ones I assumed they wanted
5/ MRR at 3 weeks: $[X]. Trajectory: [X]
```

---

## WEEK 4 — Momentum + Referral

**Day 22**
```
If you've used Shipwright, I have one ask:

Tell one developer friend about it.

Not a tweet. Not a like. A direct message.

"Hey, you have that project sitting on GitHub — try this."

That's how tools like this spread.
```

**Day 23**
```
The GitHub repos most likely to benefit from Shipwright:

→ Last commit > 3 months ago
→ No live URL in the description
→ Stars > 5 (people found it useful but it's not deployed)
→ No README or a one-liner README

Sound familiar?
```

**Day 24**
```
Roadmap update:

Near term:
→ Real-time generation progress (step-by-step UI)
→ Better AI quality with Claude/GPT-4o on Pro tier

Medium term:  
→ Railway + Fly.io support (not just Vercel)
→ GitHub Actions workflow generation
→ Repo health score dashboard

Far term:
→ One-click deploy (not just PR)
```

**Day 25**
```
Hot take: the best thing about indie tools is that the founder actually replies.

If Shipwright generates something wrong for your repo — tell me. @vpkdevs

I'll fix it and you'll get better output on the next run.

Open feedback loop beats any product roadmap.
```

**Day 26**
```
One pattern I've noticed in the repos Shipwright processes:

Most missing env vars have obvious names (DATABASE_URL, API_KEY, NEXTAUTH_SECRET).

But they're missing from .env.example because the developer "just knew" what was needed.

The next developer on the project doesn't.

Shipwright catches this automatically.
```

**Day 27**
```
Month-end: [X] paying customers. [X] repos shipped. $[X] MRR.

Started with: 0 users, 0 revenue, a feature that didn't work (no payment gate).

Lesson: deploy broken. Fix in production. Ship > polish.
```

**Day 28**
```
The #1 DM I get from Shipwright users:

"I didn't think the README would be that good."

The AI has context about your actual dependencies, framework, and structure. It's not writing about a generic "project." It's writing about YOUR project.

That's the difference.
```

**Day 29**
```
Building Shipwright taught me more about how developers think about shipping than any course or book.

The blockers aren't technical. They're psychological.

"The README isn't good enough."
"The landing page looks basic."
"I need one more feature first."

Remove the blockers. People ship.
```

**Day 30**
```
30 days of Shipwright.

Month 1 numbers: [X] signups, [X] paying customers, $[X] MRR, [X] repos shipped

What's next: [roadmap item]

If you've been on the fence — [URL]. $5. Ship your dormant repo this weekend.
```

---

## Scheduling Instructions

These posts are ready to paste into Buffer (https://buffer.com) or Twitter directly.

Update all [X] placeholders with real numbers as they come in. Days 1–7 are launch-critical — post manually. Days 8–30 can be scheduled 7 days in advance.

**Buffer API key needed** (`BUFFER_ACCESS_TOKEN`) to schedule automatically.
