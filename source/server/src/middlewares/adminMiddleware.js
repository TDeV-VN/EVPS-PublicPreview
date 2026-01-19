import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/ApiError.js";

export const adminMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      return next(
        new ApiError(StatusCodes.UNAUTHORIZED, "User chưa được xác thực")
      );
    }

    if (req.user.role !== "admin") {
      return next(
        new ApiError(
          StatusCodes.FORBIDDEN,
          "Bạn không có quyền truy cập tài nguyên này"
        )
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
