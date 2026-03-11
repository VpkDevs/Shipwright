import { Octokit } from "@octokit/rest";

export interface FileContent {
  path: string;
  content: string;
  type: "file" | "dir";
}

export type GitHubOctokitLike = Pick<Octokit, "repos" | "git" | "pulls">;

export class GitHubClient {
  private octokit: GitHubOctokitLike;

  constructor(token: string, octokit?: GitHubOctokitLike) {
    this.octokit = octokit ?? new Octokit({ auth: token });
  }

  async getUserRepos() {
    const { data } = await this.octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      direction: "desc",
      per_page: 100,
    });
    return data;
  }

  async getRepo(owner: string, repo: string) {
    try {
      const { data } = await this.octokit.repos.get({
        owner,
        repo,
      });
      return data;
    } catch {
      return null;
    }
  }

  async getRepoContents(owner: string, repo: string, path = "") {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
      });

      if (Array.isArray(data)) {
        return data;
      }

      if ("content" in data) {
        const content = Buffer.from(data.content, "base64").toString("utf-8");
        return { path: data.path, content };
      }

      return data;
    } catch {
      return null;
    }
  }

  async getFileContent(owner: string, repo: string, path: string) {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
      });

      if (!("content" in data)) {
        return null;
      }

      return Buffer.from(data.content, "base64").toString("utf-8");
    } catch {
      return null;
    }
  }

  async getFileTree(owner: string, repo: string, maxDepth = 2) {
    const files: FileContent[] = [];

    const traverse = async (path: string, depth: number) => {
      if (depth > maxDepth) return;

      try {
        const contents = await this.getRepoContents(owner, repo, path);
        if (!Array.isArray(contents)) return;

        for (const item of contents) {
          if (item.type === "dir" && depth < maxDepth) {
            await traverse(item.path, depth + 1);
          } else if (item.type === "file") {
            files.push({
              path: item.path,
              type: item.type,
              content: item.name,
            });
          }
        }
      } catch {
        return;
      }
    };

    await traverse("", 0);
    return files;
  }

  async createBranch(owner: string, repo: string, branchName: string, fromBranch = "main") {
    try {
      const { data: refData } = await this.octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${fromBranch}`,
      });

      const { data: newRef } = await this.octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: refData.object.sha,
      });

      return newRef;
    } catch {
      return null;
    }
  }

  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    branch: string,
    message: string
  ) {
    try {
      let sha: string | undefined;

      const existing = await this.octokit.repos
        .getContent({
          owner,
          repo,
          path,
          ref: branch,
        })
        .catch(() => null);

      if (existing && !Array.isArray(existing.data) && "sha" in existing.data) {
        sha = existing.data.sha;
      }

      const { data } = await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString("base64"),
        branch,
        sha,
      });

      return data;
    } catch {
      return null;
    }
  }

  async createPullRequest(
    owner: string,
    repo: string,
    title: string,
    body: string,
    head: string,
    base = "main"
  ) {
    try {
      const { data } = await this.octokit.pulls.create({
        owner,
        repo,
        title,
        body,
        head,
        base,
      });

      return data;
    } catch {
      return null;
    }
  }
}
