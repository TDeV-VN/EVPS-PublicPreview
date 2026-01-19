import mongoose from "mongoose";
import { userSchema } from "./schemas.js";

const User = mongoose.model("User", userSchema);

const createUser = async (userData) => {
  const user = new User(userData);
  return await user.save();
};

const getUserByEmail = async (email) => await User.findOne({ email }).exec();

const getUserById = async (id) => await User.findById(id).exec();

// Cập nhật thôgn tin user
const updateUser = async (userId, updateData) => {
  const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
  return user;
};

// Cập nhật thông tin user theo email
const updateUserByEmail = async (email, updateData) => {
  const user = await User.findOneAndUpdate({ email }, updateData, {
    new: true,
  });
  return user;
};

// Lấy tất cả users
const getAllUsers = async () => await User.find().exec();

// Lấy status user theo email
const getUserStatusByEmail = async (email) => {
  const user = await User.findOne({ email }, { status: 1 }).exec();
  return user ? user.status : null;
};

// Kiểm tra user có tồn tại không
const isUserExists = async (email) => {
  const exists = await User.exists({ email });
  return exists ? true : false;
};

// Kiểm tra user có tồn tại không (theo id)
const isUserExistsById = async (userId) => {
  const exists = await User.exists({ _id: userId });
  return exists ? true : false;
};

// Lấy role user theo id
const getUserRoleById = async (userId) => {
  const user = await User.findById(userId, { role: 1 }).exec();
  return user ? user.role : null;
};

// Xóa user
const deleteUser = async (userId) => {
  const result = await User.findByIdAndDelete(userId).exec();
  return result;
};

export const userModel = {
  getUserByEmail,
  getUserById,
  createUser,
  getAllUsers,
  updateUser,
  updateUserByEmail,
  getUserStatusByEmail,
  isUserExists,
  getUserRoleById,
  deleteUser,
  isUserExistsById,
};
