import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RepoAnalyzer } from "@/lib/analyzer";
import { z } from "zod";

const analyzeSchema = z.object({
  owner: z.string(),
  repo: z.string(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !(session.user as any).accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { owner, repo } = analyzeSchema.parse(body);

    const token = (session.user as any).accessToken;
    const analyzer = new RepoAnalyzer(token);

    const analysis = await analyzer.analyze(owner, repo);

    return Response.json(analysis);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    console.error("Failed to analyze repo:", error);
    return Response.json(
      { error: "Failed to analyze repository" },
      { status: 500 }
    );
  }
}
