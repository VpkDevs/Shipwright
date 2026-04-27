import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({
    GITHUB_ID: process.env.GITHUB_ID ? "✓ Loaded" : "✗ Missing",
    GITHUB_SECRET: process.env.GITHUB_SECRET ? "✓ Loaded" : "✗ Missing",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "Not set",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "✓ Loaded" : "✗ Missing",
    NODE_ENV: process.env.NODE_ENV,
  });
}
