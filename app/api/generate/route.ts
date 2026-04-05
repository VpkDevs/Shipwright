import { RepoAnalyzer } from "@/lib/analyzer";
import { authOptions } from "@/lib/auth";
import { generateEnvTemplate } from "@/lib/generators/env-template";
import { generateLandingPage } from "@/lib/generators/landing";
import { generateReadme } from "@/lib/generators/readme";
import { generatePackageJsonScripts, generateVercelJsonFile } from "@/lib/generators/vercel-config";
import { getServerSession } from "next-auth";
import { z } from "zod";

const generateSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  description: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { owner, repo, description } = generateSchema.parse(body);

    const analyzer = new RepoAnalyzer(session.user.accessToken);

    const analysis = await analyzer.analyze(owner, repo);

    const generated = {
      vercelJson: generateVercelJsonFile(analysis),
      packageJsonScripts: generatePackageJsonScripts(analysis),
      envTemplate: generateEnvTemplate(analysis),
      readme: generateReadme(repo, analysis, description),
      landingPage: generateLandingPage(owner, repo, analysis, description),
    };

    return Response.json(generated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request parameters" }, { status: 400 });
    }

    console.error("Failed to generate content:", error);
    return Response.json({ error: "Failed to generate content" }, { status: 500 });
  }
}
