import { StatusCodes } from "http-status-codes";
import { vehicleRegistrationService } from "../services/vehicleRegistrationService.js";

const createRegistration = async (req, res, next) => {
  try {
    const registration = await vehicleRegistrationService.createRegistration(
      req.body
    );
    res.status(StatusCodes.CREATED).json(registration);
  } catch (error) {
    next(error);
  }
};

const getAllRegistrations = async (req, res, next) => {
  try {
    const registrations = await vehicleRegistrationService.getAllRegistrations(
      req.query
    );
    res.status(StatusCodes.OK).json(registrations);
  } catch (error) {
    next(error);
  }
};

const updateRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const registration = await vehicleRegistrationService.updateRegistration(
      id,
      req.body
    );
    res.status(StatusCodes.OK).json(registration);
  } catch (error) {
    next(error);
  }
};

const deleteRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;
    await vehicleRegistrationService.deleteRegistration(id);
    res.status(StatusCodes.OK).json({ message: "Deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const approveRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Assuming req.user is populated by auth middleware
    const userId = req.user ? req.user._id : null;
    const registration = await vehicleRegistrationService.approveRegistration(
      id,
      userId
    );
    res.status(StatusCodes.OK).json(registration);
  } catch (error) {
    next(error);
  }
};

const checkDeviceStatus = async (req, res, next) => {
  try {
    const { macAddress } = req.params;
    const isApproved = await vehicleRegistrationService.checkDeviceStatus(
      macAddress
    );
    res.status(StatusCodes.OK).json({ isApproved });
  } catch (error) {
    next(error);
  }
};

export const vehicleRegistrationController = {
  createRegistration,
  getAllRegistrations,
  updateRegistration,
  deleteRegistration,
  approveRegistration,
  checkDeviceStatus,
};
