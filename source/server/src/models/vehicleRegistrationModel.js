import mongoose from "mongoose";
import { vehicleRegistrationSchema } from "./schemas.js";

const VehicleRegistration = mongoose.model(
  "VehicleRegistration",
  vehicleRegistrationSchema
);

const createRegistration = async (data) => {
  const registration = new VehicleRegistration(data);
  return await registration.save();
};

const getRegistrationById = async (id) =>
  await VehicleRegistration.findById(id).exec();

const getAllRegistrations = async (query = {}) =>
  await VehicleRegistration.find(query).exec();

const updateRegistration = async (id, updateData) => {
  return await VehicleRegistration.findByIdAndUpdate(id, updateData, {
    new: true,
  });
};

const deleteRegistration = async (id) => {
  return await VehicleRegistration.findByIdAndDelete(id).exec();
};

const getRegistrationByMacAddress = async (macAddress) => {
  return await VehicleRegistration.findOne({ macAddress }).exec();
};

export const vehicleRegistrationModel = {
  createRegistration,
  getRegistrationById,
  getAllRegistrations,
  updateRegistration,
  deleteRegistration,
  getRegistrationByMacAddress,
};
