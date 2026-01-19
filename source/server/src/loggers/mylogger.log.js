const { createLogger, format, transports } = require("winston");
require("winston-daily-rotate-file");
import { env } from "../config/environment.js";
import { asyncLocalStorage } from "../middlewares/requestIdMiddleware.js";

// Thêm requestId vào mỗi record và xuất JSON
const addRequestId = format((info) => {
  const store = asyncLocalStorage.getStore();
  info.requestId = store?.get("requestId") || "-";
  return info;
});

const jsonFormat = format.combine(
  // timestamp ở định dạng chuẩn
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  // bao gồm stack khi có lỗi
  format.errors({ stack: true }),
  // inject requestId
  addRequestId(),
  // cuối cùng serialize thành JSON
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

    // Luôn log ra console ở dạng JSON; chỉ thay đổi level theo env
    transportsArr.push(
      new transports.Console({
        level: env.BUILD_MODE === "dev" ? "debug" : "info",
        format: jsonFormat,
      })
    );

    this.logger = createLogger({
      level: env.BUILD_MODE === "dev" ? "debug" : "info",
      transports: transportsArr,
      exitOnError: false,
    });
  }
}

exports.myLogger = new MyLogger().logger;

// Usage example:
// import { myLogger } from "../loggers/mylogger.log.js";
// myLogger.info('This is an info message');
// myLogger.error('This is an error message with stack trace', { stack: err.stack });
// myLogger.debug('This is a debug message');
