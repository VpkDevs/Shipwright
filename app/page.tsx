"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-400">Shipwright</h1>
            <div className="flex gap-4">
              <Link
                href="/repos"
                className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Repos
              </Link>
              <a
                href="/api/auth/signout"
                className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Sign Out
              </a>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Welcome back!</h2>
            <p className="text-slate-400 text-lg">
              Ready to turn your repositories into live products?
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/repos"
              className="card hover:border-blue-500 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="text-4xl mb-2">📦</div>
                  <h3 className="text-lg font-semibold">My Repositories</h3>
                </div>
              </div>
            </Link>

            <div className="card opacity-50">
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <h3 className="text-lg font-semibold">Dashboard</h3>
                  <p className="text-xs text-slate-400 mt-2">Coming soon</p>
                </div>
              </div>
            </div>

            <div className="card opacity-50">
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="text-4xl mb-2">⚙️</div>
                  <h3 className="text-lg font-semibold">Settings</h3>
                  <p className="text-xs text-slate-400 mt-2">Coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-400">Shipwright</h1>
          <p className="text-slate-400">Turn dormant repos into live products</p>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold mb-4 text-white">
            From Repository to Production
          </h2>
          <p className="text-xl text-slate-400 mb-8">
            Shipwright collapses the gap between your GitHub repos and deployed
            products. Get deployment-ready configs, documentation, and landing
            pages in minutes.
          </p>

          <div className="flex gap-4 justify-center">
            <a
              href="/api/auth/signin/github"
              className="btn-primary px-8 py-3 text-lg"
            >
              Sign In with GitHub
            </a>
            <a
              href="#features"
              className="btn-secondary px-8 py-3 text-lg"
            >
              Learn More
            </a>
          </div>
        </div>

        <div id="features" className="mt-20">
          <h3 className="text-3xl font-bold text-center mb-12">Features</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card">
              <div className="text-4xl mb-3">🔍</div>
              <h4 className="text-lg font-semibold mb-2">Repo Analysis</h4>
              <p className="text-slate-400">
                Automatically detect your framework, dependencies, and
                deployment requirements.
              </p>
            </div>

            <div className="card">
              <div className="text-4xl mb-3">⚡</div>
              <h4 className="text-lg font-semibold mb-2">Config Generation</h4>
              <p className="text-slate-400">
                Generate Vercel configs, environment templates, and deployment
                scripts automatically.
              </p>
            </div>

            <div className="card">
              <div className="text-4xl mb-3">📝</div>
              <h4 className="text-lg font-semibold mb-2">Documentation</h4>
              <p className="text-slate-400">
                Get production-ready READMEs and landing pages generated from
                your repo.
              </p>
            </div>

            <div className="card">
              <div className="text-4xl mb-3">🚀</div>
              <h4 className="text-lg font-semibold mb-2">PR Ready</h4>
              <p className="text-slate-400">
                All changes packaged into a single pull request for your
                review.
              </p>
            </div>

            <div className="card">
              <div className="text-4xl mb-3">✅</div>
              <h4 className="text-lg font-semibold mb-2">Deploy Button</h4>
              <p className="text-slate-400">
                One-click deployment to Vercel with all configurations ready.
              </p>
            </div>

            <div className="card">
              <div className="text-4xl mb-3">⏱️</div>
              <h4 className="text-lg font-semibold mb-2">15 Minutes</h4>
              <p className="text-slate-400">
                From repo to live URL in under 15 minutes. That&apos;s the goal.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-20 text-center">
          <p className="text-slate-400 mb-6">
            Shipwright is built for solo builders and indie developers who want
            to ship fast.
          </p>
          <a
            href="/api/auth/signin/github"
            className="btn-primary px-8 py-3 text-lg inline-block"
          >
            Get Started Now
          </a>
        </div>
      </div>
    </div>
  );
}
