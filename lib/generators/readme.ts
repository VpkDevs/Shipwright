import type { RepoAnalysis } from "@/types";

export function generateReadme(
  repoName: string,
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

  const sections = [
    `# ${repoName}`,
    "",
    description || analysis.description,
    "",
    "## Features",
    "",
    "- ✨ Fast and performant",
    "- 🔧 Easy to configure",
    "- 📦 Production-ready",
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
    ...(analysis.hasDocker ? ["- Docker"] : []),
    "",
    "### Installation",
    "",
    "```bash",
    installCmd,
    "```",
    "",
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
    "### Vercel",
    "",
    "This project is optimized for deployment on Vercel:",
    "",
    "1. Push your code to GitHub",
    "2. Import the repository to Vercel",
    "3. Vercel will automatically detect the framework and build settings",
    "4. Deploy!",
    "",
    "[Learn more about deploying to Vercel](https://vercel.com/docs)",
    "",
    "## Contributing",
    "",
    "Contributions are welcome! Please feel free to submit a Pull Request.",
    "",
    "## License",
    "",
    "This project is open source and available under the MIT License.",
    "",
    "## Support",
    "",
    "If you have any questions or issues, please open an issue on GitHub.",
  ];

  return sections.join("\n");
}
