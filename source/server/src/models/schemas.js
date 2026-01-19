import mongoose from "mongoose";
import { ROLE, USER_STATUS } from "../utils/constants.js";
import { validate } from "~/validations/validator.js";

export const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      match: validate.email,
    },
    password: { type: String, required: true, match: validate.password },
    avatar: { type: String, default: "" },
    fullName: { type: String, required: true, match: validate.fullName },
    emailVerifiedAt: { type: Date },
    status: { type: String, enum: USER_STATUS, default: USER_STATUS[0] },
    role: { type: String, enum: ROLE, default: ROLE[0] },
  },
  { timestamps: true, versionKey: false }
);

export const vehicleRegistrationSchema = new mongoose.Schema(
  {
    ownerName: { type: String, required: true },
    cccd: { type: String, required: true },
    email: { type: String, required: true, match: validate.email },
    phoneNumber: { type: String, required: true },
    vehicleType: { type: String, required: true },
    licensePlate: { type: String, required: true },
    macAddress: { type: String, required: true },
    currentVersion: { type: String, default: "" }, // Added field for firmware version
    isApproved: { type: Boolean, default: false },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: { type: Date, default: null },
    requestedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);
