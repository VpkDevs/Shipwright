import type { RepoAnalysis } from "@/types";
import { GitHubClient } from "./github";

export interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  packageManager?: string;
}

export interface RepositorySnapshot {
  packageJson: PackageJson | null;
  filePaths: string[];
  fileContents: Record<string, string>;
  usesTypeScript?: boolean;
}

const NEXT_CONFIG_FILES = [
  "next.config.js",
  "next.config.mjs",
  "next.config.cjs",
  "next.config.ts",
];

const DEPLOYMENT_CONFIG_FILES = [
  "vercel.json",
  "netlify.toml",
  "fly.toml",
  "railway.json",
  "docker-compose.yml",
  "docker-compose.yaml",
];

const ENV_TEMPLATE_FILES = [".env.example", ".env.sample", ".env.template"];
const ENV_FILE_PATTERN = /^\.env(\..+)?$/i;
const SOURCE_FILE_PATTERN = /\.(ts|tsx|js|jsx|mjs|cjs)$/i;
const ROOT_SOURCE_FILE_PATTERN = /^(index|main|server|app)\.(ts|tsx|js|jsx|mjs|cjs)$/i;
const CONFIG_FILE_PATTERN =
  /(^|\/)(next|vite|astro|nuxt|remix|svelte)\.config\.(ts|js|mjs|cjs)$|(^|\/)gatsby-config\.(ts|js|mjs|cjs)$/i;
const COMMON_SOURCE_PREFIXES = ["app/", "src/", "pages/", "lib/", "server/", "api/"];
const SERVER_BACKENDS = new Set([
  "Node.js",
  "Express",
  "Fastify",
  "Hapi",
  "Koa",
  "NestJS",
  "FastAPI",
  "Rails",
  "Django",
]);
const IGNORED_ENV_VARS = new Set(["NODE_ENV"]);

export function analyzeRepositorySnapshot(snapshot: RepositorySnapshot): RepoAnalysis {
  const pathSet = createLowerPathSet(snapshot.filePaths);
  const hasDocker = hasDockerfile(pathSet);
  const framework = detectFramework(snapshot, pathSet);
  const packageManager = detectPackageManager(snapshot, pathSet);
  const backendType = detectBackendType(snapshot, pathSet);
  const envVarsDetected = detectEnvVars(snapshot);
  const buildScript = snapshot.packageJson?.scripts?.build ?? null;
  const hasDeploymentConfig =
    hasDocker || DEPLOYMENT_CONFIG_FILES.some((file) => hasPath(pathSet, file));
  const missingConfigs = checkMissingConfigs({
    snapshot,
    pathSet,
    framework,
    backendType,
    hasDocker,
    hasDeploymentConfig,
    envVarsDetected,
  });
  const usesTypeScript = snapshot.usesTypeScript ?? hasPath(pathSet, "tsconfig.json");

  return {
    framework,
    packageManager,
    backendType,
    hasDocker,
    envVarsDetected,
    buildScript,
    missingConfigs,
    deploymentRiskScore: calculateRiskScore({
      hasPackageJson: Boolean(snapshot.packageJson),
      framework,
      backendType,
      buildScript,
      hasDocker,
      hasDeploymentConfig,
      hasStartScript: Boolean(snapshot.packageJson?.scripts?.start),
      envVarsCount: envVarsDetected.length,
      missingConfigs,
    }),
    description: buildDescription({
      framework,
      packageManager,
      backendType,
      hasDocker,
    }),
    usesTypeScript,
  };
}

export class RepoAnalyzer {
  private client: GitHubClient;
  private static cache = new Map<string, RepoAnalysis>();

  constructor(token: string, client?: GitHubClient) {
    this.client = client ?? new GitHubClient(token);
  }

