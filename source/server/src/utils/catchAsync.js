export default function catchAsync(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
}

// Sử dụng trong các controller bất đông bộ (async)
// để tự động bắt lỗi (những lỗi không cần xử lý gì thêm)
// và chuyển cho middleware xử lý lỗi. Tránh việc phải viết try-catch {next(err)} lặp đi lặp lại.

// import catchAsync from "~/utils/catchAsync.js";

// Sử dụng: bọc hàm ở tầng controller bằng catchAsync, ví dụ:
// const getUser = catchAsync(async (req, res) => {
//   const user = await userService.getUserById(req.params.id);
//   res.locals.message = "User fetched successfully";
//   res.status(200).json({ data: user });
// });

// thay vì viết:
// const getUser = async (req, res, next) => {
//   try {
//     const user = await userService.getUserById(req.params.id);
//     res.locals.message = "User fetched successfully";
//     res.status(200).json({ data: user });
//   } catch (err) {
//     next(err);
//   }
// };
