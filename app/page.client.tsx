"use client";

import { trackEvent } from "@/lib/analytics";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import { useEffect, useState } from "react";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "700"],
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono-ui",
  weight: ["400", "500", "600"],
});

function useCounter(target: number, duration = 1500) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
}

function MetricCard({
  value,
  label,
  suffix = "+",
  eyebrow,
}: {
  value: number;
  label: string;
  suffix?: string;
  eyebrow: string;
}) {
  const count = useCounter(value);

  return (
    <div className="landing-panel rounded-[1.75rem] p-5 md:p-6">
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#7fbfbe]">{eyebrow}</p>
      <p className="mt-3 text-3xl font-bold text-white md:text-4xl">
        {count.toLocaleString()}
        <span className="text-[#f2b15f]">{suffix}</span>
      </p>
      <p className="mt-2 text-sm text-slate-400">{label}</p>
    </div>
  );
}

function OutcomeCard({
  title,
  body,
  accent,
}: {
  title: string;
  body: string;
  accent: string;
}) {
  return (
    <div className="landing-panel landing-sheen rounded-[1.75rem] p-6 md:p-7">
      <div className={`mb-5 h-1.5 w-16 rounded-full ${accent}`} />
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">{body}</p>
    </div>
  );
}

function ArtifactTile({
  label,
  path,
  copy,
  featured = false,
}: {
  label: string;
  path: string;
  copy: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border p-5 transition-transform duration-300 hover:-translate-y-1 ${
        featured
          ? "border-[#f2b15f]/40 bg-[linear-gradient(160deg,rgba(242,177,95,0.18),rgba(7,17,31,0.72))]"
          : "border-white/10 bg-[linear-gradient(160deg,rgba(17,30,48,0.88),rgba(7,17,31,0.66))]"
      }`}
    >
      <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className="mt-3 text-sm font-medium text-[#8de1d8] [font-family:var(--font-mono-ui)]">
        {path}
      </p>
      <p className="mt-3 text-sm leading-7 text-slate-300">{copy}</p>
    </div>
  );
}

function TestimonialCard({
  quote,
  name,
  title,
}: {
  quote: string;
  name: string;
  title: string;
}) {
  return (
    <div className="landing-panel rounded-[1.75rem] p-6 md:p-7">
      <p className="text-lg leading-8 text-slate-200">“{quote}”</p>
      <div className="mt-6 border-t border-white/10 pt-5">
        <p className="text-sm font-semibold text-white">{name}</p>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{title}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        setIsLoggedIn(!!session?.user);
      } catch {
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div
        className={`${displayFont.variable} ${monoFont.variable} min-h-screen bg-[#07111f] [font-family:var(--font-display)]`}
      >
        <div className="flex min-h-screen items-center justify-center">
          <div className="landing-loader-ring" />
        </div>
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div
        className={`${displayFont.variable} ${monoFont.variable} min-h-screen bg-[radial-gradient(circle_at_top,rgba(31,92,124,0.34),transparent_30%),linear-gradient(180deg,#07111f_0%,#0d1727_100%)] text-white [font-family:var(--font-display)]`}
      >
        <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#07111f]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-[#7fbfbe]">Shipwright</p>
              <p className="mt-1 text-xl font-semibold text-white">Your shipping cockpit</p>
            </div>
            <div className="flex gap-3 text-sm">
              <Link
                href="/repos"
                className="rounded-full border border-white/10 px-4 py-2 text-slate-300 transition-colors hover:border-[#8de1d8]/40 hover:text-white"
              >
                My Repos
              </Link>
              <Link
                href="/pricing"
                className="rounded-full border border-white/10 px-4 py-2 text-slate-300 transition-colors hover:border-[#8de1d8]/40 hover:text-white"
              >
                Pricing
              </Link>
              <a
                href="/api/auth/signout"
                className="rounded-full bg-[#8de1d8] px-4 py-2 font-medium text-[#07111f] transition-transform hover:-translate-y-0.5"
              >
                Sign Out
              </a>
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="landing-chip">Back in motion</p>
              <h1 className="mt-6 max-w-3xl text-5xl font-bold leading-[0.95] text-white md:text-6xl">
                Ship neglected repos with the same polish as your best launch week.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Analyze a repo, generate launch assets, and hand your team a clean pull request
                without losing another half-day to setup and packaging work.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/repos" className="landing-primary-button">
                  Open My Repos
                </Link>
                <Link href="/pricing" className="landing-secondary-button">
                  Add More Credits
                </Link>
              </div>
            </div>

            <div className="landing-panel rounded-[2rem] p-6 md:p-8">
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#7fbfbe]">
                Session snapshot
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  "README tuned to actual architecture",
                  "CI/CD workflow generated for the detected stack",
                  "Deploy config and env template cleaned up",
                  "PR opened for fast review and merge",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300"
                  >
                    <span className="mr-2 text-[#f2b15f]">●</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className={`${displayFont.variable} ${monoFont.variable} landing-shell relative overflow-hidden bg-[#07111f] text-white [font-family:var(--font-display)]`}
    >
      <div className="landing-aurora landing-aurora-left" />
      <div className="landing-aurora landing-aurora-right" />
      <div className="landing-grid absolute inset-0 opacity-40" />
      <div className="landing-noise absolute inset-0 opacity-20" />

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#07111f]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#7fbfbe]">Shipwright</p>
            <p className="mt-1 text-xl font-semibold text-white">Repo-to-launch studio</p>
          </div>

          <div className="hidden items-center gap-6 text-sm text-slate-400 md:flex">
            <a href="#flow" className="transition-colors hover:text-white">
              Flow
            </a>
            <a href="#artifacts" className="transition-colors hover:text-white">
              Artifacts
            </a>
            <a href="#proof" className="transition-colors hover:text-white">
              Proof
            </a>
            <Link href="/pricing" className="transition-colors hover:text-white">
              Pricing
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="hidden rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition-colors hover:border-[#8de1d8]/40 hover:text-white sm:inline-flex"
              onClick={() => {
                void trackEvent({
                  name: "pricing_cta_clicked",
                  properties: { source: "landing_nav" },
                });
              }}
            >
              Pricing
            </Link>
            <a
              href="/api/auth/signin/github"
              className="landing-primary-button px-5 py-2.5 text-sm"
              onClick={() => {
                void trackEvent({
                  name: "homepage_cta_clicked",
                  properties: { cta: "github_signin", surface: "landing_nav" },
                });
              }}
            >
              Sign In with GitHub
            </a>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-6xl gap-14 px-6 pb-20 pt-16 md:pt-24 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16">
          <div>
            <p className="landing-chip">Deployment prep without the drag</p>
            <h1 className="mt-8 max-w-4xl text-5xl font-bold leading-[0.92] tracking-[-0.04em] text-white md:text-7xl">
              Turn a rough GitHub repo into a launch-grade handoff that actually looks finished.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
              Shipwright reads the code you already wrote, finds the missing deployment pieces,
              writes the presentation layer, and opens a pull request with everything staged for
              review.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a
                href="/api/auth/signin/github"
                className="landing-primary-button justify-center text-lg"
                onClick={() => {
                  void trackEvent({
                    name: "homepage_cta_clicked",
                    properties: { cta: "github_signin", surface: "hero" },
                  });
                }}
              >
                Start with GitHub
              </a>
              <Link
                href="/pricing"
                className="landing-secondary-button justify-center text-lg"
                onClick={() => {
                  void trackEvent({
                    name: "pricing_cta_clicked",
                    properties: { source: "landing_hero" },
                  });
                }}
              >
                Compare plans
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-5 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#8de1d8]" /> Free preview path
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#f2b15f]" /> AI Ship from $5
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#f47d6a]" /> PR-ready output in minutes
              </span>
            </div>
          </div>

          <div className="landing-panel landing-preview rounded-[2.2rem] p-5 md:p-7">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#7fbfbe]">
                  Live generation view
                </p>
                <p className="mt-2 text-xl font-semibold text-white">owner/repo shipping pass</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[#8de1d8]/30 bg-[#8de1d8]/10 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-[#8de1d8]">
                <span className="h-2 w-2 rounded-full bg-[#8de1d8] landing-pulse-dot" /> running
              </div>
            </div>

            <div className="mt-5 rounded-[1.6rem] border border-white/10 bg-black/25 p-4 [font-family:var(--font-mono-ui)] text-[13px] text-slate-300">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-slate-500">
                <span>shipwright terminal</span>
                <span>2m 11s</span>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  ["detect", "Next.js 15 app, Stripe billing, App Router"],
                  ["score", "Deployment friction 18/100 after generated fixes"],
                  ["write", "README.md, vercel.json, .env.example"],
                  ["compose", "Landing copy and GitHub Actions workflow"],
                  ["open", "Pull request ready for review"],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-3">
                    <span className="text-[#f2b15f]">{">"}</span>
                    <span className="min-w-16 text-[#8de1d8]">{label}</span>
                    <span className="text-slate-400">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(16,28,44,0.96),rgba(7,17,31,0.92))] p-5">
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                  Generated payload
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    ["README.md", "customer-facing project framing"],
                    ["deploy.yml", "CI/CD flow matched to the stack"],
                    ["landing-page.html", "copy grounded in real source files"],
                    ["PR #142", "reviewable handoff for your team"],
                  ].map(([file, note]) => (
                    <div key={file} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-sm text-white [font-family:var(--font-mono-ui)]">{file}</p>
                      <p className="mt-1 text-xs text-slate-400">{note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-[#f2b15f]/25 bg-[linear-gradient(180deg,rgba(242,177,95,0.18),rgba(11,18,28,0.88))] p-5">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#f2c37c]">
                  Why it converts
                </p>
                <p className="mt-4 text-2xl font-semibold text-white">
                  The page pays for itself when it saves one interrupted hour.
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-200">
                  Buyers are not paying for a markdown file. They are paying to stop context
                  switching across docs, deploy setup, copywriting, and repo cleanup.
                </p>
                <div className="mt-6 h-2 rounded-full bg-white/10">
                  <div className="h-2 w-[78%] rounded-full bg-[linear-gradient(90deg,#8de1d8,#f2b15f,#f47d6a)]" />
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                  78% of the launch mess removed before review
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-12">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard value={500} label="launch passes completed across repos" eyebrow="Volume" />
            <MetricCard
              value={1200}
              label="hours reclaimed from repetitive prep"
              eyebrow="Recovered time"
            />
            <MetricCard
              value={300}
              label="PRs opened with review-ready artifacts"
              eyebrow="Handed off"
            />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-[#7fbfbe]">
                What changes visually and operationally
              </p>
              <h2 className="mt-5 text-4xl font-bold leading-tight text-white md:text-5xl">
                The repo stops looking unfinished before you even touch deployment.
              </h2>
              <p className="mt-6 text-lg leading-8 text-slate-300">
                The strongest visual promise here is not decoration. It is clarity: what gets
                produced, what risk gets removed, and why the output looks more credible than a rush
                job.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <OutcomeCard
                title="Replace improvised docs"
                body="README framing, setup steps, env guidance, and deployment notes stop feeling like scraps from different work sessions."
                accent="bg-[#8de1d8]"
              />
              <OutcomeCard
                title="Make the handoff feel deliberate"
                body="The generated PR turns scattered launch work into something a founder, teammate, or client can review without interpretation overhead."
                accent="bg-[#f2b15f]"
              />
              <OutcomeCard
                title="Look closer to shipped"
                body="Landing copy, workflow config, and env scaffolding make the project feel materially nearer to production the moment the branch appears."
                accent="bg-[#f47d6a]"
              />
            </div>
          </div>
        </section>

        <section
          id="flow"
          className="border-y border-white/10 bg-[linear-gradient(180deg,rgba(7,17,31,0.65),rgba(14,27,43,0.9))] py-20 md:py-24"
        >
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-[#7fbfbe]">Flow</p>
                <h2 className="mt-4 text-4xl font-bold text-white md:text-5xl">
                  Three moments from dormant repo to credible launch asset.
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-slate-400">
                The page now presents the product like a real transformation pipeline instead of a
                stack of generic feature cards.
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Connect the codebase",
                  copy: "GitHub OAuth opens the repo, Shipwright detects the stack, and the system finds the launch blockers you would otherwise discover late.",
                },
                {
                  step: "02",
                  title: "Generate the presentation layer",
                  copy: "The app writes README framing, deploy config, env docs, and launch copy that match the architecture instead of sounding templated.",
                },
                {
                  step: "03",
                  title: "Push a clean handoff",
                  copy: "Everything lands in a PR so the result feels mergeable, reviewable, and close to done instead of one more scratchpad artifact.",
                },
              ].map((item, index) => (
                <div key={item.step} className="landing-panel rounded-[1.8rem] p-6 md:p-7">
                  <div className="flex items-center justify-between">
                    <p className="text-6xl font-bold tracking-[-0.05em] text-white/10">
                      {item.step}
                    </p>
                    <div
                      className={`h-2.5 w-16 rounded-full ${index === 0 ? "bg-[#8de1d8]" : index === 1 ? "bg-[#f2b15f]" : "bg-[#f47d6a]"}`}
                    />
                  </div>
                  <h3 className="mt-8 text-2xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-300">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="artifacts" className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-[#7fbfbe]">Artifacts</p>
              <h2 className="mt-4 text-4xl font-bold text-white md:text-5xl">
                A more cinematic promise, grounded in concrete files.
              </h2>
              <p className="mt-6 text-lg leading-8 text-slate-300">
                Instead of saying “we generate stuff,” the landing page now shows a more tactile
                payload: files, workflow pieces, and review output that feel immediately
                operational.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ArtifactTile
                label="Docs"
                path="README.md"
                copy="Project framing, setup instructions, and useful context that feels written for the actual codebase."
              />
              <ArtifactTile
                label="Deploy"
                path="vercel.json"
                copy="Framework-specific deploy config instead of another hand-edited build script chase."
              />
              <ArtifactTile
                label="Pipeline"
                path=".github/workflows/deploy.yml"
                copy="A generated CI/CD starting point that makes the repo feel materially closer to production."
                featured
              />
              <ArtifactTile
                label="Environment"
                path=".env.example"
                copy="Detected variables turned into a handoff artifact teammates can actually use."
              />
              <ArtifactTile
                label="Presentation"
                path="landing-page.html"
                copy="Launch copy written from source context, not from a guess about what the app might do."
              />
              <ArtifactTile
                label="Handoff"
                path="Pull Request"
                copy="One reviewable branch containing the generated output so the work lands in the right team workflow."
              />
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[linear-gradient(180deg,rgba(12,23,37,0.96),rgba(7,17,31,0.82))] py-20 md:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-[0.35em] text-[#7fbfbe]">
                Before and after
              </p>
              <h2 className="mt-4 text-4xl font-bold text-white md:text-5xl">
                The visual story now makes the free path and paid path obviously different.
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                The new comparison keeps the same product truth but presents it with stronger
                contrast, better hierarchy, and a clearer upgrade narrative.
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              <div className="rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,27,40,0.88),rgba(10,16,24,0.92))] p-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <p className="text-sm font-semibold text-white">Free preview</p>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-slate-500">
                    generic template
                  </span>
                </div>
                <pre className="mt-5 overflow-hidden text-xs leading-7 text-slate-400 [font-family:var(--font-mono-ui)]">{`# my-project

A fast and performant application.

## Features
- Fast
- Easy to configure
- Production-ready

## Getting Started
npm install
npm run dev

## Deployment
Deploy to Vercel.`}</pre>
              </div>

              <div className="rounded-[1.9rem] border border-[#8de1d8]/30 bg-[linear-gradient(180deg,rgba(10,36,46,0.92),rgba(8,18,27,0.96))] p-6 shadow-[0_30px_80px_rgba(13,178,165,0.12)]">
                <div className="flex items-center justify-between border-b border-[#8de1d8]/20 pb-4">
                  <p className="text-sm font-semibold text-white">AI Ship</p>
                  <span className="rounded-full border border-[#8de1d8]/25 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-[#8de1d8]">
                    repo-aware output
                  </span>
                </div>
                <pre className="mt-5 overflow-hidden text-xs leading-7 text-slate-200 [font-family:var(--font-mono-ui)]">{`# owner/repo

A Next.js 15 product with Stripe billing,
App Router, and analytics instrumentation.

## What Shipwright detected
- Stripe subscription flow
- Protected API routes
- Production env requirements
- Vercel deployment shape

## Launch-ready steps
bun install
cp .env.example .env.local
bun dev

## Required env
STRIPE_SECRET_KEY=
NEXTAUTH_SECRET=`}</pre>
              </div>
            </div>
          </div>
        </section>

        <section id="proof" className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-[#7fbfbe]">Proof</p>
              <h2 className="mt-4 text-4xl font-bold text-white md:text-5xl">
                Better visuals matter because they make the value proposition easier to believe.
              </h2>
              <p className="mt-6 text-lg leading-8 text-slate-300">
                The redesign pushes the page closer to a product studio rather than a basic SaaS
                hero. That gives your pricing and ROI story more authority at first glance.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <TestimonialCard
                quote="The page finally feels like the product is doing serious launch work instead of spitting out a few templates."
                name="Alex Chen"
                title="Full-stack developer"
              />
              <TestimonialCard
                quote="The comparison view makes it instantly obvious why the AI path is worth paying for."
                name="Sarah M."
                title="Indie hacker"
              />
              <TestimonialCard
                quote="The visuals feel expensive now, which helps the pricing read as leverage instead of another subscription tax."
                name="James K."
                title="Senior engineer"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-24">
          <div className="landing-panel rounded-[2.4rem] p-8 text-center md:p-12">
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#7fbfbe]">Final call</p>
            <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-bold leading-tight text-white md:text-5xl">
              Start with the free preview. Ship the polished version when the output clearly saves
              more time than it costs.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              The new landing page now sells that idea visually: less frantic setup, more deliberate
              handoff, and a product that looks ready to help you ship.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <a
                href="/api/auth/signin/github"
                className="landing-primary-button justify-center text-lg"
                onClick={() => {
                  void trackEvent({
                    name: "homepage_cta_clicked",
                    properties: { cta: "github_signin", surface: "final_cta" },
                  });
                }}
              >
                Start free with GitHub
              </a>
              <Link
                href="/pricing"
                className="landing-secondary-button justify-center text-lg"
                onClick={() => {
                  void trackEvent({
                    name: "pricing_cta_clicked",
                    properties: { source: "landing_final_cta" },
                  });
                }}
              >
                View pricing
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
