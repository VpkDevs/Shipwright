"use client";

import { type CheckoutPlan, getProCheckoutPlan } from "@/lib/pricing";
import { useToast } from "@/lib/toast";
import Link from "next/link";
import { useState } from "react";

// ─── Comparison table data ────────────────────────────────────────────────────
const FEATURES = [
  {
    label: "Template preview (README, vercel.json, .env.example)",
    free: true,
    credit: true,
    pro: true,
  },
  { label: "Deployment readiness score", free: true, credit: true, pro: true },
  { label: "Framework & stack detection", free: true, credit: true, pro: true },
  { label: "Ship blocker analysis", free: true, credit: true, pro: true },
  { label: "AI-generated README (from actual code)", free: false, credit: true, pro: true },
  { label: "AI landing page copy", free: false, credit: true, pro: true },
  { label: "GitHub Actions CI/CD workflow", free: false, credit: true, pro: true },
  { label: "AI deployment recommendations", free: false, credit: true, pro: true },
  { label: "One-click PR creation", free: false, credit: true, pro: true },
  { label: "Priority AI processing", free: false, credit: false, pro: true },
  { label: "30 AI ships per month", free: false, credit: false, pro: true },
  { label: "Cancel anytime", free: false, credit: false, pro: true },
];

function Check({ yes, highlight }: { yes: boolean; highlight?: boolean }) {
  if (!yes) return <span className="text-slate-600 text-lg">—</span>;
  return (
    <span className={`text-lg font-bold ${highlight ? "text-blue-400" : "text-green-400"}`}>✓</span>
  );
}

