import type { RepoAnalysis } from "@/types";
import { GitHubClient } from "@/lib/github";

const BLACKBOX_API_URL = "https://api.blackbox.ai/api/chat";
const BLACKBOX_MODEL = "blackboxai";

// ─── Blackbox API Client ──────────────────────────────────────────────────────

interface BlackboxMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface BlackboxResponse {
  choices?: Array<{
    message?: { content?: string };
    delta?: { content?: string };
  }>;
  // Blackbox sometimes returns plain text
  response?: string;
}

async function callBlackbox(
  messages: BlackboxMessage[],
  maxTokens = 1500
): Promise<string> {
  const apiKey = process.env.BLACKBOX_API_KEY;
  if (!apiKey) throw new Error("BLACKBOX_API_KEY is not set");

  const response = await fetch(BLACKBOX_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: BLACKBOX_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.4,
      stream: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Blackbox API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as BlackboxResponse;

  // Handle different response formats
  if (data.choices?.[0]?.message?.content) {
    return data.choices[0].message.content;
  }
  if (data.response) {
    return data.response;
  }

  throw new Error("Unexpected Blackbox API response format");
}

// ─── Main Agent ───────────────────────────────────────────────────────────────

export interface BlackboxAgentResult {
  /** Detailed code-aware analysis */
  codeInsights: string;
  /** Generated vercel.json content */
  vercelConfig: string;
  /** Generated .env.example content */
  envTemplate: string;
  /** Deployment risk assessment */
  riskAssessment: string;
  /** Suggested package.json scripts */
  suggestedScripts: Record<string, string>;
}

export async function runBlackboxAgent(
  owner: string,
  repo: string,
  analysis: RepoAnalysis,
  githubToken: string,
  onStep?: (label: string, detail?: string) => void
): Promise<BlackboxAgentResult> {
  const github = new GitHubClient(githubToken);

  // Step 1: Gather repo context (read key files)
  onStep?.("Blackbox AI: Reading repository", "Fetching key files");

  const fileTree = await github.getFileTree(owner, repo, 1);
  const fileList = fileTree.map((f) => f.path).join("\n");

  // Read package.json for deep analysis
  const packageJsonContent = await github.getFileContent(owner, repo, "package.json");

  // Try to read main entry point
  const entryFiles = ["src/index.ts", "src/index.js", "index.ts", "index.js", "src/app.ts", "src/main.ts"];
  let entryContent = "";
  for (const file of entryFiles) {
    const content = await github.getFileContent(owner, repo, file);
    if (content) {
      entryContent = content.slice(0, 2000);
      break;
    }
  }

  // Step 2: Code analysis
  onStep?.("Blackbox AI: Analyzing code", "Deep dependency analysis");

  const analysisPrompt = `You are a senior DevOps engineer analyzing a GitHub repository for deployment readiness.

Repository: ${owner}/${repo}
Framework: ${analysis.framework}
Package Manager: ${analysis.packageManager}
Backend: ${analysis.backendType}
Has Docker: ${analysis.hasDocker}
Detected env vars: ${analysis.envVarsDetected.join(", ") || "none"}
Missing configs: ${analysis.missingConfigs.join(", ") || "none"}
Risk score: ${analysis.deploymentRiskScore}/100

File structure:
${fileList.slice(0, 1000)}

${packageJsonContent ? `package.json:\n${packageJsonContent.slice(0, 1500)}` : ""}

${entryContent ? `Main entry file:\n${entryContent}` : ""}

Provide a JSON response with exactly this structure:
{
  "codeInsights": "2-3 sentences about the codebase quality and deployment readiness",
  "riskAssessment": "specific risks and how to mitigate them",
  "suggestedScripts": { "build": "...", "start": "...", "dev": "..." }
}`;

  let codeInsights = "";
  let riskAssessment = "";
  let suggestedScripts: Record<string, string> = {};

  try {
    const analysisResponse = await callBlackbox([
      { role: "user", content: analysisPrompt },
    ]);

    const parsed = extractJSON(analysisResponse);
    if (parsed) {
      codeInsights = typeof parsed.codeInsights === "string" ? parsed.codeInsights : "";
      riskAssessment = typeof parsed.riskAssessment === "string" ? parsed.riskAssessment : "";
      suggestedScripts =
        parsed.suggestedScripts &&
        typeof parsed.suggestedScripts === "object" &&
        !Array.isArray(parsed.suggestedScripts)
          ? (parsed.suggestedScripts as Record<string, string>)
          : {};
    } else {
      codeInsights = analysisResponse.slice(0, 300);
    }
  } catch (err) {
    onStep?.("Blackbox AI: Analysis warning", String(err));
    codeInsights = `${analysis.framework} project analyzed. ${analysis.missingConfigs.length > 0 ? "Some configurations are missing." : "Configuration looks good."}`;
  }

  // Step 3: Generate Vercel config
  onStep?.("Blackbox AI: Generating Vercel config", "Creating deployment config");

  const vercelPrompt = `Generate a production-ready vercel.json for this project:
Framework: ${analysis.framework}
Build script: ${analysis.buildScript || "npm run build"}
Env vars: ${analysis.envVarsDetected.join(", ") || "none"}

Return ONLY valid JSON for vercel.json, no explanation.`;

  let vercelConfig = "";
  try {
    const vercelResponse = await callBlackbox([
      { role: "user", content: vercelPrompt },
    ], 500);

    // Extract JSON from response
    const jsonMatch = vercelResponse.match(/\{[\s\S]*\}/);
    vercelConfig = jsonMatch ? jsonMatch[0] : generateDefaultVercelConfig(analysis);
  } catch {
    vercelConfig = generateDefaultVercelConfig(analysis);
  }

  // Step 4: Generate env template
  onStep?.("Blackbox AI: Generating env template", "Creating .env.example");

  const envPrompt = `Generate a .env.example file for a ${analysis.framework} project.
Known env vars: ${analysis.envVarsDetected.join(", ") || "none"}
Backend: ${analysis.backendType}

Return ONLY the .env.example content with helpful comments, no explanation.`;

  let envTemplate = "";
  try {
    envTemplate = await callBlackbox([{ role: "user", content: envPrompt }], 400);
    // Clean up any markdown code blocks
    envTemplate = envTemplate.replace(/```[a-z]*\n?/g, "").trim();
  } catch {
    envTemplate = generateDefaultEnvTemplate(analysis);
  }

  return {
    codeInsights,
    vercelConfig,
    envTemplate,
    riskAssessment,
    suggestedScripts,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractJSON(text: string): Record<string, unknown> | null {
  try {
    // Try direct parse first
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    // Try to extract JSON block
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function generateDefaultVercelConfig(analysis: RepoAnalysis): string {
  const config: Record<string, unknown> = {
    framework: getVercelFramework(analysis.framework),
    buildCommand: analysis.buildScript || "npm run build",
    outputDirectory: getOutputDir(analysis.framework),
    installCommand: `${analysis.packageManager} install`,
    devCommand: `${analysis.packageManager} run dev`,
  };

  if (analysis.envVarsDetected.length > 0) {
    config.env = Object.fromEntries(
      analysis.envVarsDetected.map((v) => [v, `@${v.toLowerCase()}`])
    );
  }

  return JSON.stringify(config, null, 2);
}

function generateDefaultEnvTemplate(analysis: RepoAnalysis): string {
  const lines = [
    "# Environment Variables",
    "# Copy this file to .env.local and fill in the values",
    "",
  ];

  for (const v of analysis.envVarsDetected) {
    lines.push(`${v}=`);
  }

  if (analysis.envVarsDetected.length === 0) {
    lines.push("# No environment variables detected");
  }

  return lines.join("\n");
}

function getVercelFramework(framework: string): string {
  const map: Record<string, string> = {
    "Next.js": "nextjs",
    React: "react",
    Vue: "vue",
    Svelte: "svelte",
    Astro: "astro",
    Nuxt: "nuxtjs",
    Gatsby: "gatsby",
  };
  return map[framework] || "";
}

function getOutputDir(framework: string): string {
  const map: Record<string, string> = {
    "Next.js": ".next",
    React: "dist",
    Vue: "dist",
    Svelte: "build",
    Astro: "dist",
    Nuxt: ".output",
    Gatsby: "public",
  };
  return map[framework] || "dist";
}
