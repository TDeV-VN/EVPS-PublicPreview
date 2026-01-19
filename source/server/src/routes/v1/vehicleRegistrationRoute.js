import express from "express";
import { vehicleRegistrationController } from "../../controllers/vehicleRegistrationController.js";
import { vehicleRegistrationValidation } from "../../validations/vehicleRegistrationValidation.js";
import { isAuthorized } from "../../middlewares/authMiddleware.js";

const Router = express.Router();

// Public routes
Router.route("/").post(
  vehicleRegistrationValidation.createRegistration,
  vehicleRegistrationController.createRegistration
);

Router.route("/check-auth/:macAddress").get(
  vehicleRegistrationController.checkDeviceStatus
);

// Protected routes
Router.use(isAuthorized);

Router.route("/").get(vehicleRegistrationController.getAllRegistrations);

Router.route("/:id")
  .put(
    vehicleRegistrationValidation.updateRegistration,
    vehicleRegistrationController.updateRegistration
  )
  .delete(vehicleRegistrationController.deleteRegistration);

Router.route("/:id/approve").patch(
  vehicleRegistrationController.approveRegistration
);

export const vehicleRegistrationRoute = Router;
