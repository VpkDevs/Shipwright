import { formatDate, formatRelative } from "@/lib/utils";
import { describe, expect, it } from "vitest";

describe("utils date formatting", () => {
  it("formatDate returns a readable date string", () => {
    const iso = "2026-03-10T12:34:56.000Z";
    const out = formatDate(iso);
    expect(typeof out).toBe("string");
    expect(out).toMatch(/2026/);
  });

  it("formatRelative handles just now and minutes", () => {
    const now = new Date().toISOString();
    expect(formatRelative(now)).toBe("just now");
    const tenMinAgo = new Date(Date.now() - 10 * 60_000).toISOString();
    const rel = formatRelative(tenMinAgo);
    expect(rel).toMatch(/m ago$/);
  });
});
