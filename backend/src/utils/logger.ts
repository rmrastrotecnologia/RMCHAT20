// Simple logger for Cloudflare Workers
// Replaces pino which doesn't work well in Workers environment

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

type LogLevel = keyof typeof LOG_LEVELS;

class WorkersLogger {
  private minLevel: number = LOG_LEVELS.INFO;

  constructor(level: LogLevel = "INFO") {
    this.minLevel = LOG_LEVELS[level];
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] ${level}:`;

    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data, null, 2)}`;
    }
    return `${prefix} ${message}`;
  }

  debug(message: string, data?: any) {
    if (LOG_LEVELS.DEBUG >= this.minLevel) {
      console.debug(this.formatMessage("DEBUG", message, data));
    }
  }

  info(message: string, data?: any) {
    if (LOG_LEVELS.INFO >= this.minLevel) {
      console.log(this.formatMessage("INFO", message, data));
    }
  }

  warn(message: string, data?: any) {
    if (LOG_LEVELS.WARN >= this.minLevel) {
      console.warn(this.formatMessage("WARN", message, data));
    }
  }

  error(message: string | Error, data?: any) {
    if (LOG_LEVELS.ERROR >= this.minLevel) {
      if (message instanceof Error) {
        console.error(
          this.formatMessage("ERROR", message.message, {
            stack: message.stack,
            ...data
          })
        );
      } else {
        console.error(this.formatMessage("ERROR", message, data));
      }
    }
  }
}

// Create default logger instance
const logLevel = (
  typeof process !== "undefined" && process.env.LOG_LEVEL
    ? process.env.LOG_LEVEL
    : "INFO"
) as LogLevel;

const logger = new WorkersLogger(logLevel);

export { logger, WorkersLogger };
