import {
  getInstallCommand,
  getRunScriptCommand,
  normalizePackageManager,
} from "@/lib/package-manager";
import { describe, expect, it } from "vitest";

describe("package-manager helpers", () => {
  it("normalizes known managers", () => {
    expect(normalizePackageManager("npm")).toBe("npm");
    expect(normalizePackageManager("pnpm")).toBe("pnpm");
    expect(normalizePackageManager("yarn")).toBe("yarn");
    expect(normalizePackageManager("bun")).toBe("bun");
    expect(normalizePackageManager("something")).toBe("npm");
  });

  it("builds install commands correctly", () => {
    expect(getInstallCommand("npm")).toBe("npm install");
    expect(getInstallCommand("pnpm")).toBe("pnpm install");
    expect(getInstallCommand("yarn")).toBe("yarn install");
    expect(getInstallCommand("bun")).toBe("bun install");
  });

  it("generates run script commands for each manager", () => {
    expect(getRunScriptCommand("npm", "build")).toBe("npm run build");
    expect(getRunScriptCommand("pnpm", "build")).toBe("pnpm build");
    expect(getRunScriptCommand("yarn", "dev")).toBe("yarn dev");
    expect(getRunScriptCommand("bun", "start")).toBe("bun run start");
  });
});
