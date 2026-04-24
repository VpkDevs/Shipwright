import { useTheme } from "@/lib/theme";
import { fireEvent, render } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

function TestComponent() {
  const { theme, toggle } = useTheme();
  return React.createElement(
    "button",
    { type: "button", "data-testid": "btn", onClick: toggle },
    theme
  );
}

describe("useTheme hook", () => {
  beforeEach(() => {
    const storage = new Map<string, string>();

    Object.defineProperty(window, "localStorage", {
      writable: true,
      value: {
        getItem: vi.fn((key: string) => storage.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
          storage.set(key, value);
        }),
        removeItem: vi.fn((key: string) => {
          storage.delete(key);
        }),
        clear: vi.fn(() => {
          storage.clear();
        }),
      },
    });

    document.documentElement.className = "";
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        media: "(prefers-color-scheme: dark)",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
  });

  it("toggles and stores theme", () => {
    const { getByTestId } = render(React.createElement(TestComponent));
    const btn = getByTestId("btn");
    expect(["light", "dark"]).toContain(btn.textContent);
    fireEvent.click(btn);
    expect(localStorage.getItem("theme")).toBe(btn.textContent);
    expect(document.documentElement.classList.contains("dark")).toBe(btn.textContent === "dark");
  });
});
