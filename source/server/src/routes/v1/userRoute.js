import express from "express";
import { userController } from "~/controllers/userController";
import { isAuthorized } from "~/middlewares/authMiddleware.js";
import { userValidation } from "~/validations/userValidation";

const Router = express.Router();

// API đăng nhập.
Router.route("/login").post(userValidation.login, userController.login);

// API đăng xuất.
Router.route("/logout").delete(userController.logout);

// API Refresh Token - Cấp lại Access Token mới.
Router.route("/refresh_token").put(userController.refreshToken);

// API lấy thông tin user hiện tại.
Router.route("/me").get(isAuthorized, userController.getCurrentUserInfo);

// API cập nhật thông tin user hiện tại.
Router.route("/me").put(
  isAuthorized,
  userValidation.update,
  userController.updateCurrentUser
);

// API đổi mật khẩu cho user hiện tại.
Router.route("/change-password").put(
  isAuthorized,
  userValidation.changePassword,
  userController.changePassword
);

// API yêu cầu lấy lại mật khẩu (gửi email chứa link reset password)
Router.route("/password-recovery").post(
  userValidation.passwordRecovery,
  userController.passwordRecovery
);

// API reset mật khẩu (thông qua link gửi trong email)
Router.route("/reset-password").put(
  userValidation.resetPassword,
  userController.resetPassword
);

// API xác thực OTP đăng ký
Router.route("/verify-otp").post(userController.verifyOtp);

// API gửi lại OTP đăng ký
Router.route("/resend-otp").post(userController.resendOtp);

// API xóa tài khoản user hiện tại.
Router.route("/me").delete(isAuthorized, userController.deleteCurrentUser);

export const userRoute = Router;
