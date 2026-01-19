import dotenv from "dotenv";
dotenv.config({ path: "./secrets/.env" });

export const env = {
  MONGODB_URI: process.env.MONGODB_URI,
  DATABASE_NAME: process.env.DATABASE_NAME,
  APP_PORT: process.env.APP_PORT,
  APP_PUBLIC_PORT: process.env.APP_PUBLIC_PORT,
  APP_HOST: process.env.APP_HOST, // NOTE: cần sửa file .env khi đổi nơi deploy

  DEFAULT_REDIS_HOST: process.env.DEFAULT_REDIS_HOST,
  DEFAULT_REDIS_PORT: process.env.DEFAULT_REDIS_PORT,
  DEFAULT_REDIS_PASSWORD: process.env.DEFAULT_REDIS_PASSWORD,

  BUILD_MODE: process.env.BUILD_MODE,

  ACCESS_TOKEN_SECRET_SIGNATURE: process.env.ACCESS_TOKEN_SECRET_SIGNATURE,
  REFRESH_TOKEN_SECRET_SIGNATURE: process.env.REFRESH_TOKEN_SECRET_SIGNATURE,

  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ADMIN_NAME: process.env.ADMIN_NAME,

  // GitHub Config for Firmware Update
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GITHUB_OWNER: process.env.GITHUB_OWNER,
  GITHUB_REPO: process.env.GITHUB_REPO,

  // Firmware Download Config
  FIRMWARE_DOWNLOAD_HOST: process.env.FIRMWARE_DOWNLOAD_HOST,
  FIRMWARE_DOWNLOAD_PORT: process.env.FIRMWARE_DOWNLOAD_PORT,
};
