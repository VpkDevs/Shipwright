import type { Metadata } from "next";
import "./globals.css";

// SEO defaults for the entire site
import { defaultMetadata, metadataBase, siteName } from "@/lib/seo";

export const metadata: Metadata = defaultMetadata;

import { ToastProvider } from "@/lib/toast";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: metadataBase.toString(),
    logo: `${metadataBase.toString()}/logo.svg`,
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        <ToastProvider>
          {children}
          <script type="application/ld+json">{JSON.stringify(orgSchema)}</script>
        </ToastProvider>
      </body>
    </html>
  );
}
