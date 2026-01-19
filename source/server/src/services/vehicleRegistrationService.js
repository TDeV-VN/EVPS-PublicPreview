import { vehicleRegistrationModel } from "../models/vehicleRegistrationModel.js";

const createRegistration = async (data) => {
  // Có thể thêm logic kiểm tra trùng lặp ở đây nếu cần (ví dụ: check biển số xe hoặc MAC address)
  return await vehicleRegistrationModel.createRegistration(data);
};

const getAllRegistrations = async (params = {}) => {
  const query = {};
  if (params.keyword) {
    const regex = new RegExp(params.keyword, "i");
    query.$or = [
      { ownerName: regex },
      { licensePlate: regex },
      { phoneNumber: regex },
      { email: regex },
    ];
  }
  if (params.isApproved !== undefined) {
    query.isApproved = params.isApproved === "true";
  }
  return await vehicleRegistrationModel.getAllRegistrations(query);
};

const updateRegistration = async (id, data) => {
  return await vehicleRegistrationModel.updateRegistration(id, data);
};

const deleteRegistration = async (id) => {
  return await vehicleRegistrationModel.deleteRegistration(id);
};

const approveRegistration = async (id, userId) => {
  const updateData = {
    isApproved: true,
    approvedBy: userId,
    approvedAt: new Date(),
  };
  return await vehicleRegistrationModel.updateRegistration(id, updateData);
};

const checkDeviceStatus = async (macAddress) => {
  const device = await vehicleRegistrationModel.getRegistrationByMacAddress(
    macAddress
  );
  if (device && device.isApproved) {
    return true;
  }
  return false;
};

const updateVersionByMac = async (macAddress, version) => {
  const device = await vehicleRegistrationModel.getRegistrationByMacAddress(
    macAddress
  );
  if (device) {
    return await vehicleRegistrationModel.updateRegistration(device._id, {
      currentVersion: version,
    });
  }
  return null;
};

export const vehicleRegistrationService = {
  createRegistration,
  getAllRegistrations,
  updateRegistration,
  deleteRegistration,
  approveRegistration,
  checkDeviceStatus,
  updateVersionByMac,
};
