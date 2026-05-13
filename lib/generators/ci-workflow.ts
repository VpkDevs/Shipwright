import type { RepoAnalysis } from "@/types";
import { getPackageScriptCommand } from "./package-manager";

export function generateCiWorkflow(
  analysis: RepoAnalysis,
  generatedScripts: Record<string, string>,
  defaultBranch = "main"
): string {
  const nodeSetupSteps = analysis.packageManager === "bun" ? [] : getNodeSetupSteps();
  const packageManagerSetupSteps = getPackageManagerSetupSteps(analysis.packageManager);
  const installCommand = getInstallCommand(analysis);
  const hasBuildStep = Boolean(analysis.buildScript || generatedScripts.build);
  const buildCommand = hasBuildStep
    ? getPackageScriptCommand(analysis.packageManager, "build")
    : null;
  const testCommand = analysis.testScript
    ? getPackageScriptCommand(analysis.packageManager, "test")
    : null;

  return [
    "name: Shipwright deployment checks",
    "",
    "on:",
    "  pull_request:",
    "  push:",
    `    branches: [${JSON.stringify(defaultBranch)}]`,
    "",
    "jobs:",
    "  deployment-readiness:",
    "    runs-on: ubuntu-latest",
    "    steps:",
    "      - name: Checkout",
    "        uses: actions/checkout@v4",
    "",
    ...nodeSetupSteps,
    ...packageManagerSetupSteps,
    "      - name: Install dependencies",
    `        run: ${installCommand}`,
    "",
    ...(testCommand ? ["      - name: Test", `        run: ${testCommand}`, ""] : []),
    buildCommand
      ? ["      - name: Build", `        run: ${buildCommand}`].join("\n")
      : "      # Add a build script before enabling a build step.",
    "",
  ].join("\n");
}

function getNodeSetupSteps(): string[] {
  return [
    "      - name: Setup Node",
    "        uses: actions/setup-node@v4",
    "        with:",
    "          node-version: 20",
    "",
  ];
}

function getPackageManagerSetupSteps(packageManager: string): string[] {
  if (packageManager === "pnpm" || packageManager === "yarn") {
    return ["      - name: Enable Corepack", "        run: corepack enable", ""];
  }

  if (packageManager === "bun") {
    return ["      - name: Setup Bun", "        uses: oven-sh/setup-bun@v2", ""];
  }

  return [];
}

function getInstallCommand(analysis: RepoAnalysis): string {
  if (analysis.packageManager === "npm") {
    return analysis.lockfile === "package-lock.json" ? "npm ci" : "npm install";
  }

  if (analysis.packageManager === "pnpm") {
    return analysis.lockfile ? "pnpm install --frozen-lockfile" : "pnpm install";
  }
  if (analysis.packageManager === "yarn") {
    return analysis.lockfile ? "yarn install --frozen-lockfile" : "yarn install";
  }
  if (analysis.packageManager === "bun") {
    return analysis.lockfile ? "bun install --frozen-lockfile" : "bun install";
  }

  return `${analysis.packageManager} install`;
}
