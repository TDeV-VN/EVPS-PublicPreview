#ifndef MQTT_HANDLER_H
#define MQTT_HANDLER_H

#include <Arduino.h>

void reconnect(String deviceId);
void callback(char* topic, byte* payload, unsigned int length);
void mqttSetup();
void mqttLoop(String deviceId);
void mqttSend(String topic, String message);
void requestAuth(String transmitterMac);
void requestConfig(String deviceId);
bool isMqttConnected();
void checkFirmwareUpdate();

#endif
