import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { metadata as layoutMeta } from "@/app/layout";
import { metadata as homeMeta } from "@/app/page";
import { metadata as pricingMeta } from "@/app/pricing/page";
import { generateMetadata as repoGenerate } from "@/app/repos/[...slug]/page";
import { metadata as reposMeta } from "@/app/repos/page";

type RepoMetadataArgs = {
  params: Promise<{
    slug?: string[];
  }>;
};

describe("SEO metadata", () => {
  it("layout metadata includes openGraph and twitter settings", () => {
    expect(layoutMeta).toBeDefined();
    expect(layoutMeta.openGraph).toBeDefined();
    expect(layoutMeta.twitter).toBeDefined();
    expect(layoutMeta.keywords).toContain("GitHub");
  });

  it("home page metadata overrides the title and description", () => {
    expect(homeMeta.title).toMatch(/From Repository to Production/);
    expect(homeMeta.description).toContain("AI-powered deployment");
  });

  it("repos listing metadata is sensible", () => {
    expect(reposMeta.title).toContain("Repositories");
    expect(reposMeta.description).toMatch(/Select a GitHub repo/);
  });

  it("pricing metadata mentions pricing and site name", () => {
    expect(pricingMeta.title).toMatch(/Pricing/);
    expect(pricingMeta.description).toMatch(/pricing plans/);
  });

  it("repoGenerate generates metadata for a given repo path", async () => {
    const generated = await repoGenerate({
      params: Promise.resolve({ slug: ["owner", "repo"] }),
    } satisfies RepoMetadataArgs);
    expect(generated.title).toContain("owner/repo");
    expect(generated.description).toContain("GitHub repository owner/repo");
  });

  it("layout file contains JSON-LD structured data marker", () => {
    const layoutPath = path.join(process.cwd(), "app/layout.tsx");
    const contents = fs.readFileSync(layoutPath, "utf-8");
    expect(contents).toContain("application/ld+json");
  });
});
