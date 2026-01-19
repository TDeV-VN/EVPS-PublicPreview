import ApiError from "~/utils/ApiError";
import { StatusCodes } from "http-status-codes";
import { jwtProvider } from "~/providers/JwtProvider.js";
import { env } from "~/config/environment";
import { JWT_LIFE, RESET_PASSWORD_TOKEN_LIFE } from "~/utils/constants.js";
import { userModel } from "~/models/userModel.js";
import { myLogger } from "~/loggers/mylogger.log";
import placeholderAvatar from "~/utils/placeholderAvatar";
import bcrypt from "bcryptjs";
import { getVietnamDatetimeString } from "~/utils/datetime";
import crypto from "crypto";
import { defaultRedisClient } from "~/config/redis.js";
import {
  ROLE,
  CONFIRM_EMAIL_BASE_URL,
  RESET_PASSWORD_BASE_URL,
  EMAIL_CONFIRMATION_TOKEN_LIFE,
  USER_STATUS,
} from "~/utils/constants.js";

import { emailQueue } from "~/providers/jobQueue.js";
import { generatePassword } from "~/utils/random.js";

const login = async (email, password, isGoogleLogin = false) => {
  let user = await userModel.getUserByEmail(email);
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");

  user = user.toObject();

  // So sánh password
  if (!isGoogleLogin) {
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid credentials");
    }
  }

  // Kiểm tra trạng thái user
  if (user.status !== "active") {
    throw new ApiError(StatusCodes.FORBIDDEN, "User is not active");
  }

  delete user.password;
  delete user.addresses;
  user.createdAt = getVietnamDatetimeString(user.createdAt);
  user.updatedAt = getVietnamDatetimeString(user.updatedAt);

  // Tạo thông tin Payload để  trong JWT Token
  const payload = {
    _id: user._id,
    email: user.email,
    role: user.role,
  };
  // Tạo Access Token
  const accessToken = await jwtProvider.generateToken(
    payload,
    env.ACCESS_TOKEN_SECRET_SIGNATURE,
    JWT_LIFE.ACCESS_TOKEN_LIFE
  );
  // Tạo Refresh Token
  const refreshToken = await jwtProvider.generateToken(
    payload,
    env.REFRESH_TOKEN_SECRET_SIGNATURE,
    JWT_LIFE.REFRESH_TOKEN_LIFE
  );

  // Trả về thông tin user, accessToken, refreshToken cho Controller
  return { user, accessToken, refreshToken };
};

const refreshToken = async (refreshToken) => {
  try {
    // Xác thực token
    const decoded = await jwtProvider.verifyToken(
      refreshToken,
      env.REFRESH_TOKEN_SECRET_SIGNATURE
    );

    // Tạo payload mới cho Access Token
    delete decoded.iat;
    delete decoded.exp;
    const user = decoded;

    // Tạo Access Token
    const accessToken = await jwtProvider.generateToken(
      user,
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      JWT_LIFE.ACCESS_TOKEN_LIFE
    );

    return { accessToken };
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      // Nếu lỗi là do token hết hạn
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        "Refresh token expired! Please login again."
      );
    } else if (
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError"
    ) {
      // Nếu xảy ra các lỗi khác liên quan đến Token
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        "Invalid refresh token! Please login again."
      );
    } else {
      // Các lỗi khác
      throw error;
    }
  }
};

const getUserById = async (userId) => {
  let user = await userModel.getUserById(userId);
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  user = user.toObject();
  delete user.password;
  delete user.addresses;
  user.createdAt = getVietnamDatetimeString(user.createdAt);
  user.updatedAt = getVietnamDatetimeString(user.updatedAt);
  return user;
};

const updateUser = async (userId, updateData) => {
  let user = await userModel.updateUser(userId, updateData);
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  user = user.toObject();
  delete user.password;
  delete user.addresses;
  user.createdAt = getVietnamDatetimeString(user.createdAt);
  user.updatedAt = getVietnamDatetimeString(user.updatedAt);
  return user;
};

