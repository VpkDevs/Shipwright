import { describe, expect, it } from "vitest";
import { extractJSON } from "@/lib/agents/blackbox-agent";

describe("blackbox-agent extractJSON", () => {
  it("parses plain JSON strings", () => {
    const input = '{"codeInsights":"ok","riskAssessment":"low"}';
    const result = extractJSON(input);
    expect(result).not.toBeNull();
    expect(result?.codeInsights).toBe("ok");
    expect(result?.riskAssessment).toBe("low");
  });

  it("extracts JSON embedded in surrounding text", () => {
    const input =
      "prefix text\n```json\n{\"codeInsights\":\"value\"}\n```\nmore text";
    const result = extractJSON(input);
    expect(result).not.toBeNull();
    expect(result?.codeInsights).toBe("value");
  });

  it("returns null when no JSON found", () => {
    const input = "no json here";
    const result = extractJSON(input);
    expect(result).toBeNull();
  });

  it("returns null when JSON is malformed", () => {
    const input = "{invalid json";
    const result = extractJSON(input);
    expect(result).toBeNull();
  });
}

