import { StatusCodes } from "http-status-codes";
import { firmwareService, FIRMWARE_DIR } from "~/services/firmware.service";
import path from "path";
import fs from "fs";

const syncFirmware = async (req, res, next) => {
  try {
    const { type } = req.body; // 'receiver' or 'transmitter'
    const result = await firmwareService.syncLatestFirmware(type);
    res.status(StatusCodes.OK).json({
      message: "Sync firmware successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getFirmwares = async (req, res, next) => {
  try {
    const files = await firmwareService.listLocalFirmware();
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Get firmwares successfully",
      data: files,
    });
  } catch (error) {
    next(error);
  }
};

const downloadFirmware = async (req, res, next) => {
  try {
    const { token, type } = req.query;

    if (!token || !type) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Missing token or type",
      });
    }

    // Validate Token
    const tokenData = await firmwareService.validateDownloadToken(token);
    if (!tokenData) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: "Invalid or expired token",
      });
    }

    if (tokenData.type !== type) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: "Token type mismatch",
      });
    }

    // Check File
    const fileName = `firmware-${type}.bin`;
    const filePath = path.join(FIRMWARE_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Firmware file not found",
      });
    }

    // Send File
    res.download(filePath, fileName, (err) => {
      if (err) {
        next(err);
      }
    });
  } catch (error) {
    next(error);
  }
};

const triggerUpdate = async (req, res, next) => {
  try {
    const result = await firmwareService.triggerUpdate(req.body);
    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getLatestByType = async (req, res, next) => {
  try {
    const { type } = req.params;
    const fw = await firmwareService.getLatestFirmwareByType(type);
    if (!fw) {
      // Return 200 with null or 404? 200 null is safer for frontend handling
      return res.status(StatusCodes.OK).json(null);
    }
    res.status(StatusCodes.OK).json(fw);
  } catch (error) {
    next(error);
  }
};

export const firmwareController = {
  syncFirmware,
  getFirmwares,
  downloadFirmware,
  triggerUpdate,
  getLatestByType,
};
