#include <Arduino.h>
#include <WiFiManager.h>
#include <esp_now.h>
#include <WiFi.h>
#include "mqtt_handler.h"
#include <ArduinoJson.h>
#include "haversine_distance.h"
#include "define.h"
#include <mbedtls/aes.h>
#include <queue>
#include <freertos/semphr.h>

// Lưu lịch sử khoảng cách để xác định xu hướng di chuyển
double distanceHistory[HISTORY_WINDOW_SIZE] = {9999.0};
int distanceHistoryIdx = 0;

struct GpsData {
    double lat;
    double lng;
    String macAddr;
    bool isWorking;
};

std::queue<GpsData> gpsQueue;
SemaphoreHandle_t queueMutex;

// =============================
// STRUCT
// =============================
struct TowerPins {
  int G[2];
  int Y[2];
  int R[2];
};

struct ButtonGroup {
  int btnG, btnY, btnR;
};

struct ButtonState {
  bool lastG = HIGH;
  bool lastY = HIGH;
  bool lastR = HIGH;
};

// =============================
// PIN MAP
// =============================
TowerPins A = {
  {PIN_A_GREEN_1, PIN_A_GREEN_2},
  {PIN_A_YELLOW_1, PIN_A_YELLOW_2},
  {PIN_A_RED_1, PIN_A_RED_2}
};

TowerPins B = {
  {PIN_B_GREEN_1, PIN_B_GREEN_2},
  {PIN_B_YELLOW_1, PIN_B_YELLOW_2},
  {PIN_B_RED_1, PIN_B_RED_2}
};

ButtonGroup btnA = {BTN_A_GREEN, BTN_A_YELLOW, BTN_A_RED};
ButtonGroup btnB = {BTN_B_GREEN, BTN_B_YELLOW, BTN_B_RED};

// =============================
// STATE
// =============================
enum LightState { GREEN, YELLOW, RED };

bool isAutoMode = true;
bool wifiConfigRunning = false;

LightState manualStateA = RED;
LightState manualStateB = RED;

ButtonState btnStateA;
ButtonState btnStateB;

// =============================
// BASIC CONTROL
// =============================
void setTower(const TowerPins &tw, LightState st) {
  digitalWrite(tw.G[0], st == GREEN);
  digitalWrite(tw.G[1], st == GREEN);
  digitalWrite(tw.Y[0], st == YELLOW);
  digitalWrite(tw.Y[1], st == YELLOW);
  digitalWrite(tw.R[0], st == RED);
  digitalWrite(tw.R[1], st == RED);
}

// =============================
// AUTO MODE (NON-BLOCKING)
// =============================
void autoMode() {
  static unsigned long timer = 0;
  static int phase = 0;
  unsigned long now = millis();

  unsigned long duration =
    (phase == 0 || phase == 2) ? GREEN_TIME : YELLOW_TIME;

  if (now - timer >= duration) {
    timer = now;
    phase = (phase + 1) % 4;
  }

  switch (phase) {
    case 0: setTower(A, GREEN);  setTower(B, RED);    break;
    case 1: setTower(A, YELLOW); setTower(B, RED);    break;
    case 2: setTower(A, RED);    setTower(B, GREEN);  break;
    case 3: setTower(A, RED);    setTower(B, YELLOW); break;
  }
}

// =============================
// MANUAL MODE
// =============================
void manualControl(const ButtonGroup &btn,
                   ButtonState &bs,
                   LightState &state) {

  bool g = digitalRead(btn.btnG);
  bool y = digitalRead(btn.btnY);
  bool r = digitalRead(btn.btnR);

  if (bs.lastG == HIGH && g == LOW) state = GREEN;
  if (bs.lastY == HIGH && y == LOW) state = YELLOW;
  if (bs.lastR == HIGH && r == LOW) state = RED;

  bs.lastG = g;
  bs.lastY = y;
  bs.lastR = r;
}

void manualMode() {
  manualControl(btnA, btnStateA, manualStateA);
  manualControl(btnB, btnStateB, manualStateB);

  setTower(A, manualStateA);
  setTower(B, manualStateB);
}

// =============================
// WIFI CONFIG
// =============================
void startWifiConfig() {
  Serial.println("=== WIFI CONFIG MODE ===");
  wifiConfigRunning = true;

  WiFiManager wm;
  wm.setConfigPortalTimeout(WIFI_CONFIG_PORTAL_TIMEOUT);

  bool res = wm.startConfigPortal(WIFI_CONFIG_AP_NAME, WIFI_CONFIG_AP_PASSWORD);

  if (res) Serial.println("WiFi configured!");
  else Serial.println("WiFi config timeout");

  wifiConfigRunning = false;
}

