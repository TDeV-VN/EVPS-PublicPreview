import { intersectionModel } from "~/models/intersectionModel";
import ApiError from "~/utils/ApiError";
import { StatusCodes } from "http-status-codes";

const createIntersection = async (reqBody) => {
  const existingIntersection = await intersectionModel.findOne({
    mac: reqBody.mac,
  });
  if (existingIntersection) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      "Intersection with this MAC address already exists"
    );
  }
  const createdIntersection = await intersectionModel.create(reqBody);
  return createdIntersection;
};

const getIntersections = async (query) => {
  // Basic filtering and pagination can be added here if needed
  const intersections = await intersectionModel.find(query);
  return intersections;
};

const getIntersectionById = async (intersectionId) => {
  const intersection = await intersectionModel.findById(intersectionId);
  if (!intersection) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Intersection not found");
  }
  return intersection;
};

const getIntersectionByMac = async (mac) => {
  const intersection = await intersectionModel.findOne({ mac });
  if (!intersection) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Intersection not found");
  }
  return intersection;
};

const updateIntersectionByMac = async (mac, updateData) => {
  const intersection = await intersectionModel.findOneAndUpdate(
    { mac },
    updateData,
    { new: true }
  );
  // Note: We don't throw error here if not found, to allow soft failures in MQTT, or we can handle upstream
  return intersection;
};

const updateIntersectionById = async (intersectionId, reqBody) => {
  const intersection = await intersectionModel.findByIdAndUpdate(
    intersectionId,
    reqBody,
    { new: true }
  );
  if (!intersection) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Intersection not found");
  }
  return intersection;
};

const deleteIntersectionById = async (intersectionId) => {
  const intersection = await intersectionModel.findByIdAndDelete(
    intersectionId
  );
  if (!intersection) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Intersection not found");
  }
  return intersection;
};

export const intersectionService = {
  createIntersection,
  getIntersections,
  getIntersectionById,
  getIntersectionByMac,
  updateIntersectionByMac,
  updateIntersectionById,
  deleteIntersectionById,
};
