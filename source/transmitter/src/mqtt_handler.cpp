#include "mqtt_handler.h"
#include "config/config.h"
#include "define.h" // Để lấy thông tin PIN
#include <HTTPUpdate.h>

#ifdef MQTT_USE_TLS
  #include <WiFiClientSecure.h>
  WiFiClientSecure espClient;
#else
  WiFiClient espClient;
#endif

PubSubClient client(espClient);

// Forward declaration
void performUpdate(String url);
void update_started();
void update_finished();
void update_progress(int cur, int total);

void requestConfig(String deviceId) {
    // Send version to server to store
    JsonDocument doc;
    doc["mac"] = deviceId;
    doc["version"] = FIRMWARE_VERSION;
    String output;
    serializeJson(doc, output);
    client.publish("server/request-vehicle-config", output.c_str());
    Serial.println("Sent version info for " + deviceId + " (v" + String(FIRMWARE_VERSION) + ")");
}

void reconnect(String deviceId) {
  // Loop until we're reconnected
  if (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    // Create a random client ID
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);

    // Attempt to connect
    if (client.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
      Serial.println("connected");
      
      // Subscribe to topics
      // 1. Command topic
      String topicCmd = "esp32/" + deviceId + "/command";
      client.subscribe(topicCmd.c_str());
      Serial.println("Subscribed to: " + topicCmd);

      // 2. Update response topic
      String topicUpdate = "esp32/" + deviceId + "/update/response";
      client.subscribe(topicUpdate.c_str());
      Serial.println("Subscribed to: " + topicUpdate);

      // Report Version
      requestConfig(deviceId);

    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying (handled in loop to avoid blocking)
    }
  }
}

void callback(char* topic, byte* payload, unsigned int length) {
  String topicStr = String(topic);
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.print("Message arrived [");
  Serial.print(topicStr);
  Serial.print("]: ");
  Serial.println(message);

  // Handle Response Topic
  if (topicStr.endsWith("/update/response")) {
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, message);
    if (!error) {
       bool allowed = doc["allowed"];
       if (allowed) {
          String fullUrl = doc["url"].as<String>(); 
          Serial.println(">>> Update Allowed! Starting OTA...");
          Serial.println(">>> URL: " + fullUrl);
          
          performUpdate(fullUrl);
       } else {
          String reason = doc["reason"].as<String>();
          Serial.println(">>> Update Denied: " + reason);
       }
    } else {
      Serial.println("Failed to parse update response JSON");
    }
    return;
  }

  // Handle Command Topic
  if (message == "CheckFirmware") {
    Serial.println("CheckFirmware request received via MQTT.");
    checkFirmwareUpdate();
  }
}

void checkFirmwareUpdate() {
   if (WiFi.status() == WL_CONNECTED && client.connected()) {
      Serial.println(">>> Checking for firmware update...");
      String mac = WiFi.macAddress();
      String topic = "server/request-update";
      String payload = "{\"mac\":\"" + mac + "\", \"type\":\"transmitter\"}";
      client.publish(topic.c_str(), payload.c_str());
   } else {
      Serial.println("Cannot check update: No WiFi or MQTT connection");
   }
}

// Callbacks cho quá trình update
void update_started() {
  Serial.println("CALLBACK: HTTP update process started");
}

void update_finished() {
  Serial.println("CALLBACK: HTTP update process finished");
}

void update_progress(int cur, int total) {
  static unsigned long lastPrint = 0;
  if (millis() - lastPrint > 500) {
     lastPrint = millis();
     Serial.printf("CALLBACK: HTTP update process at %d of %d bytes...\n", cur, total);
     digitalWrite(PIN_LED_TASK, !digitalRead(PIN_LED_TASK)); // Nháy đèn khi đang tải
  }
}

void performUpdate(String url) {
   Serial.println(">>> Starting Firmware Update...");
   
   // Đăng ký các callback để theo dõi tiến trình
   httpUpdate.onStart(update_started);
   httpUpdate.onEnd(update_finished);
   httpUpdate.onProgress(update_progress);
   
   // Tự động khởi động lại sau khi update thành công
   httpUpdate.rebootOnUpdate(true);

   WiFiClient updateClient; 
   // Tăng timeout kết nối
   updateClient.setTimeout(12000);

   t_httpUpdate_return ret = httpUpdate.update(updateClient, url);

   switch (ret) {
      case HTTP_UPDATE_FAILED:
        Serial.printf("HTTP_UPDATE_FAILED Error (%d): %s\n", httpUpdate.getLastError(), httpUpdate.getLastErrorString().c_str());
        break;

      case HTTP_UPDATE_NO_UPDATES:
        Serial.println("HTTP_UPDATE_NO_UPDATES");
        break;

      case HTTP_UPDATE_OK:
        Serial.println("HTTP_UPDATE_OK");
        break;
   }
}


void mqttSetup() {
  // Kết nối WiFi nếu chưa kết nối
  if (WiFi.status() != WL_CONNECTED) {
      Serial.println("WiFi not connected. Waiting for connection...");
      // WiFi.begin(); // Thử kết nối lại với thông tin đã lưu (nếu cần)
  }

  #ifdef MQTT_USE_TLS
    espClient.setInsecure(); // Bỏ qua kiểm tra chứng chỉ (linh động cho nhiều broker)
  #endif

  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(callback);
}

void mqttLoop(String deviceId) {
  // Kiểm tra kết nối WiFi
  if (WiFi.status() != WL_CONNECTED) {
      static unsigned long lastWifiPrint = 0;
      if (millis() - lastWifiPrint > 3000) {
        lastWifiPrint = millis();
        Serial.print("WiFi Disconnected. Status: ");
        Serial.println(WiFi.status());
        // Status: 3=CONNECTED, 6=DISCONNECTED, 1=NO_SSID, 4=FAILED
      }
      return; 
  }

  static bool wifiConnectedLog = false;
  if (!wifiConnectedLog) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    wifiConnectedLog = true;
  }

  if (!client.connected()) {
    static unsigned long lastReconnectAttempt = 0;
    unsigned long now = millis();
    if (now - lastReconnectAttempt > 5000) {
      lastReconnectAttempt = now;
      reconnect(deviceId);
    }
  } else {
      client.loop();
  }
}

void mqttSend(String topic, String message) {
    if (client.connected()) {
        client.publish(topic.c_str(), message.c_str());
        Serial.println("MQTT Published: " + message + " to " + topic);
    }
}
