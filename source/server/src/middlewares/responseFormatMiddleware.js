import { successResponse } from "../utils/constants.js";
import { getVietnamDatetimeString } from "../utils/datetime.js";

export const responseFormatMiddleware = (req, res, next) => {
  const oldJson = res.json;
  res.json = function (data) {
    // Nếu request đến từ Bull Board, bỏ qua và dùng hàm json gốc
    if (req.originalUrl.startsWith("/admin/queues")) {
      return oldJson.call(this, data);
    }

    if (
      data &&
      typeof data === "object" &&
      ("success" in data || "error" in data)
    ) {
      return oldJson.call(this, data);
    }
    const response = successResponse(
      data,
      res.locals.message || "Success",
      getVietnamDatetimeString()
    );
    return oldJson.call(this, response);
  };
  next();
};

// Usage example:
// app.use(responseFormatMiddleware);
// app.get('/example', (req, res) => {
//   res.locals.message = "Dữ liệu lấy thành công";
//   res.status(StatusCodes.OK).json({ id: 1, name: "John Doe" });
// });
