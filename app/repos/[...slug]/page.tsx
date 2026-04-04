"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import type { RepoAnalysis, AgentStep, PaymentStatus } from "@/types";

interface TemplateContent {
  vercelJson: string;
  packageJsonScripts: Record<string, string>;
  envTemplate: string;
  readme: string;
  landingPage: string;
  isAI: false;
}

interface AIContent {
  analysis: RepoAnalysis;
  aiReadme: string;
  aiLandingPage: string;
  vercelJson: string;
  packageJsonScripts: Record<string, string>;
  envTemplate: string;
  deploymentRecommendations: string[];
  steps: AgentStep[];
  provider: "openai" | "blackbox" | "template";
  creditsRemaining: number | null;
  plan: "pro" | "credit";
  isAI: true;
}

type GeneratedContent = TemplateContent | AIContent;

export default function RepoPage() {
  const router = useRouter();
  const params = useParams();

  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(null);
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "readme" | "landing" | "config">("overview");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isShipping, setIsShipping] = useState(false);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [isCreatingPR, setIsCreatingPR] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);

  const slug = params?.slug;
  const owner = Array.isArray(slug) ? slug[0] : slug;
  const repo = Array.isArray(slug) ? slug[1] : undefined;

  // Check payment status
  const fetchPaymentStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/credits");
      if (res.ok) {
        const data = await res.json() as PaymentStatus;
        setPaymentStatus(data);
      }
    } catch {
      // ignore — fail open for payment status (gate is server-side)
    }
  }, []);

  useEffect(() => {
    if (!owner || !repo) return;

    const init = async () => {
      try {
        const [analyzeRes] = await Promise.all([
          fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ owner, repo }),
          }),
          fetchPaymentStatus(),
        ]);

        if (!analyzeRes.ok) {
          if (analyzeRes.status === 401) {
            router.push("/");
            return;
          }
          throw new Error("Failed to analyze");
        }

        const data = await analyzeRes.json() as RepoAnalysis;
        setAnalysis(data);
      } catch (err) {
        setError("Failed to analyze repository");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [owner, repo, router, fetchPaymentStatus]);

  // Check for payment success redirect
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("payment") === "success") {
      fetchPaymentStatus();
      // Clean up URL
      url.searchParams.delete("payment");
      window.history.replaceState({}, "", url.toString());
    }
  }, [fetchPaymentStatus]);

  /** Free template-based generation */
  const handleTemplateGenerate = async () => {
    if (!owner || !repo || isGenerating) return;
    setIsGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo }),
      });
      if (!res.ok) throw new Error("Failed to generate");
      const data = await res.json() as TemplateContent;
      setGenerated({ ...data, isAI: false });
      setActiveTab("readme");
    } catch (err) {
      setError("Failed to generate template content");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  /** AI-powered generation (requires payment) */
  const handleAIShip = async () => {
    if (!owner || !repo || isShipping) return;
    setIsShipping(true);
    setError("");
    setAgentSteps([]);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo }),
      });

      if (res.status === 402) {
        // Payment required — redirect to pricing
        router.push(`/pricing`);
        return;
      }

      if (!res.ok) {
        const errData = await res.json() as { error?: string };
        throw new Error(errData.error || "AI generation failed");
      }

      const data = await res.json() as Omit<AIContent, "isAI">;
      setGenerated({ ...data, isAI: true });
      setAgentSteps(data.steps || []);
      setActiveTab("readme");

      // Refresh payment status
      await fetchPaymentStatus();
    } catch (err) {
      setError(String(err));
      console.error(err);
    } finally {
      setIsShipping(false);
    }
  };

  /** Create PR with generated content */
  const handleCreatePR = async () => {
    if (!generated || !owner || !repo || isCreatingPR) return;
    setIsCreatingPR(true);
    setError("");

    const aiContent = generated.isAI ? generated : null;
    const readme = aiContent ? aiContent.aiReadme : (generated as TemplateContent).readme;
    const vercelJson = generated.vercelJson;
    const envTemplate = generated.envTemplate;

    try {
      const res = await fetch("/api/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_pr",
          owner,
          repo,
          files: [
            { path: "README.md", content: readme },
            ...(vercelJson ? [{ path: "vercel.json", content: vercelJson }] : []),
            { path: ".env.example", content: envTemplate },
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json() as { url?: string };
        if (data.url) {
          setPrUrl(data.url);
        }
      } else {
        throw new Error("Failed to create PR");
      }
    } catch (err) {
      setError("PR creation failed — you can manually copy the files above.");
      console.error(err);
    } finally {
      setIsCreatingPR(false);
    }
  };

  const hasPayment = paymentStatus && (paymentStatus.plan === "pro" || paymentStatus.credits > 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <Link href="/repos" className="text-2xl font-bold text-blue-400">← Back</Link>
          </div>
        </nav>
        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Analyzing repository...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <Link href="/repos" className="text-2xl font-bold text-blue-400">← Back</Link>
          </div>
        </nav>
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="card text-center py-12">
            <p className="text-red-400 mb-4">{error || "Repository not found"}</p>
            <Link href="/repos" className="btn-secondary">Back to Repos</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/repos" className="text-xl font-bold text-blue-400">← {repo}</Link>
          <div className="flex items-center gap-3">
            {paymentStatus?.plan === "pro" && (
              <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full font-semibold">PRO</span>
            )}
            {paymentStatus?.plan === "credit" && (
              <span className="text-xs bg-green-700 text-white px-2 py-1 rounded-full font-semibold">
                {paymentStatus.credits} credit{paymentStatus.credits !== 1 ? "s" : ""}
              </span>
            )}
            <a href="/api/auth/signout" className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors text-sm">
              Sign Out
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">

          {/* ── Left: Analysis + Actions ── */}
          <div>
            <div className="card sticky top-24 space-y-4">
              <h2 className="text-lg font-semibold">Analysis</h2>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-500 text-xs">Framework</p>
                  <p className="font-semibold text-blue-400">{analysis.framework}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Package Manager</p>
                  <p className="font-semibold">{analysis.packageManager}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Backend</p>
                  <p className="font-semibold">{analysis.backendType}</p>
                </div>
                {analysis.hasDocker && (
                  <div className="flex items-center gap-2 text-green-400 text-xs">
                    <span>✓</span> Docker present
                  </div>
                )}
                <div>
                  <p className="text-slate-500 text-xs mb-1">Risk Score</p>
                  <div className="w-full bg-slate-700 rounded h-2">
                    <div
                      className={`h-2 rounded ${
                        analysis.deploymentRiskScore < 30
                          ? "bg-green-500"
                          : analysis.deploymentRiskScore < 60
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${analysis.deploymentRiskScore}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{analysis.deploymentRiskScore}% risk</p>
                </div>
                {analysis.missingConfigs.length > 0 && (
                  <div>
                    <p className="text-slate-500 text-xs mb-1">Missing Configs</p>
                    <ul className="text-xs text-slate-400 space-y-1">
                      {analysis.missingConfigs.map((c) => <li key={c}>• {c}</li>)}
                    </ul>
                  </div>
                )}
                {analysis.envVarsDetected.length > 0 && (
                  <div>
                    <p className="text-slate-500 text-xs mb-1">Env Variables</p>
                    <ul className="text-xs text-slate-400 space-y-1">
                      {analysis.envVarsDetected.map((e) => <li key={e}>• {e}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-700 pt-4 space-y-3">
                {/* Free template preview */}
                <button
                  onClick={handleTemplateGenerate}
                  disabled={isGenerating || isShipping || !!generated}
                  className="btn-secondary w-full text-sm disabled:opacity-40"
                >
                  {isGenerating ? "Generating..." : "Preview (Free Template)"}
                </button>

                {/* AI Ship button */}
                {hasPayment ? (
                  <button
                    onClick={handleAIShip}
                    disabled={isShipping || isGenerating}
                    className="btn-primary w-full disabled:opacity-50 relative"
                  >
                    {isShipping ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                        AI Shipping...
                      </span>
                    ) : (
                      "🚀 Ship with AI"
                    )}
                  </button>
                ) : (
                  <Link
                    href="/pricing"
                    className="btn-primary w-full text-center block"
                  >
                    🚀 Ship with AI — $5
                  </Link>
                )}

                {paymentStatus?.plan === "none" && (
                  <p className="text-xs text-slate-500 text-center">
                    AI generation requires a{" "}
                    <Link href="/pricing" className="text-blue-400 hover:underline">
                      Ship Credit or Pro plan
                    </Link>
                  </p>
                )}
              </div>

              {/* Agent Steps */}
              {(isShipping || agentSteps.length > 0) && (
                <div className="border-t border-slate-700 pt-4">
                  <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">
                    Agent Progress
                  </p>
                  <ul className="space-y-2">
                    {agentSteps.map((step) => (
                      <li key={step.id} className="flex items-start gap-2 text-xs">
                        <span className="mt-0.5 flex-shrink-0">
                          {step.status === "done" && <span className="text-green-400">✓</span>}
                          {step.status === "running" && (
                            <span className="inline-block animate-spin text-blue-400">⟳</span>
                          )}
                          {step.status === "error" && <span className="text-red-400">✗</span>}
                          {step.status === "pending" && <span className="text-slate-500">○</span>}
                        </span>
                        <div>
                          <p className={`${step.status === "done" ? "text-slate-300" : step.status === "error" ? "text-red-400" : "text-slate-400"}`}>
                            {step.label}
                          </p>
                          {step.detail && (
                            <p className="text-slate-500 text-xs">{step.detail}</p>
                          )}
                        </div>
                      </li>
                    ))}
                    {isShipping && agentSteps.length === 0 && (
                      <li className="text-xs text-slate-400 flex items-center gap-2">
                        <span className="animate-spin inline-block">⟳</span> Starting agents...
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Content Preview ── */}
          <div className="md:col-span-2">
            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-4 text-red-200 text-sm">
                {error}
              </div>
            )}

            {!generated ? (
              <div className="card text-center py-16">
                <div className="text-5xl mb-4">🚀</div>
                <h3 className="text-xl font-semibold mb-2">Ready to ship {repo}?</h3>
                <p className="text-slate-400 mb-6 max-w-sm mx-auto text-sm">
                  Get a free template preview, or use AI to generate production-quality
                  configs, README, and landing page from your actual code.
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <button
                    onClick={handleTemplateGenerate}
                    disabled={isGenerating}
                    className="btn-secondary text-sm"
                  >
                    {isGenerating ? "Generating..." : "Free Preview"}
                  </button>
                  <Link href="/pricing" className="btn-primary text-sm">
                    Ship with AI — $5
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* AI vs Template badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-2">
                    {(["overview", "readme", "landing", "config"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 font-medium text-sm transition-colors ${
                          activeTab === tab
                            ? "text-blue-400 border-b-2 border-blue-400"
                            : "text-slate-400 hover:text-slate-300"
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      generated.isAI
                        ? "bg-blue-900 text-blue-300"
                        : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {generated.isAI ? "✨ AI Generated" : "📋 Template"}
                  </span>
                </div>

                <div className="card">
                  {activeTab === "overview" && (
                    <div className="space-y-4">
                      {/* AI Recommendations */}
                      {generated.isAI && generated.deploymentRecommendations.length > 0 && (
                        <div>
                          <h3 className="text-sm text-slate-400 mb-2 font-semibold">
                            🤖 AI Deployment Recommendations
                          </h3>
                          <ul className="space-y-2">
                            {generated.deploymentRecommendations.map((rec, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                <span className="text-blue-400 mt-0.5">→</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm text-slate-500 mb-2">Vercel Config</h3>
                        <pre className="bg-slate-900 p-3 rounded text-xs overflow-x-auto text-green-400 max-h-48">
                          {generated.vercelJson || "{}"}
                        </pre>
                      </div>
                      <div>
                        <h3 className="text-sm text-slate-500 mb-2">Environment Template</h3>
                        <pre className="bg-slate-900 p-3 rounded text-xs overflow-x-auto text-slate-300 max-h-48">
                          {generated.envTemplate}
                        </pre>
                      </div>
                    </div>
                  )}

                  {activeTab === "readme" && (
                    <div>
                      {!generated.isAI && (
                        <div className="mb-4 p-3 bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-between">
                          <p className="text-xs text-slate-400">
                            This is a generic template. AI generation creates a README from your actual code.
                          </p>
                          <Link href="/pricing" className="text-xs text-blue-400 hover:underline ml-4 whitespace-nowrap">
                            Upgrade →
                          </Link>
                        </div>
                      )}
                      <pre className="bg-slate-900 p-3 rounded text-xs overflow-x-auto text-slate-300 max-h-96">
                        {generated.isAI ? generated.aiReadme : (generated as TemplateContent).readme}
                      </pre>
                    </div>
                  )}

                  {activeTab === "landing" && (
                    <div className="bg-slate-900 p-4 rounded">
                      {!generated.isAI && (
                        <div className="mb-4 p-3 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-between">
                          <p className="text-xs text-slate-400">
                            AI generates landing page copy from your actual codebase.
                          </p>
                          <Link href="/pricing" className="text-xs text-blue-400 hover:underline ml-4 whitespace-nowrap">
                            Upgrade →
                          </Link>
                        </div>
                      )}
                      <p className="text-slate-400 text-sm mb-3">Landing page HTML preview:</p>
                      <pre className="text-xs overflow-x-auto text-slate-300 max-h-96">
                        {(generated.isAI ? generated.aiLandingPage : (generated as TemplateContent).landingPage).substring(0, 800)}...
                      </pre>
                    </div>
                  )}

                  {activeTab === "config" && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm text-slate-500 mb-2">Package.json Scripts</h3>
                        <pre className="bg-slate-900 p-3 rounded text-xs overflow-x-auto text-blue-400">
                          {JSON.stringify(generated.packageJsonScripts, null, 2)}
                        </pre>
                      </div>
                      {generated.isAI && (
                        <div>
                          <h3 className="text-sm text-slate-500 mb-2">Generated by</h3>
                          <p className="text-xs text-slate-400">
                            Provider: <span className="text-blue-400">{generated.provider}</span>
                            {generated.creditsRemaining !== null && (
                              <span className="ml-4">Credits remaining: <span className="text-green-400">{generated.creditsRemaining}</span></span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* PR Creation */}
                {prUrl ? (
                  <a
                    href={prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full mt-6 text-center block"
                  >
                    ✅ View Pull Request →
                  </a>
                ) : (
                  <button
                    onClick={handleCreatePR}
                    disabled={isCreatingPR || !generated.isAI}
                    className="btn-primary w-full mt-6 disabled:opacity-40"
                    title={!generated.isAI ? "PR creation requires AI generation" : ""}
                  >
                    {isCreatingPR
                      ? "Creating PR..."
                      : generated.isAI
                        ? "📬 Create Pull Request"
                        : "📬 Create PR (requires AI Ship)"}
                  </button>
                )}

                {!generated.isAI && (
                  <p className="text-center text-xs text-slate-500 mt-2">
                    PR creation is only available with AI generation.{" "}
                    <Link href="/pricing" className="text-blue-400 hover:underline">
                      Upgrade for $5 →
                    </Link>
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
