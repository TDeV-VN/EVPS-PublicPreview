import dotenv from "dotenv";
dotenv.config({ path: "./secrets/.env" });

export const env = {
  MONGODB_URI: process.env.MONGODB_URI,
  DATABASE_NAME: process.env.DATABASE_NAME,

  DEFAULT_REDIS_HOST: process.env.DEFAULT_REDIS_HOST,
  DEFAULT_REDIS_PORT: process.env.DEFAULT_REDIS_PORT,
  DEFAULT_REDIS_PASSWORD: process.env.DEFAULT_REDIS_PASSWORD,

  GOOGLE_APP_PASSWORD: process.env.GOOGLE_APP_PASSWORD,
  GOOGLE_APP_EMAIL: process.env.GOOGLE_APP_EMAIL,

  BUILD_MODE: process.env.BUILD_MODE,

  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
  SUPABASE_BUCKET: process.env.SUPABASE_BUCKET,
};
