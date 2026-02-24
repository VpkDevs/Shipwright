"use client";

import Link from "next/link";
import { useState } from "react";

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<"credit" | "pro" | null>(null);

  const handleCheckout = async (plan: "credit" | "pro") => {
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok) {
        alert(data.error || "Failed to start checkout. Please try again.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to start checkout. Please try again.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
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

      <div className="max-w-5xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 text-white">
            Ship your repo today
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            AI-powered deployment configs, READMEs, and landing pages — generated
            from your actual code in under 2 minutes.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Ship Credit */}
          <div className="relative rounded-2xl border border-slate-700 bg-slate-800/60 p-8 flex flex-col">
            <div className="mb-6">
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Ship Credit
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-white">$5</span>
                <span className="text-slate-400">one-time</span>
              </div>
              <p className="text-slate-400 mt-2 text-sm">
                Perfect for shipping a single project
              </p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {[
                "1 AI-powered repo ship",
                "GPT-4o-mini README generation",
                "Blackbox AI code analysis",
                "Vercel config + env template",
                "AI landing page copy",
                "One-click PR creation",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="text-green-400 font-bold">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleCheckout("credit")}
              disabled={loadingPlan !== null}
              className="w-full py-3 px-6 rounded-xl font-semibold text-slate-900 bg-white hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingPlan === "credit" ? "Redirecting..." : "Buy Ship Credit →"}
            </button>
          </div>

          {/* Pro Monthly */}
          <div className="relative rounded-2xl border-2 border-blue-500 bg-slate-800/60 p-8 flex flex-col">
            {/* Popular badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                Best Value
              </span>
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2">
                Pro Monthly
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-white">$15</span>
                <span className="text-slate-400">/month</span>
              </div>
              <p className="text-slate-400 mt-2 text-sm">
                For builders shipping multiple projects
              </p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {[
                "30 AI ships per month",
                "Everything in Ship Credit",
                "Priority AI processing",
                "Deployment risk scoring",
                "AI deployment recommendations",
                "Cancel anytime",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="text-blue-400 font-bold">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleCheckout("pro")}
              disabled={loadingPlan !== null}
              className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingPlan === "pro" ? "Redirecting..." : "Start Pro →"}
            </button>
          </div>
        </div>

        {/* What you get section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">
            What the AI generates for you
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "🤖",
                title: "Deep Code Analysis",
                desc: "Blackbox AI reads your actual source files — not just package.json — to understand your codebase.",
              },
              {
                icon: "📝",
                title: "Professional README",
                desc: "GPT-4o-mini generates a README based on your real code, not a generic template.",
              },
              {
                icon: "🚀",
                title: "Landing Page Copy",
                desc: "AI-written headlines and feature bullets that actually describe what your project does.",
              },
              {
                icon: "⚙️",
                title: "Vercel Config",
                desc: "Production-ready vercel.json with correct framework settings, build commands, and env vars.",
              },
              {
                icon: "🔐",
                title: "Env Template",
                desc: "Documented .env.example with all detected variables and helpful hints.",
              },
              {
                icon: "📬",
                title: "One-Click PR",
                desc: "All generated files committed to a new branch and opened as a pull request automatically.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-700 bg-slate-800/40 p-6"
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10 text-white">FAQ</h2>
          <div className="space-y-6">
            {[
              {
                q: "Can I preview before paying?",
                a: "Yes — you can see a basic template-based preview for free. The AI-enhanced version (which is significantly better) requires a Ship Credit or Pro subscription.",
              },
              {
                q: "What AI models are used?",
                a: "We use GPT-4o-mini (OpenAI) for README and landing page generation, and Blackbox AI for deep code analysis and config generation.",
              },
              {
                q: "How many repos can I ship with Pro?",
                a: "Up to 30 repos per month. That's $0.50 per ship — much cheaper than the one-time credit.",
              },
              {
                q: "What if the AI generation fails?",
                a: "If AI generation fails for any reason, your credit is not consumed. You'll see an error and can try again.",
              },
              {
                q: "Can I cancel Pro anytime?",
                a: "Yes, cancel anytime from the billing portal. You keep access until the end of your billing period.",
              },
            ].map((item) => (
              <div key={item.q} className="border border-slate-700 rounded-xl p-6">
                <h3 className="font-semibold text-white mb-2">{item.q}</h3>
                <p className="text-slate-400 text-sm">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <p className="text-slate-400 mb-6">
            Already have a credit?{" "}
            <Link href="/repos" className="text-blue-400 hover:underline">
              Go to your repos →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
