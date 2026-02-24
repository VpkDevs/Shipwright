import { RepoAnalysis } from "@/types";
import { GitHubClient } from "./github";

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

export class RepoAnalyzer {
  private client: GitHubClient;

  constructor(token: string) {
    this.client = new GitHubClient(token);
  }

  async analyze(owner: string, repo: string): Promise<RepoAnalysis> {
    const packageJson = await this.getPackageJson(owner, repo);
    const hasDocker = await this.hasDockerfile(owner, repo);
    const envVars = await this.detectEnvVars(owner, repo);

    const framework = this.detectFramework(packageJson);
    const packageManager = this.detectPackageManager(packageJson);
    const backendType = this.detectBackendType(packageJson);
    const buildScript = packageJson?.scripts?.build || null;
    const missingConfigs = this.checkMissingConfigs(
      packageJson,
      framework,
      hasDocker
    );

    const riskScore = this.calculateRiskScore({
      framework,
      buildScript,
      hasDocker,
      envVarsCount: envVars.length,
      missingConfigsCount: missingConfigs.length,
    });

    return {
      framework,
      packageManager,
      backendType,
      hasDocker,
      envVarsDetected: envVars,
      buildScript,
      missingConfigs,
      deploymentRiskScore: riskScore,
      description: `${framework} project with ${packageManager} and ${backendType}`,
    };
  }

  private async getPackageJson(
    owner: string,
    repo: string
  ): Promise<PackageJson | null> {
    try {
      const content = await this.client.getFileContent(owner, repo, "package.json");
      if (!content) return null;
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private async hasDockerfile(owner: string, repo: string): Promise<boolean> {
    const dockerfile = await this.client.getFileContent(owner, repo, "Dockerfile");
    return dockerfile !== null;
  }

  private async detectEnvVars(owner: string, repo: string): Promise<string[]> {
    const files = [".env.example", ".env.local", ".env"];
    const vars: Set<string> = new Set();

    for (const file of files) {
      const content = await this.client.getFileContent(owner, repo, file);
      if (content) {
        const lines = content.split("\n");
        for (const line of lines) {
          const match = line.match(/^([A-Z_][A-Z0-9_]*)\s*=/);
          if (match) {
            vars.add(match[1]);
          }
        }
      }
    }

    return Array.from(vars);
  }

  private detectFramework(packageJson: PackageJson | null): string {
    if (!packageJson?.dependencies && !packageJson?.devDependencies) {
      return "Unknown";
    }

    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (deps.next) return "Next.js";
    if (deps.react) return "React";
    if (deps.vue) return "Vue";
    if (deps.svelte) return "Svelte";
    if (deps.nuxt) return "Nuxt";
    if (deps.gatsby) return "Gatsby";
    if (deps.remix) return "Remix";
    if (deps.astro) return "Astro";

    return "Node.js";
  }

  private detectPackageManager(packageJson: PackageJson | null): string {
    if (!packageJson) return "npm";
    // This is a heuristic - in real implementation, check bun.lockb, pnpm-lock.yaml, etc.
    return "npm";
  }

  private detectBackendType(packageJson: PackageJson | null): string {
    if (!packageJson?.dependencies && !packageJson?.devDependencies) {
      return "Frontend";
    }

    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (deps.express) return "Express";
    if (deps.fastify) return "Fastify";
    if (deps.hapi) return "Hapi";
    if (deps.koa) return "Koa";
    if (deps["@nestjs/core"]) return "NestJS";
    if (deps.fastapi) return "FastAPI";
    if (deps.rails) return "Rails";
    if (deps.django) return "Django";

    return "Frontend";
  }

  private checkMissingConfigs(
    packageJson: PackageJson | null,
    framework: string,
    hasDocker: boolean
  ): string[] {
    const missing: string[] = [];

    if (!packageJson?.scripts?.build) {
      missing.push("build script");
    }
    if (!packageJson?.scripts?.start) {
      missing.push("start script");
    }
    if (!hasDocker && !packageJson?.scripts?.dev) {
      missing.push("dev script");
    }

    if (framework === "Next.js") {
      const content = JSON.stringify(packageJson || {});
      if (!content.includes("next.config")) {
        missing.push("next.config.js");
      }
    }

    return missing;
  }

  private calculateRiskScore(params: {
    framework: string;
    buildScript: string | null;
    hasDocker: boolean;
    envVarsCount: number;
    missingConfigsCount: number;
  }): number {
    let score = 0;

    if (!params.buildScript) score += 20;
    if (!params.hasDocker) score += 10;
    if (params.missingConfigsCount > 0) score += params.missingConfigsCount * 5;
    if (params.envVarsCount > 5) score += 15;

    return Math.min(score, 100);
  }
}
