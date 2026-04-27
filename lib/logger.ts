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

/**
 * Create a child logger with additional context
 */
export function createLogger(context: Record<string, unknown>) {
  const childLogger = log.child(context);
  return {
    info: (message: string, data?: Record<string, unknown>) => childLogger.info(data, message),
    warn: (message: string, data?: Record<string, unknown>) => childLogger.warn(data, message),
    error: (message: string, data?: Record<string, unknown>) => childLogger.error(data, message),
    debug: (message: string, data?: Record<string, unknown>) => childLogger.debug(data, message),
    child: (ctx: Record<string, unknown>) => createLogger({ ...context, ...ctx }),
  };
}

/**
 * Generate a unique request ID for tracing
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
