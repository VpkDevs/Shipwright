import { RepoAnalyzer } from "@/lib/analyzer";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { z } from "zod";

const analyzeSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { owner, repo } = analyzeSchema.parse(body);

    const analyzer = new RepoAnalyzer(session.user.accessToken);

    const analysis = await analyzer.analyze(owner, repo);

    return Response.json(analysis);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request parameters" }, { status: 400 });
    }

    console.error("Failed to analyze repo:", error);
    return Response.json({ error: "Failed to analyze repository" }, { status: 500 });
  }
}
