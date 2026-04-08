"use client";

import type { RepoAnalysis } from "@/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface GeneratedContent {
  vercelJson: string;
  railwayToml: string;
  packageJsonScripts: Record<string, string>;
  envTemplate: string;
  readme: string;
  landingPage: string;
  aiEnhanced?: boolean;
}

interface PRResult {
  url: string;
  number: number;
  title: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 transition-colors text-slate-300"
      title="Copy to clipboard"
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function CodeBlock({ label, content }: { label: string; content: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm text-slate-500">{label}</h3>
        {content && <CopyButton text={content} />}
      </div>
      <pre className="bg-slate-900 p-3 rounded text-xs overflow-x-auto text-green-400 max-h-64">
        {content || "Not applicable for this framework"}
      </pre>
    </div>
  );
}

export default function RepoPage() {
  const router = useRouter();
  const params = useParams();
  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(null);
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "readme" | "landing" | "config" | "railway"
  >("overview");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingPR, setIsCreatingPR] = useState(false);
  const [prResult, setPRResult] = useState<PRResult | null>(null);
  const [prError, setPRError] = useState("");
  const [showLandingPreview, setShowLandingPreview] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const slug = params?.slug;
  const owner = Array.isArray(slug) ? slug[0] : slug;
  const repo = Array.isArray(slug) ? slug[1] : undefined;

  const runAnalysis = useCallback(async () => {
    if (!owner || !repo) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/");
          return;
        }
        throw new Error("Failed to analyze");
      }

      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      setError("Failed to analyze repository");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [owner, repo, router]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  // Render landing page HTML into iframe using a blob URL
  useEffect(() => {
    if (!showLandingPreview || !generated?.landingPage || !iframeRef.current) return;
    const blob = new Blob([generated.landingPage], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    iframeRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [showLandingPreview, generated?.landingPage]);

  const handleGenerate = async () => {
    if (!owner || !repo || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo }),
      });

      if (!res.ok) throw new Error("Failed to generate");

