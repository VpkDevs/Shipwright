import type { RepoAnalysis, AgentResult, AgentStep } from "@/types";
import { RepoAnalyzer } from "@/lib/analyzer";
import { runOpenAIAgent } from "./openai-agent";
import { runBlackboxAgent } from "./blackbox-agent";
import { generateReadme } from "@/lib/generators/readme";
import { generateEnvTemplate } from "@/lib/generators/env-template";
import {
  generateVercelJsonFile,
  generatePackageJsonScripts,
} from "@/lib/generators/vercel-config";

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export interface OrchestratorOptions {
  owner: string;
  repo: string;
  githubToken: string;
  description?: string;
  /** Called on each agent step for real-time UI updates */
  onStep?: (step: AgentStep) => void;
}

/**
 * Main agentic orchestrator.
 *
 * Workflow:
 * 1. Static analysis (RepoAnalyzer — free, no API cost)
 * 2. Blackbox AI — code analysis + vercel config + env template
 * 3. OpenAI GPT-4o-mini — README + landing page copy + recommendations
 * 4. Merge results, fall back to templates if any AI step fails
 */
export async function runOrchestrator(
  options: OrchestratorOptions
): Promise<AgentResult> {
  const { owner, repo, githubToken, description, onStep } = options;

  const steps: AgentStep[] = [];
  let stepCounter = 0;

  const addStep = (label: string, status: AgentStep["status"] = "running", detail?: string): AgentStep => {
    const step: AgentStep = {
      id: String(++stepCounter),
      label,
      status,
      detail,
    };
    steps.push(step);
    onStep?.(step);
    return step;
  };

  const completeStep = (step: AgentStep, detail?: string) => {
    step.status = "done";
    if (detail) step.detail = detail;
    onStep?.(step);
  };

  const failStep = (step: AgentStep, detail: string) => {
    step.status = "error";
    step.detail = detail;
    onStep?.(step);
  };

  // ── Step 1: Static Analysis ──────────────────────────────────────────────
  const analysisStep = addStep("Analyzing repository structure");

  let analysis: RepoAnalysis;
  try {
    const analyzer = new RepoAnalyzer(githubToken);
    analysis = await analyzer.analyze(owner, repo);
    completeStep(analysisStep, `${analysis.framework} · Risk: ${analysis.deploymentRiskScore}%`);
  } catch (err) {
    failStep(analysisStep, String(err));
    throw new Error(`Repository analysis failed: ${String(err)}`);
  }

  // ── Step 2: Blackbox AI — Code Analysis & Config Generation ─────────────
  const blackboxStep = addStep("Blackbox AI: Deep code analysis");

  let blackboxResult = null;
  try {
    blackboxResult = await runBlackboxAgent(
      owner,
      repo,
      analysis,
      githubToken,
      (label, detail) => {
        blackboxStep.label = label;
        if (detail) blackboxStep.detail = detail;
        onStep?.(blackboxStep);
      }
    );
    completeStep(blackboxStep, "Config & env template generated");
  } catch (err) {
    failStep(blackboxStep, `Falling back to templates: ${String(err)}`);
  }

  // ── Step 3: OpenAI — README & Landing Page ───────────────────────────────
  const openaiStep = addStep("OpenAI: Generating README & landing page");

  let openaiResult = null;
  try {
    openaiResult = await runOpenAIAgent(
      owner,
      repo,
      analysis,
      githubToken,
      (label, detail) => {
        openaiStep.label = label;
        if (detail) openaiStep.detail = detail;
        onStep?.(openaiStep);
      }
    );
    completeStep(openaiStep, "README & landing page ready");
  } catch (err) {
    failStep(openaiStep, `Falling back to templates: ${String(err)}`);
  }

  // ── Step 4: Merge Results ────────────────────────────────────────────────
  const mergeStep = addStep("Assembling final output");

  // Determine which provider was used
  const provider =
    openaiResult && blackboxResult
      ? "openai"
      : openaiResult
        ? "openai"
        : blackboxResult
          ? "blackbox"
          : "template";

  // README: prefer OpenAI, fall back to template
  const aiReadme =
    openaiResult?.readme ||
    generateReadme(repo, analysis, description);

  // Landing page: build from OpenAI copy or fall back to template
  const aiLandingPage = buildLandingPage(
    repo,
    analysis,
    openaiResult?.landingPageCopy,
    description
  );

  // Vercel config: prefer Blackbox AI, fall back to static generator
  const vercelJson =
    blackboxResult?.vercelConfig ||
    generateVercelJsonFile(analysis);

  // Env template: prefer Blackbox AI, fall back to static generator
  const envTemplate =
    blackboxResult?.envTemplate ||
    generateEnvTemplate(analysis);

  // Package scripts: prefer Blackbox AI suggestions, fall back to static
  const packageJsonScripts =
    Object.keys(blackboxResult?.suggestedScripts || {}).length > 0
      ? blackboxResult!.suggestedScripts
      : generatePackageJsonScripts(analysis);

  // Deployment recommendations
  const deploymentRecommendations =
    openaiResult?.deploymentRecommendations ||
    buildDefaultRecommendations(analysis);

  completeStep(mergeStep, `Generated via ${provider}`);

  return {
    analysis,
    aiReadme,
    aiLandingPage,
    vercelJson,
    packageJsonScripts,
    envTemplate,
    deploymentRecommendations,
    steps,
    provider,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface LandingCopy {
  headline?: string;
  subheadline?: string;
  features?: string[];
}

function buildLandingPage(
  repoName: string,
  analysis: RepoAnalysis,
  landingPageCopyJson?: string,
  description?: string
): string {
  let copy: LandingCopy = {};

  if (landingPageCopyJson) {
    try {
      copy = JSON.parse(landingPageCopyJson) as LandingCopy;
    } catch {
      // ignore parse errors
    }
  }

  const headline = copy.headline || repoName;
  const subheadline =
    copy.subheadline || description || analysis.description;
  const features = copy.features || [
    "Fast and performant",
    "Production ready",
    "Easy to deploy",
  ];

  // Build an enhanced landing page with AI copy
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${repoName}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh}
    header{background:rgba(0,0,0,.5);backdrop-filter:blur(10px);color:#fff;padding:1rem 0;position:sticky;top:0;z-index:100}
    nav{max-width:1200px;margin:0 auto;padding:0 2rem;display:flex;justify-content:space-between;align-items:center}
    nav h1{font-size:1.5rem;font-weight:700}
    .hero{max-width:1200px;margin:0 auto;padding:6rem 2rem;text-align:center;color:#fff}
    .hero h1{font-size:3.5rem;margin-bottom:1rem;font-weight:700}
    .hero p{font-size:1.25rem;margin-bottom:2rem;opacity:.9;max-width:600px;margin-left:auto;margin-right:auto}
    .badge{display:inline-block;background:rgba(255,255,255,.2);color:#fff;padding:.25rem .75rem;border-radius:9999px;font-size:.875rem;margin:.25rem}
    .cta{display:flex;gap:1rem;justify-content:center;margin-top:2rem;flex-wrap:wrap}
    .btn{padding:.75rem 2rem;font-size:1rem;border:none;border-radius:.5rem;cursor:pointer;font-weight:600;transition:all .3s;text-decoration:none;display:inline-block}
    .btn-primary{background:#fff;color:#667eea}
    .btn-primary:hover{transform:translateY(-2px);box-shadow:0 10px 20px rgba(0,0,0,.2)}
    .btn-secondary{background:transparent;color:#fff;border:2px solid #fff}
    .btn-secondary:hover{background:#fff;color:#667eea}
    .features{background:#fff;padding:4rem 2rem}
    .features-container{max-width:1200px;margin:0 auto}
    .features h2{text-align:center;font-size:2.5rem;margin-bottom:3rem;color:#333}
    .features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:2rem}
    .feature-card{padding:2rem;background:#f8f9fa;border-radius:.5rem;box-shadow:0 4px 6px rgba(0,0,0,.1)}
    .feature-card h3{font-size:1.25rem;margin-bottom:.75rem;color:#667eea}
    .tech-stack{background:#f8f9fa;padding:2rem;border-radius:.5rem;margin:2rem 0;text-align:center}
    footer{background:rgba(0,0,0,.5);color:#fff;text-align:center;padding:2rem;margin-top:4rem}
  </style>
</head>
<body>
  <header>
    <nav>
      <h1>${repoName}</h1>
      <div>
        <a href="#features" style="color:#fff;text-decoration:none;margin-left:2rem">Features</a>
        <a href="#tech" style="color:#fff;text-decoration:none;margin-left:2rem">Tech</a>
      </div>
    </nav>
  </header>
  <section class="hero">
    <h1>${headline}</h1>
    <p>${subheadline}</p>
    <div>
      <span class="badge">${analysis.framework}</span>
      <span class="badge">${analysis.packageManager}</span>
      <span class="badge">${analysis.backendType}</span>
      ${analysis.hasDocker ? '<span class="badge">Docker</span>' : ""}
    </div>
    <div class="cta">
      <a href="https://github.com/${repoName}" class="btn btn-primary">View on GitHub</a>
      <a href="#features" class="btn btn-secondary">Learn More</a>
    </div>
  </section>
  <section class="features">
    <div class="features-container">
      <h2 id="features">Features</h2>
      <div class="features-grid">
        ${features
          .map(
            (f, i) => `
        <div class="feature-card">
          <h3>${["⚡", "🔧", "📦"][i] || "✨"} ${f}</h3>
          <p>Built with modern best practices for production environments.</p>
        </div>`
          )
          .join("")}
      </div>
      <div id="tech" class="tech-stack">
        <h3 style="margin-bottom:1rem;color:#333">Tech Stack</h3>
        <span class="badge" style="background:#667eea">${analysis.framework}</span>
        <span class="badge" style="background:#667eea">${analysis.packageManager}</span>
        <span class="badge" style="background:#667eea">${analysis.backendType}</span>
        ${analysis.hasDocker ? '<span class="badge" style="background:#667eea">Docker</span>' : ""}
      </div>
    </div>
  </section>
  <footer>
    <p>&copy; 2024 ${repoName}. Shipped with <a href="https://shipwright.dev" style="color:#a78bfa">Shipwright</a>.</p>
  </footer>
</body>
</html>`;
}

function buildDefaultRecommendations(analysis: RepoAnalysis): string[] {
  const recs: string[] = [];

  if (analysis.missingConfigs.includes("build script")) {
    recs.push(`Add a build script to package.json: "build": "${analysis.framework === "Next.js" ? "next build" : "vite build"}"`);
  }
  if (analysis.envVarsDetected.length > 0) {
    recs.push(`Configure ${analysis.envVarsDetected.length} environment variable(s) in your deployment platform`);
  }
  if (!analysis.hasDocker) {
    recs.push("Consider adding a Dockerfile for containerized deployments");
  }
  if (analysis.deploymentRiskScore > 50) {
    recs.push("High risk score detected — review missing configurations before deploying");
  }

  while (recs.length < 3) {
    const defaults = [
      `Set NODE_ENV=production in your deployment environment`,
      `Enable automatic deployments from your main branch`,
      `Configure health check endpoints for production monitoring`,
    ];
    recs.push(defaults[recs.length]);
  }

  return recs.slice(0, 3);
}
