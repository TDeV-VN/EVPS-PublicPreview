import express from "express";
import { firmwareController } from "~/controllers/firmware.controller";
import { isAuthorized, isAdmin } from "~/middlewares/authMiddleware.js";

const Router = express.Router();

Router.route("/sync").post(
  isAuthorized,
  isAdmin,
  firmwareController.syncFirmware
);

Router.route("/trigger-update").post(
  isAuthorized,
  isAdmin,
  firmwareController.triggerUpdate
);

Router.route("/").get(isAuthorized, isAdmin, firmwareController.getFirmwares);

Router.route("/latest/:type").get(
  isAuthorized,
  isAdmin,
  firmwareController.getLatestByType
);

Router.route("/download").get(firmwareController.downloadFirmware);

export const firmwareRoute = Router;
