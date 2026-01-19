import { StatusCodes } from "http-status-codes";
import ms from "ms";
import ApiError from "~/utils/ApiError.js";
import { JWT_LIFE } from "~/utils/constants.js";
import { userService } from "~/services/userService.js";
import { myLogger } from "../loggers/mylogger.log.js";
import { env } from "../config/environment.js";

const getCurrentUserInfo = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user._id);

    res.locals.message = "Get current user info success!";
    res.locals.data = user;
    return res.status(StatusCodes.OK).json(user);
  } catch (error) {
    return next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await userService.getUserById(userId);
    res.locals.message = "Get user by ID success!";
    res.locals.data = user;
    return res.status(StatusCodes.OK).json(user);
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await userService.login(
      email,
      password
    );

    // Trả về http only cookie cho Client
    res.cookie("accessToken", accessToken, {
      httpOnly: true, // Không cho phép client (JS) truy cập vào cookie
      secure: true, // Nếu true thì chỉ gửi cookie qua kết nối HTTPS
      sameSite: "none", // Cấu hình cookie trong các trình duyệt hiện đại
      maxAge: ms(JWT_LIFE.COOKIE_LIFE), // Thời gian sống của cookie
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: ms(JWT_LIFE.COOKIE_LIFE),
    });

    // Trả về thông tin user và token cho Client
    res.locals.message = "Login API success!";
    res.status(StatusCodes.OK).json({
      ...user,
      accessToken,
      refreshToken,
      accessTokenExpiresIn: ms(JWT_LIFE.ACCESS_TOKEN_LIFE),
      refreshTokenExpiresIn: ms(JWT_LIFE.REFRESH_TOKEN_LIFE),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      // Chống enumeration attack
      if (
        error.statusCode === StatusCodes.NOT_FOUND ||
        error.statusCode === StatusCodes.UNAUTHORIZED
      ) {
        error.statusCode = StatusCodes.UNAUTHORIZED;
        error.message = "Invalid credentials";
      }
    }
    return next(error);
  }
};

const logout = (req, res) => {
  // Xoá cookie ở phía Client
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  res.locals.message =
    "Cookies cleared successfully! Please delete token in client storage to logout completely!";
  res.status(StatusCodes.OK).json({});
};

const refreshToken = async (req, res, next) => {
  try {
    // 1. Lấy token từ cookie hoặc body
    let refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      refreshToken = req.body?.refreshToken;
    }

    // 2. Nếu không có token, trả về lỗi
    if (!refreshToken) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        "No refresh token provided!"
      );
    }

    // 3. Gọi service để refresh token
    const { accessToken } = await userService.refreshToken(refreshToken);

    // 6. Trả về http only cookie cho Client
    res.cookie("accessToken", accessToken, {
      httpOnly: true, // Không cho phép client (JS) truy cập vào cookie
      secure: true, // Nếu true thì chỉ gửi cookie qua kết nối HTTPS
      sameSite: "none", // Cấu hình cookie trong các trình duyệt hiện đại
      maxAge: ms(JWT_LIFE.COOKIE_LIFE), // Thời gian sống của cookie
    });

    // Trả về thông tin user và token cho Client
    res.locals.message = "Refresh token success!";
    res.locals.data = { accessToken, refreshToken };
    res.status(StatusCodes.OK).json({
      ...req.user,
      accessToken,
      accessTokenExpiresIn: ms(JWT_LIFE.ACCESS_TOKEN_LIFE),
    });
  } catch (error) {
    return next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const userData = req.body;
    const { newUser, pendingVerification } = await userService.register(
      userData
    );

    res.locals.message = "User registered successfully!";

    // Không cấp token ngay, yêu cầu xác thực OTP trước
    res.locals.message = "Register success - verification required";
    return res.status(StatusCodes.OK).json({ ...newUser, pendingVerification });
  } catch (error) {
    return next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const { user, accessToken, refreshToken } = await userService.verifyOtp(
      email,
      otp
    );

    // Cấp cookie sau khi xác thực
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: ms(JWT_LIFE.COOKIE_LIFE),
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: ms(JWT_LIFE.COOKIE_LIFE),
    });

    res.locals.message = "Verify OTP success!";
    return res
      .status(StatusCodes.OK)
      .json({ ...user, accessToken, refreshToken });
  } catch (error) {
    return next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.locals.message = "Get all users success!";
    res.locals.data = users;
    return res.status(StatusCodes.OK).json(users);
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    next(error);
  }
};

const updateCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const updateData = req.body;
    const updatedUser = await userService.updateUser(userId, updateData);
    res.locals.message = "Update current user success!";
    res.locals.data = updatedUser;
    return res.status(StatusCodes.OK).json(updatedUser);
  } catch (error) {
    return next(error);
  }
};

const updateUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;
    const updatedUser = await userService.updateUser(userId, updateData);
    res.locals.message = "Update user by ID success!";
    res.locals.data = updatedUser;
    return res.status(StatusCodes.OK).json(updatedUser);
  } catch (error) {
    return next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { status } = req.body;
    const updatedUser = await userService.updateStatus(userId, { status });
    res.locals.message = "Update user status by ID success!";
    res.locals.data = updatedUser;
    return res.status(StatusCodes.OK).json(updatedUser);
  } catch (error) {
    return next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;
    const updatedUserId = await userService.changePassword(
      userId,
      currentPassword,
      newPassword
    );
    res.locals.message = "Change password success!";
    return res.status(StatusCodes.OK).json({ _id: updatedUserId });
  } catch (error) {
    return next(error);
  }
};

const passwordRecovery = async (req, res, next) => {
  try {
    const { email } = req.body;
    await userService.passwordRecovery(email);
    res.locals.message = "Password recovery email sent successfully!";
    return res.status(StatusCodes.OK).json();
  } catch (error) {
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const userId = await userService.resetPassword(token, newPassword);
    res.locals.message = "Reset password success!";
    return res.status(StatusCodes.OK).json({ _id: userId });
  } catch (error) {
    return next(error);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await userService.resendOtp(email);
    res.locals.message = "Resend OTP success!";
    return res
      .status(StatusCodes.OK)
      .json(env.BUILD_MODE === "dev" ? result : {});
  } catch (error) {
    return next(error);
  }
};

const deleteCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user._id;
    await userService.deleteUser(userId);
    res.locals.message = "Delete current user success!";
    return res.status(StatusCodes.OK).json();
  } catch (error) {
    return next(error);
  }
};

const deleteUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    await userService.deleteUser(userId);
    res.locals.message = "Delete user by ID success!";
    return res.status(StatusCodes.OK).json();
  } catch (error) {
    return next(error);
  }
};

export const userController = {
  register,
  login,
  logout,
  refreshToken,
  getCurrentUserInfo,
  getAllUsers,
  getUserById,
  updateCurrentUser,
  updateUserById,
  changePassword,
  updateUserStatus,
  passwordRecovery,
  resetPassword,
  deleteCurrentUser,
  deleteUserById,
  verifyOtp,
  resendOtp,
};