      const data = await res.json();
      setGenerated(data);
      setActiveTab("readme");
    } catch (err) {
      setError("Failed to generate content");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    setGenerated(null);
    setPRResult(null);
    setPRError("");
    setShowLandingPreview(false);
  };

  const handleCreatePR = async () => {
    if (!owner || !repo || !generated || isCreatingPR) return;

    setIsCreatingPR(true);
    setPRError("");

    const files: Array<{ path: string; content: string }> = [];

    if (generated.vercelJson) {
      files.push({ path: "vercel.json", content: generated.vercelJson });
    }
    if (generated.railwayToml) {
      files.push({ path: "railway.toml", content: generated.railwayToml });
    }
    if (generated.envTemplate) {
      files.push({ path: ".env.example", content: generated.envTemplate });
    }
    if (generated.readme) {
      files.push({ path: "README.md", content: generated.readme });
    }
    if (generated.landingPage) {
      files.push({ path: "landing/index.html", content: generated.landingPage });
    }
    if (Object.keys(generated.packageJsonScripts).length > 0) {
      files.push({
        path: "shipwright-scripts.json",
        content: JSON.stringify({ scripts: generated.packageJsonScripts }, null, 2),
      });
    }

    try {
      const res = await fetch("/api/create-pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo, files }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create PR");
      }

      const data = await res.json();
      setPRResult(data);
    } catch (err) {
      setPRError(err instanceof Error ? err.message : "Failed to create pull request");
      console.error(err);
    } finally {
      setIsCreatingPR(false);
    }
  };

  const riskColor = !analysis
    ? "bg-slate-500"
    : analysis.deploymentRiskScore < 20
      ? "bg-green-500 text-green-400"
      : analysis.deploymentRiskScore < 50
        ? "bg-yellow-500 text-yellow-400"
        : "bg-red-500 text-red-400";

  const riskBarColor = riskColor.split(" ")[0];
  const riskTextColor = riskColor.split(" ")[1];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <Link href="/repos" className="text-2xl font-bold text-blue-400">
              ← Repos
            </Link>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
            <p className="text-slate-400">Analyzing {repo}...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <Link href="/repos" className="text-2xl font-bold text-blue-400">
              ← Repos
            </Link>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="card text-center py-12">
            <p className="text-red-400 mb-4">{error || "Repository not found"}</p>
            <Link href="/repos" className="btn-secondary">
              Back to Repos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Link
              href="/"
              className="hover:text-blue-400 transition-colors font-bold text-blue-400"
            >
              Shipwright
            </Link>
            <span>/</span>
            <Link href="/repos" className="hover:text-slate-200 transition-colors">
              Repos
            </Link>
            <span>/</span>
            <span className="text-slate-200 font-semibold">
              {owner}/{repo}
            </span>
          </div>
          <a
            href="/api/auth/signout"
            className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors text-sm"
          >
            Sign Out
          </a>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left: Analysis Summary */}
          <div>
            <div className="card sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Analysis</h2>
                <button
                  type="button"
                  onClick={runAnalysis}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  title="Re-analyze repository"
                >
                  ↻ Refresh
                </button>
              </div>

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
                  <p className="text-slate-500 text-xs">Backend Type</p>
                  <p className="font-semibold">{analysis.backendType}</p>
                </div>

                {analysis.hasDocker && (
                  <div className="flex items-center gap-2 text-green-400">
                    <span>✓</span> Docker present
                  </div>
                )}

                {analysis.buildScript && (
                  <div>
                    <p className="text-slate-500 text-xs">Build Script</p>
                    <code className="text-xs bg-slate-700 px-1 rounded text-slate-300">
                      {analysis.buildScript}
                    </code>
                  </div>
                )}

                <div>
                  <p className="text-slate-500 text-xs mb-1">Deployment Risk</p>
                  <div className="w-full bg-slate-700 rounded h-2">
                    <div
                      className={`h-2 rounded ${riskBarColor}`}
                      style={{
                        width: `${analysis.deploymentRiskScore}%`,
                      }}
                    />
                  </div>
                  <p className={`text-xs mt-1 ${riskTextColor}`}>
                    {analysis.deploymentRiskScore < 20
                      ? `✓ Low risk (${analysis.deploymentRiskScore}%)`
                      : analysis.deploymentRiskScore < 50
                        ? `⚠ Medium risk (${analysis.deploymentRiskScore}%)`
                        : `✗ High risk (${analysis.deploymentRiskScore}%)`}
                  </p>
                </div>

                {analysis.missingConfigs.length > 0 && (
                  <div>
                    <p className="text-slate-500 text-xs mb-1">Missing Configs</p>
                    <ul className="text-xs text-yellow-400 space-y-1">
                      {analysis.missingConfigs.map((config) => (
                        <li key={config}>⚠ {config}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.envVarsDetected.length > 0 && (
                  <div>
                    <p className="text-slate-500 text-xs mb-1">
                      Env Variables ({analysis.envVarsDetected.length})
                    </p>
                    <ul className="text-xs text-slate-400 space-y-1 max-h-28 overflow-y-auto">
                      {analysis.envVarsDetected.map((env) => (
                        <li key={env} className="font-mono">
                          • {env}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {!generated ? (
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="btn-primary w-full mt-6 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Generating...
                    </span>
                  ) : (
                    "⚡ Generate Content"
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="btn-secondary w-full mt-6"
                >
                  ↻ Regenerate
                </button>
              )}
            </div>
          </div>

          {/* Right: Content Preview */}
          <div className="md:col-span-2">
            {!generated ? (
              <div className="card text-center py-16">
                <div className="text-5xl mb-4">🚢</div>
                <h3 className="text-xl font-semibold mb-2">Ready to Generate</h3>
                <p className="text-slate-400 mb-6 max-w-sm mx-auto">
                  Click &quot;Generate Content&quot; to create deployment configs, README, and
                  landing page for <span className="text-blue-400 font-mono">{repo}</span>.
                </p>
                {!!process.env.NEXT_PUBLIC_AI_ENABLED && (
                  <p className="text-xs text-purple-400">✨ AI-enhanced generation enabled</p>
                )}
              </div>
            ) : (
              <>
                {generated.aiEnhanced && (
                  <div className="mb-4 flex items-center gap-2 text-purple-400 text-sm">
                    <span>✨</span>
                    <span>Content enhanced with AI</span>
                  </div>
                )}

                <div className="flex gap-2 mb-6 border-b border-slate-700 overflow-x-auto">
                  {(["overview", "readme", "landing", "config", "railway"] as const).map((tab) => (
                    <button
                      type="button"
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${
                        activeTab === tab
                          ? "text-blue-400 border-b-2 border-blue-400"
                          : "text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      {tab === "overview"
                        ? "Overview"
                        : tab === "readme"
                          ? "README"
                          : tab === "landing"
                            ? "Landing Page"
                            : tab === "config"
                              ? "Vercel Config"
                              : "Railway Config"}
                    </button>
                  ))}
                </div>

                <div className="card">
                  {activeTab === "overview" && (
                    <div className="space-y-4">
                      <CodeBlock label="vercel.json" content={generated.vercelJson} />
                      <CodeBlock label=".env.example" content={generated.envTemplate} />
                    </div>
                  )}

                  {activeTab === "readme" && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm text-slate-500">README.md</h3>
                        <CopyButton text={generated.readme} />
                      </div>
                      <pre className="bg-slate-900 p-3 rounded text-xs overflow-x-auto text-slate-300 max-h-96 whitespace-pre-wrap">
                        {generated.readme}
                      </pre>
                    </div>
                  )}

                  {activeTab === "landing" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-slate-400 text-sm">
                          Saved as{" "}
                          <code className="bg-slate-700 px-1 rounded">landing/index.html</code>
                        </p>
                        <div className="flex gap-2">
                          <CopyButton text={generated.landingPage} />
                          <button
                            type="button"
                            onClick={() => setShowLandingPreview((v) => !v)}
                            className="text-xs px-2 py-1 rounded bg-blue-700 hover:bg-blue-600 transition-colors text-white"
                          >
                            {showLandingPreview ? "Hide Preview" : "Live Preview"}
                          </button>
                        </div>
                      </div>

                      {showLandingPreview ? (
                        <iframe
                          ref={iframeRef}
                          title="Landing page preview"
                          className="w-full h-96 rounded border border-slate-600"
                          sandbox="allow-same-origin"
                        />
                      ) : (
                        <pre className="bg-slate-900 p-3 rounded text-xs overflow-x-auto text-slate-300 max-h-96">
                          {generated.landingPage.substring(0, 1500)}
                          {generated.landingPage.length > 1500
                            ? "\n... (truncated — click Live Preview to see rendered)"
                            : ""}
                        </pre>
                      )}
                    </div>
                  )}

                  {activeTab === "config" && (
                    <div className="space-y-4">
                      <CodeBlock label="vercel.json" content={generated.vercelJson} />
                      {Object.keys(generated.packageJsonScripts).length > 0 ? (
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm text-slate-500">
                              Suggested package.json Scripts
                            </h3>
                            <CopyButton
                              text={JSON.stringify(generated.packageJsonScripts, null, 2)}
                            />
                          </div>
                          <pre className="bg-slate-900 p-3 rounded text-xs overflow-x-auto text-blue-400">
                            {JSON.stringify(generated.packageJsonScripts, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <p className="text-slate-400 text-sm">
                          ✓ Your package.json already has all required scripts.
                        </p>
                      )}
                    </div>
                  )}

                  {activeTab === "railway" && (
                    <div className="space-y-4">
                      <p className="text-slate-400 text-sm">
                        Add this file as{" "}
                        <code className="bg-slate-700 px-1 rounded">railway.toml</code> in your
                        repository root.
                      </p>
                      <CodeBlock label="railway.toml" content={generated.railwayToml} />
                      <div className="bg-slate-900 rounded p-3 text-xs text-slate-400">
                        <p className="font-semibold text-slate-300 mb-1">Deploy to Railway:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>
                            Create a new project at{" "}
                            <a
                              href="https://railway.app"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline"
                            >
                              railway.app
                            </a>
                          </li>
                          <li>Connect your GitHub repository</li>
                          <li>Railway picks up settings from railway.toml automatically</li>
                          <li>Add your environment variables in the Railway dashboard</li>
                          <li>Deploy!</li>
                        </ol>
                      </div>
                    </div>
                  )}
                </div>

                {prResult ? (
                  <div className="mt-6 bg-green-900/50 border border-green-700 rounded-lg p-4">
                    <p className="text-green-400 font-semibold mb-1">✓ Pull Request Created!</p>
                    <p className="text-green-300 text-sm mb-3">
                      PR #{prResult.number}: {prResult.title}
                    </p>
                    <a
                      href={prResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary inline-block"
                    >
                      View Pull Request →
                    </a>
                  </div>
                ) : (
                  <div className="mt-6">
                    {prError && <p className="text-red-400 text-sm mb-3">{prError}</p>}
                    <button
                      type="button"
                      onClick={handleCreatePR}
                      disabled={isCreatingPR}
                      className="btn-primary w-full disabled:opacity-50"
                    >
                      {isCreatingPR ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          Creating Pull Request...
                        </span>
                      ) : (
                        "🚢 Create Pull Request"
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
