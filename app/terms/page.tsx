import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Shipwright",
  description: "Shipwright Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/" className="text-xl font-bold text-blue-400">
            Shipwright
          </Link>
        </div>
      </nav>
      <div className="max-w-4xl mx-auto px-6 py-12 prose prose-invert prose-slate max-w-none">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-slate-400 text-sm mb-8">Effective date: May 3, 2026</p>

        <section className="space-y-6 text-slate-300">
          <div>
            <h2 className="text-xl font-semibold text-white">1. Acceptance</h2>
            <p>
              By accessing or using Shipwright, you agree to be bound by these Terms. If you do not
              agree, do not use the Service.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">2. Description of Service</h2>
            <p>
              Shipwright analyzes your GitHub repositories and generates deployment configurations,
              documentation, landing pages, and pull requests. The Service is provided on an "as is"
              basis.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">3. Account and Authentication</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You must authenticate via GitHub OAuth to use the Service</li>
              <li>You are responsible for maintaining the security of your GitHub account</li>
              <li>
                We access only the repository data necessary to provide the Service (scope:{" "}
                <code className="bg-slate-700 px-1 rounded text-xs">repo user</code>)
              </li>
              <li>We do not store your GitHub access token beyond your session</li>
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">4. Payment Terms</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Ship Credits ($5):</strong> One-time, one generation. Non-refundable after
                use.
              </li>
              <li>
                <strong>Pro ($15/month):</strong> Unlimited generations. Cancel anytime; effective
                end of billing period.
              </li>
              <li>
                <strong>Pro Annual ($150/year):</strong> Same as Pro, billed annually.
              </li>
              <li>
                <strong>Team ($250/month):</strong> Unlimited generations for up to 10 members.
              </li>
              <li>
                <strong>Refunds:</strong> 30-day money-back guarantee on first-time purchases. Email
                vincekinney1991@gmail.com.
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">5. Acceptable Use</h2>
            <p>
              You agree not to use the Service to analyze repos you don't own or have permission to
              access, circumvent rate limits or payment requirements, use it for unlawful purposes,
              or reverse engineer the underlying AI models.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">6. Intellectual Property</h2>
            <p>
              Generated content (READMEs, landing pages, configs) belongs to you. The Shipwright
              codebase and brand are owned by us.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">7. Disclaimers</h2>
            <p className="uppercase text-sm">
              The service is provided "as is" without warranty of any kind. We do not guarantee that
              generated content will be error-free or fit for any particular purpose.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">8. Limitation of Liability</h2>
            <p className="uppercase text-sm">
              To the maximum extent permitted by law, our liability shall not exceed the amount you
              paid us in the 12 months preceding the claim.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">9. Contact</h2>
            <p>
              Questions?{" "}
              <a href="mailto:vincekinney1991@gmail.com" className="text-blue-400 hover:underline">
                vincekinney1991@gmail.com
              </a>
            </p>
          </div>
        </section>

        <div className="mt-12 pt-6 border-t border-slate-700 flex gap-6 text-sm text-slate-500">
          <Link href="/privacy" className="hover:text-slate-300">
            Privacy Policy
          </Link>
          <Link href="/" className="hover:text-slate-300">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
