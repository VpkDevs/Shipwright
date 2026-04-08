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
    case "Solid.js":
    case "Preact":
      return "dist";
    case "Gatsby":
      return "public";
    case "Nuxt":
    case "SvelteKit":
    case "SolidStart":
      return ".output";
    case "Astro":
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
    case "Nuxt":
      return "nuxtjs";
    case "Svelte":
      return "svelte";
    case "SvelteKit":
      return "sveltekit";
    case "Astro":
      return "astro";
    case "Angular":
      return "angular";
    case "Gatsby":
      return "gatsby";
    case "Remix":
      return "remix";
    default:
      return "";
  }
}

export function generateVercelJsonFile(analysis: RepoAnalysis): string {
  const frameworkConfig = getFrameworkConfig(analysis.framework);

  const config: VercelConfig = {
    buildCommand: analysis.buildScript || "npm run build",
    outputDirectory: getOutputDirectory(analysis.framework),
    installCommand: `${analysis.packageManager} install`,
    devCommand: `${analysis.packageManager === "npm" ? "npm run" : analysis.packageManager} dev`,
  };

  if (frameworkConfig) {
    config.framework = frameworkConfig;
  }

  return JSON.stringify(config, null, 2);
}

export function generatePackageJsonScripts(analysis: RepoAnalysis): Record<string, string> {
  const scripts: Record<string, string> = {};

  if (!analysis.buildScript) {
    if (analysis.framework === "Next.js") {
      scripts.build = "next build";
      scripts.start = "next start";
      scripts.dev = "next dev";
    } else if (
      analysis.framework === "React" ||
      analysis.framework === "Vue" ||
      analysis.framework === "Solid.js" ||
      analysis.framework === "Preact"
    ) {
      scripts.build = "vite build";
      scripts.start = "vite build && vite preview";
      scripts.dev = "vite";
    } else if (analysis.framework === "SvelteKit") {
      scripts.build = "vite build";
      scripts.start = "node build";
      scripts.dev = "vite dev";
    } else if (analysis.framework === "Astro") {
      scripts.build = "astro build";
      scripts.start = "astro preview";
      scripts.dev = "astro dev";
    } else if (analysis.framework === "Remix") {
      scripts.build = "remix build";
      scripts.start = "remix-serve ./build/server/index.js";
      scripts.dev = "remix dev";
    }
  }

  return scripts;
}

export function generateRailwayConfig(analysis: RepoAnalysis): string {
  const buildCommand = analysis.buildScript || "npm run build";
  const startCommand = (() => {
    switch (analysis.framework) {
      case "Next.js":
        return `${analysis.packageManager === "npm" ? "npm run" : analysis.packageManager} start`;
      case "Remix":
        return "node ./build/server/index.js";
      default:
        return `${analysis.packageManager === "npm" ? "npm run" : analysis.packageManager} start`;
    }
  })();

  const lines = [
    "[build]",
    `builder = "NIXPACKS"`,
    `buildCommand = "${buildCommand}"`,
    "",
    "[deploy]",
    `startCommand = "${startCommand}"`,
    `restartPolicyType = "ON_FAILURE"`,
    "restartPolicyMaxRetries = 10",
  ];

  if (analysis.envVarsDetected.length > 0) {
    lines.push("", "[env]");
    for (const envVar of analysis.envVarsDetected) {
      lines.push(`${envVar} = ""`);
    }
  }

  return lines.join("\n");
}
