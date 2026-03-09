import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RepoAnalyzer } from "@/lib/analyzer";
import { z } from "zod";
import { createLogger, generateRequestId } from "@/lib/logger";

const analyzeSchema = z.object({
  owner: z.string(),
  repo: z.string(),
});

export async function POST(request: Request) {
  const requestId = generateRequestId();
  const logger = createLogger({
    requestId,
    route: "POST /api/analyze",
  });

  const session = await getServerSession(authOptions);

  if (!session?.user || !(session.user as any).accessToken) {
    logger.warn("Unauthorized analyze request: missing GitHub access token");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { owner, repo } = analyzeSchema.parse(body);

    const token = (session.user as any).accessToken;
    const analyzer = new RepoAnalyzer(token);

    logger.info("Analyzing repository", { owner, repo });

    const analysis = await analyzer.analyze(owner, repo);

    logger.info("Repository analysis succeeded", {
      owner,
      repo,
      framework: analysis.framework,
      backendType: analysis.backendType,
      deploymentRiskScore: analysis.deploymentRiskScore,
    });

    return Response.json(analysis);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    logger.error("Failed to analyze repo", undefined, error);
    return Response.json(
      { error: "Failed to analyze repository" },
      { status: 500 }
    );
  }
}
