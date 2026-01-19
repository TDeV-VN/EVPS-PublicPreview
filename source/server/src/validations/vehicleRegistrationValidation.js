import Joi from "joi";
import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/ApiError.js";

const createRegistration = async (req, res, next) => {
  const schema = Joi.object({
    ownerName: Joi.string().required().min(2).max(50).trim().messages({
      "any.required": "Owner name is required",
      "string.empty": "Owner name cannot be empty",
    }),
    cccd: Joi.string()
      .required()
      .pattern(/^[0-9]{12}$/)
      .messages({
        "any.required": "CCCD is required",
        "string.empty": "CCCD cannot be empty",
        "string.pattern.base": "CCCD must be 12 digits",
      }),
    email: Joi.string().email().required().messages({
      "any.required": "Email is required",
      "string.empty": "Email cannot be empty",
      "string.email": "Email must be a valid email",
    }),
    phoneNumber: Joi.string()
      .required()
      .pattern(/^[0-9]{10,11}$/)
      .messages({
        "any.required": "Phone number is required",
        "string.empty": "Phone number cannot be empty",
        "string.pattern.base": "Phone number must be 10-11 digits",
      }),
    vehicleType: Joi.string().required().messages({
      "any.required": "Vehicle type is required",
      "string.empty": "Vehicle type cannot be empty",
    }),
    licensePlate: Joi.string().required().messages({
      "any.required": "License plate is required",
      "string.empty": "License plate cannot be empty",
    }),
    macAddress: Joi.string()
      .required()
      .pattern(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)
      .messages({
        "any.required": "MAC address is required",
        "string.empty": "MAC address cannot be empty",
        "string.pattern.base":
          "Invalid MAC address format (e.g., 00:1A:2B:3C:4D:5E)",
      }),
  });

  try {
    await schema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    next(new ApiError(StatusCodes.BAD_REQUEST, error.message));
  }
};

const updateRegistration = async (req, res, next) => {
  const schema = Joi.object({
    ownerName: Joi.string().min(2).max(50).trim().messages({
      "string.empty": "Owner name cannot be empty",
    }),
    cccd: Joi.string()
      .pattern(/^[0-9]{12}$/)
      .messages({
        "string.empty": "CCCD cannot be empty",
        "string.pattern.base": "CCCD must be 12 digits",
      }),
    email: Joi.string().email().messages({
      "string.empty": "Email cannot be empty",
      "string.email": "Email must be a valid email",
    }),
    phoneNumber: Joi.string()
      .pattern(/^[0-9]{10,11}$/)
      .messages({
        "string.empty": "Phone number cannot be empty",
        "string.pattern.base": "Phone number must be 10-11 digits",
      }),
    vehicleType: Joi.string().messages({
      "string.empty": "Vehicle type cannot be empty",
    }),
    licensePlate: Joi.string().messages({
      "string.empty": "License plate cannot be empty",
    }),
    macAddress: Joi.string()
      .pattern(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)
      .messages({
        "string.empty": "MAC address cannot be empty",
        "string.pattern.base":
          "Invalid MAC address format (e.g., 00:1A:2B:3C:4D:5E)",
      }),
    isApproved: Joi.boolean(),
  });

  try {
    await schema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    next(new ApiError(StatusCodes.BAD_REQUEST, error.message));
  }
};

export const vehicleRegistrationValidation = {
  createRegistration,
  updateRegistration,
};
