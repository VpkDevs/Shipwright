"use client";

import type { RepoAnalysis } from "@/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface GeneratedContent {
  vercelJson: string;
  packageJsonScripts: Record<string, string>;
  envTemplate: string;
  readme: string;
  landingPage: string;
}

interface PRResult {
  url: string;
  number: number;
  title: string;
}

export default function RepoPage() {
  const router = useRouter();
  const params = useParams();
  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(null);
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "readme" | "landing" | "config">(
    "overview"
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingPR, setIsCreatingPR] = useState(false);
  const [prResult, setPRResult] = useState<PRResult | null>(null);
  const [prError, setPRError] = useState("");

  const slug = params?.slug;
  const owner = Array.isArray(slug) ? slug[0] : slug;
  const repo = Array.isArray(slug) ? slug[1] : undefined;

  useEffect(() => {
    if (!owner || !repo) return;

    const analyze = async () => {
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
    };

    analyze();
  }, [owner, repo, router]);

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

  const handleCreatePR = async () => {
    if (!owner || !repo || !generated || isCreatingPR) return;

    setIsCreatingPR(true);
    setPRError("");

    const files: Array<{ path: string; content: string }> = [];

    if (generated.vercelJson) {
      files.push({ path: "vercel.json", content: generated.vercelJson });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <Link href="/repos" className="text-2xl font-bold text-blue-400">
              ← Back
            </Link>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
            <p className="text-slate-400">Analyzing repository...</p>
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
              ← Back
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
          <Link href="/repos" className="text-xl font-bold text-blue-400">
            ← {repo}
          </Link>
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
              <h2 className="text-lg font-semibold mb-4">Analysis</h2>

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
                      style={{
                        width: `${analysis.deploymentRiskScore}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {analysis.deploymentRiskScore}% risk
                  </p>
                </div>

                {analysis.missingConfigs.length > 0 && (
                  <div>
                    <p className="text-slate-500 text-xs mb-1">Missing Configs</p>
                    <ul className="text-xs text-slate-400 space-y-1">
                      {analysis.missingConfigs.map((config) => (
                        <li key={config}>• {config}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.envVarsDetected.length > 0 && (
                  <div>
                    <p className="text-slate-500 text-xs mb-1">Environment Variables</p>
                    <ul className="text-xs text-slate-400 space-y-1">
                      {analysis.envVarsDetected.map((env) => (
                        <li key={env}>• {env}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !!generated}
                className="btn-primary w-full mt-6 disabled:opacity-50"
              >
                {isGenerating ? "Generating..." : generated ? "Generated ✓" : "Generate Content"}
              </button>
            </div>
          </div>

          {/* Right: Content Preview */}
          <div className="md:col-span-2">
            {!generated ? (
              <div className="card text-center py-12">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-slate-400 mb-4">
                  Click &quot;Generate Content&quot; to create deployment configs, README, and
                  landing page.
                </p>
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-6 border-b border-slate-700">
                  {(["overview", "readme", "landing", "config"] as const).map((tab) => (
                    <button
                      type="button"
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

                <div className="card">
                  {activeTab === "overview" && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm text-slate-500 mb-2">Vercel Config</h3>
                        <pre className="bg-slate-900 p-3 rounded text-xs overflow-x-auto text-green-400">
                          {generated.vercelJson || "Not applicable for this framework"}
                        </pre>
                      </div>
                      <div>
                        <h3 className="text-sm text-slate-500 mb-2">Environment Template</h3>
                        <pre className="bg-slate-900 p-3 rounded text-xs overflow-x-auto text-slate-300">
                          {generated.envTemplate}
                        </pre>
                      </div>
                    </div>
                  )}

                  {activeTab === "readme" && (
                    <div className="prose prose-invert max-w-none text-sm">
                      <pre className="bg-slate-900 p-3 rounded text-xs overflow-x-auto text-slate-300 max-h-96 whitespace-pre-wrap">
                        {generated.readme}
                      </pre>
                    </div>
                  )}

                  {activeTab === "landing" && (
                    <div className="space-y-4">
                      <p className="text-slate-400 text-sm">
                        Landing page HTML — will be saved as{" "}
                        <code className="bg-slate-700 px-1 rounded">landing/index.html</code>
                      </p>
                      <pre className="bg-slate-900 p-3 rounded text-xs overflow-x-auto text-slate-300 max-h-96">
                        {generated.landingPage.substring(0, 1000)}
                        {generated.landingPage.length > 1000 ? "\n... (truncated)" : ""}
                      </pre>
                    </div>
                  )}

                  {activeTab === "config" && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm text-slate-500 mb-2">Suggested Scripts</h3>
                        {Object.keys(generated.packageJsonScripts).length > 0 ? (
                          <pre className="bg-slate-900 p-3 rounded text-xs overflow-x-auto text-blue-400">
                            {JSON.stringify(generated.packageJsonScripts, null, 2)}
                          </pre>
                        ) : (
                          <p className="text-slate-400 text-sm">
                            No missing scripts detected — your package.json already has the required
                            scripts.
                          </p>
                        )}
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
                      {isCreatingPR ? "Creating Pull Request..." : "🚢 Create Pull Request"}
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
