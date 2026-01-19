#include "mqtt_handler.h"
#include "define.h"
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "haversine_distance.h"
#include <HTTPUpdate.h>

// Forward declaration for OTA
void performUpdate(String url);
void update_started();
void update_finished();
void update_progress(int cur, int total);
void checkFirmwareUpdate();


#ifdef MQTT_USE_TLS
#include <WiFiClientSecure.h>
WiFiClientSecure espClient;
const char* hivemq_root_ca PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc
h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+
0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U
A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW
T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH
B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC
B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv
KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn
OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn
jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw
qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI
rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV
HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq
hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ
3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK
NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5
ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur
TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC
jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc
oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq
4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA
mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d
emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=
-----END CERTIFICATE-----

)EOF";
#else
WiFiClient espClient;
#endif

PubSubClient client(espClient);

void mqttSend(String topic, String message) {
    if (client.connected()) {
        client.publish(topic.c_str(), message.c_str());
        Serial.println("MQTT SENT: " + topic);
    } else {
        Serial.println("MQTT SEND FAILED: Client not connected");
    }
}

void requestConfig(String deviceId) {
    JsonDocument doc;
    doc["receiverMac"] = deviceId;
    doc["version"] = FIRMWARE_VERSION;
    String output;
    serializeJson(doc, output);
    mqttSend("server/request-config", output);
    Serial.println("Sent config request for " + deviceId + " (v" + String(FIRMWARE_VERSION) + ")");
}

void requestAuth(String transmitterMac) {
    JsonDocument doc;
    doc["transmitterMac"] = transmitterMac;
    doc["receiverMac"] = WiFi.macAddress();
    String output;
    serializeJson(doc, output);
    mqttSend("server/check-auth", output);
    Serial.println("Sent auth request for " + transmitterMac);
}

bool isMqttConnected() {
    return client.connected();
}

void reconnect(String deviceId) {
  if (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP32Receiver-";
    clientId += String(random(0xffff), HEX);

    if (client.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
      Serial.println("connected");
      
      // Đăng ký topic phản hồi xác thực
      String topicAuth = "esp32/" + deviceId + "/check-auth-response";
      client.subscribe(topicAuth.c_str());
      Serial.println("Subscribed to: " + topicAuth);

      // Đăng ký topic nhận cấu hình
      String topicConfig = "esp32/" + deviceId + "/config-response";
      client.subscribe(topicConfig.c_str());
      Serial.println("Subscribed to: " + topicConfig);

      // --- OTA TOPICS ---
      // 1. Command topic
      String topicCmd = "esp32/" + deviceId + "/command";
      client.subscribe(topicCmd.c_str());
      Serial.println("Subscribed to: " + topicCmd);

      // 2. Update response topic
      String topicUpdate = "esp32/" + deviceId + "/update/response";
      client.subscribe(topicUpdate.c_str());
      Serial.println("Subscribed to: " + topicUpdate);


    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
    }
  }
}

void callback(char* topic, byte* payload, unsigned int length) {
  String topicStr = String(topic);
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  message.trim();

  Serial.println("--------------------------------------------------");
  Serial.print("MQTT MSG ARRIVED [");
  Serial.print(topicStr);
  Serial.print("]: ");
  Serial.println(message);
  Serial.println("--------------------------------------------------");

  // Handle OTA Command Topic
  if (topicStr.endsWith("/command")) {
    // Check command content case-insensitively or exact match
    if (message.equalsIgnoreCase("CheckFirmware") || message.indexOf("CheckFirmware") >= 0) {
        Serial.println(">>> MATCHED: CheckFirmware command received!");
        checkFirmwareUpdate();
        return;
    } else {
        Serial.println(">>> COMMAND IGNORED: Content does not match 'CheckFirmware'");
    }
  }

  // Handle OTA Update Response Topic
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
          String reason = "Unknown"; // Default reason
          if (doc["reason"].is<String>()) reason = doc["reason"].as<String>();
          else if (doc["message"].is<String>()) reason = doc["message"].as<String>();
          Serial.println(">>> Update Denied: " + reason);
       }
    } else {
      Serial.println("Failed to parse update response JSON");
    }
    return;
  }

  // Phân tích phản hồi JSON
  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.print("deserializeJson() failed: ");
    Serial.println(error.c_str());
    return;
  }

  // Xử lý phản hồi xác thực
  if (doc["isApproved"].is<bool>()) {
    bool isApproved = doc["isApproved"];
    const char* transmitterMac = doc["transmitterMac"];
    
    Serial.print("Auth Result for ");
    Serial.print(transmitterMac);
    Serial.print(": ");
    Serial.println(isApproved ? "APPROVED" : "DENIED");

    // Gọi hàm trong main.cpp để xử lý logic phiên
    extern void handleAuthDecision(String mac, bool isApproved);
    handleAuthDecision(String(transmitterMac), isApproved);
  }

  // Xử lý phản hồi cấu hình
  if (doc["pillars"].is<JsonArray>()) {
      JsonArray pillars = doc["pillars"];
      std::vector<TrafficLight> newLights;
      
      for (JsonObject p : pillars) {
          TrafficLight t;
          t.lat = p["lat"];
          t.lon = p["lng"];
          // Sử dụng espGroupPin để xác định nhóm trụ (1 hoặc 2)
          int pId = 0;
          
          // Kiểm tra espGroupPin trước
          if (p["espGroupPin"].is<int>()) {
              pId = p["espGroupPin"];
          } else if (p["espGroupPin"].is<const char*>() || p["espGroupPin"].is<String>()) {
              String pinStr = p["espGroupPin"].as<String>();
              pId = pinStr.toInt();
          }

          // Nếu chưa xác định được, fallback sang logic cũ dùng groupId
          if (pId == 0) {
              if (p["groupId"].is<int>()) {
                  pId = p["groupId"];
              } else {
                  String gId = p["groupId"].as<String>();
                  if (gId == "A" || gId == "1") pId = 1;
                  else if (gId == "B" || gId == "2") pId = 2;
                  else pId = gId.toInt();
              }
          }
          
          t.pairId = pId;
          newLights.push_back(t);
      }
      
      updateTrafficLightsConfig(newLights);
  }
}

