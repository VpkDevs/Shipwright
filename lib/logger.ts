import pino from "pino";

let logger: pino.Logger | null = null;

function getLogger() {
  if (!logger) {
    logger = pino({
      level: process.env.LOG_LEVEL || "info",
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      },
    });
  }
  return logger;
}

export const log = getLogger();
