/**
 * Centralized logging utility for the Canteen Project
 * Provides consistent logging across the application
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment: boolean;
  private serviceName: string;

  constructor(serviceName: string = "CanteenApp") {
    this.serviceName = serviceName;
    this.isDevelopment = import.meta.env.MODE === "development";
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] [${this.serviceName}] ${message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    // In production, you could send to a remote logging service
    // For now, we only log in development
    if (!this.isDevelopment && level === "debug") {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, context);

    switch (level) {
      case "debug":
        console.debug(formattedMessage);
        break;
      case "info":
        console.info(formattedMessage);
        break;
      case "warn":
        console.warn(formattedMessage);
        break;
      case "error":
        console.error(formattedMessage);
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log("error", message, context);
  }

  // Helper for capturing errors with stack traces
  captureError(error: Error, context?: LogContext): void {
    this.log("error", error.message, {
      ...context,
      stack: error.stack,
      name: error.name,
    });
  }

  // Performance logging helper
  time(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.info(`Performance: ${label}`, { durationMs: duration });
    };
  }
}

// Export a singleton instance
export const logger = new Logger("CanteenApp");

// Export a factory for creating context-specific loggers
export const createLogger = (serviceName: string): Logger => {
  return new Logger(serviceName);
};
