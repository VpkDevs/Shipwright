import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Shipwright",
  description: "Shipwright Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/" className="text-xl font-bold text-blue-400">
            Shipwright
          </Link>
        </div>
      </nav>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-slate-400 text-sm mb-8">Effective date: May 3, 2026</p>

        <div className="space-y-8 text-slate-300">
          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Information We Collect</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-slate-200">From GitHub OAuth</h3>
                <p className="text-sm">Your GitHub username, display name, email, and avatar. A temporary OAuth token used only during your session — never stored.</p>
              </div>
              <div>
                <h3 className="font-medium text-slate-200">From Your Repositories</h3>
                <p className="text-sm">We read <code className="bg-slate-700 px-1 rounded text-xs">package.json</code>, README, file tree, and environment variable <em>names</em> (never values) to perform analysis.</p>
              </div>
              <div>
                <h3 className="font-medium text-slate-200">From Payments</h3>
                <p className="text-sm">Processed by Stripe. We store your Stripe customer ID, plan type, and remaining credits. We never store card numbers.</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>To analyze repos and generate content</li>
              <li>To process payments and manage subscriptions</li>
              <li>To enforce rate limits</li>
              <li>To improve the Service (aggregated, anonymized only)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Data Retention</h2>
            <div className="overflow-x-auto">
              <table className="text-sm w-full">
                <thead><tr className="text-slate-400 border-b border-slate-700"><th className="text-left py-2 pr-8">Data</th><th className="text-left py-2">Retention</th></tr></thead>
                <tbody className="divide-y divide-slate-800">
                  <tr><td className="py-2 pr-8">GitHub profile data</td><td className="py-2">Until account deletion</td></tr>
                  <tr><td className="py-2 pr-8">Repo analysis results</td><td className="py-2">Not persisted — per request</td></tr>
                  <tr><td className="py-2 pr-8">API logs</td><td className="py-2">30 days</td></tr>
                  <tr><td className="py-2 pr-8">Payment data</td><td className="py-2">Per Stripe policy (7 years)</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Your Rights</h2>
            <p className="text-sm">You may request access, deletion, or correction of your data. Email <a href="mailto:vincekinney1991@gmail.com" className="text-blue-400 hover:underline">vincekinney1991@gmail.com</a>. We respond within 30 days.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Security</h2>
            <p className="text-sm">All data in transit is encrypted via TLS. GitHub tokens are session-only. We use encrypted database connections. We do not use tracking or advertising cookies.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Contact</h2>
            <p className="text-sm"><a href="mailto:vincekinney1991@gmail.com" className="text-blue-400 hover:underline">vincekinney1991@gmail.com</a></p>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-700 flex gap-6 text-sm text-slate-500">
          <Link href="/terms" className="hover:text-slate-300">Terms of Service</Link>
          <Link href="/" className="hover:text-slate-300">Home</Link>
        </div>
      </div>
    </div>
  );
}
