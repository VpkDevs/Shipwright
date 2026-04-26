import { afterEach, describe, expect, it, vi } from "vitest";

describe("Logger", () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("enables pretty logging in development", async () => {
    vi.stubEnv("NODE_ENV", "development");

    const pino = vi.fn(() => ({ info: vi.fn() }));
    vi.doMock("pino", () => ({
      default: pino,
    }));

    await import("@/lib/logger");

    expect(pino).toHaveBeenCalledWith(
      expect.objectContaining({
        transport: expect.objectContaining({
          target: "pino-pretty",
        }),
      })
    );
  });

  it("skips pretty logging transport outside development", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const pino = vi.fn(() => ({ info: vi.fn() }));
    vi.doMock("pino", () => ({
      default: pino,
    }));

    await import("@/lib/logger");

    expect(pino).toHaveBeenCalledWith(
      expect.not.objectContaining({
        transport: expect.anything(),
      })
    );
  });
});
