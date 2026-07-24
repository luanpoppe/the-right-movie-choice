import pino from "pino";
import { env } from "@/env";

const rootLogger = pino({
  level:
    env.NODE_ENV === "test"
      ? "silent"
      : env.NODE_ENV === "prod"
        ? "info"
        : "debug",
});

type LogContext = Record<string, string | number | boolean | undefined>;

export class Logger {
  static info(message: string, context?: LogContext) {
    rootLogger.info(context ?? {}, message);
  }

  static warn(message: string, context?: LogContext) {
    rootLogger.warn(context ?? {}, message);
  }

  static error(message: string, context?: LogContext) {
    rootLogger.error(context ?? {}, message);
  }

  static debug(message: string, context?: LogContext) {
    rootLogger.debug(context ?? {}, message);
  }
}
