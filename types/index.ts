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

export interface GeneratedContent {
  vercelJson: string;
  packageJsonScripts: Record<string, string>;
  envTemplate: string;
  readme: string;
  landingPage: string;
}

// ─── Payment / Billing Types ───────────────────────────────────────────────

/** Access tier returned by the billing status endpoint */
export type PlanType = "none" | "credit" | "pro";

export interface PaymentStatus {
  /** Current plan: none, credit (one-time), or pro/team (subscription) */
  plan: PlanType;
  /** Remaining one-time ship credits (only if plan === "credit") */
  credits: number;
  /** ISO date string for subscription expiry (only if plan === "pro") */
  proExpiresAt?: string;
  /** Stripe customer ID for this user */
  stripeCustomerId?: string;
}