export default function PricingClient() {
  const toast = useToast();
  const [loadingPlan, setLoadingPlan] = useState<CheckoutPlan | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isAnnual, setIsAnnual] = useState(false);

  const proMonthlyPrice = 15;
  const proAnnualMonthly = 10;
  const proAnnualTotal = 120;

  const handleCheckout = async (plan: CheckoutPlan) => {
    setLoadingPlan(plan);
    setErrorMessage("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = (await res.json()) as { url?: string; error?: string };

      if (res.status === 401) {
        window.location.href = "/api/auth/signin/github?callbackUrl=/pricing";
        return;
      }

      if (!res.ok) {
        const msg = data.error || "Failed to start checkout. Please try again.";
        setErrorMessage(msg);
        toast(msg, "error");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        setErrorMessage("Failed to start checkout. Please try again.");
      }
    } catch {
      const msg = "Something went wrong. Please try again.";
      setErrorMessage(msg);
      toast(msg, "error");
    } finally {
      setLoadingPlan(null);
    }
  };

  const proCheckoutPlan = getProCheckoutPlan(isAnnual);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* ── Nav ── */}
      <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-400">
            Shipwright
          </Link>
          <Link
            href="/repos"
            className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors text-sm"
          >
            My Repos
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-20">
        {/* ── Header ── */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold mb-4">Simple, honest pricing</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            A DevOps consultant charges <span className="text-white font-semibold">$150/hr</span> to
            set up deployment configs. Shipwright does it in{" "}
            <span className="text-blue-400 font-semibold">2 minutes for $5</span>.
          </p>
        </div>

        {/* ── Annual toggle ── */}
        <div className="flex items-center justify-center gap-4 mb-14">
          <span className={`text-sm font-medium ${!isAnnual ? "text-white" : "text-slate-400"}`}>
            Monthly
          </span>
          <button
            type="button"
            onClick={() => setIsAnnual((v) => !v)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              isAnnual ? "bg-blue-600" : "bg-slate-600"
            }`}
            aria-label="Toggle annual billing"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                isAnnual ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${isAnnual ? "text-white" : "text-slate-400"}`}>
            Annual
          </span>
          {isAnnual && (
            <span className="bg-green-600/20 border border-green-500/30 text-green-300 text-xs font-bold px-2.5 py-1 rounded-full">
              Save $60/yr
            </span>
          )}
        </div>

        {errorMessage && (
          <div className="mb-8 rounded-xl border border-red-700 bg-red-900/40 px-4 py-3 text-sm text-red-200 max-w-2xl mx-auto">
            {errorMessage}
          </div>
        )}

        {/* ── Pricing cards ── */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
          {/* Free */}
          <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-8 flex flex-col">
            <div className="mb-6">
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Free Preview
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-white">$0</span>
              </div>
              <p className="text-slate-400 mt-2 text-sm">Always free — no credit card needed</p>
            </div>

            <ul className="space-y-2.5 mb-8 flex-1 text-sm">
              {[
                "Template README & landing page",
                "Vercel config + .env.example",
                "Deployment readiness score",
                "Framework & stack detection",
                "Ship blocker analysis",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-slate-300">
                  <span className="text-green-400 font-bold mt-0.5 flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
              {["AI-generated content", "GitHub Actions CI/CD", "One-click PR creation"].map(
                (f) => (
                  <li key={f} className="flex items-start gap-2.5 text-slate-600">
                    <span className="mt-0.5 flex-shrink-0">—</span>
                    {f}
                  </li>
                )
              )}
            </ul>

            <a
              href="/api/auth/signin/github"
              className="w-full py-3 px-6 rounded-xl font-semibold text-center border border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white transition-colors block"
            >
              Start Free →
            </a>
          </div>

          {/* Ship Credit */}
          <div className="rounded-2xl border border-slate-600 bg-slate-800/60 p-8 flex flex-col">
            <div className="mb-6">
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Ship Credit
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-white">$5</span>
                <span className="text-slate-400">one-time</span>
              </div>
              <p className="text-slate-400 mt-2 text-sm">Perfect for shipping a single project</p>
            </div>

            <ul className="space-y-2.5 mb-8 flex-1 text-sm">
              {[
                "Everything in Free",
                "AI-generated README (from your code)",
                "AI landing page copy",
                "GitHub Actions CI/CD workflow",
                "AI deployment recommendations",
                "One-click PR creation",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-slate-300">
                  <span className="text-green-400 font-bold mt-0.5 flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => handleCheckout("credit")}
              disabled={loadingPlan !== null}
              className="w-full py-3 px-6 rounded-xl font-semibold text-slate-900 bg-white hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingPlan === "credit" ? "Redirecting..." : "Buy Ship Credit →"}
            </button>
          </div>

          {/* Pro */}
          <div className="relative rounded-2xl border-2 border-blue-500 bg-slate-800/60 p-8 flex flex-col">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                Best Value
              </span>
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2">
                {isAnnual ? "Pro Annual" : "Pro Monthly"}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-white">
                  ${isAnnual ? proAnnualMonthly : proMonthlyPrice}
                </span>
                <span className="text-slate-400">/month</span>
              </div>
              {isAnnual && (
                <p className="text-green-400 text-xs mt-1 font-medium">
                  Billed ${proAnnualTotal}/yr · saves $60
                </p>
              )}
              <p className="text-slate-400 mt-2 text-sm">For builders shipping multiple projects</p>
            </div>

            <ul className="space-y-2.5 mb-8 flex-1 text-sm">
              {[
                "Everything in Ship Credit",
                "30 AI ships per month",
                `$${isAnnual ? "0.33" : "0.50"} per ship`,
                "Priority AI processing",
                "Cancel anytime",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-slate-300">
                  <span className="text-blue-400 font-bold mt-0.5 flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => handleCheckout(proCheckoutPlan)}
              disabled={loadingPlan !== null}
              className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingPlan === proCheckoutPlan
                ? "Redirecting..."
                : isAnnual
                  ? "Start Pro Annual →"
                  : "Start Pro →"}
            </button>
          </div>
        </div>

        {/* ── Value framing ── */}
        <div className="max-w-3xl mx-auto mb-20 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6 text-center">
          <p className="text-amber-200 font-semibold text-lg mb-2">💡 The math is simple</p>
          <p className="text-slate-300 text-sm leading-relaxed">
            Setting up a README, CI/CD pipeline, Vercel config, and env template manually takes{" "}
            <strong className="text-white">3–5 hours</strong> for an experienced developer. At even
            $50/hr, that's <strong className="text-white">$150–$250 of your time</strong>.
            Shipwright does it in 2 minutes for <strong className="text-amber-300">$5</strong>.
          </p>
        </div>

        {/* ── What gets generated ── */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-2xl font-bold text-center mb-10">
            What gets generated for each repo
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {
                icon: "📝",
                path: "README.md",
                desc: "AI-written from your actual source files",
                aiOnly: false,
              },
              {
                icon: "⚙️",
                path: "vercel.json",
                desc: "Framework-aware Vercel deployment config",
                aiOnly: false,
              },
              {
                icon: "🔄",
                path: ".github/workflows/deploy.yml",
                desc: "CI/CD pipeline tailored to your stack",
                aiOnly: true,
              },
              {
                icon: "🔐",
                path: ".env.example",
                desc: "All detected env vars documented",
                aiOnly: false,
              },
              {
                icon: "🎨",
                path: "shipwright/landing-page.html",
                desc: "AI landing page copy from your code",
                aiOnly: true,
              },
              {
                icon: "📋",
                path: "shipwright/deployment-recommendations.md",
                desc: "Actionable deployment checklist",
                aiOnly: true,
              },
            ].map((item) => (
              <div
                key={item.path}
                className={`rounded-xl border p-4 ${
                  item.aiOnly
                    ? "border-blue-500/30 bg-blue-950/20"
                    : "border-slate-700 bg-slate-800/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-2xl">{item.icon}</span>
                  {item.aiOnly && (
                    <span className="text-[10px] font-bold text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      AI
                    </span>
                  )}
                </div>
                <p className="font-mono text-xs text-blue-300 mb-1 break-all">{item.path}</p>
                <p className="text-slate-400 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Comparison table ── */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-2xl font-bold text-center mb-10">Full feature comparison</h2>
          <div className="rounded-2xl border border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/60">
                  <th className="text-left px-6 py-4 text-slate-400 font-medium w-1/2">Feature</th>
                  <th className="text-center px-4 py-4 text-slate-400 font-medium">Free</th>
                  <th className="text-center px-4 py-4 text-slate-400 font-medium">Credit</th>
                  <th className="text-center px-4 py-4 text-blue-400 font-semibold">Pro</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((feature, i) => (
                  <tr
                    key={feature.label}
                    className={`border-b border-slate-700/50 ${
                      i % 2 === 0 ? "bg-slate-800/20" : "bg-transparent"
                    }`}
                  >
                    <td className="px-6 py-3.5 text-slate-300">{feature.label}</td>
                    <td className="text-center px-4 py-3.5">
                      <Check yes={feature.free} />
                    </td>
                    <td className="text-center px-4 py-3.5">
                      <Check yes={feature.credit} />
                    </td>
                    <td className="text-center px-4 py-3.5">
                      <Check yes={feature.pro} highlight />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Guarantees ── */}
        <div className="max-w-3xl mx-auto mb-20 grid sm:grid-cols-3 gap-4 text-center">
          {[
            {
              icon: "🛡️",
              title: "7-day guarantee",
              desc: "Not happy? Get a full refund within 7 days, no questions asked.",
            },
            {
              icon: "⚡",
              title: "Failures don't cost credits",
              desc: "If AI generation fails for any reason, your credit is not consumed.",
            },
            {
              icon: "🔒",
              title: "No secrets stored",
              desc: "We never store your env var values — only the variable names are documented.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-slate-700 bg-slate-800/30 p-5"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-white mb-1 text-sm">{item.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* ── FAQ ── */}
        <div className="max-w-2xl mx-auto mb-20">
          <h2 className="text-2xl font-bold text-center mb-10">FAQ</h2>
          <div className="space-y-4">
            {[
              {
                q: "Can I preview before paying?",
                a: "Yes — the free template preview is always available. It shows a generic README, vercel.json, and .env.example. AI Ship generates content from your actual code, which is significantly better.",
              },
              {
                q: "What is the GitHub Actions CI/CD workflow?",
                a: "A ready-to-use .github/workflows/deploy.yml file tailored to your framework and package manager. It builds your project and deploys to Vercel on every push to main. Just add your VERCEL_TOKEN, VERCEL_ORG_ID, and VERCEL_PROJECT_ID as GitHub Secrets.",
              },
              {
                q: "What AI models are used?",
                a: "GPT-4o-mini (OpenAI) for README and landing page generation. Blackbox AI for deep code analysis, config generation, and env template creation.",
              },
              {
                q: "How many repos can I ship with Pro?",
                a: "Up to 30 repos per month. That's $0.50 per ship on monthly, or $0.33 per ship on annual — much cheaper than buying individual credits.",
              },
              {
                q: "What if AI generation fails?",
                a: "If AI generation fails for any reason, your credit is not consumed. You'll see an error message and can try again.",
              },
              {
                q: "Can I cancel Pro anytime?",
                a: "Yes, cancel anytime from the billing portal. You keep access until the end of your billing period.",
              },
              {
                q: "Does Shipwright write to my repo?",
                a: "Only when you click 'Create Pull Request'. Shipwright creates a new branch and opens a PR — you review and merge it yourself. We never push directly to main.",
              },
            ].map((item) => (
              <div key={item.q} className="border border-slate-700 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-2 text-sm">{item.q}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom CTA ── */}
        <div className="text-center">
          <p className="text-slate-400 mb-4 text-sm">
            Already have a credit?{" "}
            <Link href="/repos" className="text-blue-400 hover:underline">
              Go to your repos →
            </Link>
          </p>
          <p className="text-slate-500 text-xs">Questions? Open an issue on GitHub.</p>
        </div>
      </div>
    </div>
  );
}
