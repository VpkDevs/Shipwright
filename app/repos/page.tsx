import { defaultMetadata, siteName } from "@/lib/seo";
import type { Metadata } from "next";
import ReposClient from "./ReposClient";

export const metadata: Metadata = {
  ...defaultMetadata,
  title: `Your Repositories - ${siteName}`,
  description: "Select a GitHub repo to analyze and generate deployment resources.",
};

export default function Page() {
  return <ReposClient />;
}
