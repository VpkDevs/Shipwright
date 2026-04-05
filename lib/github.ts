import { Octokit } from "@octokit/rest";

export interface FileContent {
  path: string;
  content: string;
  type: "file" | "dir";
}

export class GitHubClient {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async getUserRepos() {
    const { data } = await this.octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      direction: "desc",
      per_page: 100,
    });
    return data;
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
              content: "",
            });
          }
        }
      } catch (err) {
        console.error(`Failed to traverse path "${path}":`, err);
      }
    };

    await traverse("", 0);
    return files;
  }

  async createBranch(owner: string, repo: string, branchName: string, fromBranch = "main") {
    try {
      // Try to get the ref from the specified base branch; fall back to HEAD
      let sha: string | undefined;
      try {
        const { data: refData } = await this.octokit.git.getRef({
          owner,
          repo,
          ref: `heads/${fromBranch}`,
        });
        sha = refData.object.sha;
      } catch {
        // Base branch not found, try to get the default branch HEAD
        const { data: repoData } = await this.octokit.repos.get({ owner, repo });
        const { data: refData } = await this.octokit.git.getRef({
          owner,
          repo,
          ref: `heads/${repoData.default_branch}`,
        });
        sha = refData.object.sha;
      }

      const { data: newRef } = await this.octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha,
      });

      return newRef;
    } catch (err) {
      console.error("Failed to create branch:", err);
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
      // Check if the file already exists to get its SHA (required for updates)
      let fileSha: string | undefined;
      try {
        const { data } = await this.octokit.repos.getContent({
          owner,
          repo,
          path,
          ref: branch,
        });
        if (!Array.isArray(data) && "sha" in data) {
          fileSha = data.sha;
        }
      } catch {
        // File doesn't exist yet, that's fine
      }

      const { data } = await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString("base64"),
        branch,
        ...(fileSha ? { sha: fileSha } : {}),
      });

      return data;
    } catch (err) {
      console.error(`Failed to create/update file "${path}":`, err);
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
    } catch (err) {
      console.error("Failed to create pull request:", err);
      return null;
    }
  }
}