const updateStatus = async (userId, status) => {
  // Không cho thay đổi status của admin
  const role = await userModel.getUserRoleById(userId);
  if (!role) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  if (role === ROLE[1]) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Cannot change status of admin user"
    );
  }
  return await updateUser(userId, status);
};

const changePassword = async (userId, currentPassword, newPassword) => {
  let user = await userModel.getUserById(userId);
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  user = user.toObject();
  // So sánh password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid current password");
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  user = await userModel.updateUser(userId, { password: hashedPassword });
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  user = user.toObject();

  await emailQueue.add("send_password_change_notification_email", {
    to: user.email,
  });

  return user._id;
};

const passwordRecovery = async (email) => {
  const user = await userModel.getUserByEmail(email);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Generate a new random password
  const newPassword = generatePassword();

  // Hash the new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update the user's password in the database
  await userModel.updateUser(user._id, { password: hashedPassword });

  // Add a job to the email queue to send the new password
  await emailQueue.add("send_reset_password_email", {
    to: email,
    newPassword: newPassword,
  });

  myLogger.info(`New password generated and sent to ${email}`);

  return { message: "A new password has been sent to your email." };
};

const resetPassword = async (token, newPassword) => {
  const email = await defaultRedisClient.get(`reset:${token}`);
  if (!email) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid or expired token");
  }
  const isUserExists = await userModel.isUserExists(email);
  if (!isUserExists) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  const user = await userModel.updateUserByEmail(email, {
    password: hashedPassword,
  });
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  await defaultRedisClient.del(`reset:${token}`);
  return user._id;
};

const register = async (userData) => {
  try {
    const salt = await bcrypt.genSalt(10);

    // NOTE: môi dev sẽ đặt mật khẩu mặc định, môi trường production thì random
    if (env.BUILD_MODE === "dev") {
      userData.password = "#12345678Gu";
    } else {
      userData.password = generatePassword();
    }
    const rawPassword = userData.password; // giữ mật khẩu thô để gửi email (CHỈ DEV/DEMO)
    userData.password = await bcrypt.hash(userData.password, salt);

    if (!userData.avatar) {
      userData.avatar = placeholderAvatar(userData.fullName);
    }

    // Thêm thông tin address
    if (userData.address) {
      userData.address.recipientName = userData.fullName;
      userData.address.isDefault = true;
      userData.addresses = [userData.address];
      delete userData.address;
    }

    // Ensure role default
    if (!userData.role || !ROLE.includes(userData.role)) {
      userData.role = ROLE[0]; // 'user'
    }

    userData.status = USER_STATUS[0];
    let newUser = await userModel.createUser(userData);
    newUser = newUser.toObject();
    delete newUser.password;
    newUser.createdAt = getVietnamDatetimeString(newUser.createdAt);
    newUser.updatedAt = getVietnamDatetimeString(newUser.updatedAt);

    /** Gửi email xác nhận đăng ký: OTP + link đặt mật khẩu */
    const token = crypto.randomBytes(32).toString("hex");
    const otp = "" + Math.floor(100000 + Math.random() * 900000); // 6-digit
    // Lưu OTP theo email để thuận tiện xác thực từ form
    await defaultRedisClient.setex(
      `otp:${newUser.email}`,
      EMAIL_CONFIRMATION_TOKEN_LIFE,
      otp
    );
    const resetURL = `${env.APP_HOST}:${env.APP_PUBLIC_PORT}${CONFIRM_EMAIL_BASE_URL}?token=${token}`;
    myLogger.debug(
      `Registration confirmation link for ${newUser.email}: ${resetURL} (OTP: ${otp})`
    );

    await emailQueue.add("send_welcome_email", {
      to: newUser.email,
      userName: newUser.fullName,
      resetLink: resetURL,
      tempPassword: rawPassword,
      otp,
      email_confirmation_token_life: EMAIL_CONFIRMATION_TOKEN_LIFE,
    });

    // NOTE: Log này để test với email giả lập
    myLogger.info(
      `Registration confirmation link generated for ${newUser.email}: ${resetURL}`
    );

    // NOTE: Không cấp token ngay cho tới khi user xác thực OTP & đặt mật khẩu.
    return { newUser, pendingVerification: true };
  } catch (error) {
    if (error.code === 11000 && error.keyPattern.email) {
      // Email đã tồn tại
      throw new ApiError(StatusCodes.CONFLICT, "Email already exists");
    } else if (
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError"
    ) {
      // Nếu xảy ra các lỗi khác liên quan đến Token
      myLogger.error(error.message, { stack: error.stack });
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        "Register success but error when generating token! Please login again."
      );
    } else if (error.name === "ValidationError") {
      // Dữ liệu bị lỗi do quá trình xử lý của server
      myLogger.error(error.message, { stack: error.stack });
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Data was corrupted during server processing."
      );
    }
    throw error;
  }
};

