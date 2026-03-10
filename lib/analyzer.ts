import type { RepoAnalysis } from "@/types";
import { GitHubClient } from "./github";

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  packageManager?: string;
}

export class RepoAnalyzer {
  private client: GitHubClient;

  constructor(token: string) {
    this.client = new GitHubClient(token);
  }

  async analyze(owner: string, repo: string): Promise<RepoAnalysis> {
    const [packageJson, hasDocker, envVars, fileList] = await Promise.all([
      this.getPackageJson(owner, repo),
      this.hasDockerfile(owner, repo),
      this.detectEnvVars(owner, repo),
      this.getFileList(owner, repo),
    ]);

    const framework = this.detectFramework(packageJson);
    const packageManager = await this.detectPackageManager(owner, repo, packageJson);
    const backendType = this.detectBackendType(packageJson);
    const buildScript = packageJson?.scripts?.build || null;
    const missingConfigs = this.checkMissingConfigs(packageJson, framework, hasDocker, fileList);

    const riskScore = this.calculateRiskScore({
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

  private async getPackageJson(owner: string, repo: string): Promise<PackageJson | null> {
    try {
      const content = await this.client.getFileContent(owner, repo, "package.json");
      if (!content) return null;
      return JSON.parse(content) as PackageJson;
    } catch {
      return null;
    }
  }

  private async getFileList(owner: string, repo: string): Promise<string[]> {
    try {
      const tree = await this.client.getFileTree(owner, repo, 1);
      return tree.map((f) => f.path);
    } catch {
      return [];
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
          const trimmed = line.trim();
          // Skip comments and empty lines
          if (!trimmed || trimmed.startsWith("#")) continue;
          // Match both UPPER_CASE and mixed-case env var names
          const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=/);
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
    if (deps["@remix-run/node"] || deps["@remix-run/react"]) return "Remix";
    if (deps.astro) return "Astro";

    return "Node.js";
  }

  private async detectPackageManager(
    owner: string,
    repo: string,
    packageJson: PackageJson | null
  ): Promise<string> {
    // Check packageManager field in package.json (corepack standard)
    if (packageJson?.packageManager) {
      const pm = packageJson.packageManager.toLowerCase();
      if (pm.startsWith("pnpm")) return "pnpm";
      if (pm.startsWith("yarn")) return "yarn";
      if (pm.startsWith("bun")) return "bun";
      if (pm.startsWith("npm")) return "npm";
    }

    // Check for lock files to determine package manager
    const lockFileChecks = await Promise.all([
      this.client
        .getFileContent(owner, repo, "bun.lockb")
        .then((r) => ({ pm: "bun", exists: r !== null })),
      this.client
        .getFileContent(owner, repo, "pnpm-lock.yaml")
        .then((r) => ({ pm: "pnpm", exists: r !== null })),
      this.client
        .getFileContent(owner, repo, "yarn.lock")
        .then((r) => ({ pm: "yarn", exists: r !== null })),
      this.client
        .getFileContent(owner, repo, "package-lock.json")
        .then((r) => ({ pm: "npm", exists: r !== null })),
    ]);

    for (const check of lockFileChecks) {
      if (check.exists) return check.pm;
    }

    return "npm";
  }

  private detectBackendType(packageJson: PackageJson | null): string {
    if (!packageJson?.dependencies && !packageJson?.devDependencies) {
      return "Frontend";
    }

    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (deps.express) return "Express";
    if (deps.fastify) return "Fastify";
    if (deps["@hapi/hapi"] || deps.hapi) return "Hapi";
    if (deps.koa) return "Koa";
    if (deps["@nestjs/core"]) return "NestJS";

    return "Frontend";
  }

  private checkMissingConfigs(
    packageJson: PackageJson | null,
    framework: string,
    hasDocker: boolean,
    fileList: string[]
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
      const hasNextConfig = fileList.some((f) => /^next\.config\.(js|ts|mjs|cjs)$/.test(f));
      if (!hasNextConfig) {
        missing.push("next.config.js");
      }
    }

    return missing;
  }

  private calculateRiskScore(params: {
    buildScript: string | null;
    hasDocker: boolean;
    envVarsCount: number;
    missingConfigsCount: number;
  }): number {
    const MISSING_BUILD_SCRIPT_PENALTY = 20;
    const NO_DOCKER_PENALTY = 10;
    const MISSING_CONFIG_PENALTY = 5;
    const MANY_ENV_VARS_PENALTY = 15;
    const MANY_ENV_VARS_THRESHOLD = 5;

    let score = 0;

    if (!params.buildScript) score += MISSING_BUILD_SCRIPT_PENALTY;
    if (!params.hasDocker) score += NO_DOCKER_PENALTY;
    if (params.missingConfigsCount > 0)
      score += params.missingConfigsCount * MISSING_CONFIG_PENALTY;
    if (params.envVarsCount > MANY_ENV_VARS_THRESHOLD) score += MANY_ENV_VARS_PENALTY;

    return Math.min(score, 100);
  }
}
