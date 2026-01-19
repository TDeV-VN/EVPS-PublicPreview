import mongoose from "mongoose";

const INTERSECTION_COLLECTION_NAME = "intersections";
const INTERSECTION_COLLECTION_SCHEMA = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mac: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    currentVersion: {
      type: String,
      default: "unknown",
    },
    pillars: [
      {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        groupId: { type: String, required: true },
        espGroupPin: { type: String, required: false },
        description: { type: String },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const intersectionModel = mongoose.model(
  INTERSECTION_COLLECTION_NAME,
  INTERSECTION_COLLECTION_SCHEMA
);
