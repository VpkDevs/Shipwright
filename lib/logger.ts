export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  requestId?: string;
  route?: string;
  email?: string;
  userName?: string;
  [key: string]: unknown;
}

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(
    message: string,
    meta?: Record<string, unknown>,
    error?: unknown
  ): void;
  child(context: Partial<LogContext>): Logger;
}

function logToConsole(
  level: LogLevel,
  context: LogContext,
  message: string,
  meta?: Record<string, unknown>,
  error?: unknown
) {
  const payload: Record<string, unknown> = {
    level,
    timestamp: new Date().toISOString(),
    message,
    ...context,
    ...(meta ?? {}),
  };

  if (error) {
    if (error instanceof Error) {
      payload.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else {
      payload.error = {
        value: String(error),
      };
    }
  }

  if (level === "error") {
    console.error(payload);
  } else if (level === "warn") {
    console.warn(payload);
  } else {
    console.log(payload);
  }
}

export function createLogger(baseContext: LogContext = {}): Logger {
  const loggerForContext = (context: LogContext): Logger => ({
    debug(message, meta) {
      logToConsole("debug", context, message, meta);
    },
    info(message, meta) {
      logToConsole("info", context, message, meta);
    },
    warn(message, meta) {
      logToConsole("warn", context, message, meta);
    },
    error(message, meta, error) {
      logToConsole("error", context, message, meta, error);
    },
    child(extraContext: Partial<LogContext>): Logger {
      return loggerForContext({ ...context, ...extraContext });
    },
  });

  return loggerForContext(baseContext);
}

export function generateRequestId(): string {
  const timePart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${timePart}-${randomPart}`;
}

