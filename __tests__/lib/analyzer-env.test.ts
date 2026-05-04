import { RepoAnalyzer } from "@/lib/analyzer";
import { describe, expect, it } from "vitest";

describe("RepoAnalyzer env var extraction", () => {
  it("detects environment variables from common JavaScript runtime patterns", () => {
    const analyzer = new RepoAnalyzer("test-token");

    const vars = analyzer.extractEnvVarsFromSource(`
      const a = process.env.DATABASE_URL;
      const b = process.env["NEXTAUTH_SECRET"];
      const c = import.meta.env.VITE_PUBLIC_API_URL;
      const d = Deno.env.get("EDGE_TOKEN");
    `);

    expect(vars).toEqual(["DATABASE_URL", "NEXTAUTH_SECRET", "VITE_PUBLIC_API_URL", "EDGE_TOKEN"]);
  });
});
