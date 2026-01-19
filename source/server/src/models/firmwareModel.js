import mongoose from "mongoose";

const FIRMWARE_COLLECTION_NAME = "firmwares";
const FIRMWARE_SCHEMA = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["receiver", "transmitter"],
    },
    version: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    releaseNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const firmwareModel = mongoose.model(
  FIRMWARE_COLLECTION_NAME,
  FIRMWARE_SCHEMA
);
