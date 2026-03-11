import { type PackageJson, analyzeRepositorySnapshot } from "@/lib/analyzer";
import { describe, expect, it } from "vitest";

function buildSnapshot(input: {
  packageJson: PackageJson | null;
  filePaths: string[];
  fileContents?: Record<string, string>;
  usesTypeScript?: boolean;
}) {
  return {
    packageJson: input.packageJson,
    filePaths: input.filePaths,
    fileContents: input.fileContents ?? {},
    usesTypeScript: input.usesTypeScript,
  };
}

describe("analyzeRepositorySnapshot", () => {
  it("detects Next.js repos with Bun, API routes, and env usage", () => {
    const result = analyzeRepositorySnapshot(
      buildSnapshot({
        packageJson: {
          packageManager: "bun@1.1.38",
          dependencies: {
            next: "15.0.0",
            react: "19.0.0",
          },
          scripts: {
            dev: "next dev",
            build: "next build",
            start: "next start",
          },
        },
        filePaths: [
          "tsconfig.json",
          "app/layout.tsx",
          "app/page.tsx",
          "app/api/repos/route.ts",
          ".env.example",
          "vercel.json",
        ],
        fileContents: {
          ".env.example": "NEXTAUTH_SECRET=\nDATABASE_URL=\n",
          "app/page.tsx": "const api = process.env.NEXT_PUBLIC_API_URL;",
        },
      })
    );

    expect(result.framework).toBe("Next.js");
    expect(result.packageManager).toBe("bun");
    expect(result.backendType).toBe("Next.js API Routes");
    expect(result.envVarsDetected).toEqual([
      "DATABASE_URL",
      "NEXTAUTH_SECRET",
      "NEXT_PUBLIC_API_URL",
    ]);
    expect(result.missingConfigs).toEqual([]);
    expect(result.usesTypeScript).toBe(true);
    expect(result.deploymentRiskScore).toBeLessThan(20);
  });

  it("flags missing deployment basics for a React app", () => {
    const result = analyzeRepositorySnapshot(
      buildSnapshot({
        packageJson: {
          dependencies: {
            react: "19.0.0",
          },
          devDependencies: {
            vite: "5.0.0",
          },
          scripts: {},
        },
        filePaths: ["package-lock.json", "vite.config.ts", "src/main.tsx"],
        fileContents: {
          "src/main.tsx": "const api = import.meta.env.VITE_API_URL;",
        },
      })
    );

    expect(result.framework).toBe("React");
    expect(result.packageManager).toBe("npm");
    expect(result.backendType).toBe("Frontend");
    expect(result.envVarsDetected).toEqual(["VITE_API_URL"]);
    expect(result.missingConfigs).toEqual(["build script", "dev script", ".env.example"]);
    expect(result.deploymentRiskScore).toBeGreaterThan(45);
  });

  it("does not require a build script for an Express server with Docker", () => {
    const result = analyzeRepositorySnapshot(
      buildSnapshot({
        packageJson: {
          dependencies: {
            express: "4.0.0",
          },
          scripts: {
            start: "node server.js",
            dev: "nodemon server.js",
          },
        },
        filePaths: ["pnpm-lock.yaml", "Dockerfile", "server.js"],
        fileContents: {
          "server.js": "app.listen(process.env.PORT); const db = process.env.DATABASE_URL;",
        },
      })
    );

    expect(result.framework).toBe("Node.js");
    expect(result.packageManager).toBe("pnpm");
    expect(result.backendType).toBe("Express");
    expect(result.envVarsDetected).toEqual(["DATABASE_URL", "PORT"]);
    expect(result.missingConfigs).toEqual([".env.example"]);
    expect(result.deploymentRiskScore).toBeLessThan(20);
  });

  it("detects Remix from file structure and Yarn from repo markers", () => {
    const result = analyzeRepositorySnapshot(
      buildSnapshot({
        packageJson: {
          scripts: {
            dev: "remix vite:dev",
            build: "remix build",
          },
        },
        filePaths: ["yarn.lock", ".yarnrc.yml", "remix.config.js", "app/root.tsx"],
      })
    );

    expect(result.framework).toBe("Remix");
    expect(result.packageManager).toBe("yarn");
    expect(result.backendType).toBe("Frontend");
    expect(result.missingConfigs).toEqual([]);
  });

  it("prefers the declared package manager and ignores NODE_ENV env usage", () => {
    const result = analyzeRepositorySnapshot(
      buildSnapshot({
        packageJson: {
          packageManager: "pnpm@9.1.0",
          dependencies: {
            react: "19.0.0",
          },
          scripts: {
            dev: "vite",
            build: "vite build",
          },
        },
        filePaths: ["package-lock.json", "src/main.tsx", ".env.local"],
        fileContents: {
          "src/main.tsx": [
            'const mode = process.env.NODE_ENV;',
            'const secret = process.env["STRIPE_SECRET_KEY"];',
            'const apiUrl = import.meta.env.VITE_API_URL;',
          ].join("\n"),
          ".env.local": "NODE_ENV=development\nPUBLIC_FLAG=true\n",
        },
      })
    );

    expect(result.packageManager).toBe("pnpm");
    expect(result.envVarsDetected).toEqual(["PUBLIC_FLAG", "STRIPE_SECRET_KEY", "VITE_API_URL"]);
    expect(result.missingConfigs).toEqual([".env.example"]);
  });

  it("does not require dev or deployment config for a Dockerized Node server", () => {
    const result = analyzeRepositorySnapshot(
      buildSnapshot({
        packageJson: {
          dependencies: {
            express: "4.0.0",
          },
          scripts: {
            start: "node server.js",
          },
        },
        filePaths: ["Dockerfile", "server.js"],
      })
    );

    expect(result.framework).toBe("Node.js");
    expect(result.backendType).toBe("Express");
    expect(result.hasDocker).toBe(true);
    expect(result.missingConfigs).toEqual([]);
    expect(result.deploymentRiskScore).toBeLessThan(20);
  });
});
