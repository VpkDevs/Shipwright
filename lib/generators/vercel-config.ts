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

  if (!analysis.buildScript) {
    if (analysis.framework === "Next.js") {
      scripts.build = "next build";
      scripts.start = "next start";
      scripts.dev = "next dev";
    } else if (analysis.framework === "React") {
      scripts.build = "vite build";
      scripts.start = "vite build && vite preview";
      scripts.dev = "vite";
    } else if (analysis.framework === "Vue") {
      scripts.build = "vite build";
      scripts.start = "vite build && vite preview";
      scripts.dev = "vite";
    }
  }

  return scripts;
}
