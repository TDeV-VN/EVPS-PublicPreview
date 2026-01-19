import express from "express";
import { userController } from "~/controllers/userController";
import { isAuthorized, isAdmin } from "~/middlewares/authMiddleware.js";
import { userValidation } from "~/validations/userValidation";

const Router = express.Router();

// API đăng ký tài khoản.
// TODO: chỉ admin mới được tạo tài khoản user khác
Router.route("/register").post(
  userValidation.createNew,
  userController.register
);

// API lấy tất cả users
Router.route("/").get(isAuthorized, isAdmin, userController.getAllUsers);

// API lấy thông tin user theo ID
Router.route("/:id").get(isAuthorized, isAdmin, userController.getUserById);

// API cập nhật thông tin user theo ID
Router.route("/:id").put(
  isAuthorized,
  isAdmin,
  userValidation.update,
  userController.updateUserById
);

// API cập nhật trạng thái user theo ID
Router.route("/:id/status").put(
  isAuthorized,
  isAdmin,
  userValidation.updateStatus,
  userController.updateUserStatus
);

// API xóa user theo ID
Router.route("/:id").delete(
  isAuthorized,
  isAdmin,
  userController.deleteUserById
);

export const usersManagementRoute = Router;
