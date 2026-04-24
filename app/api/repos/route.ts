import { authOptions } from "@/lib/auth";
import { RateLimitError, ValidationError } from "@/lib/errors";
import { GitHubClient } from "@/lib/github";
import { checkRateLimit } from "@/lib/rate-limit";
import { withErrorHandler } from "@/lib/with-error-handler";
import { getServerSession } from "next-auth";

export const GET = withErrorHandler(async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    throw new ValidationError("auth", "Not authenticated");
  }

  if (!session.user.accessToken) {
    throw new ValidationError("auth", "Missing access token");
  }

  const rateLimitResult = await checkRateLimit(session.user.email, "/api/repos");
  if (!rateLimitResult.success) {
    throw new RateLimitError(rateLimitResult.retryAfter || 60);
  }

  const client = new GitHubClient(session.user.accessToken);

  const repos = await client.getUserRepos();
  return new Response(JSON.stringify(repos), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
