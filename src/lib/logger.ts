type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

export interface Logger {
  debug(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
}

function writeLog(
  level: LogLevel,
  scope: string,
  message: string,
  context: LogContext,
): void {
  const payload = {
    level,
    scope,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export function createLogger(
  scope: string,
  defaultContext: LogContext = {},
): Logger {
  return {
    debug(message, context = {}) {
      writeLog("debug", scope, message, { ...defaultContext, ...context });
    },
    error(message, context = {}) {
      writeLog("error", scope, message, { ...defaultContext, ...context });
    },
    info(message, context = {}) {
      writeLog("info", scope, message, { ...defaultContext, ...context });
    },
    warn(message, context = {}) {
      writeLog("warn", scope, message, { ...defaultContext, ...context });
    },
  };
}

export const logger = createLogger("blog2");
