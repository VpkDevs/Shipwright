"use client";

import Link from "next/link";
import { useState } from "react";

const PLANS = [
  {
    id: "credit",
    name: "Ship Credit",
    price: "$5",
    period: "one-time",
    description: "One AI-powered generation. Perfect for a single project.",
    features: [
      "1 repo generation",
      "AI README + landing page",
      "Vercel config + env template",
      "GitHub PR automation",
    ],
    cta: "Buy a Credit",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$15",
    period: "/ month",
    description: "Unlimited generations for active builders.",
    features: [
      "Unlimited repo generations",
      "AI README + landing page",
      "Vercel config + env template",
      "GitHub PR automation",
      "Priority processing",
    ],
    cta: "Go Pro",
    highlighted: true,
  },
  {
    id: "proAnnual",
    name: "Pro Annual",
    price: "$150",
    period: "/ year",
    description: "Same as Pro — save 2 months.",
    features: [
      "Unlimited repo generations",
      "AI README + landing page",
      "Vercel config + env template",
      "GitHub PR automation",
      "Priority processing",
      "2 months free vs monthly",
    ],
    cta: "Go Pro Annual",
    highlighted: false,
  },
  {
    id: "team",
    name: "Team",
    price: "$250",
    period: "/ month",
    description: "For teams shipping multiple projects.",
    features: [
      "Everything in Pro",
      "Up to 10 team members",
      "Shared repo history",
      "Priority support",
    ],
    cta: "Get Team",
    highlighted: false,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleCheckout = async (planId: string) => {
    setLoading(planId);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });

      if (res.status === 401) {
        window.location.href = "/api/auth/signin/github";
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Checkout failed");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-400">
            Shipwright
          </Link>
          <Link href="/repos" className="text-slate-300 hover:text-white transition-colors text-sm">
            My Repos →
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold mb-4">Simple, Honest Pricing</h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Pay once per repo, or go unlimited. No subscription traps — cancel anytime.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-xl border p-6 flex flex-col ${
                plan.highlighted
                  ? "border-blue-500 bg-blue-950/40 ring-1 ring-blue-500"
                  : "border-slate-700 bg-slate-800/40"
              }`}
            >
              {plan.highlighted && (
                <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">
                  Most Popular
                </div>
              )}
              <h2 className="text-xl font-bold mb-1">{plan.name}</h2>
              <div className="mb-2">
                <span className="text-3xl font-extrabold">{plan.price}</span>
                <span className="text-slate-400 text-sm ml-1">{plan.period}</span>
              </div>
              <p className="text-slate-400 text-sm mb-6">{plan.description}</p>
              <ul className="space-y-2 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => handleCheckout(plan.id)}
                disabled={loading !== null}
                className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                  plan.highlighted
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "bg-slate-700 hover:bg-slate-600 text-slate-100"
                }`}
              >
                {loading === plan.id ? "Redirecting..." : plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <p className="text-slate-500 text-sm">
            All plans include a 30-day money-back guarantee. Questions?{" "}
            <a
              href="mailto:vincekinney1991@gmail.com"
              className="text-blue-400 hover:underline"
            >
              Email us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
