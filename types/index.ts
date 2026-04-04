export interface RepoAnalysis {
  framework: string;
  packageManager: string;
  backendType: string;
  hasDocker: boolean;
  envVarsDetected: string[];
  buildScript: string | null;
  missingConfigs: string[];
  deploymentRiskScore: number;
  description: string;
}

export interface DeploymentConfig {
  vercelJson: string;
  packageJsonScripts: Record<string, string>;
  envTemplate: string;
  deploymentInstructions: string;
}

export interface GeneratedContent {
  readme: string;
  landingPage: string;
  config: DeploymentConfig;
}

export interface GithubRepo {
  name: string;
  owner: string;
  url: string;
  description: string;
  language: string;
  stargazers_count: number;
}

export interface PRCreatePayload {
  owner: string;
  repo: string;
  title: string;
  body: string;
  head: string;
  base: string;
  files: Array<{
    path: string;
    content: string;
  }>;
}

// ─── Agent Types ────────────────────────────────────────────────────────────

export type AgentStepStatus = "pending" | "running" | "done" | "error";

export interface AgentStep {
  id: string;
  label: string;
  status: AgentStepStatus;
  detail?: string;
}

export interface AgentToolCall {
  name: string;
  args: Record<string, unknown>;
  result?: string;
}

export interface AgentResult {
  analysis: RepoAnalysis;
  aiReadme: string;
  aiLandingPage: string;
  vercelJson: string;
  packageJsonScripts: Record<string, string>;
  envTemplate: string;
  deploymentRecommendations: string[];
  steps: AgentStep[];
  provider: "openai" | "blackbox" | "template";
}

// ─── Payment / Billing Types ─────────────────────────────────────────────────

export type PlanType = "none" | "credit" | "pro";

export interface PaymentStatus {
  plan: PlanType;
  /** Remaining one-time ship credits */
  credits: number;
  /** ISO date string for Pro subscription expiry */
  proExpiresAt?: string;
  stripeCustomerId?: string;
}

export interface CheckoutSessionRequest {
  priceId: string;
  /** owner/repo being shipped — stored in metadata */
  repoFullName?: string;
}

export interface CheckoutSessionResponse {
  url: string;
}
