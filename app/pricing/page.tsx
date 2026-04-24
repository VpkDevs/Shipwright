import { defaultMetadata, siteName } from "@/lib/seo";
import type { Metadata } from "next";
import PricingClient from "./PricingClient";

export const metadata: Metadata = {
  ...defaultMetadata,
  title: `Pricing - ${siteName}`,
  description: "Explore Shipwright's pricing plans for AI-powered repo shipping.",
};

export default function PricingPage() {
  return <PricingClient />;
}
