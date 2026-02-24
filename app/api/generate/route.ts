import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RepoAnalyzer } from "@/lib/analyzer";
import {
  generateVercelJsonFile,
  generatePackageJsonScripts,
} from "@/lib/generators/vercel-config";
import { generateEnvTemplate } from "@/lib/generators/env-template";
import { generateReadme } from "@/lib/generators/readme";
import { generateLandingPage } from "@/lib/generators/landing";
import { z } from "zod";

const generateSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  description: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !(session.user as any).accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { owner, repo, description } = generateSchema.parse(body);

    const token = (session.user as any).accessToken;
    const analyzer = new RepoAnalyzer(token);

    const analysis = await analyzer.analyze(owner, repo);

    const generated = {
      vercelJson: generateVercelJsonFile(analysis),
      packageJsonScripts: generatePackageJsonScripts(analysis),
      envTemplate: generateEnvTemplate(analysis),
      readme: generateReadme(repo, analysis, description),
      landingPage: generateLandingPage(repo, analysis, description),
    };

    return Response.json(generated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    console.error("Failed to generate content:", error);
    return Response.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
