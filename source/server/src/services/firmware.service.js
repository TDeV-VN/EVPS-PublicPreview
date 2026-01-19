/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import axios from "axios";
import { env } from "~/config/environment";
import { defaultRedisClient as redisClient } from "~/config/redis.js";
import { mqttService } from "./mqttService.js";
import { intersectionService } from "./intersectionService.js";
import { firmwareModel } from "~/models/firmwareModel.js";

export const FIRMWARE_DIR = path.join(process.cwd(), "uploads", "firmware");

const ensureFirmwareDir = () => {
  if (!fs.existsSync(FIRMWARE_DIR)) {
    console.log(`Creating firmware directory at: ${FIRMWARE_DIR}`);
    fs.mkdirSync(FIRMWARE_DIR, { recursive: true });
  }
};

// Ensure directory exists on startup
ensureFirmwareDir();

const getReleases = async () => {
  if (!env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPO) {
    throw new Error("GitHub configuration (TOKEN, OWNER, REPO) is missing.");
  }

  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/releases`;
  const headers = {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
  };

  try {
    const response = await axios.get(url, {
      headers,
      params: { per_page: 20 },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        `GitHub API Error: ${error.response.status} - ${error.response.statusText}`
      );
    }
    throw error;
  }
};

const downloadAsset = async (assetUrl, fileName) => {
  ensureFirmwareDir();
  const filePath = path.join(FIRMWARE_DIR, fileName);
  console.log(`Downloading asset to: ${filePath}`);
  const writer = fs.createWriteStream(filePath);

  const response = await axios({
    url: assetUrl,
    method: "GET",
    responseType: "stream",
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/octet-stream",
    },
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(filePath));
    writer.on("error", reject);
  });
};

export const firmwareService = {
  syncLatestFirmware: async (type) => {
    // type: 'receiver' | 'transmitter' | undefined (all)
    const releases = await getReleases();
    const downloadResults = [];
    let releaseNote = "";
    let version = "";

    const targetTypes = type ? [type] : ["receiver", "transmitter"];

    for (const target of targetTypes) {
      // Find latest release for this target (tag ends with -target)
      const release = releases.find((r) => r.tag_name.endsWith(`-${target}`));

      if (release) {
        version += `${target}:${release.tag_name} `;
        releaseNote += `\n--- ${target.toUpperCase()} (${
          release.tag_name
        }) ---\n${release.body}`;

        const asset = release.assets.find((a) => a.name.endsWith(".bin"));
        if (asset) {
          // Determine fixed filename for overwriting
          const fixedFileName = `firmware-${target}.bin`;
          await downloadAsset(asset.url, fixedFileName);

          // Update Firmware in DB (upsert or create new history)
          await firmwareModel.findOneAndUpdate(
            { type: target },
            {
              type: target,
              version: release.tag_name,
              fileName: fixedFileName,
              path: path.join("uploads/firmware", fixedFileName),
              releaseNotes: release.body,
            },
            { upsert: true, new: true }
          );

          downloadResults.push({
            type: target,
            version: release.tag_name,
            file: fixedFileName,
            path: path.join("uploads/firmware", fixedFileName),
          });
        }
      }
    }

    if (downloadResults.length === 0) {
      throw new Error("No suitable firmware releases found.");
    }

    return {
      version: version.trim(),
      downloaded: downloadResults,
      releaseNote: releaseNote.trim(),
    };
  },

  listLocalFirmware: async () => {
    // Return data from DB + file system check
    const firmwares = await firmwareModel.find({});
    const validFirmwares = [];

    for (const fw of firmwares) {
      // Correctly resolve path
      const fullPath = path.isAbsolute(fw.path)
        ? fw.path
        : path.join(process.cwd(), fw.path);

      if (fs.existsSync(fullPath)) {
        validFirmwares.push(fw);
      } else {
        // File missing, remove from DB to keep sync
        console.log(
          `[FirmwareService] Auto-removing record for missing file: ${fw.fileName}`
        );
        await firmwareModel.deleteOne({ _id: fw._id });
      }
    }
    return validFirmwares;
  },

  validateDownloadToken: async (token) => {
    const data = await redisClient.get(`ota_token:${token}`);
    if (!data) return null;
    return JSON.parse(data);
  },

  triggerUpdate: async ({ type, targets }) => {
    let macsToUpdate = [];

    if (type === "all") {
      const intersections = await intersectionService.getIntersections({});
      macsToUpdate = intersections.map((i) => i.mac).filter((m) => m);
    } else if (["specific", "list"].includes(type)) {
      if (!Array.isArray(targets) || targets.length === 0) {
        throw new Error("No targets provided for specific update");
      }
      macsToUpdate = targets;
    }

    let successCount = 0;
    for (const mac of macsToUpdate) {
      try {
        mqttService.sendCommand(mac, "CheckFirmware");
        successCount++;
      } catch (err) {
        console.error(`Failed to send update command to ${mac}:`, err);
      }
    }

    return {
      message: `Update command sent to ${successCount} devices`,
      total: macsToUpdate.length,
      sent: successCount,
    };
  },

  getLatestFirmwareByType: async (type) => {
    return await firmwareModel.findOne({ type }).sort({ updatedAt: -1 });
  },
};
