import { RepoAnalysis } from "@/types";

export function generateVercelConfig(analysis: RepoAnalysis): string {
  const config: Record<string, unknown> = {
    buildCommand: analysis.buildScript
      ? `npm run ${analysis.buildScript.replace("npm run ", "")}`
      : "npm run build",
    outputDirectory: getOutputDirectory(analysis.framework),
    framework: getFrameworkConfig(analysis.framework),
  };

  if (analysis.envVarsDetected.length > 0) {
    config.env = analysis.envVarsDetected.reduce(
      (acc, envVar) => {
        acc[envVar] = "@" + envVar;
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

  const config = {
    buildCommand: analysis.buildScript ? "npm run build" : undefined,
    outputDirectory: ".next",
    installCommand: "npm install",
    devCommand: "npm run dev",
    framework: "nextjs",
  };

  return JSON.stringify(Object.fromEntries(
    Object.entries(config).filter(([, value]) => value !== undefined)
  ), null, 2);
}

export function generatePackageJsonScripts(analysis: RepoAnalysis): Record<
  string,
  string
> {
  const scripts: Record<string, string> = {};

  if (!analysis.buildScript) {
    if (analysis.framework === "Next.js") {
      scripts.build = "next build";
      scripts.start = "next start";
      scripts.dev = "next dev";
    } else if (analysis.framework === "React") {
      scripts.build = "vite build";
      scripts.start = "npm run build && npm run preview";
      scripts.dev = "vite";
    }
  }

  return scripts;
}
