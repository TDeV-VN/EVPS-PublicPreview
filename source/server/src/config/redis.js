import { Redis } from "ioredis";
import { env } from "~/config/environment.js";
import { myLogger } from "~/loggers/mylogger.log.js";

export const defaultRedisClient = new Redis({
  host: env.DEFAULT_REDIS_HOST,
  port: env.DEFAULT_REDIS_PORT,
  password: env.DEFAULT_REDIS_PASSWORD,
});

defaultRedisClient.on("connect", () => {
  myLogger.info("Redis client (default server) connected");
});
defaultRedisClient.on("error", (err) => {
  myLogger.error("Redis Client (default server) Error", err);
});
defaultRedisClient.on("ready", () => {
  myLogger.info("Redis client (default server) ready to use");
});
defaultRedisClient.on("end", () => {
  myLogger.info("Redis client (default server) disconnected");
});

// Sử dụng lệnh PING để kiểm tra kết nối
defaultRedisClient
  .ping()
  .then((result) => {
    myLogger.info("Redis (default server) PING response:" + result);
  })
  .catch((err) => {
    myLogger.error("Redis (default server) PING error:", err);
  });
