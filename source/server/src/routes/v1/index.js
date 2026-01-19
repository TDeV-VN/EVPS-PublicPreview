import express from "express";
import { StatusCodes } from "http-status-codes";
import ApiError from "~/utils/ApiError.js";
import { userRoute } from "./userRoute";
import { usersManagementRoute } from "./usersManagementRoute.js";
import { vehicleRegistrationRoute } from "./vehicleRegistrationRoute.js";
import { intersectionRoute } from "./intersectionRoute.js";
import { firmwareRoute } from "./firmware.route.js";

const Router = express.Router();

Router.get("/health", function (req, res) {
  res.locals.message = "EVPS APIs V1 is healthy";
  res.status(StatusCodes.ACCEPTED).json({ apiVersion: "v1", status: "OK" });
});

Router.get("/error-simulation", function (req, res, next) {
  next(new ApiError(StatusCodes.ACCEPTED, "This is a simulated error"));
});

// User Routes
Router.use("/users", userRoute);
Router.use("/admin/users", usersManagementRoute);
Router.use("/vehicle-registrations", vehicleRegistrationRoute);
Router.use("/intersections", intersectionRoute);
Router.use("/firmware", firmwareRoute);

module.exports = Router;
