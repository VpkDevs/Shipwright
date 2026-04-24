import { RepoAnalyzer } from "@/lib/analyzer";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { repositories } from "@/lib/db/schema";
import { RateLimitError, ValidationError } from "@/lib/errors";
import { enrichAnalysisWithGemini } from "@/lib/gemini-analyzer";
import { checkRateLimit } from "@/lib/rate-limit";
import { withErrorHandler } from "@/lib/with-error-handler";
import { getServerSession } from "next-auth";
import { z } from "zod";

const analyzeSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  repoId: z.string().optional(),
});

export const POST = withErrorHandler(async (request: Request) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    throw new ValidationError("auth", "Not authenticated");
  }

  if (!session.user.accessToken) {
    throw new ValidationError("auth", "Missing access token");
  }

  const rateLimitResult = await checkRateLimit(session.user.email, "/api/analyze");
  if (!rateLimitResult.success) {
    throw new RateLimitError(rateLimitResult.retryAfter || 60);
  }

  const body = await request.json();
  const { owner, repo, repoId } = analyzeSchema.parse(body);

  const analyzer = new RepoAnalyzer(session.user.accessToken);
  const analysis = await analyzer.analyze(owner, repo);

  // Enrich with Gemini
  const enrichment = await enrichAnalysisWithGemini(
    (analysis as any).packageJson,
    (analysis as any).fileTree,
    (analysis as any).readme,
    (analysis as any).framework
  );

  if (enrichment) {
    (analysis as any).framework = enrichment.framework;
    (analysis as any).missingEnvVars = [
      ...new Set([...((analysis as any).missingEnvVars || []), ...enrichment.missingEnvVars]),
    ];
    (analysis as any).readinessSummary = enrichment.readinessSummary;
  }

  // Save to DB
  const db = getDb();
  if (repoId && session.user.id) {
    try {
      await db.insert(repositories).values({
        user_id: session.user.id,
        github_repo_id: repoId,
        owner,
        name: repo,
        framework: (analysis as any).framework,
        risk_score: (analysis as any).riskScore,
        last_analyzed_at: new Date(),
      });
    } catch (_e) {
      // Silently fail DB insert (analysis still works without DB)
    }
  }

  return new Response(JSON.stringify(analysis), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
