import { authOptions } from "@/lib/auth";
import { GitHubClient } from "@/lib/github";
import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = new GitHubClient(session.user.accessToken);

  try {
    const repos = await client.getUserRepos();
    return Response.json(repos);
  } catch (error) {
    console.error("Failed to fetch repos:", error);
    return Response.json({ error: "Failed to fetch repositories" }, { status: 500 });
  }
}
