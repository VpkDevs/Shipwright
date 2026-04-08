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
