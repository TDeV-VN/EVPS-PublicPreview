import { createLogger, format, transports } from "winston";
import "winston-daily-rotate-file";
import { env } from "../configs/environment.js";

const jsonFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.json()
);

class MyLogger {
  constructor() {
    // Ghi file info
    const dailyRotateFileTransportInfo = new transports.DailyRotateFile({
      filename: "application-%DATE%.info.log",
      datePattern: "YYYY-MM-DD",
      dirname: "logs",
      maxFiles: "14d",
      zippedArchive: false,
      level: "info",
      format: jsonFormat,
    });

    // Ghi file error
    const dailyRotateFileTransportError = new transports.DailyRotateFile({
      filename: "application-%DATE%.error.log",
      datePattern: "YYYY-MM-DD",
      dirname: "logs",
      maxFiles: "14d",
      zippedArchive: false,
      level: "error",
      format: jsonFormat,
    });

    const transportsArr = [
      dailyRotateFileTransportInfo,
      dailyRotateFileTransportError,
    ];

    // Chỉ log debug ra console ở môi trường dev
    transportsArr.push(
      new transports.Console({
        level: env.BUILD_MODE === "dev" ? "debug" : "info",
        format: jsonFormat,
      })
    );

    this.logger = createLogger({
      level: "debug",
      transports: transportsArr,
      exitOnError: false,
    });
  }
}

export const myLogger = new MyLogger().logger;
// Usage example:
// import { myLogger } from "../loggers/mylogger.log.js";
// myLogger.info('This is an info message');
// myLogger.error(err.message, { stack: err.stack });
// myLogger.debug('This is a debug message');
