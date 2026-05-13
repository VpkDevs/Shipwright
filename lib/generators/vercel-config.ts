import type { RepoAnalysis } from "@/types";

interface VercelConfig {
  buildCommand?: string;
  outputDirectory?: string;
  installCommand?: string;
  devCommand?: string;
  framework?: string;
  env?: Record<string, string>;
}

export function generateVercelJsonFile(analysis: RepoAnalysis): string {
  if (analysis.framework !== "Next.js") {
    return "";
  }

  const config: VercelConfig = {
    buildCommand: analysis.buildScript || "npm run build",
    outputDirectory: ".next",
    installCommand: `${analysis.packageManager} install`,
    devCommand: `${analysis.packageManager === "npm" ? "npm run" : analysis.packageManager} dev`,
    framework: "nextjs",
  };

  return JSON.stringify(config, null, 2);
}

export function generatePackageJsonScripts(analysis: RepoAnalysis): Record<string, string> {
  const scripts: Record<string, string> = {};
  const needsDevScript = analysis.missingConfigs.includes("dev script");

  if (analysis.framework === "Next.js") {
    if (!analysis.buildScript) {
      scripts.build = "next build";
    }
    if (!analysis.startScript) {
      scripts.start = "next start";
    }
    if (needsDevScript) {
      scripts.dev = "next dev";
    }
  }

  return scripts;
}

export function generatePackageJsonFile(
  packageJsonContent: string | null,
  generatedScripts: Record<string, string>
): string | null {
  if (!packageJsonContent || Object.keys(generatedScripts).length === 0) {
    return null;
  }

  try {
    const packageJson = JSON.parse(packageJsonContent) as {
      scripts?: Record<string, string>;
      [key: string]: unknown;
    };

    const existingScripts = packageJson.scripts ?? {};
    packageJson.scripts = { ...existingScripts };
    let addedScript = false;
    for (const [name, command] of Object.entries(generatedScripts)) {
      // Shipwright should add missing scripts without clobbering project-specific commands.
      if (!(name in packageJson.scripts)) {
        packageJson.scripts[name] = command;
        addedScript = true;
      }
    }

    if (!addedScript) {
      return null;
    }

    return `${JSON.stringify(packageJson, null, 2)}\n`;
  } catch {
    return null;
  }
}
