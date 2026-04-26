import pino from "pino";

let logger: pino.Logger | null = null;

function getLogger() {
  if (!logger) {
    const isDevelopment = process.env.NODE_ENV === "development";

    logger = pino({
      level: process.env.LOG_LEVEL || "info",
      ...(isDevelopment
        ? {
            transport: {
              target: "pino-pretty",
              options: {
                colorize: true,
              },
            },
          }
        : {}),
    });
  }
  return logger;
}

export const log = getLogger();
