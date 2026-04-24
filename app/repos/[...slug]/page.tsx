import { makeRepoMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import RepoPageClient from "./RepoPageClient";

type RepoParams = {
  slug?: string[];
};

type RepoPageProps = {
  params: Promise<RepoParams>;
};

async function resolveRepoPath(params: Promise<RepoParams>) {
  const resolved = await params;
  const slug = Array.isArray(resolved?.slug) ? resolved.slug : [];
  if (slug.length >= 2) {
    return `${slug[0]}/${slug[1]}`;
  }
  return slug.join("/") || "repository";
}

export async function generateMetadata({ params }: RepoPageProps): Promise<Metadata> {
  return makeRepoMetadata(await resolveRepoPath(params));
}

export default function Page() {
  return <RepoPageClient />;
}