// =============================
// HOLD CLICK AUTO BUTTON
// =============================

void handleAutoButton() {
  static bool lastBtn = HIGH;
  static unsigned long pressTime = 0;
  static bool holdTriggered = false;

  bool btn = digitalRead(BTN_RETURN_AUTO);

  // ---- Nhấn xuống ----
  if (lastBtn == HIGH && btn == LOW) {
    pressTime = millis();
    holdTriggered = false;
  }

  // ---- Giữ ----
  if (btn == LOW && !holdTriggered) {
    if (millis() - pressTime >= WIFI_HOLD_TIME_MS) {
      Serial.println("HOLD AUTO BUTTON → WIFI CONFIG");
      holdTriggered = true;
      startWifiConfig();  
    }
  }

  // ---- Thả ra ----
  if (lastBtn == LOW && btn == HIGH) {
    if (!holdTriggered) {
      isAutoMode = !isAutoMode;
      Serial.println(isAutoMode ? "AUTO MODE" : "MANUAL MODE");

      if (!isAutoMode) {
        manualStateA = RED;
        manualStateB = RED;
        btnStateA = ButtonState();
        btnStateB = ButtonState();
      }
    }
  }

  lastBtn = btn;
}

typedef struct struct_message {
  double lat;
  double lng;
  char macAddr[18];
  bool isWorking;
} struct_message;

struct_message myData;

// Biến quản lý phiên
String activeSessionMac = "";
bool isSessionActive = false;
unsigned long lastSessionTime = 0;
String pendingAuthMac = "";
unsigned long lastAuthCheckTime = 0;

// Biến theo dõi khoảng cách cho logic ưu tiên
double lastDistM = 9999.0;
double minSessionDistM = 9999.0;
int intersectionPriorityPair = 0; // 0: chưa vào giao lộ, 1: A, 2: B
bool inIntersection = false;


// Hàm xử lý logic đèn giao thông dựa trên vị trí
void updateTrafficLights(double lat, double lng) {
    double distKm = 0.0;
    int nearestPair = findNearestTrafficLightPairId(lat, lng, distKm);
    double distM = distKm * 1000.0;

    // Cập nhật lịch sử khoảng cách
    // Nếu khoảng cách hiện tại bằng lần trước, không làm gì cả
    if (distM == distanceHistory[(distanceHistoryIdx - 1 + HISTORY_WINDOW_SIZE) % HISTORY_WINDOW_SIZE]) {
        // Không cập nhật lịch sử
    } else {
      // Dịch trái toàn bộ mảng, thêm mới vào cuối (queue FIFO)
      for (int i = 1; i < HISTORY_WINDOW_SIZE; ++i) {
        distanceHistory[i - 1] = distanceHistory[i];
      }
      distanceHistory[HISTORY_WINDOW_SIZE - 1] = distM;

      // Kiểm tra xu hướng di chuyển: nếu phần lớn các giá trị đều giảm thì coi là đang tiến gần
      int decreaseCount = 0;
      int validPairs = 0;
      for (int i = 1; i < HISTORY_WINDOW_SIZE; ++i) {
        validPairs++;
        if (distanceHistory[i - 1] > distanceHistory[i]) decreaseCount++;
      }
      bool isApproaching = (validPairs > 0) && (((float)decreaseCount / validPairs) >= APPROACH_RATIO_THRESHOLD);

      // // Debug log các giá trị chính
      // Serial.printf("[DEBUG] distM=%.2f, isApproaching=%d, inIntersection=%d, nearestPair=%d\n", distM, isApproaching, inIntersection, nearestPair);
      // Serial.print("[DEBUG] distanceHistory: ");
      // for (int i = 0; i < HISTORY_WINDOW_SIZE; ++i) {
      //     Serial.printf("%.2f ", distanceHistory[i]);
      // }
      // Serial.println();

      if (!inIntersection && distM < DISTANCE_THRESHOLD_TRACKING && isApproaching) {
        // Xe bắt đầu vào vùng gần giao lộ, lưu hướng ưu tiên
        intersectionPriorityPair = nearestPair;
        inIntersection = true;
        minSessionDistM = distM;
      }

      if (inIntersection) {
        // Cập nhật khoảng cách gần nhất đã thấy trong phiên này
        if (distM < minSessionDistM) minSessionDistM = distM;

        // Nếu xe đã đi qua giao lộ một khoảng nhất định thì kết thúc phiên
        double distancePassed = distM - minSessionDistM;
        if (distancePassed > DISTANCE_THRESHOLD_EXIT_INTERSECTION) {
          // Kết thúc phiên
          isSessionActive = false;
          activeSessionMac = "";
          isAutoMode = true;
          inIntersection = false;
          intersectionPriorityPair = 0;
          Serial.printf("Vehicle passed intersection %.1fm -> Session CLOSED\n", distancePassed);
          return;
        } else {
          isAutoMode = false;
          Serial.printf("Priority Mode: Pair %d, Dist: %.1fm\n", intersectionPriorityPair, distM);

          // Giữ hướng ưu tiên đã lưu khi vào giao lộ
          if (intersectionPriorityPair == 1) {
            manualStateA = GREEN;
            manualStateB = RED;
          } else if (intersectionPriorityPair == 2) {
            manualStateA = RED;
            manualStateB = GREEN;
          } else {
            Serial.println("Unknown Pair ID -> Defaulting");
          }

          setTower(A, manualStateA);
          setTower(B, manualStateB);
        }
      } else {
        // Nếu xe ở xa > 100m, đảm bảo về Auto Mode
        if (!isAutoMode) {
          isAutoMode = true;
          inIntersection = false;
          intersectionPriorityPair = 0;
          Serial.println("Vehicle out of range -> Auto Mode");
        }
      }

      lastDistM = distM;
    }

    
}

