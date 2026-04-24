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
  /** true if a tsconfig.json file exists */
  usesTypeScript?: boolean;
  /** GitHub HTML url for the repo (optional) */
  htmlUrl?: string;
  /** ISO timestamp of repo last update (optional) */
  updatedAt?: string;
}

export interface GeneratedContent {
  vercelJson: string;
  packageJsonScripts: Record<string, string>;
  envTemplate: string;
  readme: string;
  landingPage: string;
  isAI: false;
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
  /** GitHub Actions CI/CD workflow YAML — paid/AI-only artifact */
  githubActionsWorkflow: string;
  steps: AgentStep[];
  provider: "openai" | "blackbox" | "template";
}

// ─── Payment / Billing Types ─────────────────────────────────────────────────

/** Access tier returned by the billing status endpoint. All recurring subscriptions map to `pro`. */
export type PlanType = "none" | "credit" | "pro";

export interface PaymentStatus {
  plan: PlanType;
  /** Remaining one-time ship credits */
  credits: number;
  /** ISO date string for recurring subscription expiry */
  proExpiresAt?: string;
  stripeCustomerId?: string;
}

export interface CheckoutSessionRequest {
  plan: "credit" | "pro" | "proAnnual" | "team";
  /** owner/repo being shipped — stored in metadata */
  repoFullName?: string;
}

export interface CheckoutSessionResponse {
  url: string;
}
