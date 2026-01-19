import "dotenv/config";

export const mqttConfig = {
  host: process.env.MQTT_HOST || "mosquitto",
  port: process.env.MQTT_PORT || 1883,
  username: process.env.MQTT_USER || "user1",
  password: process.env.MQTT_PASSWORD || "12345678",
  protocol: process.env.MQTT_PROTOCOL || "mqtt", // mqtt or mqtts
};
