#include <PubSubClient.h>
#include <WiFi.h>
#include <ArduinoJson.h>

void reconnect(String deviceId);
void callback(char* topic, byte* payload, unsigned int length);
void mqttSetup();
void mqttLoop(String deviceId);
void mqttSend(String topic, String message);
void checkFirmwareUpdate();
