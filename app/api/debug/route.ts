export async function GET() {
  return Response.json({
    GITHUB_ID: process.env.GITHUB_ID ? "✓ Loaded" : "✗ Missing",
    GITHUB_SECRET: process.env.GITHUB_SECRET ? "✓ Loaded" : "✗ Missing",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "Not set",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "✓ Loaded" : "✗ Missing",
    NODE_ENV: process.env.NODE_ENV,
  });
}
