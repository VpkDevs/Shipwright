import { describe, expect, it } from "vitest";
import { getUsableTestScript, RepoAnalyzer } from "@/lib/analyzer";

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

describe("getUsableTestScript", () => {
  it("ignores npm's default failing test placeholder", () => {
    expect(getUsableTestScript('echo "Error: no test specified" && exit 1')).toBeNull();
  });

  it("keeps real test scripts", () => {
    expect(getUsableTestScript("vitest run")).toBe("vitest run");
  });
});