// Hàm xử lý quyết định xác thực từ MQTT
void handleAuthDecision(String mac, bool isApproved) {
  if (isApproved) {
    if (!isSessionActive || activeSessionMac != mac) {
        activeSessionMac = mac;
        isSessionActive = true;
        lastSessionTime = millis();
        Serial.println(">>> Session OPENED for " + mac);
        
        // Reset trạng thái khoảng cách khi bắt đầu phiên mới
        minSessionDistM = 9999.0;
        lastDistM = 9999.0;
        // Reset lịch sử khoảng cách: gán toàn bộ bằng giá trị hiện tại
        double initDist = myData.lat != 0.0 && myData.lng != 0.0 ? findNearestTrafficLightPairId(myData.lat, myData.lng, initDist), initDist * 1000.0 : 9999.0;
        for (int i = 0; i < HISTORY_WINDOW_SIZE; ++i) {
          distanceHistory[i] = initDist;
        }

        // Cập nhật đèn ngay lập tức với tọa độ hiện tại
        updateTrafficLights(myData.lat, myData.lng);
    }
    pendingAuthMac = ""; // Xóa trạng thái chờ
  } else {
    Serial.println(">>> Auth DENIED for " + mac);
    // FIX: Không đóng phiên đang hoạt động khi bị từ chối để tránh chập chờn nếu server gửi True rồi False
    if (activeSessionMac == mac && isSessionActive) {
        Serial.println(">>> IGNORING Denial for Active Session (Stability)");
    }
  }
}

