import { defaultMetadata, siteName } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  ...defaultMetadata,
  title: `${siteName} – From Repository to Production`,
  description:
    "AI-powered deployment configs, READMEs, and landing pages generated from your actual code.",
  openGraph: {
    ...defaultMetadata.openGraph,
    title: `${siteName} – From Repository to Production`,
    description:
      "AI-powered deployment configs, READMEs, and landing pages generated from your actual code.",
  },
};

export default function Page() {
  const Home = require("./page.client").default;
  return <Home />;
}
