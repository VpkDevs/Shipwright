import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shipwright",
  description: "Deployment readiness for solo builders with unfinished GitHub repos",
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