void mqttSetup() {
  // Kết nối WiFi được xử lý bởi WiFiManager trong main.cpp
  #ifdef MQTT_USE_TLS
    espClient.setCACert(hivemq_root_ca); // Nạp CA certificate
  #endif

  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(callback);
}

void mqttLoop(String deviceId) {
  if (WiFi.status() != WL_CONNECTED) {
      return; 
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

// ================= OTA IMPLEMENTATION =================

// Hàm tiện ích để điều khiển đèn trực tiếp trong quá trình OTA
void setAllLights(int state, bool isRed, bool isYellow, bool isGreen) {
    // Tắt/Bật LED Nhóm A
    digitalWrite(PIN_A_RED_1, isRed ? state : LOW);
    digitalWrite(PIN_A_RED_2, isRed ? state : LOW);
    digitalWrite(PIN_A_YELLOW_1, isYellow ? state : LOW);
    digitalWrite(PIN_A_YELLOW_2, isYellow ? state : LOW);
    digitalWrite(PIN_A_GREEN_1, isGreen ? state : LOW);
    digitalWrite(PIN_A_GREEN_2, isGreen ? state : LOW);

    // Tắt/Bật LED Nhóm B
    digitalWrite(PIN_B_RED_1, isRed ? state : LOW);
    digitalWrite(PIN_B_RED_2, isRed ? state : LOW);
    digitalWrite(PIN_B_YELLOW_1, isYellow ? state : LOW);
    digitalWrite(PIN_B_YELLOW_2, isYellow ? state : LOW);
    digitalWrite(PIN_B_GREEN_1, isGreen ? state : LOW);
    digitalWrite(PIN_B_GREEN_2, isGreen ? state : LOW);
}

void checkFirmwareUpdate() {
   if (WiFi.status() == WL_CONNECTED && client.connected()) {
      Serial.println(">>> Checking for firmware update...");
      String mac = WiFi.macAddress();
      String topic = "server/request-update";
      String payload = "{\"mac\":\"" + mac + "\", \"type\":\"receiver\"}"; // IMPORTANT: type receiver
      client.publish(topic.c_str(), payload.c_str());
   } else {
      Serial.println("Cannot check update: No WiFi or MQTT connection");
   }
}

// Callbacks cho quá trình update
void update_started() {
  Serial.println("CALLBACK: HTTP update process started");
  // Giai đoạn 2: Trong khi tải, chuyển sang ĐỎ TOÀN BỘ (All Red) để đảm bảo an toàn
  Serial.println(">>> LIGHTS: SWITCHING TO RED (SAFETY MODE)");
  setAllLights(HIGH, true, false, false); 
}

void update_finished() {
  Serial.println("CALLBACK: HTTP update process finished");
  // Giữ nguyên đèn đỏ cho đến khi reboot xong
}

void update_progress(int cur, int total) {
  static unsigned long lastPrint = 0;
  if (millis() - lastPrint > 500) {
     lastPrint = millis();
     Serial.printf("CALLBACK: HTTP update process at %d of %d bytes...\n", cur, total);
     // Nháy đèn LED_MODE_PIN (nếu có trên mạch) để kỹ thuật viên biết đang nạp
     #ifdef LED_MODE_PIN
     digitalWrite(LED_MODE_PIN, !digitalRead(LED_MODE_PIN)); 
     #endif
  }
}

void performUpdate(String url) {
   Serial.println(">>> Starting Firmware Update Sequence...");
   
   // Giai đoạn 1: Cảnh báo - Bật Vàng toàn bộ trong 3 giây
   Serial.println(">>> LIGHTS: WARNING YELLOW (3s)");
   setAllLights(HIGH, false, true, false); // Chỉ bật vàng
   delay(3000);

   // Đăng ký các callback
   httpUpdate.onStart(update_started); // Sẽ bật đèn Đỏ trong hàm này
   httpUpdate.onEnd(update_finished);
   httpUpdate.onProgress(update_progress);
   
   httpUpdate.rebootOnUpdate(true);

   WiFiClient updateClient; 
   updateClient.setTimeout(12000);

   t_httpUpdate_return ret = httpUpdate.update(updateClient, url);

   switch (ret) {
      case HTTP_UPDATE_FAILED:
        Serial.printf("HTTP_UPDATE_FAILED Error (%d): %s\n", httpUpdate.getLastError(), httpUpdate.getLastErrorString().c_str());
        // KHÔI PHỤC: Nếu lỗi, Tắt đèn đỏ, bật lại đèn vàng 1 chút rồi để Main Loop xử lý về Auto
        Serial.println(">>> LIGHTS: RESTORING OPERATION");
        setAllLights(LOW, true, true, true); // Reset hết về LOW
        // Logic Auto trong Main Loop sẽ tự động điều khiển lại đèn ở vòng lặp tiếp theo
        break;

      case HTTP_UPDATE_NO_UPDATES:
        Serial.println("HTTP_UPDATE_NO_UPDATES");
        break;

      case HTTP_UPDATE_OK:
        Serial.println("HTTP_UPDATE_OK");
        break;
   }
}

