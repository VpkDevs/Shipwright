import type { GitHubOctokitLike } from "@/lib/github";
import { GitHubClient } from "@/lib/github";
import { describe, expect, it, vi } from "vitest";

function createMockOctokit() {
  return {
    repos: {
      listForAuthenticatedUser: vi.fn(),
      get: vi.fn(),
      getContent: vi.fn(),
      createOrUpdateFileContents: vi.fn(),
    },
    git: {
      getRef: vi.fn(),
      createRef: vi.fn(),
    },
    pulls: {
      create: vi.fn(),
    },
  };
}

describe("GitHubClient", () => {
  it("sends sha when updating an existing file", async () => {
    const octokit = createMockOctokit();
    octokit.repos.getContent.mockResolvedValue({ data: { sha: "abc123" } });
    octokit.repos.createOrUpdateFileContents.mockResolvedValue({ data: {} });
    const client = new GitHubClient("token", octokit as unknown as GitHubOctokitLike);

    await client.createOrUpdateFile("o", "r", "path", "content", "branch", "msg");
    expect(octokit.repos.createOrUpdateFileContents).toHaveBeenCalledWith(
      expect.objectContaining({ sha: "abc123" })
    );
  });

  it("skips sha when file does not exist", async () => {
    const octokit = createMockOctokit();
    octokit.repos.getContent.mockRejectedValue(new Error("not found"));
    octokit.repos.createOrUpdateFileContents.mockResolvedValue({ data: {} });
    const client = new GitHubClient("token", octokit as unknown as GitHubOctokitLike);

    await client.createOrUpdateFile("o", "r", "path", "content", "branch", "msg");
    expect(octokit.repos.createOrUpdateFileContents).toHaveBeenCalledWith(
      expect.not.objectContaining({ sha: expect.any(String) })
    );
  });

  it("getRepo returns data or null", async () => {
    const octokit = createMockOctokit();
    octokit.repos.get.mockResolvedValue({ data: { full_name: "o/r" } });
    const client = new GitHubClient("token", octokit as unknown as GitHubOctokitLike);

    const info = await client.getRepo("o", "r");
    expect(info).toEqual({ full_name: "o/r" });

    octokit.repos.get.mockRejectedValue(new Error("not found"));
    const info2 = await client.getRepo("o", "x");
    expect(info2).toBeNull();
  });
});