  async analyze(owner: string, repo: string): Promise<RepoAnalysis> {
    const cacheKey = `${owner}/${repo}`;
    const cachedAnalysis = RepoAnalyzer.cache.get(cacheKey);
    if (cachedAnalysis) {
      return cachedAnalysis;
    }

    const [packageJson, filePaths] = await Promise.all([
      this.getPackageJson(owner, repo),
      this.getFilePaths(owner, repo),
    ]);
    const fileContents = await this.getRelevantFileContents(owner, repo, filePaths);

    const analysis = analyzeRepositorySnapshot({
      packageJson,
      filePaths,
      fileContents,
    });

    RepoAnalyzer.cache.set(cacheKey, analysis);
    return analysis;
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

  private async getFilePaths(owner: string, repo: string): Promise<string[]> {
    try {
      const fileTree = await this.client.getFileTree(owner, repo, 3);
      return fileTree.map((file) => file.path);
    } catch {
      return [];
    }
  }

  private async getRelevantFileContents(
    owner: string,
    repo: string,
    filePaths: string[]
  ): Promise<Record<string, string>> {
    const relevantFiles = getRelevantFiles(filePaths);
    const entries = await Promise.all(
      relevantFiles.map(
        async (path) => [path, await this.client.getFileContent(owner, repo, path)] as const
      )
    );

    return entries.reduce<Record<string, string>>((acc, [path, content]) => {
      if (content) {
        acc[path] = content;
      }
      return acc;
    }, {});
  }
}

function buildDescription(params: {
  framework: string;
  packageManager: string;
  backendType: string;
  hasDocker: boolean;
}): string {
  const parts = [`${params.framework} project`, `using ${params.packageManager}`];

  if (params.backendType !== "Frontend") {
    parts.push(`with ${params.backendType}`);
  }

  if (params.hasDocker) {
    parts.push("and Docker support");
  }

  return parts.join(" ");
}

function getRelevantFiles(filePaths: string[]): string[] {
  const importantFiles = filePaths.filter((path) => {
    const lowerPath = path.toLowerCase();
    return (
      ENV_FILE_PATTERN.test(lowerPath) ||
      CONFIG_FILE_PATTERN.test(lowerPath) ||
      ROOT_SOURCE_FILE_PATTERN.test(lowerPath)
    );
  });

  const sourceFiles = filePaths.filter((path) => {
    const lowerPath = path.toLowerCase();
    return (
      SOURCE_FILE_PATTERN.test(lowerPath) &&
      COMMON_SOURCE_PREFIXES.some((prefix) => lowerPath.startsWith(prefix))
    );
  });

  return Array.from(new Set([...importantFiles, ...sourceFiles])).slice(0, 24);
}

function detectFramework(snapshot: RepositorySnapshot, pathSet: Set<string>): string {
  const deps = getDependencies(snapshot.packageJson);

  if (
    deps.next ||
    NEXT_CONFIG_FILES.some((file) => hasPath(pathSet, file)) ||
    (hasPathPrefix(pathSet, "app/") &&
      hasMatchingPath(pathSet, (path) => /(^|\/)layout\.(ts|tsx|js|jsx)$/.test(path))) ||
    hasPath(pathSet, "pages/_app.tsx") ||
    hasPath(pathSet, "pages/_app.jsx")
  ) {
    return "Next.js";
  }

  if (deps.nuxt || hasMatchingPath(pathSet, (path) => path.startsWith("nuxt.config."))) {
    return "Nuxt";
  }

  if (deps.astro || hasMatchingPath(pathSet, (path) => path.startsWith("astro.config."))) {
    return "Astro";
  }

  if (deps.gatsby || hasMatchingPath(pathSet, (path) => path.startsWith("gatsby-config."))) {
    return "Gatsby";
  }

  if (
    deps["@remix-run/react"] ||
    deps["@remix-run/node"] ||
    hasMatchingPath(pathSet, (path) => path.startsWith("remix.config.")) ||
    hasPath(pathSet, "app/root.tsx") ||
    hasPath(pathSet, "app/root.jsx")
  ) {
    return "Remix";
  }

  if (deps.svelte || hasMatchingPath(pathSet, (path) => path.startsWith("svelte.config."))) {
    return "Svelte";
  }

  if (deps.vue) return "Vue";
  if (deps.react) return "React";

  if (Object.keys(deps).length > 0 || snapshot.filePaths.length > 0) {
    return "Node.js";
  }

  return "Unknown";
}

function detectPackageManager(snapshot: RepositorySnapshot, pathSet: Set<string>): string {
  const declaredManager = snapshot.packageJson?.packageManager?.toLowerCase();

  if (declaredManager?.startsWith("bun@")) return "bun";
  if (declaredManager?.startsWith("pnpm@")) return "pnpm";
  if (declaredManager?.startsWith("yarn@")) return "yarn";
  if (declaredManager?.startsWith("npm@")) return "npm";

  if (hasPath(pathSet, "bun.lock") || hasPath(pathSet, "bun.lockb")) {
    return "bun";
  }

  if (hasPath(pathSet, "pnpm-lock.yaml")) {
    return "pnpm";
  }

  if (hasPath(pathSet, "yarn.lock") || hasPath(pathSet, ".yarnrc.yml")) {
    return "yarn";
  }

  if (hasPath(pathSet, "package-lock.json") || hasPath(pathSet, "npm-shrinkwrap.json")) {
    return "npm";
  }

  const scriptValues = Object.values(snapshot.packageJson?.scripts ?? {});
  if (scriptValues.some((script) => /(^|\s)bun(\s|$)/.test(script))) {
    return "bun";
  }

  return "npm";
}

function detectBackendType(snapshot: RepositorySnapshot, pathSet: Set<string>): string {
  const deps = getDependencies(snapshot.packageJson);
  const scripts = snapshot.packageJson?.scripts ?? {};
  const commandText = [scripts.start, scripts.dev].filter(Boolean).join(" ");

  if (deps["@nestjs/core"]) return "NestJS";
  if (deps.express) return "Express";
  if (deps.fastify) return "Fastify";
  if (deps["@hapi/hapi"] || deps.hapi) return "Hapi";
  if (deps.koa) return "Koa";
  if (deps.fastapi) return "FastAPI";
  if (deps.rails) return "Rails";
  if (deps.django) return "Django";

  if (hasPathPrefix(pathSet, "app/api/") || hasPathPrefix(pathSet, "pages/api/")) {
    return "Next.js API Routes";
  }

  if (/\b(node|tsx|ts-node|nodemon|bun)\b/.test(commandText)) {
    return "Node.js";
  }

  if (
    hasMatchingPath(pathSet, (path) => /(^|\/)(server|api)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(path))
  ) {
    return "Node.js";
  }

  return "Frontend";
}

function detectEnvVars(snapshot: RepositorySnapshot): string[] {
  const vars = new Set<string>();

  for (const [path, content] of Object.entries(snapshot.fileContents)) {
    if (ENV_FILE_PATTERN.test(path.toLowerCase())) {
      for (const line of content.split(/\r?\n/)) {
        const match = line.match(/^([A-Z_][A-Z0-9_]*)\s*=/);
        if (match) {
          vars.add(match[1]);
        }
      }
    }

    collectMatches(content, /process\.env\.([A-Z_][A-Z0-9_]*)/g, vars);
    collectMatches(content, /process\.env\[["']([A-Z_][A-Z0-9_]*)["']\]/g, vars);
    collectMatches(content, /import\.meta\.env\.([A-Z_][A-Z0-9_]*)/g, vars);
  }

  return Array.from(vars)
    .filter((value) => !IGNORED_ENV_VARS.has(value))
    .sort();
}

function checkMissingConfigs(params: {
  snapshot: RepositorySnapshot;
  pathSet: Set<string>;
  framework: string;
  backendType: string;
  hasDocker: boolean;
  hasDeploymentConfig: boolean;
  envVarsDetected: string[];
}): string[] {
  const scripts = params.snapshot.packageJson?.scripts ?? {};
  const missing: string[] = [];

  if (requiresBuildScript(params.framework) && !scripts.build) {
    missing.push("build script");
  }

  if (requiresStartScript(params.backendType) && !scripts.start) {
    missing.push("start script");
  }

  if (!scripts.dev && !params.hasDocker) {
    missing.push("dev script");
  }

  if (
    params.envVarsDetected.length > 0 &&
    !ENV_TEMPLATE_FILES.some((file) => hasPath(params.pathSet, file))
  ) {
    missing.push(".env.example");
  }

  if (
    requiresDeploymentConfig(params.backendType) &&
    !params.hasDocker &&
    !params.hasDeploymentConfig
  ) {
    missing.push("deployment config");
  }

  return missing;
}

function calculateRiskScore(params: {
  hasPackageJson: boolean;
  framework: string;
  backendType: string;
  buildScript: string | null;
  hasDocker: boolean;
  hasDeploymentConfig: boolean;
  hasStartScript: boolean;
  envVarsCount: number;
  missingConfigs: string[];
}): number {
  let score = 0;

  if (!params.hasPackageJson) score += 35;
  if (params.framework === "Unknown") score += 20;

  if (requiresBuildScript(params.framework) && !params.buildScript) {
    score += 20;
  }

  if (requiresStartScript(params.backendType) && !params.hasStartScript) {
    score += 15;
  }

  if (
    requiresDeploymentConfig(params.backendType) &&
    !params.hasDocker &&
    !params.hasDeploymentConfig
  ) {
    score += 15;
  }

  if (params.envVarsCount > 0 && params.missingConfigs.includes(".env.example")) {
    score += 12;
  }

  if (params.envVarsCount > 8) {
    score += 8;
  }

  score += params.missingConfigs.length * 6;

  if (params.hasDocker) {
    score -= 5;
  }

  return clamp(score, 0, 100);
}

function requiresBuildScript(framework: string): boolean {
  return framework !== "Node.js" && framework !== "Unknown";
}

function requiresStartScript(backendType: string): boolean {
  return SERVER_BACKENDS.has(backendType);
}

function requiresDeploymentConfig(backendType: string): boolean {
  return SERVER_BACKENDS.has(backendType);
}

function hasDockerfile(pathSet: Set<string>): boolean {
  return hasMatchingPath(pathSet, (path) => /(^|\/)dockerfile(\..+)?$/i.test(path));
}

function collectMatches(content: string, regex: RegExp, vars: Set<string>): void {
  for (const match of content.matchAll(regex)) {
    const candidate = match[1];
    if (candidate) {
      vars.add(candidate);
    }
  }
}

function getDependencies(packageJson: PackageJson | null): Record<string, string> {
  return {
    ...(packageJson?.dependencies ?? {}),
    ...(packageJson?.devDependencies ?? {}),
  };
}

function createLowerPathSet(paths: string[]): Set<string> {
  return new Set(paths.map((path) => path.toLowerCase()));
}

function hasPath(pathSet: Set<string>, path: string): boolean {
  return pathSet.has(path.toLowerCase());
}

function hasPathPrefix(pathSet: Set<string>, prefix: string): boolean {
  const lowerPrefix = prefix.toLowerCase();
  return Array.from(pathSet).some((path) => path.startsWith(lowerPrefix));
}

function hasMatchingPath(pathSet: Set<string>, predicate: (path: string) => boolean): boolean {
  return Array.from(pathSet).some(predicate);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
