import { RepoAnalyzer } from "@/lib/analyzer";
import { authOptions } from "@/lib/auth";
import { generateEnvTemplate } from "@/lib/generators/env-template";
import { generateLandingPage } from "@/lib/generators/landing";
import { generateReadme } from "@/lib/generators/readme";
import {
  generatePackageJsonScripts,
  generateRailwayConfig,
  generateVercelJsonFile,
} from "@/lib/generators/vercel-config";
import Anthropic from "@anthropic-ai/sdk";
import { getServerSession } from "next-auth";
import { z } from "zod";

const generateSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  description: z.string().optional(),
});

async function enhanceWithAI(
  repoName: string,
  baseReadme: string,
  baseLanding: string,
  description: string
): Promise<{ readme: string; landingPage: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { readme: baseReadme, landingPage: baseLanding };
  }

  try {
    const client = new Anthropic({ apiKey });

    const [readmeMsg, landingMsg] = await Promise.all([
      client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: `You are a technical writer. Improve the following README for the "${repoName}" project. Make it more engaging, professional, and comprehensive. Keep all the technical sections but make the language more compelling. Project description: "${description}"\n\nExisting README:\n${baseReadme}\n\nReturn only the improved README markdown, no commentary.`,
          },
        ],
      }),
      client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `You are a web designer. Improve the following landing page HTML for the "${repoName}" project. Make the copy more compelling and the design suggestions more appealing. Keep the same HTML structure but improve text content and make the description section more persuasive. Project description: "${description}"\n\nExisting HTML:\n${baseLanding}\n\nReturn only the improved HTML, no commentary.`,
          },
        ],
      }),
    ]);

    const readmeContent = readmeMsg.content[0];
    const landingContent = landingMsg.content[0];

    return {
      readme: readmeContent.type === "text" ? readmeContent.text : baseReadme,
      landingPage: landingContent.type === "text" ? landingContent.text : baseLanding,
    };
  } catch (err) {
    console.error("AI enhancement failed, using template output:", err);
    return { readme: baseReadme, landingPage: baseLanding };
  }
}

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

    const baseReadme = generateReadme(repo, analysis, description);
    const baseLanding = generateLandingPage(owner, repo, analysis, description);

    const { readme, landingPage } = await enhanceWithAI(
      repo,
      baseReadme,
      baseLanding,
      description ?? analysis.description
    );

    const generated = {
      vercelJson: generateVercelJsonFile(analysis),
      railwayToml: generateRailwayConfig(analysis),
      packageJsonScripts: generatePackageJsonScripts(analysis),
      envTemplate: generateEnvTemplate(analysis),
      readme,
      landingPage,
      aiEnhanced: !!process.env.ANTHROPIC_API_KEY,
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
