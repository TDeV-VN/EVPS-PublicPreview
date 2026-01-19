export const successResponse = (data, message = "Success", timestamp) => ({
  success: true,
  message,
  data,
  error: null,
  timestamp,
});

export const errorResponse = (err, message, timestamp, env = "dev") => ({
  success: false,
  message,
  data: null,
  error: {
    statusCode: err.statusCode,
    stack: env === "dev" ? err.stack : undefined,
  },
  timestamp,
});

export const WHITELIST_DOMAINS = [
  "http://localhost:3000",
  "http://localhost:4000",
  "http://localhost:5173",
  // Docker internal service to service calls may not send an Origin header
  // Các domain được phép truy cập API của chúng ta
];

// Available roles (extendable). First element kept 'user' as default for registration.
export const ROLE = ["user", "admin"];
export const USER_STATUS = ["active", "suspended"];

// OTP / Token constants
export const OTA_TOKEN_TTL = 300; // 5 minutes in seconds

const ACCESS_TOKEN_LIFE = "1 days";
const REFRESH_TOKEN_LIFE = "7 days";
const COOKIE_LIFE = "7 days";
export const JWT_LIFE = {
  ACCESS_TOKEN_LIFE,
  REFRESH_TOKEN_LIFE,
  COOKIE_LIFE,
};

export const RESET_PASSWORD_TOKEN_LIFE = 5 * 60; // 5 phút
export const EMAIL_CONFIRMATION_TOKEN_LIFE = 24 * 60 * 60; // 24 giờ
export const CONFIRM_EMAIL_BASE_URL = "/auth/reset-password";
export const RESET_PASSWORD_BASE_URL = "/auth/reset-password";
