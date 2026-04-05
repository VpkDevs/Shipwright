import type { RepoAnalysis } from "@/types";

interface VercelConfig {
  buildCommand?: string;
  outputDirectory?: string;
  installCommand?: string;
  devCommand?: string;
  framework?: string;
  env?: Record<string, string>;
}

export function generateVercelConfig(analysis: RepoAnalysis): string {
  const config: VercelConfig = {
    buildCommand: analysis.buildScript || "npm run build",
    outputDirectory: getOutputDirectory(analysis.framework),
    framework: getFrameworkConfig(analysis.framework) || undefined,
  };

  if (analysis.envVarsDetected.length > 0) {
    config.env = analysis.envVarsDetected.reduce(
      (acc, envVar) => {
        acc[envVar] = `@${envVar}`;
        return acc;
      },
      {} as Record<string, string>
    );
  }

  return JSON.stringify(config, null, 2);
}

function getOutputDirectory(framework: string): string {
  switch (framework) {
    case "Next.js":
      return ".next";
    case "React":
    case "Vite":
      return "dist";
    case "Gatsby":
      return "public";
    case "Nuxt":
      return "dist";
    default:
      return "dist";
  }
}

function getFrameworkConfig(framework: string): string {
  switch (framework) {
    case "Next.js":
      return "nextjs";
    case "React":
      return "react";
    case "Vue":
      return "vue";
    case "Svelte":
      return "svelte";
    case "Astro":
      return "astro";
    default:
      return "";
  }
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
