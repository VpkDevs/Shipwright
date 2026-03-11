import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shipwright",
  description: "Turn dormant repos into live products in minutes",
};

import { ToastProvider } from "@/lib/toast";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
