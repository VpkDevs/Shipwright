import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GitHubClient } from "@/lib/github";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !(session.user as any).accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = (session.user as any).accessToken;
  const client = new GitHubClient(token);

  try {
    const repos = await client.getUserRepos();
    return Response.json(repos);
  } catch (error) {
    console.error("Failed to fetch repos:", error);
    return Response.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