const getAllUsers = async () => {
  const users = await userModel.getAllUsers();
  // Xoá thông tin password và địa chỉ
  return users.map((user) => {
    let userObj = user.toObject();
    delete userObj.password;
    delete userObj.addresses;
    userObj.createdAt = getVietnamDatetimeString(userObj.createdAt);
    userObj.updatedAt = getVietnamDatetimeString(userObj.updatedAt);
    return userObj;
  });
};

const isActive = async (email) => {
  const status = await userModel.getUserStatusByEmail(email);
  return status === "active";
};

const deleteUser = async (userId) => {
  // Không cho xoá admin
  const role = await userModel.getUserRoleById(userId);
  if (!role) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  if (role === ROLE[1]) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Cannot delete admin user");
  }
  let result = await userModel.deleteUser(userId);
  if (!result) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  result.toObject();
  delete result.password;
  delete result.addresses;
  result.createdAt = getVietnamDatetimeString(result.createdAt);
  result.updatedAt = getVietnamDatetimeString(result.updatedAt);
  return result;
};

export const userService = {
  login,
  getUserById,
  register,
  refreshToken,
  getAllUsers,
  updateUser,
  changePassword,
  passwordRecovery,
  resetPassword,
  isActive,
  updateStatus,
  deleteUser,
  async verifyOtp(email, otp) {
    const stored = await defaultRedisClient.get(`otp:${email}`);
    if (!stored) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid or expired OTP");
    }
    if (stored !== otp) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "OTP does not match");
    }
    // Kích hoạt tài khoản
    let user = await userModel.updateUserByEmail(email, {
      status: "active",
      emailVerifiedAt: new Date(),
    });
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    await defaultRedisClient.del(`otp:${email}`);
    user = user.toObject();
    delete user.password;
    delete user.addresses;
    user.createdAt = getVietnamDatetimeString(user.createdAt);
    user.updatedAt = getVietnamDatetimeString(user.updatedAt);

    // Cấp token sau khi xác thực thành công
    const payload = { _id: user._id, email: user.email, role: user.role };
    const accessToken = await jwtProvider.generateToken(
      payload,
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      JWT_LIFE.ACCESS_TOKEN_LIFE
    );
    const refreshToken = await jwtProvider.generateToken(
      payload,
      env.REFRESH_TOKEN_SECRET_SIGNATURE,
      JWT_LIFE.REFRESH_TOKEN_LIFE
    );

    return { user, accessToken, refreshToken };
  },
  async resendOtp(email) {
    const exists = await userModel.isUserExists(email);
    if (!exists) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
    // Tạo OTP mới và ghi đè
    const otp = "" + Math.floor(100000 + Math.random() * 900000);
    await defaultRedisClient.setex(
      `otp:${email}`,
      EMAIL_CONFIRMATION_TOKEN_LIFE,
      otp
    );
    // Dev aid: log OTP to help testing
    if (env.BUILD_MODE === "dev") {
      myLogger.debug(`Resend OTP for ${email}: ${otp}`);
    }
    await emailQueue.add("send_resend_otp_email", {
      to: email,
      otp,
      email_confirmation_token_life: EMAIL_CONFIRMATION_TOKEN_LIFE,
    });
    return { sent: true, ...(env.BUILD_MODE === "dev" ? { devOtp: otp } : {}) };
  },
};
