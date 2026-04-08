import type { RepoAnalysis } from "@/types";

function getFrameworkBadge(framework: string): string {
  const badges: Record<string, string> = {
    "Next.js": "![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js)",
    React: "![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)",
    Vue: "![Vue](https://img.shields.io/badge/Vue.js-4FC08D?logo=vue.js&logoColor=white)",
    Svelte: "![Svelte](https://img.shields.io/badge/Svelte-FF3E00?logo=svelte&logoColor=white)",
    SvelteKit:
      "![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?logo=svelte&logoColor=white)",
    Angular: "![Angular](https://img.shields.io/badge/Angular-DD0031?logo=angular&logoColor=white)",
    Astro: "![Astro](https://img.shields.io/badge/Astro-BC52EE?logo=astro&logoColor=white)",
    Remix: "![Remix](https://img.shields.io/badge/Remix-black?logo=remix)",
    Nuxt: "![Nuxt](https://img.shields.io/badge/Nuxt-00DC82?logo=nuxt.js&logoColor=white)",
    Gatsby: "![Gatsby](https://img.shields.io/badge/Gatsby-663399?logo=gatsby&logoColor=white)",
    Hono: "![Hono](https://img.shields.io/badge/Hono-E36002?logo=hono&logoColor=white)",
    Elysia: "![Elysia](https://img.shields.io/badge/Elysia-AC0AC4?logo=bun&logoColor=white)",
    NestJS: "![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)",
    Express: "![Express](https://img.shields.io/badge/Express-black?logo=express)",
  };
  return badges[framework] ?? "";
}

function getPackageManagerBadge(pm: string): string {
  const badges: Record<string, string> = {
    npm: "![npm](https://img.shields.io/badge/npm-CB3837?logo=npm&logoColor=white)",
    pnpm: "![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)",
    yarn: "![yarn](https://img.shields.io/badge/yarn-2C8EBB?logo=yarn&logoColor=white)",
    bun: "![bun](https://img.shields.io/badge/bun-black?logo=bun)",
  };
  return badges[pm] ?? "";
}

export function generateReadme(
  repoName: string,
  owner: string,
  analysis: RepoAnalysis,
  description?: string
): string {
  const installCmd =
    analysis.packageManager === "npm" ? "npm install" : `${analysis.packageManager} install`;
  const devCmd =
    analysis.packageManager === "npm" ? "npm run dev" : `${analysis.packageManager} dev`;
  const buildCmd =
    analysis.packageManager === "npm" ? "npm run build" : `${analysis.packageManager} build`;
  const startCmd =
    analysis.packageManager === "npm" ? "npm start" : `${analysis.packageManager} start`;

  const frameworkBadge = getFrameworkBadge(analysis.framework);
  const pmBadge = getPackageManagerBadge(analysis.packageManager);
  const licenseBadge = "![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)";

  const badges = [frameworkBadge, pmBadge, licenseBadge].filter(Boolean).join(" ");

  const repoUrl = `https://github.com/${owner}/${repoName}`;

  const sections = [
    `# ${repoName}`,
    "",
    badges,
    "",
    description || analysis.description,
    "",
    "## Features",
    "",
    "- ✨ Fast and performant",
    "- 🔧 Easy to configure",
    "- 📦 Production-ready",
    "- 🔒 Secure by default",
    "",
    "## Tech Stack",
    "",
    `- **Framework**: ${analysis.framework}`,
    `- **Package Manager**: ${analysis.packageManager}`,
    ...(analysis.backendType !== "Frontend" ? [`- **Backend**: ${analysis.backendType}`] : []),
    ...(analysis.hasDocker ? ["- **Container**: Docker"] : []),
    "",
    "## Getting Started",
    "",
    "### Prerequisites",
    "",
    "- Node.js 18+",
    `- ${analysis.packageManager}`,
    ...(analysis.hasDocker ? ["- Docker (optional)"] : []),
    "",
    "### Installation",
    "",
    "1. Clone the repository:",
    "```bash",
    `git clone ${repoUrl}.git`,
    `cd ${repoName}`,
    "```",
    "",
    "2. Install dependencies:",
    "```bash",
    installCmd,
    "```",
    "",
    ...(analysis.envVarsDetected.length > 0
      ? [
          "3. Set up environment variables:",
          "```bash",
          "cp .env.example .env.local",
          "```",
          "",
          "Edit `.env.local` and fill in the required values.",
          "",
        ]
      : []),
    "### Development",
    "",
    "```bash",
    devCmd,
    "```",
    "",
    "### Build",
    "",
    "```bash",
    buildCmd,
    "```",
    "",
    "### Production",
    "",
    "```bash",
    startCmd,
    "```",
    "",
    "## Environment Variables",
    "",
    "Copy `.env.example` to `.env.local` and fill in the required values:",
    "",
    analysis.envVarsDetected.length > 0
      ? `\`\`\`\n${analysis.envVarsDetected.map((v) => `${v}=`).join("\n")}\n\`\`\``
      : "```\n# Add your environment variables here\n```",
    "",
    "## Deployment",
    "",
    "### Vercel (Recommended)",
    "",
    `[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=${repoUrl})`,
    "",
    "Or deploy manually:",
    "",
    "1. Push your code to GitHub",
    "2. Import the repository at [vercel.com/new](https://vercel.com/new)",
    "3. Vercel will auto-detect the framework and configure build settings",
    "4. Add your environment variables in the Vercel dashboard",
    "5. Deploy!",
    "",
    "### Railway",
    "",
    "1. Create a new project at [railway.app](https://railway.app)",
    "2. Connect your GitHub repository",
    "3. Railway will auto-detect the build settings from `railway.toml`",
    "4. Add your environment variables",
    "5. Deploy!",
    "",
    "## Contributing",
    "",
    "Contributions are welcome! Please follow these steps:",
    "",
    "1. Fork the repository",
    "2. Create a feature branch (`git checkout -b feat/amazing-feature`)",
    "3. Commit your changes (`git commit -m 'feat: add amazing feature'`)",
    "4. Push to the branch (`git push origin feat/amazing-feature`)",
    "5. Open a Pull Request",
    "",
    "## License",
    "",
    "This project is open source and available under the [MIT License](LICENSE).",
    "",
    "## Support",
    "",
    `If you have any questions or run into issues, please [open an issue](${repoUrl}/issues).`,
    "",
    "---",
    "",
    "_Generated by [Shipwright](https://github.com/VpkDevs/Shipwright) 🚢_",
  ];

  return sections.join("\n");
}
