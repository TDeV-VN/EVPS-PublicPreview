/* eslint-disable no-useless-escape */

import Joi from "joi";
import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/ApiError.js";
import { ROLE, USER_STATUS } from "../utils/constants.js";

const createNew = async (req, res, next) => {
  const schema = Joi.object({
    fullName: fullName,
    email: email,
    role: Joi.string()
      .valid(...ROLE)
      .default("user")
      .messages({
        "string.empty": "Role cannot be empty",
        "any.only": `Role must be one of the following values: ${ROLE.join(
          ", "
        )}`,
      }),
  });

  try {
    await schema.validateAsync(req.body);
    next();
  } catch (error) {
    next(new ApiError(StatusCodes.BAD_REQUEST, error.message));
  }
};

const login = async (req, res, next) => {
  const schema = Joi.object({
    email,
    password,
  });
  try {
    await schema.validateAsync(req.body);
    next();
  } catch (error) {
    next(new ApiError(StatusCodes.BAD_REQUEST, error.message));
  }
};

const update = async (req, res, next) => {
  const schema = Joi.object({
    fullName: fullName,
    role: Joi.string()
      .valid(...ROLE)
      .optional(),
  });

  try {
    await schema.validateAsync(req.body);
    next();
  } catch (error) {
    if (error.isJoi === true) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, error.message));
    }
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  const schema = Joi.object({
    status,
  });
  try {
    await schema.validateAsync(req.body);
    next();
  } catch (error) {
    if (error.isJoi === true) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, error.message));
    }
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  const schema = Joi.object({
    currentPassword: password.label("Current Password"),
    newPassword: password.label("New Password"),
  }).with("currentPassword", "newPassword");
  try {
    await schema.validateAsync(req.body);
    next();
  } catch (error) {
    if (error.isJoi === true) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, error.message));
    }
    next(error);
  }
};

const passwordRecovery = async (req, res, next) => {
  const schema = Joi.object({
    email,
  });
  try {
    await schema.validateAsync(req.body);
    next();
  } catch (error) {
    if (error.isJoi === true) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, error.message));
    }
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  const schema = Joi.object({
    token: Joi.string().required().trim().strict().messages({
      "any.required": "Token is required",
      "string.empty": "Token cannot be empty",
      "string.strict": "Token must be a string",
      "string.trim": "Token cannot have leading or trailing spaces",
    }),
    newPassword: password.label("New Password"),
  });
  try {
    await schema.validateAsync(req.body);
    next();
  } catch (error) {
    if (error.isJoi === true) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, error.message));
    }
    next(error);
  }
};

// Common reusable validators

const email = Joi.string().trim().strict().email().required().messages({
  "any.required": "Email is required",
  "string.empty": "Email cannot be empty",
  "string.email": "Email must be a valid email address",
  "string.trim": "Email cannot have leading or trailing spaces",
  "string.strict": "Email must be a string",
});

const fullName = Joi.string()
  .min(2)
  .max(50)
  .trim()
  .strict()
  .pattern(
    // eslint-disable-next-line no-misleading-character-class
    /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂĐÊÔƠàáảãạăắằẳẵặâấầ̉ẫậđêếềểễệôốồổỗộơớờởỡợùúủũụưứừửữự\s]+$/,
    "lettersAndSpacesOnly"
  )
  .required()
  .messages({
    "any.required": "Full name is required",
    "string.empty": "Full name cannot be empty",
    "string.min": "Full name should have a minimum length of {#limit}",
    "string.max": "Full name should have a maximum length of {#limit}",
    "string.trim": "Full name cannot have leading or trailing spaces",
    "string.pattern.lettersAndSpacesOnly":
      "Full name can only contain letters and spaces",
    "string.strict": "Full name must be a string",
  });

const password = Joi.string()
  .min(8)
  .max(128)
  .trim()
  .strict()
  .pattern(/[a-z]/, "lowercase")
  .pattern(/[A-Z]/, "uppercase")
  .pattern(/\d/, "digit")
  .pattern(/[!@#$%^&*()_+\-=\[\]{}|;:'",.<>\/?~\\]/, "specialCharacter")
  .required()
  .messages({
    "any.required": "Password is required",
    "string.empty": "Password cannot be empty",
    "string.min": "Password should have a minimum length of {#limit}",
    "string.max": "Password should have a maximum length of {#limit}",
    "string.trim": "Password cannot have leading or trailing spaces",
    "string.pattern.lowercase":
      "Password must contain at least one lowercase letter",
    "string.pattern.uppercase":
      "Password must contain at least one uppercase letter",
    "string.pattern.digit": "Password must contain at least one digit",
    "string.pattern.specialCharacter":
      "Password must contain at least one special character",
    "string.strict": "Password must be a string",
  });

const status = Joi.string()
  .required()
  .valid(...USER_STATUS)
  .messages({
    "any.required": "Status is required",
    "string.empty": "Status cannot be empty",
    "any.only": `Status must be one of the following values: ${USER_STATUS.join(
      ", "
    )}`,
  });

export const userValidation = {
  createNew,
  update,
  changePassword,
  updateStatus,
  passwordRecovery,
  resetPassword,
  login,
};

/**
 * Usage example:
 * Router.route("/register").post(userValidation.createNew, userController.register);
 */
