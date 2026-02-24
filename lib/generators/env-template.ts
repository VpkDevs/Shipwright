import { RepoAnalysis } from "@/types";

export function generateEnvTemplate(analysis: RepoAnalysis): string {
  if (analysis.envVarsDetected.length === 0) {
    return "# Add your environment variables here\n";
  }

  const lines = analysis.envVarsDetected.map((envVar) => {
    const hint = getEnvVarHint(envVar);
    return `${envVar}=${hint}`;
  });

  return (
    "# Environment variables\n" +
    "# Copy this file to .env.local and fill in the values\n\n" +
    lines.join("\n") +
    "\n"
  );
}

function getEnvVarHint(envVar: string): string {
  const lowerVar = envVar.toLowerCase();

  if (lowerVar.includes("key")) return "your-key-here";
  if (lowerVar.includes("secret")) return "your-secret-here";
  if (lowerVar.includes("url") || lowerVar.includes("uri")) return "https://example.com";
  if (lowerVar.includes("token")) return "your-token-here";
  if (lowerVar.includes("id")) return "your-id-here";
  if (lowerVar.includes("password") || lowerVar.includes("pwd")) return "your-password-here";
  if (lowerVar.includes("host") || lowerVar.includes("db")) return "localhost";
  if (lowerVar.includes("port")) return "3000";
  if (lowerVar.includes("env")) return "development";

  return "";
}
