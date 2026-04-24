import { getProCheckoutPlan } from "@/lib/pricing";
import { describe, expect, it } from "vitest";

describe("getProCheckoutPlan", () => {
  it("returns the monthly checkout plan by default", () => {
    expect(getProCheckoutPlan(false)).toBe("pro");
  });

  it("returns the annual checkout plan when annual billing is enabled", () => {
    expect(getProCheckoutPlan(true)).toBe("proAnnual");
  });
});
