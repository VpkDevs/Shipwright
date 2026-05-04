import type { RepoAnalysis } from "@/types";

export function generateCiWorkflow(
  analysis: RepoAnalysis,
  generatedScripts: Record<string, string>
): string {
  const packageManagerSetupSteps = getPackageManagerSetupSteps(analysis.packageManager);
  const installCommand = getInstallCommand(analysis);
  const buildCommand =
    analysis.buildScript || generatedScripts.build
      ? getRunCommand(analysis.packageManager, "build")
      : null;
  const testCommand = analysis.testScript ? getRunCommand(analysis.packageManager, "test") : null;

  return [
    "name: Shipwright deployment checks",
    "",
    "on:",
    "  pull_request:",
    "  push:",
    "    branches: [main]",
    "",
    "jobs:",
    "  deployment-readiness:",
    "    runs-on: ubuntu-latest",
    "    steps:",
    "      - name: Checkout",
    "        uses: actions/checkout@v4",
    "",
    "      - name: Setup Node",
    "        uses: actions/setup-node@v4",
    "        with:",
    "          node-version: 20",
    "",
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

  if (analysis.packageManager === "pnpm") return "pnpm install --frozen-lockfile";
  if (analysis.packageManager === "yarn") return "yarn install --frozen-lockfile";
  if (analysis.packageManager === "bun") return "bun install --frozen-lockfile";

  return `${analysis.packageManager} install`;
}

function getRunCommand(packageManager: string, script: string): string {
  if (packageManager === "npm") return `npm run ${script}`;
  if (packageManager === "yarn") return `yarn ${script}`;
  if (packageManager === "pnpm") return `pnpm ${script}`;
  if (packageManager === "bun") return `bun run ${script}`;
  return `${packageManager} run ${script}`;
}
