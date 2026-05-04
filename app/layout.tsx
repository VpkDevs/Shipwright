import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shipwright — Turn GitHub Repos Into Live Products in Minutes",
  description:
    "Analyze any GitHub repo and instantly generate Vercel configs, README files, landing pages, and .env templates — packaged as a pull request. $5/repo or $15/month unlimited.",
  keywords: [
    "github deployment",
    "vercel config generator",
    "readme generator",
    "deploy github repo",
    "side project tools",
    "indie dev tools",
  ],
  openGraph: {
    title: "Shipwright — From GitHub to Deployed in 15 Minutes",
    description:
      "AI-powered deployment configs, README, and landing page for your GitHub repos. One PR. Done.",
    siteName: "Shipwright",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shipwright — Turn GitHub Repos Into Live Products",
    description:
      "AI-generated deployment configs, README, and landing page. One PR. Ship your dormant repos.",
    creator: "@vpkdevs",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
