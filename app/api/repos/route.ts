import { authOptions } from "@/lib/auth";
import { GitHubClient } from "@/lib/github";
import { createLogger, generateRequestId } from "@/lib/logger";
import { getServerSession } from "next-auth";
import { z } from "zod";

interface RepoListItem {
  id: number;
  name: string;
  full_name: string;
  description: string;
  htmlUrl: string;
  language: string;
  stargazers_count: number;
  private: boolean;
  fork: boolean;
  archived: boolean;
  updatedAt: string;
}

export async function GET() {
  const requestId = generateRequestId();
  const logger = createLogger({
    requestId,
    route: "GET /api/repos",
  });

  const session = await getServerSession(authOptions);

  if (!session?.user?.accessToken) {
    logger.warn("Unauthorized repos list request: missing GitHub access token");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = session.user.accessToken;
  const client = new GitHubClient(token);

  try {
    const repos = await client.getUserRepos();
    logger.info("Fetched user repositories", { count: repos.length });

    const payload: RepoListItem[] = repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description || "",
      htmlUrl: repo.html_url,
      language: repo.language || "",
      stargazers_count: repo.stargazers_count,
      private: repo.private,
      fork: repo.fork,
      archived: repo.archived,
      updatedAt: repo.updated_at || repo.created_at || new Date(0).toISOString(),
    }));

    return Response.json(payload);
  } catch (error) {
    logger.error("Failed to fetch repos", undefined, error);
    return Response.json({ error: "Failed to fetch repositories" }, { status: 500 });
  }
}

const createPRSchema = z
  .object({
    action: z.literal("create_pr"),
    owner: z.string().trim().min(1).max(100),
    repo: z.string().trim().min(1).max(100),
    files: z
      .array(
        z.object({
          path: z
            .string()
            .trim()
            .min(1)
            .max(200)
            .refine((value) => !value.startsWith("/") && !value.includes(".."), {
              message: "Invalid file path",
            }),
          content: z.string(),
        })
      )
      .min(1)
      .max(10),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    for (const [index, file] of value.files.entries()) {
      const key = file.path.toLowerCase();
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate file paths are not allowed",
          path: ["files", index, "path"],
        });
      }
      seen.add(key);
    }
  });

export async function POST(request: Request) {
  const requestId = generateRequestId();
  const logger = createLogger({
    requestId,
    route: "POST /api/repos",
  });

  const session = await getServerSession(authOptions);

  if (!session?.user?.accessToken) {
    logger.warn("Unauthorized PR creation request: missing GitHub access token");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    logger.warn("Invalid JSON body for PR creation", {
      error: error instanceof Error ? error.message : String(error),
    });
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createPRSchema.safeParse(body);
  if (!parsed.success) {
    logger.warn("Invalid PR creation parameters");
    return Response.json({ error: "Invalid request parameters" }, { status: 400 });
  }

  const { owner, repo, files } = parsed.data;
  const token = session.user.accessToken;
  const client = new GitHubClient(token);

  const branchName = `shipwright/ship-${Date.now()}`;
  const repoMetadata = await client.getRepo(owner, repo);
  const defaultBranch = repoMetadata?.default_branch || "main";

  logger.info("Creating ship branch for PR", {
    owner,
    repo,
    branchName,
    fileCount: files.length,
    defaultBranch,
  });

  let branch = await client.createBranch(owner, repo, branchName, defaultBranch);
  if (!branch && defaultBranch !== "main") {
    logger.warn("Failed to create branch from default branch, trying main", {
      owner,
      repo,
      branchName,
      defaultBranch,
    });
    branch = await client.createBranch(owner, repo, branchName, "main");
  }
  if (!branch && defaultBranch !== "master") {
    logger.warn("Failed to create branch from default/main branch, trying master", {
      owner,
      repo,
      branchName,
      defaultBranch,
    });
    branch = await client.createBranch(owner, repo, branchName, "master");
  }
  if (!branch) {
    logger.error("Failed to create branch for PR", { owner, repo, branchName });
    return Response.json(
      {
        error:
          "Could not create branch — ensure the repository has a default branch (main or master).",
      },
      { status: 500 }
    );
  }

  // Commit each file to the new branch
  for (const file of files) {
    const result = await client.createOrUpdateFile(
      owner,
      repo,
      file.path,
      file.content,
      branchName,
      `chore: add ${file.path} via Shipwright`
    );
    if (!result) {
      logger.error("Failed to commit file to branch", { owner, repo, branchName, path: file.path });
      return Response.json({ error: `Failed to commit ${file.path} to branch.` }, { status: 500 });
    }
  }

  // Create pull request
  const pr = await client.createPullRequest(
    owner,
    repo,
    "🚀 Ship: Add AI-generated deployment configs",
    `## Generated by [Shipwright](https://shipwright.dev)\n\nThis PR adds the following files generated by Shipwright AI:\n\n${files.map((f) => `- \`${f.path}\``).join("\n")}\n\n### What's included\n- **README.md** — AI-generated documentation from your actual codebase\n- **vercel.json** — Production deployment config\n- **.env.example** — Documented environment variables\n\n> Generated with Shipwright · [shipwright.dev](https://shipwright.dev)`,
    branchName,
    defaultBranch
  );

  // Try master if default-branch PR creation fails
  if (!pr) {
    logger.warn("PR creation against default branch failed, trying master", {
      owner,
      repo,
      branchName,
      defaultBranch,
    });
    const prMaster = await client.createPullRequest(
      owner,
      repo,
      "🚀 Ship: Add AI-generated deployment configs",
      `## Generated by [Shipwright](https://shipwright.dev)\n\nThis PR adds the following files:\n\n${files.map((f) => `- \`${f.path}\``).join("\n")}`,
      branchName,
      "master"
    );
    if (!prMaster) {
      logger.error("PR creation failed for both main and master", { owner, repo, branchName });
      return Response.json(
        {
          error: "Files committed but PR creation failed. Check the repository for the new branch.",
        },
        { status: 500 }
      );
    }
    logger.info("PR created against master", { url: prMaster.html_url, branchName });
    return Response.json({ url: prMaster.html_url, branch: branchName });
  }

  logger.info("PR created against default branch", {
    url: pr.html_url,
    branchName,
    defaultBranch,
  });
  return Response.json({ url: pr.html_url, branch: branchName });
}
