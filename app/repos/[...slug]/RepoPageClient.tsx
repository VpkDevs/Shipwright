"use client";

import { trackEvent } from "@/lib/analytics";
import { useToast } from "@/lib/toast";
import { formatRelative } from "@/lib/utils";
import type { AgentStep, PaymentStatus, RepoAnalysis } from "@/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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
  githubActionsWorkflow: string;
  steps: AgentStep[];
  provider: "openai" | "blackbox" | "template";
  creditsRemaining: number | null;
  plan: "pro" | "credit";
  isAI: true;
}

type GeneratedContent = TemplateContent | AIContent;

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function downloadTextFile(
  fileName: string,
  content: string,
  mimeType = "text/plain;charset=utf-8"
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function getRiskMeta(score: number) {
  if (score < 30) {
    return {
      label: "Low risk",
      summary: "This repo looks close to deployable.",
      barClass: "bg-green-500",
      badgeClass: "border border-green-500/30 bg-green-500/10 text-green-300",
    };
  }

  if (score < 60) {
    return {
      label: "Medium risk",
      summary: "A few deployment gaps should be fixed before shipping.",
      barClass: "bg-yellow-500",
      badgeClass: "border border-yellow-500/30 bg-yellow-500/10 text-yellow-200",
    };
  }

  return {
    label: "High risk",
    summary: "Shipwright found several issues worth resolving first.",
    barClass: "bg-red-500",
    badgeClass: "border border-red-500/30 bg-red-500/10 text-red-200",
  };
}

function getRecommendedNextSteps(analysis: RepoAnalysis): string[] {
  const steps: string[] = [];

  if (analysis.missingConfigs.includes("build script")) {
    steps.push("Add a reliable build script so deployments can produce a production bundle.");
  }

  if (analysis.missingConfigs.includes("start script")) {
    steps.push("Add a start script so the deployed service has a clear runtime entrypoint.");
  }

  if (analysis.missingConfigs.includes("deployment config")) {
    steps.push("Add deployment config or Docker so the runtime, build, and output are explicit.");
  }

  if (analysis.missingConfigs.includes(".env.example")) {
    steps.push(
      "Create an .env.example file so teammates and deployments know which secrets are required."
    );
  }

  if (analysis.envVarsDetected.length > 0) {
    steps.push(
      `Review ${analysis.envVarsDetected.length} detected environment variable${analysis.envVarsDetected.length === 1 ? "" : "s"} before shipping.`
    );
  }

  if (steps.length === 0) {
    steps.push(
      "Generate a preview to inspect the suggested README, env template, and deployment config."
    );
    steps.push(
      "If the output looks good, use AI Ship to generate repo-aware content and create a PR."
    );
  }

  return steps.slice(0, 3);
}

export default function RepoPage() {
  const router = useRouter();
  const params = useParams();

  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(null);
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "readme" | "landing" | "config" | "cicd">(
    "overview"
  );
  const [showLandingPreview, setShowLandingPreview] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const toast = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isShipping, setIsShipping] = useState(false);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [isCreatingPR, setIsCreatingPR] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [showAllMissingConfigs, setShowAllMissingConfigs] = useState(false);
  const [showAllEnvVars, setShowAllEnvVars] = useState(false);

  const slug = params?.slug;
  const owner = Array.isArray(slug) ? slug[0] : slug;
  const repo = Array.isArray(slug) ? slug[1] : undefined;

  const copyText = useCallback(
    async (value: string, section: string) => {
      try {
        await navigator.clipboard.writeText(value);
        setCopiedSection(section);
        toast("Copied to clipboard", "success");
        window.setTimeout(
          () => setCopiedSection((current) => (current === section ? null : current)),
          2000
        );
      } catch (error) {
        const msg = getErrorMessage(error, "Failed to copy to clipboard");
        setError(msg);
        toast(msg, "error");
      }
    },
    [toast]
  );

  const downloadLandingPage = useCallback(() => {
    if (!generated) return;
    const html = generated.isAI ? generated.aiLandingPage : generated.landingPage;
    downloadTextFile(`${repo || "shipwright"}-landing-page.html`, html, "text/html;charset=utf-8");
  }, [generated, repo]);

  const downloadReadme = useCallback(() => {
    if (!generated) return;
    downloadTextFile(
      "README.md",
      generated.isAI ? generated.aiReadme : generated.readme,
      "text/markdown;charset=utf-8"
    );
  }, [generated]);

  // Check payment status
  const fetchPaymentStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/credits");
      if (res.ok) {
        const data = (await res.json()) as PaymentStatus;
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

        const data = (await analyzeRes.json()) as RepoAnalysis;
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
    setPrUrl(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo }),
      });
      if (!res.ok) {
        const errData = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errData?.error || "Failed to generate");
      }
      const data = (await res.json()) as TemplateContent;
      setGenerated({ ...data, isAI: false });
      setShowLandingPreview(false);
      setActiveTab("readme");
      toast("Template generated", "success");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to generate template content"));
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
    setPrUrl(null);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo }),
      });

      if (res.status === 402) {
        // Payment required — redirect to pricing
        await trackEvent({
          name: "repo_paywall_clicked",
          properties: {
            source: "agent_402_redirect",
            repo: `${owner}/${repo}`,
          },
        });
        router.push("/pricing");
        return;
      }

      if (!res.ok) {
        const errData = (await res.json()) as { error?: string };
        throw new Error(errData.error || "AI generation failed");
      }

      const data = (await res.json()) as Omit<AIContent, "isAI">;
      setGenerated({ ...data, isAI: true });
      setAgentSteps(data.steps || []);
      setShowLandingPreview(true);
      setActiveTab("readme");
      toast("AI generation complete", "success");

      // Refresh payment status
      await fetchPaymentStatus();
    } catch (err) {
      setError(getErrorMessage(err, "AI generation failed"));
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
    const landingPage = generated.isAI
      ? generated.aiLandingPage
      : (generated as TemplateContent).landingPage;
    const vercelJson = generated.vercelJson;
    const envTemplate = generated.envTemplate;
    const githubActionsWorkflow = aiContent?.githubActionsWorkflow || "";
    const recommendations = generated.isAI
      ? generated.deploymentRecommendations.map((item, index) => `${index + 1}. ${item}`).join("\n")
      : "";

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
            ...(githubActionsWorkflow
              ? [{ path: ".github/workflows/deploy.yml", content: githubActionsWorkflow }]
              : []),
            { path: "shipwright/landing-page.html", content: landingPage },
            ...(recommendations
              ? [
                  {
                    path: "shipwright/deployment-recommendations.md",
                    content: `# Deployment Recommendations\n\n${recommendations}\n`,
                  },
                ]
              : []),
          ],
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { url?: string };
        if (data.url) {
          setPrUrl(data.url);
          toast("Pull request created", "success");
        }
      } else {
        throw new Error("Failed to create PR");
      }
    } catch (err) {
      const msg = getErrorMessage(
        err,
        "PR creation failed — you can manually copy the files above."
      );
      setError(msg);
      toast(msg, "error");
      console.error(err);
    } finally {
      setIsCreatingPR(false);
    }
  };

  const hasPayment = paymentStatus && (paymentStatus.plan === "pro" || paymentStatus.credits > 0);
  const riskMeta = analysis ? getRiskMeta(analysis.deploymentRiskScore) : null;
  const recommendedNextSteps = analysis ? getRecommendedNextSteps(analysis) : [];
  const visibleMissingConfigs = analysis
    ? showAllMissingConfigs
      ? analysis.missingConfigs
      : analysis.missingConfigs.slice(0, 4)
    : [];
  const visibleEnvVars = analysis
    ? showAllEnvVars
      ? analysis.envVarsDetected
      : analysis.envVarsDetected.slice(0, 4)
    : [];

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
        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
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
          <div className="flex items-center gap-4">
            <Link href="/repos" className="text-xl font-bold text-blue-400">
              ← {repo}
            </Link>
            {analysis.updatedAt && (
              <span className="hidden text-xs text-slate-400 sm:inline">
                Updated {formatRelative(analysis.updatedAt)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <a
              href={analysis.htmlUrl || `https://github.com/${owner}/${repo}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors text-sm"
            >
              GitHub
            </a>
            {paymentStatus?.plan === "pro" && (
              <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full font-semibold">
                PRO
              </span>
            )}
            {paymentStatus?.plan === "credit" && (
              <span className="text-xs bg-green-700 text-white px-2 py-1 rounded-full font-semibold">
                {paymentStatus.credits} credit{paymentStatus.credits !== 1 ? "s" : ""}
              </span>
            )}
            <a
              href="/api/auth/signout"
              className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors text-sm"
            >
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
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Analysis</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Stack, blockers, and suggested next steps.
                  </p>
                </div>
                {riskMeta && (
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${riskMeta.badgeClass}`}
                  >
                    {riskMeta.label}
                  </span>
                )}
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 space-y-3">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Deployment readiness
                    </p>
                    <p className="text-2xl font-semibold text-white">
                      {100 - analysis.deploymentRiskScore}%
                    </p>
                  </div>
                  <p className="text-right text-xs text-slate-400 max-w-[13rem]">
                    {riskMeta?.summary}
                  </p>
                </div>
                <div className="w-full rounded-full bg-slate-700 h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${riskMeta?.barClass ?? "bg-blue-500"}`}
                    style={{ width: `${100 - analysis.deploymentRiskScore}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                    <p className="text-slate-500">Config blockers</p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {analysis.missingConfigs.length}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                    <p className="text-slate-500">Env vars found</p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {analysis.envVarsDetected.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-slate-700/80 bg-slate-900/50 p-3">
                  <p className="text-slate-500 text-xs">Framework</p>
                  <p className="mt-1 font-semibold text-blue-400">{analysis.framework}</p>
                </div>
                <div className="rounded-lg border border-slate-700/80 bg-slate-900/50 p-3">
                  <p className="text-slate-500 text-xs">Package Manager</p>
                  <p className="mt-1 font-semibold">{analysis.packageManager}</p>
                </div>
                <div className="rounded-lg border border-slate-700/80 bg-slate-900/50 p-3 col-span-2">
                  <p className="text-slate-500 text-xs">Backend</p>
                  <p className="mt-1 font-semibold">{analysis.backendType}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-slate-700 px-2.5 py-1 text-slate-300">
                  {analysis.usesTypeScript
                    ? "TypeScript detected"
                    : "No TypeScript config detected"}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 ${
                    analysis.hasDocker
                      ? "border-green-500/30 bg-green-500/10 text-green-300"
                      : "border-slate-700 text-slate-400"
                  }`}
                >
                  {analysis.hasDocker ? "Docker present" : "No Dockerfile detected"}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-slate-500 text-xs uppercase tracking-wide">Ship blockers</p>
                    <span className="text-xs text-slate-400">
                      {analysis.missingConfigs.length === 0
                        ? "None"
                        : `${analysis.missingConfigs.length} found`}
                    </span>
                  </div>
                  {analysis.missingConfigs.length > 0 ? (
                    <>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {visibleMissingConfigs.map((c) => (
                          <li key={c} className="flex items-start gap-2">
                            <span className="mt-0.5 text-amber-300">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                      {analysis.missingConfigs.length > visibleMissingConfigs.length && (
                        <button
                          type="button"
                          className="mt-2 text-xs text-blue-400 hover:underline"
                          onClick={() => setShowAllMissingConfigs(true)}
                        >
                          Show all blockers
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-green-300">No obvious config blockers detected.</p>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-slate-500 text-xs uppercase tracking-wide">
                      Environment variables
                    </p>
                    <span className="text-xs text-slate-400">
                      {analysis.envVarsDetected.length}
                    </span>
                  </div>
                  {analysis.envVarsDetected.length > 0 ? (
                    <>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {visibleEnvVars.map((envVar) => (
                          <li key={envVar} className="font-mono text-[11px] break-all">
                            {envVar}
                          </li>
                        ))}
                      </ul>
                      {analysis.envVarsDetected.length > visibleEnvVars.length && (
                        <button
                          type="button"
                          className="mt-2 text-xs text-blue-400 hover:underline"
                          onClick={() => setShowAllEnvVars(true)}
                        >
                          Show all environment variables
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-slate-400">
                      No environment variables were detected from the sampled repo files.
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-slate-700/80 bg-slate-900/40 p-3">
                  <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">
                    Recommended next steps
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {recommendedNextSteps.map((step) => (
                      <li key={step} className="flex items-start gap-2">
                        <span className="mt-0.5 text-blue-400">→</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4 space-y-3">
                {/* Free template preview */}
                <button
                  type="button"
                  onClick={handleTemplateGenerate}
                  disabled={isGenerating || isShipping}
                  className="btn-secondary w-full text-sm disabled:opacity-40"
                >
                  {isGenerating
                    ? "Generating..."
                    : generated
                      ? "Regenerate Template"
                      : "Preview (Free Template)"}
                </button>

                {/* AI Ship button */}
                {hasPayment ? (
                  <button
                    type="button"
                    onClick={handleAIShip}
                    disabled={isShipping || isGenerating}
                    className="btn-primary w-full disabled:opacity-50 relative"
                  >
                    {isShipping ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
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
                    onClick={() => {
                      void trackEvent({
                        name: "repo_paywall_clicked",
                        properties: {
                          source: "left_rail_cta",
                          repo: `${owner}/${repo}`,
                        },
                      });
                    }}
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

                {!hasPayment && (
                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-left">
                    <p className="text-xs uppercase tracking-[0.2em] text-blue-200">
                      Why people pay here
                    </p>
                    <ul className="mt-3 space-y-2 text-xs text-blue-50">
                      <li>• Repo-aware README and landing copy instead of generic placeholders.</li>
                      <li>
                        • Config, env template, and recommendations shaped by actual repo structure.
                      </li>
                      <li>• One-click PR creation for a clean handoff to teammates or clients.</li>
                    </ul>
                    <p className="mt-3 text-xs text-blue-100/90">
                      One credit is $5. Pro brings the effective cost down to about $0.50 per ship.
                      Failed AI runs do not consume credits.
                    </p>
                  </div>
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
                          <p
                            className={`${step.status === "done" ? "text-slate-300" : step.status === "error" ? "text-red-400" : "text-slate-400"}`}
                          >
                            {step.label}
                          </p>
                          {step.detail && <p className="text-slate-500 text-xs">{step.detail}</p>}
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
              <div className="card py-10">
                <div className="text-5xl mb-4">🚀</div>
                <h3 className="text-xl font-semibold mb-2 text-center">Ready to ship {repo}?</h3>
                <p className="text-slate-400 mb-6 max-w-2xl mx-auto text-sm text-center">
                  Start with a template preview, or use AI to generate production-quality configs,
                  README, and landing page based on your repo structure.
                </p>

                <div className="grid gap-3 sm:grid-cols-3 mb-6">
                  <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-left">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Detected stack</p>
                    <p className="mt-2 font-semibold text-blue-400">{analysis.framework}</p>
                    <p className="text-xs text-slate-400 mt-1">{analysis.backendType}</p>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-left">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Readiness</p>
                    <p className="mt-2 font-semibold text-white">{riskMeta?.label}</p>
                    <p className="text-xs text-slate-400 mt-1">{riskMeta?.summary}</p>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-left">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Top blockers</p>
                    <p className="mt-2 font-semibold text-white">
                      {analysis.missingConfigs.length}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {analysis.missingConfigs[0] ?? "No blockers detected"}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 mb-6 text-left">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">
                    What to do next
                  </p>
                  <ul className="space-y-2 text-sm text-slate-300">
                    {recommendedNextSteps.map((step) => (
                      <li key={step} className="flex items-start gap-2">
                        <span className="mt-0.5 text-blue-400">→</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-3 justify-center flex-wrap">
                  <button
                    type="button"
                    onClick={handleTemplateGenerate}
                    disabled={isGenerating}
                    className="btn-secondary text-sm"
                  >
                    {isGenerating ? "Generating..." : "Free Preview"}
                  </button>
                  <Link
                    href="/pricing"
                    className="btn-primary text-sm"
                    onClick={() => {
                      void trackEvent({
                        name: "repo_paywall_clicked",
                        properties: {
                          source: "empty_state_cta",
                          repo: `${owner}/${repo}`,
                        },
                      });
                    }}
                  >
                    Ship with AI from $5
                  </Link>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 text-left">
                  <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Free preview</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-300">
                      <li>• Generic README draft</li>
                      <li>• Generic landing page scaffold</li>
                      <li>• Fast way to inspect the workflow</li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
                    <p className="text-xs uppercase tracking-wide text-blue-200">AI Ship</p>
                    <ul className="mt-3 space-y-2 text-sm text-blue-50">
                      <li>• Repo-specific messaging based on your code</li>
                      <li>• Deployment recommendations and config improvements</li>
                      <li>• Pull request creation for immediate handoff</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* AI vs Template badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-2">
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
                    <button
                      type="button"
                      onClick={() => setActiveTab("cicd")}
                      className={`px-4 py-2 font-medium text-sm transition-colors flex items-center gap-1.5 ${
                        activeTab === "cicd"
                          ? "text-blue-400 border-b-2 border-blue-400"
                          : "text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      CI/CD
                      {!generated.isAI && (
                        <span className="text-[10px] bg-blue-600/30 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded-full font-bold">
                          AI
                        </span>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 hidden sm:inline">
                      {generated.isAI
                        ? prUrl
                          ? "Ready to open your PR"
                          : "Review the output, then create a PR"
                        : "Template preview ready"}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        generated.isAI ? "bg-blue-900 text-blue-300" : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {generated.isAI ? "✨ AI Generated" : "📋 Template"}
                    </span>
                  </div>
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
                          <div className="mb-2 flex justify-end">
                            <button
                              type="button"
                              className="text-xs text-blue-400 hover:underline"
                              onClick={() =>
                                copyText(
                                  generated.deploymentRecommendations.join("\n"),
                                  "recommendations"
                                )
                              }
                            >
                              {copiedSection === "recommendations"
                                ? "Copied"
                                : "Copy recommendations"}
                            </button>
                          </div>
                          <ul className="space-y-2">
                            {generated.deploymentRecommendations.map((rec) => (
                              <li
                                key={rec}
                                className="flex items-start gap-2 text-sm text-slate-300"
                              >
                                <span className="text-blue-400 mt-0.5">→</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="text-sm text-slate-500">Vercel Config</h3>
                          <button
                            type="button"
                            className="text-xs text-blue-400 hover:underline"
                            onClick={() => copyText(generated.vercelJson || "{}", "vercel")}
                          >
                            {copiedSection === "vercel" ? "Copied" : "Copy config"}
                          </button>
                        </div>
                        <pre className="bg-slate-900 p-3 rounded text-xs overflow-x-auto text-green-400 max-h-48">
                          {generated.vercelJson || "{}"}
                        </pre>
                      </div>
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="text-sm text-slate-500">Environment Template</h3>
                          <button
                            type="button"
                            className="text-xs text-blue-400 hover:underline"
                            onClick={() => copyText(generated.envTemplate, "env")}
                          >
                            {copiedSection === "env" ? "Copied" : "Copy env"}
                          </button>
                        </div>
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
                            This is a generic template. AI generation creates a README from your
                            actual code.
                          </p>
                          <Link
                            href="/pricing"
                            className="text-xs text-blue-400 hover:underline ml-4 whitespace-nowrap"
                            onClick={() => {
                              void trackEvent({
                                name: "repo_paywall_clicked",
                                properties: {
                                  source: "readme_upgrade_link",
                                  repo: `${owner}/${repo}`,
                                },
                              });
                            }}
                          >
                            Upgrade →
                          </Link>
                        </div>
                      )}
                      <div className="mb-3 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          className="text-xs text-blue-400 hover:underline"
                          onClick={downloadReadme}
                        >
                          Download README
                        </button>
                        <button
                          type="button"
                          className="text-xs text-blue-400 hover:underline"
                          onClick={() =>
                            copyText(
                              generated.isAI
                                ? generated.aiReadme
                                : (generated as TemplateContent).readme,
                              "readme"
                            )
                          }
                        >
                          {copiedSection === "readme" ? "Copied" : "Copy README"}
                        </button>
                      </div>
                      <pre className="bg-slate-900 p-3 rounded text-xs overflow-x-auto text-slate-300 max-h-96">
                        {generated.isAI
                          ? generated.aiReadme
                          : (generated as TemplateContent).readme}
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
                          <Link
                            href="/pricing"
                            className="text-xs text-blue-400 hover:underline ml-4 whitespace-nowrap"
                            onClick={() => {
                              void trackEvent({
                                name: "repo_paywall_clicked",
                                properties: {
                                  source: "landing_upgrade_link",
                                  repo: `${owner}/${repo}`,
                                },
                              });
                            }}
                          >
                            Upgrade →
                          </Link>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-slate-400 text-sm">Landing page HTML:</p>
                        <button
                          type="button"
                          className="text-xs text-blue-400 hover:underline"
                          onClick={() => setShowLandingPreview((f) => !f)}
                        >
                          {showLandingPreview ? "Show code" : "Show preview"}
                        </button>
                        <button
                          type="button"
                          className="text-xs text-blue-400 hover:underline"
                          onClick={() =>
                            copyText(
                              generated.isAI
                                ? generated.aiLandingPage
                                : (generated as TemplateContent).landingPage,
                              "landing"
                            )
                          }
                        >
                          {copiedSection === "landing" ? "Copied" : "Copy HTML"}
                        </button>
                        <button
                          type="button"
                          className="text-xs text-blue-400 hover:underline"
                          onClick={downloadLandingPage}
                        >
                          Download HTML
                        </button>
                      </div>
                      {showLandingPreview ? (
                        <iframe
                          title="Landing page preview"
                          className="w-full h-64 border"
                          srcDoc={
                            generated.isAI
                              ? generated.aiLandingPage
                              : (generated as TemplateContent).landingPage
                          }
                          sandbox="allow-scripts allow-same-origin"
                        />
                      ) : (
                        <pre className="text-xs overflow-x-auto text-slate-300 max-h-96">
                          {(generated.isAI
                            ? generated.aiLandingPage
                            : (generated as TemplateContent).landingPage
                          ).substring(0, 800)}
                          ...
                        </pre>
                      )}
                    </div>
                  )}

                  {activeTab === "cicd" && (
                    <div>
                      {generated.isAI && generated.githubActionsWorkflow ? (
                        <>
                          <div className="mb-3 flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-semibold text-white">
                                GitHub Actions CI/CD Workflow
                              </h3>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Save as{" "}
                                <span className="font-mono text-blue-300">
                                  .github/workflows/deploy.yml
                                </span>
                              </p>
                            </div>
                            <div className="flex gap-3">
                              <button
                                type="button"
                                className="text-xs text-blue-400 hover:underline"
                                onClick={() => copyText(generated.githubActionsWorkflow, "cicd")}
                              >
                                {copiedSection === "cicd" ? "Copied" : "Copy YAML"}
                              </button>
                              <button
                                type="button"
                                className="text-xs text-blue-400 hover:underline"
                                onClick={() =>
                                  downloadTextFile(
                                    "deploy.yml",
                                    generated.githubActionsWorkflow,
                                    "text/yaml;charset=utf-8"
                                  )
                                }
                              >
                                Download
                              </button>
                            </div>
                          </div>
                          <div className="mb-3 rounded-lg border border-blue-500/20 bg-blue-950/20 px-3 py-2 text-xs text-blue-200">
                            Add <span className="font-mono font-bold">VERCEL_TOKEN</span>,{" "}
                            <span className="font-mono font-bold">VERCEL_ORG_ID</span>, and{" "}
                            <span className="font-mono font-bold">VERCEL_PROJECT_ID</span> to{" "}
                            <strong>GitHub → Settings → Secrets → Actions</strong> to activate this
                            workflow.
                          </div>
                          <pre className="bg-slate-900 p-3 rounded text-xs overflow-x-auto text-green-300 max-h-[32rem] leading-relaxed">
                            {generated.githubActionsWorkflow}
                          </pre>
                        </>
                      ) : (
                        <div className="text-center py-10">
                          <div className="text-4xl mb-4">🔄</div>
                          <h3 className="text-lg font-semibold text-white mb-2">
                            GitHub Actions CI/CD Workflow
                          </h3>
                          <p className="text-slate-400 text-sm mb-2 max-w-sm mx-auto">
                            AI Ship generates a{" "}
                            <span className="font-mono text-blue-300">
                              .github/workflows/deploy.yml
                            </span>{" "}
                            tailored to your{" "}
                            <span className="text-white font-medium">{analysis.framework}</span>{" "}
                            stack and{" "}
                            <span className="text-white font-medium">
                              {analysis.packageManager}
                            </span>{" "}
                            package manager.
                          </p>
                          <div className="my-6 rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-left max-w-sm mx-auto">
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                              What you'd get
                            </p>
                            <ul className="space-y-1.5 text-xs text-slate-300">
                              <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-0.5">•</span>
                                Build job with{" "}
                                <span className="font-mono text-blue-300">
                                  {analysis.packageManager} install
                                </span>{" "}
                                + build
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-0.5">•</span>
                                Deploy job that runs only on{" "}
                                <span className="font-mono text-blue-300">main</span>/
                                <span className="font-mono text-blue-300">master</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-0.5">•</span>
                                Vercel CLI deployment with production flag
                              </li>
                              {analysis.envVarsDetected.length > 0 && (
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-400 mt-0.5">•</span>
                                  {analysis.envVarsDetected.length} env var
                                  {analysis.envVarsDetected.length !== 1 ? "s" : ""} pre-wired as
                                  GitHub Secrets
                                </li>
                              )}
                            </ul>
                          </div>
                          <Link
                            href="/pricing"
                            className="btn-primary text-sm inline-block"
                            onClick={() => {
                              void trackEvent({
                                name: "repo_paywall_clicked",
                                properties: {
                                  source: "cicd_tab_upgrade",
                                  repo: `${owner}/${repo}`,
                                },
                              });
                            }}
                          >
                            🚀 Ship with AI — $5
                          </Link>
                          <p className="text-xs text-slate-500 mt-3">
                            Includes CI/CD workflow, AI README, landing page, and one-click PR
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "config" && (
                    <div className="space-y-4">
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="text-sm text-slate-500">Package.json Scripts</h3>
                          <button
                            type="button"
                            className="text-xs text-blue-400 hover:underline"
                            onClick={() =>
                              copyText(
                                JSON.stringify(generated.packageJsonScripts, null, 2),
                                "scripts"
                              )
                            }
                          >
                            {copiedSection === "scripts" ? "Copied" : "Copy scripts"}
                          </button>
                        </div>
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
                              <span className="ml-4">
                                Credits remaining:{" "}
                                <span className="text-green-400">{generated.creditsRemaining}</span>
                              </span>
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
                    type="button"
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
                    <Link
                      href="/pricing"
                      className="text-blue-400 hover:underline"
                      onClick={() => {
                        void trackEvent({
                          name: "repo_paywall_clicked",
                          properties: {
                            source: "pr_upgrade_link",
                            repo: `${owner}/${repo}`,
                          },
                        });
                      }}
                    >
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
