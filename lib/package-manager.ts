export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export function normalizePackageManager(packageManager: string): PackageManager {
  switch (packageManager) {
    case "pnpm":
    case "yarn":
    case "bun":
      return packageManager;
    default:
      return "npm";
  }
}

export function getInstallCommand(packageManager: string): string {
  return `${normalizePackageManager(packageManager)} install`;
}

export function getRunScriptCommand(packageManager: string, scriptName: string): string {
  const normalized = normalizePackageManager(packageManager);

  switch (normalized) {
    case "pnpm":
    case "yarn":
      return `${normalized} ${scriptName}`;
    case "bun":
      return `bun run ${scriptName}`;
    default:
      return `npm run ${scriptName}`;
  }
}
