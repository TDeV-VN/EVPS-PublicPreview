import mqtt from "mqtt";
import { mqttConfig } from "../config/mqtt.js";
import { myLogger } from "~/loggers/mylogger.log";
import { vehicleRegistrationService } from "./vehicleRegistrationService.js";
import { intersectionService } from "./intersectionService.js";
import path from "path";
import fs from "fs";
import { FIRMWARE_DIR } from "./firmware.service.js";
import { defaultRedisClient as redisClient } from "~/config/redis.js"; // Import redis
import crypto from "crypto";
import { OTA_TOKEN_TTL } from "~/utils/constants.js";
import { env } from "~/config/environment.js";

let client;
let io; // Socket.io instance

const setSocketIo = (socketIoInstance) => {
  io = socketIoInstance;
};

const publish = (topic, message) => {
  if (client && client.connected) {
    client.publish(topic, message, (err) => {
      if (err) {
        myLogger.error(`Failed to publish to ${topic}:`, err);
      } else {
        myLogger.debug(`Published to ${topic}: ${message}`);
      }
    });
  } else {
    myLogger.warn("MQTT Client not connected. Cannot publish.");
  }
};

const connect = () => {
  const connectUrl = `${mqttConfig.protocol}://${mqttConfig.host}:${mqttConfig.port}`;

  myLogger.info(`Connecting to MQTT Broker at ${connectUrl}`);

  client = mqtt.connect(connectUrl, {
    clientId: `server_${Math.random().toString(16).slice(3)}`,
    clean: true,
    connectTimeout: 4000,
    username: mqttConfig.username,
    password: mqttConfig.password,
    reconnectPeriod: 5000,
    // rejectUnauthorized: false, // Uncomment if using self-signed certificates
  });

  client.on("connect", () => {
    myLogger.info("Connected to MQTT Broker");

    // Subscribe to all device status topics
    client.subscribe("esp32/+/status", (err) => {
      if (!err) {
        myLogger.info("Subscribed to topic: esp32/+/status");
      } else {
        myLogger.error("Failed to subscribe to topic: esp32/+/status", err);
      }
    });
    // Subscribe to update requests
    client.subscribe("server/request-update", (err) => {
      if (!err) {
        myLogger.info("Subscribed to topic: server/request-update");
      } else {
        myLogger.error("Failed to subscribe to server/request-update", err);
      }
    });
    // Subscribe to check-auth topic
    client.subscribe("server/check-auth", (err) => {
      if (!err) {
        myLogger.info("Subscribed to topic: server/check-auth");
      } else {
        myLogger.error("Failed to subscribe to topic: server/check-auth", err);
      }
    });

    // Subscribe to request-config topic
    client.subscribe("server/request-config", (err) => {
      if (!err) {
        myLogger.info("Subscribed to topic: server/request-config");
      } else {
        myLogger.error(
          "Failed to subscribe to topic: server/request-config",
          err
        );
      }
    });

    // Subscribe to request-vehicle-config topic (for transmitters)
    client.subscribe("server/request-vehicle-config", (err) => {
      if (!err) {
        myLogger.info("Subscribed to topic: server/request-vehicle-config");
      } else {
        myLogger.error(
          "Failed to subscribe to topic: server/request-vehicle-config",
          err
        );
      }
    });
  });

  client.on("message", async (topic, payload) => {
    try {
      const message = payload.toString();
      myLogger.debug(`Received message on ${topic}: ${message}`);

      // Handle request-vehicle-config (Transmitter Version Report)
      if (topic === "server/request-vehicle-config") {
        try {
          const data = JSON.parse(message);
          const { mac, version } = data;
          if (mac && version) {
            myLogger.info(
              `Received version report from Vehicle ${mac}: ${version}`
            );
            await vehicleRegistrationService.updateVersionByMac(mac, version);
          }
        } catch (e) {
          myLogger.error("Error parsing request-vehicle-config:", e);
        }
        return;
      }

      // Handle request-config
      if (topic === "server/request-config") {
        try {
          const data = JSON.parse(message);
          const { receiverMac, version } = data;

          if (receiverMac) {
            myLogger.info(`Processing config request for ${receiverMac}`);

            // Update version if provided
            if (version) {
              try {
                await intersectionService.updateIntersectionByMac(receiverMac, {
                  currentVersion: version,
                });
              } catch (err) {
                myLogger.warn(
                  `Failed to update version for ${receiverMac}:`,
                  err.message
                );
              }
            }

            try {
              const intersection =
                await intersectionService.getIntersectionByMac(receiverMac);

              if (intersection) {
                const response = {
                  pillars: intersection.pillars,
                };
                const responseTopic = `esp32/${receiverMac}/config-response`;
                publish(responseTopic, JSON.stringify(response));
                myLogger.info(`Sent config to ${receiverMac}`);
              } else {
                myLogger.warn(`No intersection found for MAC: ${receiverMac}`);
              }
            } catch (err) {
              myLogger.error(
                `Error fetching intersection for ${receiverMac}:`,
                err
              );
            }
          }
        } catch (e) {
          myLogger.error("Error parsing request-config message:", e);
        }
        return;
      }

      // Handle Firmware Update Request
      if (topic === "server/request-update") {
        try {
          const { mac, type } = JSON.parse(message);
          // type: 'receiver' | 'transmitter'

          let isAllowed = false;

          // 1. Check if device is registered
          if (type === "receiver") {
            try {
              const intersection =
                await intersectionService.getIntersectionByMac(mac);
              if (intersection) isAllowed = true;
            } catch {
              // Intersection not found throws error, ignore it to keep isAllowed=false
            }
          } else if (type === "transmitter") {
            const isApproved =
              await vehicleRegistrationService.checkDeviceStatus(mac);
            if (isApproved) isAllowed = true;
          }

          // 2. Check if firmware file exists
          const firmwareFileName = `firmware-${type}.bin`;
          const firmwarePath = path.join(FIRMWARE_DIR, firmwareFileName);

          if (!fs.existsSync(firmwarePath)) {
            isAllowed = false;
            myLogger.warn(
              `Firmware file not found for ${type} at ${firmwarePath}`
            );
          }

          if (isAllowed) {
            // 3. Generate Token
            const token = crypto.randomBytes(16).toString("hex");

            // 4. Save to Redis with TTL
            await redisClient.setex(
              `ota_token:${token}`,
              OTA_TOKEN_TTL,
              JSON.stringify({ mac, type })
            );

            // 5. Send Response
            const responseTopic = `esp32/${mac}/update/response`;

            // Use specific env variables for firmware download, fallback to app host
            const host =
              env.FIRMWARE_DOWNLOAD_HOST || env.APP_HOST || "localhost";
            const port =
              env.FIRMWARE_DOWNLOAD_PORT ||
              env.APP_PUBLIC_PORT ||
              env.APP_PORT ||
              5000;
            const downloadUrl = `http://${host}:${port}/v1/firmware/download?token=${token}&type=${type}`;

            publish(
              responseTopic,
              JSON.stringify({
                allowed: true,
                token: token,
                url: downloadUrl,
                ttl: OTA_TOKEN_TTL,
              })
            );
            myLogger.info(
              `Update allowed for ${mac} (${type}). Token generated.`
            );
          } else {
            const responseTopic = `esp32/${mac}/update/response`;
            publish(
              responseTopic,
              JSON.stringify({
                allowed: false,
                reason: "Unauthorized or missing firmware",
              })
            );
            myLogger.warn(`Update denied for ${mac} (${type})`);
          }
        } catch (e) {
          myLogger.error("Error handling update request:", e);
        }
        return;
      }

      // Handle check-auth request
      if (topic === "server/check-auth") {
        try {
          const data = JSON.parse(message);
          const { transmitterMac, receiverMac } = data;

          if (transmitterMac && receiverMac) {
            const isApproved =
              await vehicleRegistrationService.checkDeviceStatus(
                transmitterMac
              );

            const response = {
              transmitterMac: transmitterMac,
              isApproved: isApproved,
            };

            // Send response back to the specific receiver
            const responseTopic = `esp32/${receiverMac}/check-auth-response`;
            publish(responseTopic, JSON.stringify(response));
          }
        } catch (e) {
          myLogger.error("Error parsing check-auth message:", e);
        }
        return; // Exit after handling
      }

      // Parse topic to get MAC address
      // Topic format: esp32/MAC_ADDRESS/status
      const parts = topic.split("/");
      if (parts.length === 3 && parts[2] === "status") {
        const data = JSON.parse(message);

        // Emit data to Frontend via Socket.io
        if (io) {
          io.emit("vehicle-status-update", {
            ...data,
            timestamp: new Date(),
          });
        }
      }
    } catch (error) {
      myLogger.error("Error processing MQTT message:", error);
    }
  });

  client.on("error", (error) => {
    myLogger.error("MQTT Client Error:", error);
  });

  client.on("reconnect", () => {
    myLogger.warn("Reconnecting to MQTT Broker...");
  });
};

const sendCommand = (macAddress, command) => {
  const topic = `esp32/${macAddress}/command`;
  publish(topic, command);
};

export const mqttService = {
  connect,
  publish,
  sendCommand,
  setSocketIo,
};