// Callback when data is received
void OnDataRecv(const uint8_t * mac, const uint8_t *incomingData, int len) {
  // --- GIẢI MÃ DỮ LIỆU (AES-128 ECB) ---
  // Kiểm tra độ dài gói tin. Phải là bội số của 16 và đủ lớn để chứa struct
  if (len != 48) {
    return;
  }

  uint8_t decrypted[48];
  
  mbedtls_aes_context aes;
  mbedtls_aes_init(&aes);
  mbedtls_aes_setkey_dec(&aes, ENCRYPTION_KEY, 128);
  
  for (int i = 0; i < 48; i += 16) {
    mbedtls_aes_crypt_ecb(&aes, MBEDTLS_AES_DECRYPT, incomingData + i, decrypted + i);
  }
  mbedtls_aes_free(&aes);
  
  // Copy dữ liệu đã giải mã vào struct
  memcpy(&myData, decrypted, sizeof(myData));
  String incomingMac = String(myData.macAddr);

  // --- XÁC THỰC THÀNH CÔNG (DO ĐÃ GIẢI MÃ ĐƯỢC) ---
  // Nếu giải mã ra rác (do sai key), macAddr sẽ không hợp lệ hoặc lat/lng vô lý.
  // Ta có thể thêm checksum để chắc chắn hơn, nhưng ở đây giả sử giải mã OK là tin cậy.
  
  // --- FORWARD GPS DATA TO SERVER ---
  // Push to queue to handle in main loop (avoid MQTT in ISR context)
  if (queueMutex != NULL) {
      if (xSemaphoreTake(queueMutex, (TickType_t)10) == pdTRUE) {
          GpsData data;
          data.lat = myData.lat;
          data.lng = myData.lng;
          data.macAddr = String(myData.macAddr);
          data.isWorking = myData.isWorking;
          
          // Limit queue size to prevent heap exhaustion
          if (gpsQueue.size() < MAX_GPS_QUEUE_SIZE) {
            gpsQueue.push(data);
          }
          xSemaphoreGive(queueMutex);
      }
  }

  // Kiểm tra tính hợp lệ cơ bản của dữ liệu giải mã
  if (myData.lat == 0.0 && myData.lng == 0.0) return;

    // 1. Kiểm tra xem đây có phải là phiên đang hoạt động không
    if (isSessionActive && incomingMac == activeSessionMac) {
      lastSessionTime = millis(); // Làm mới bộ đếm thời gian phiên

      // Nếu xe tắt chế độ làm nhiệm vụ -> Kết thúc phiên ngay lập tức
      if (!myData.isWorking) {
        isSessionActive = false;
        activeSessionMac = "";
        isAutoMode = true; // Trả về Auto Mode
        inIntersection = false;
        intersectionPriorityPair = 0;
        Serial.println(">>> Vehicle stopped working -> Session CLOSED");
        return;
      }

      // Nếu đang trong giao lộ, updateTrafficLights sẽ tự kiểm tra điều kiện kết thúc phiên (qua 15m)
      updateTrafficLights(myData.lat, myData.lng);
      return;
    }

    // 2. Nếu là xe mới (hoặc phiên cũ đã hết)
    if (!isSessionActive || incomingMac != activeSessionMac) {

      // Chỉ xử lý nếu xe đang làm nhiệm vụ
      if (!myData.isWorking) {
        return;
      }

      // Kiểm tra kết nối Internet
      // Nếu WiFi mất -> Chạy chế độ Offline (tin tưởng tín hiệu mã hóa)
      if (WiFi.status() != WL_CONNECTED) {
        // OFFLINE MODE: Chấp nhận ngay lập tức
        Serial.println(">>> [OFFLINE] Encrypted Signal Verified from: " + incomingMac);
          
        activeSessionMac = incomingMac;
        isSessionActive = true;
        lastSessionTime = millis();
          
        // Reset trạng thái khoảng cách
        minSessionDistM = 9999.0;
        lastDistM = 9999.0;
          
        updateTrafficLights(myData.lat, myData.lng);
      } else {
        // ONLINE MODE: Cần xác thực từ Server
        if (pendingAuthMac != incomingMac) {
          pendingAuthMac = incomingMac;
          lastAuthCheckTime = millis();
          requestAuth(incomingMac);
          Serial.println(">>> [ONLINE] Requesting Auth for: " + incomingMac);
        } else {
          unsigned long waitTime = millis() - lastAuthCheckTime;
          // Nếu chờ quá 2s mà server không trả lời thì tự động chấp nhận xe
          if (waitTime > 2000) {
            Serial.println(">>> [ONLINE] Auth timeout >2s, auto-accepting vehicle: " + incomingMac);
            // Mở phiên cho xe này như khi xác thực thành công
            if (!isSessionActive || activeSessionMac != incomingMac) {
              activeSessionMac = incomingMac;
              isSessionActive = true;
              lastSessionTime = millis();
              // Reset trạng thái khoảng cách khi bắt đầu phiên mới
              minSessionDistM = 9999.0;
              lastDistM = 9999.0;
              double initDist = myData.lat != 0.0 && myData.lng != 0.0 ? findNearestTrafficLightPairId(myData.lat, myData.lng, initDist), initDist * 1000.0 : 9999.0;
              for (int i = 0; i < HISTORY_WINDOW_SIZE; ++i) {
                distanceHistory[i] = initDist;
              }
              updateTrafficLights(myData.lat, myData.lng);
            }
            pendingAuthMac = "";
          } else if (waitTime > 1000) { // vẫn cho phép gửi lại request sau 1s
            lastAuthCheckTime = millis();
            requestAuth(incomingMac);
            Serial.println(">>> [ONLINE] Retry Auth Request for: " + incomingMac);
          }
        }
      }
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("-------------------------------");
  Serial.print("RECEIVER FIRMWARE VERSION: ");
  Serial.println(FIRMWARE_VERSION);
  Serial.println("-------------------------------");

  // Init ESP-NOW
  WiFi.mode(WIFI_STA);
  if (esp_now_init() != ESP_OK) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }
  esp_now_register_recv_cb(OnDataRecv);

#ifdef WOKWI_SIMULATION
  WiFi.begin("Wokwi-GUEST", "", 6); // Wokwi Wifi
  while (WiFi.status() != WL_CONNECTED) {
    delay(100);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected (Wokwi-GUEST)");
#else
  WiFiManager wm;
  wm.setConnectTimeout(10);
  wm.setConfigPortalTimeout(120);

  if (wm.autoConnect(WIFI_CONFIG_AP_NAME, WIFI_CONFIG_AP_PASSWORD)) {
    Serial.println("WiFi connected");
  } else {
    Serial.println("OFFLINE MODE");
    loadTrafficLightsConfigFromNVS();
  }
#endif

  Serial.print("WiFi Channel: ");
  Serial.println(WiFi.channel());

  // Khởi tạo MQTT
  mqttSetup();

  // Đảm bảo MQTT đã kết nối trước khi gửi requestConfig
  // Lặp lại tối đa 10 lần, mỗi lần chờ 500ms
  int mqttWait = 0;
  while (!isMqttConnected() && mqttWait < 10) {
    mqttLoop(WiFi.macAddress());
    delay(500);
    mqttWait++;
  }
  if (isMqttConnected()) {
    requestConfig(WiFi.macAddress());
    Serial.println("Đã gửi yêu cầu lấy cấu hình khi khởi động");
  } else {
    Serial.println("Không thể kết nối MQTT để lấy cấu hình lúc khởi động");
  }

  for (int i = 0; i < 2; i++) {
    pinMode(A.G[i], OUTPUT);
    pinMode(A.Y[i], OUTPUT);
    pinMode(A.R[i], OUTPUT);
    pinMode(B.G[i], OUTPUT);
    pinMode(B.Y[i], OUTPUT);
    pinMode(B.R[i], OUTPUT);
  }

  pinMode(btnA.btnG, INPUT_PULLUP);
  pinMode(btnA.btnY, INPUT_PULLUP);
  pinMode(btnA.btnR, INPUT_PULLUP);
  pinMode(btnB.btnG, INPUT_PULLUP);
  pinMode(btnB.btnY, INPUT_PULLUP);
  pinMode(btnB.btnR, INPUT_PULLUP);

  pinMode(BTN_RETURN_AUTO, INPUT_PULLUP);
  pinMode(LED_MODE_PIN, OUTPUT);

  Serial.println("START IN AUTO MODE");
  
  queueMutex = xSemaphoreCreateMutex();
}

// =============================
// LOOP
// =============================
void loop() {
  mqttLoop(WiFi.macAddress());
  
  // Process GPS Queue
  // THAY ĐỔI: Chỉ gửi dữ liệu mới nhất mỗi MQTT_GPS_INTERVAL_MS để tránh làm nghẽn MQTT
  static unsigned long lastMqttGpsSendTime = 0;

  if (queueMutex != NULL && (millis() - lastMqttGpsSendTime > MQTT_GPS_INTERVAL_MS)) {
      GpsData data;
      bool hasData = false;
      
      if (xSemaphoreTake(queueMutex, (TickType_t)10) == pdTRUE) {
          // Lấy dữ liệu mới nhất (drain queue)
          while (!gpsQueue.empty()) {
              data = gpsQueue.front();
              gpsQueue.pop();
              hasData = true;
          }
          xSemaphoreGive(queueMutex);
      }
      
      if (hasData && WiFi.status() == WL_CONNECTED) {
          lastMqttGpsSendTime = millis();
          
          JsonDocument doc;
          doc["lat"] = data.lat;
          doc["lng"] = data.lng;
          doc["isWorking"] = data.isWorking;
          doc["macAddress"] = data.macAddr;
          
          String output;
          serializeJson(doc, output);
          String topic = "esp32/" + data.macAddr + "/status";
          mqttSend(topic, output);
      }
  }

  handleAutoButton();

    // Kiểm tra hết hạn phiên
    if (isSessionActive) {
      if (millis() - lastSessionTime > SESSION_TIMEOUT_MS) {
        isSessionActive = false;
        activeSessionMac = "";
        isAutoMode = true;
        inIntersection = false;
        intersectionPriorityPair = 0;
        Serial.printf("\n>>> Session CLOSED (Timeout 5s). No data since: %lu ms\n", lastSessionTime);
        Serial.println("Session Timeout -> Auto Mode");
      }
    }

  digitalWrite(LED_MODE_PIN, isAutoMode ? HIGH : LOW);

  if (isAutoMode) autoMode();
  else manualMode();
}
