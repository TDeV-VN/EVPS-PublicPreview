#include <Arduino.h>
#include "define.h"
#include <esp_now.h>
#include <WiFi.h>
#include <esp_wifi.h> // Thêm thư viện này để đổi kênh
#include <TinyGPS++.h>
#include "mqtt_handler.h"
#include "fake_paths.h"
#include <WiFiManager.h>
#include <mbedtls/aes.h>

// test build 3

// --- CẤU HÌNH CHẾ ĐỘ GPS ---
enum GpsMode {
  MODE_FAKE_1,
  MODE_FAKE_2,
  MODE_FAKE_3,
  MODE_FAKE_4,
  MODE_REAL_GPS
};

GpsMode currentGpsMode = MODE_REAL_GPS; // Mặc định dùng GPS thật
int fakePathIndex = 0;
unsigned long lastFakeUpdate = 0;

// =============================
// WIFI CONFIG
// =============================
bool wifiConfigRunning = false;

void startWifiConfig() {
  Serial.println("=== WIFI CONFIG MODE ===");
  wifiConfigRunning = true;
  
  // Turn on LEDs to indicate mode
  digitalWrite(PIN_LED_TASK, HIGH);
  digitalWrite(PIN_LED_INTERNET, HIGH);

  WiFiManager wm;
  wm.setConfigPortalTimeout(WIFI_CONFIG_PORTAL_TIMEOUT);

  // Tên Wifi và Mật khẩu mặc định để config
  bool res = wm.startConfigPortal(WIFI_CONFIG_AP_NAME, WIFI_CONFIG_AP_PASSWORD);

  if (res) Serial.println("WiFi configured!");
  else Serial.println("WiFi config timeout");

  wifiConfigRunning = false;
}

// Helper function to get current mode name
String getModeName(GpsMode mode) {
  switch(mode) {
    case MODE_FAKE_1: return "FAKE PATH 1";
    case MODE_FAKE_2: return "FAKE PATH 2";
    case MODE_FAKE_3: return "FAKE PATH 3";
    case MODE_FAKE_4: return "FAKE PATH 4";
    case MODE_REAL_GPS: return "REAL GPS";
    default: return "UNKNOWN";
  }
}
// ------------------------------------

// Đối tượng GPS
TinyGPSPlus gps;
// Sử dụng HardwareSerial 2 cho GPS (RX2, TX2)
HardwareSerial SerialGPS(2);

typedef struct struct_message {
  double lat; // Vĩ độ
  double lng; // Kinh độ
  char macAddr[18]; // Địa chỉ MAC
  bool isWorking; // Trạng thái làm nhiệm vụ
} struct_message;

struct_message myData;
esp_now_peer_info_t peerInfo;

bool isWorking = false; // Trạng thái làm nhiệm vụ
unsigned long lastSendTime = 0; // Thời gian gửi esp-now cuối cùng
unsigned long lastGpsPrintTime = 0; // Thời gian in thông tin GPS

// Biến cho nút nhấn Task (Nhiệm vụ)
int lastTaskButtonState = HIGH;
int currentTaskButtonState = HIGH;
unsigned long lastTaskDebounceTime = 0;
unsigned long taskButtonPressTime = 0;
bool longPressHandled = false;
bool veryLongPressHandled = false;

// Biến cho nút nguồn (Power)
int lastPowerButtonState = HIGH;
unsigned long powerButtonPressTime = 0;
const unsigned long powerOffDelay = 3000; // Giữ 3 giây để tắt

// Callback khi dữ liệu được gửi đi
void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
  Serial.print("\r\nTrạng thái gửi gói tin: ");
  if (status == ESP_NOW_SEND_SUCCESS) {
    Serial.println("Đã phát sóng (Broadcast)");
  } else {
    Serial.println("Lỗi phát sóng");
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("-------------------------------");
  Serial.print("TRANSMITTER FIRMWARE VERSION: ");
  Serial.println(FIRMWARE_VERSION);
  Serial.println("-------------------------------");

  // Khởi động Serial cho GPS (Baudrate mặc định của NEO-M8N thường là 9600)
  // SerialGPS.begin(Baudrate, Config, RX_Pin, TX_Pin)
  SerialGPS.begin(GPS_BAUD_RATE, SERIAL_8N1, PIN_ESP_RX_GPS, PIN_ESP_TX_GPS);
  Serial.println("Dang khoi tao GPS...");

  // Cấu hình WiFi ở chế độ Station để có thể phát ESP-NOW
  WiFi.mode(WIFI_STA);
  
  // Cấu hình nút nhấn
  pinMode(PIN_BUTTON_TASK, INPUT_PULLUP);

  // Cấu hình nút nguồn và đánh thức
  pinMode(PIN_BUTTON_POWER, INPUT_PULLUP);
  esp_sleep_enable_ext0_wakeup((gpio_num_t)PIN_BUTTON_POWER, 0); // Wake up khi LOW

  // Cấu hình LED
  pinMode(PIN_LED_POWER, OUTPUT);
  pinMode(PIN_LED_TASK, OUTPUT);
  pinMode(PIN_LED_INTERNET, OUTPUT);

  // Bật đèn nguồn
  digitalWrite(PIN_LED_POWER, HIGH);
  
  // TÙY CHỌN: Tăng công suất phát để test khoảng cách tối đa
  // WiFi.setTxPower(WIFI_POWER_19_5dBm);

  // Khởi tạo ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("Lỗi khởi tạo ESP-NOW");
    return;
  }

  // Đăng ký callback gửi
  esp_now_register_send_cb(OnDataSent);
  
  // Đăng ký địa chỉ Broadcast làm Peer (Bắt buộc trên một số phiên bản ESP32 SDK)
  memcpy(peerInfo.peer_addr, broadcastAddress, 6);
  peerInfo.channel = 0;  // Sử dụng kênh mặc định
  peerInfo.encrypt = false;
  
  if (esp_now_add_peer(&peerInfo) != ESP_OK){
    Serial.println("Không thể thêm địa chỉ Broadcast");
    return;
  }

#ifdef WOKWI_SIMULATION
  WiFi.begin("Wokwi-GUEST", "", 6); 
  while (WiFi.status() != WL_CONNECTED) {
    delay(100);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected (Wokwi-GUEST)");
#else
  // --- WiFi Manager AutoConnect ---
  WiFiManager wm;
  wm.setConnectTimeout(WIFI_CONNECT_TIMEOUT_SEC); // Thử kết nối trong 20s
  // wm.setConfigPortalTimeout(120); // Nếu muốn tự mở portal khi lỗi

  // Cố gắng kết nối với WiFi đã lưu. Nếu thất bại, nó sẽ KHÔNG tự mở portal (trừ khi dùng autoConnect)
  // Ở đây ta chỉ muốn nó thử kết nối, nếu không được thì thôi (chờ user kích hoạt config mode)
  if (wm.autoConnect()) {
      Serial.println("WiFi Connected via Saved Credentials!");
  } else {
      Serial.println("WiFi Connect Failed. Running Offline.");
  }
#endif

  Serial.print("WiFi Channel: ");
  Serial.println(WiFi.channel());

  // Khởi tạo MQTT
  mqttSetup();

  Serial.println("He thong san sang. Nhan nut de bat/tat che do gui.");
}

void loop() {
  // --- Xử lý MQTT ---
  mqttLoop(WiFi.macAddress());

  // --- Xử lý nhấn giữ cả 2 nút (WiFi Config) ---
  static unsigned long bothButtonsStart = 0;
  static bool bothButtonsHandled = false;
  
  int taskReadingForConfig = digitalRead(PIN_BUTTON_TASK);
  int powerReadingForConfig = digitalRead(PIN_BUTTON_POWER);

  if (taskReadingForConfig == LOW && powerReadingForConfig == LOW) {
      if (bothButtonsStart == 0) bothButtonsStart = millis();
      
      if (millis() - bothButtonsStart > BUTTON_BOTH_HOLD_TIME_MS && !bothButtonsHandled) {
          bothButtonsHandled = true;
          startWifiConfig();
          
          // Reset individual timers to prevent them from firing after return
          powerButtonPressTime = millis(); 
          taskButtonPressTime = millis();
          longPressHandled = true; // Prevent task long press
      }
  } else {
      bothButtonsStart = 0;
      if (taskReadingForConfig == HIGH && powerReadingForConfig == HIGH) {
          bothButtonsHandled = false;
      }
  }

  // --- Xử lý nút nguồn (Giữ 3s để tắt) ---
  int powerReading = digitalRead(PIN_BUTTON_POWER);
  if (powerReading == LOW && lastPowerButtonState == HIGH) {
    powerButtonPressTime = millis(); // Bắt đầu nhấn
  }
  if (powerReading == LOW && lastPowerButtonState == LOW) {
    // Chỉ tắt nguồn nếu nút Task KHÔNG được nhấn và chưa xử lý combo (để tránh xung đột)
    if (digitalRead(PIN_BUTTON_TASK) == HIGH && !bothButtonsHandled) {
      if (millis() - powerButtonPressTime > POWER_OFF_DELAY_MS) {
        Serial.println("Dang tat nguon (Deep Sleep)...");
        // Nháy đèn báo hiệu sắp tắt
        for(int i=0; i<5; i++) {
          digitalWrite(PIN_LED_POWER, LOW); delay(100);
          digitalWrite(PIN_LED_POWER, HIGH); delay(100);
        }
        digitalWrite(PIN_LED_POWER, LOW);
        digitalWrite(PIN_LED_TASK, LOW);
        digitalWrite(PIN_LED_INTERNET, LOW);
        
        // Chờ nhả nút để tránh wake up ngay lập tức
        while(digitalRead(PIN_BUTTON_POWER) == LOW) { delay(10); }
        
        esp_deep_sleep_start();
      }
    }
  }
  lastPowerButtonState = powerReading;

  // --- XÁC ĐỊNH TỌA ĐỘ (GPS THẬT HOẶC FAKE) ---
  double currentLat = 0.0;
  double currentLng = 0.0;
  bool isLocationValid = false;
  int satellites = 0;

  if (currentGpsMode == MODE_REAL_GPS) {
    // Đọc dữ liệu từ GPS thật
    while (SerialGPS.available() > 0) {
      gps.encode(SerialGPS.read());
    }
    if (gps.location.isValid()) {
        currentLat = gps.location.lat();
        currentLng = gps.location.lng();
        satellites = gps.satellites.value();
        isLocationValid = true;
    }
  } else {
    // Giả lập di chuyển mỗi 2 giây
    if (millis() - lastFakeUpdate > FAKE_PATH_UPDATE_INTERVAL_MS) {
        lastFakeUpdate = millis();
        fakePathIndex++;
        
        // Reset index based on current path length
        int currentPathLen = 0;
        switch(currentGpsMode) {
          case MODE_FAKE_1: currentPathLen = sizeof(fakePath1)/sizeof(fakePath1[0]); break;
          case MODE_FAKE_2: currentPathLen = sizeof(fakePath2)/sizeof(fakePath2[0]); break;
          case MODE_FAKE_3: currentPathLen = sizeof(fakePath3)/sizeof(fakePath3[0]); break;
          case MODE_FAKE_4: currentPathLen = sizeof(fakePath4)/sizeof(fakePath4[0]); break;
          default: currentPathLen = 1; break;
        }
        fakePathIndex = fakePathIndex % currentPathLen;
    }

    // Assign coordinates based on mode
    switch(currentGpsMode) {
      case MODE_FAKE_1:
        currentLat = fakePath1[fakePathIndex].lat;
        currentLng = fakePath1[fakePathIndex].lng;
        break;
      case MODE_FAKE_2:
        currentLat = fakePath2[fakePathIndex].lat;
        currentLng = fakePath2[fakePathIndex].lng;
        break;
      case MODE_FAKE_3:
        currentLat = fakePath3[fakePathIndex].lat;
        currentLng = fakePath3[fakePathIndex].lng;
        break;
      case MODE_FAKE_4:
        currentLat = fakePath4[fakePathIndex].lat;
        currentLng = fakePath4[fakePathIndex].lng;
        break;
      default: break;
    }
    
    satellites = 10; // Giả lập 10 vệ tinh
    isLocationValid = true;
  }

  // --- Cập nhật trạng thái LED Internet ---
  digitalWrite(PIN_LED_INTERNET, (WiFi.status() == WL_CONNECTED) ? HIGH : LOW);

  // --- Xử lý nút nhấn Task (Debounce & Long Press) ---
  int reading = digitalRead(PIN_BUTTON_TASK);

  // Nếu trạng thái nút thay đổi (do nhiễu hoặc nhấn thật)
  if (reading != lastTaskButtonState) {
    lastTaskDebounceTime = millis(); // Reset timer
  }

  if ((millis() - lastTaskDebounceTime) > debounceDelay) {
    // Nếu trạng thái đã ổn định lâu hơn debounceDelay
    if (reading != currentTaskButtonState) {
      currentTaskButtonState = reading;

      // Xử lý khi nhấn xuống (Falling edge)
      if (currentTaskButtonState == LOW) {
        taskButtonPressTime = millis();
      } 
      // Xử lý khi nhả ra (Rising edge)
      else {
        // Chỉ xử lý nếu không phải là combo 2 nút (WiFi config)
        if (!bothButtonsHandled) {
           unsigned long holdTime = millis() - taskButtonPressTime;

           // --- TRƯỜNG HỢP 3: OTA (Giữ > 10s) ---
           if (holdTime >= 10000) {
               Serial.println("\n>>> [USER TRIGGER] Kiem tra cap nhat phan mem (OTA)...");
               // Nháy đèn LED nhanh xác nhận
               for(int i=0; i<5; i++) {
                  digitalWrite(PIN_LED_TASK, !digitalRead(PIN_LED_TASK));
                  delay(50);
               }
               checkFirmwareUpdate();
           }
           // --- TRƯỜNG HỢP 2: Chuyển GPS (Giữ 3s - 10s) ---
           else if (holdTime >= 3000) {
               // Chuyển đổi chế độ GPS
                int nextMode = ((int)currentGpsMode + 1) % 5;
                currentGpsMode = (GpsMode)nextMode;
                fakePathIndex = 0;
                
                Serial.print("\n>>> CHUYEN CHE DO GPS: ");
                Serial.println(getModeName(currentGpsMode));
                
                // Nháy đèn LED Task
                for(int i=0; i<3; i++) {
                  digitalWrite(PIN_LED_TASK, !digitalRead(PIN_LED_TASK));
                  delay(100);
                }
           }
           // --- TRƯỜNG HỢP 1: Bật/Tắt Nhiệm vụ (Giữ < 3s) ---
           else {
               isWorking = !isWorking;
                Serial.print("\n>>> TRANG THAI THAY DOI: ");
                if (isWorking) {
                  Serial.println("DANG LAM NHIEM VU (Bat dau gui)");
                } else {      
                  Serial.println("NGHI NGOI (Dung gui)");
                }
           }
        }
      }
    }
  }
  
  lastTaskButtonState = reading;

  // --- Feedback LED khi giữ nút ---
  if (currentTaskButtonState == LOW && !bothButtonsHandled) {
      unsigned long currentHold = millis() - taskButtonPressTime;
      
      // Nếu giữ > 10s: Nháy rất nhanh để báo hiệu OTA sẵn sàng
      if (currentHold >= 10000) {
         if ((millis() / 100) % 2 == 0) digitalWrite(PIN_LED_TASK, HIGH);
         else digitalWrite(PIN_LED_TASK, LOW);
      }
      // Nếu giữ > 3s: Nháy chậm để báo hiệu chuyển GPS
      else if (currentHold >= 3000) {
         if ((millis() / 300) % 2 == 0) digitalWrite(PIN_LED_TASK, HIGH);
         else digitalWrite(PIN_LED_TASK, LOW);
      }
  } else {
      // Khi không nhấn nút, LED hiển thị trạng thái làm việc (Sáng = Đang làm nhiệm vụ)
      digitalWrite(PIN_LED_TASK, isWorking ? HIGH : LOW);
  }

  // --- Xử lý in thông tin GPS (Độc lập với gửi) ---
  // Nếu làm nhiệm vụ: 1s/lần. Nếu không: 5s/lần.
  unsigned long printInterval = isWorking ? gpsPrintIntervalTask : gpsPrintIntervalIdle;
  
  if (millis() - lastGpsPrintTime >= printInterval) {
    lastGpsPrintTime = millis();
    
    if (isLocationValid) {
      Serial.printf("GPS [%s]: Lat=%.6f, Lng=%.6f, Sats=%d [%s]\n", 
        isWorking ? "TASK-1s" : "IDLE-5s",
        currentLat, currentLng, satellites,
        getModeName(currentGpsMode).c_str());
    } else {
      Serial.printf("GPS [%s]: Dang tim tin hieu ve tinh... [Da doc: %lu bytes]\n", 
        isWorking ? "TASK-1s" : "IDLE-5s", gps.charsProcessed());
        
      if (currentGpsMode == MODE_REAL_GPS && gps.charsProcessed() < 10) {
          Serial.println("   -> CANH BAO: Khong nhan duoc du lieu nao tu GPS!");
          Serial.printf("   -> Kiem tra lai day: TX cua GPS noi vao GPIO %d, RX cua GPS noi vao GPIO %d.\n", PIN_ESP_RX_GPS, PIN_ESP_TX_GPS);
      }
    }
  }

  // --- Xử lý gửi dữ liệu ESP-NOW (Chỉ khi làm nhiệm vụ) ---
  if (isWorking) {
    // [NEW] Nếu đang kết nối WiFi -> Ngắt kết nối để ưu tiên Channel Hopping
    if (WiFi.status() == WL_CONNECTED) {
       Serial.println(">>> Disconnecting WiFi to enable Channel Hopping...");
       WiFi.disconnect(); 
       delay(100);
    }

    // Non-blocking delay
    if (millis() - lastSendTime >= sendInterval) {
      lastSendTime = millis();
      
      // Lấy và gán địa chỉ MAC
      String mac = WiFi.macAddress();
      mac.toCharArray(myData.macAddr, 18);
      
      // Gán trạng thái làm nhiệm vụ
      myData.isWorking = isWorking;

      // Cập nhật tọa độ GPS vào struct
      myData.lat = currentLat;
      myData.lng = currentLng;
      
      // --- MÃ HÓA DỮ LIỆU (AES-128 ECB) ---
      // ESP-NOW max payload là 250 bytes. Struct của ta nhỏ (34 bytes).
      // AES block size = 16 bytes. Cần padding để chia hết cho 16.
      
      uint8_t plaintext[48]; // Buffer cho dữ liệu gốc (đã padding)
      uint8_t encrypted[48]; // Buffer cho dữ liệu đã mã hóa
      
      // 1. Copy struct vào plaintext buffer
      memset(plaintext, 0, sizeof(plaintext)); // Xóa buffer
      memcpy(plaintext, &myData, sizeof(myData)); // Copy dữ liệu
      
      // 2. Mã hóa từng block 16 bytes
      mbedtls_aes_context aes;
      mbedtls_aes_init(&aes);
      mbedtls_aes_setkey_enc(&aes, ENCRYPTION_KEY, 128);
      
      for (int i = 0; i < 48; i += 16) {
        mbedtls_aes_crypt_ecb(&aes, MBEDTLS_AES_ENCRYPT, plaintext + i, encrypted + i);
      }
      mbedtls_aes_free(&aes);
      
      // --- GỬI ĐA KÊNH (CHANNEL HOPPING) ---
      // Quét từ kênh 1 đến 13. Yêu cầu WiFi phải được ngắt kết nối trước đó.
      
      Serial.println(">>> Broadcasting on ALL Channels (1-13)...");
      
      for (int ch = ESP_NOW_CHANNEL_START; ch <= ESP_NOW_CHANNEL_END; ch++) {
        esp_wifi_set_channel(ch, WIFI_SECOND_CHAN_NONE);
        
        // Gửi 2 lần liên tiếp (Burst)
        esp_now_send(broadcastAddress, encrypted, sizeof(encrypted));
        delay(ESP_NOW_BURST_DELAY_1_MS); 
        esp_now_send(broadcastAddress, encrypted, sizeof(encrypted));
        delay(ESP_NOW_BURST_DELAY_2_MS); 
      }
      // Không cần quay về kênh cũ vì ta đã chủ động ngắt WiFi
      
      // In thông báo gửi (ngắn gọn)
      Serial.printf("SENT (Encrypted) -> MAC: %s | Lat: %.6f | Lng: %.6f\n", myData.macAddr, myData.lat, myData.lng);
/*
      if (result != ESP_OK) {
        Serial.println("Lỗi thực thi lệnh gửi");
      }
*/
    }
  } else {
    // Nếu không làm nhiệm vụ và chưa kết nối WiFi -> Thử kết nối lại
    // (Chỉ thử mỗi 5s để tránh spam)
    static unsigned long lastReconnectAttempt = 0;
    if (WiFi.status() != WL_CONNECTED && millis() - lastReconnectAttempt > WIFI_RECONNECT_INTERVAL_MS) {
       lastReconnectAttempt = millis();
       Serial.println(">>> Attempting to reconnect WiFi (Idle Mode)...");
       WiFi.reconnect();
    }
  }

  // --- Gửi thông tin qua MQTT mỗi 5s ---
  static unsigned long lastMqttSendTime = 0;
  if (millis() - lastMqttSendTime >= MQTT_SEND_INTERVAL_MS) {
    lastMqttSendTime = millis();
    
    String mac = WiFi.macAddress();
    
    // Tạo JSON string thủ công để tiết kiệm bộ nhớ
    String json = "{";
    json += "\"mac\":\"" + mac + "\",";
    json += "\"lat\":" + String(currentLat, 6) + ",";
    json += "\"lng\":" + String(currentLng, 6) + ",";
    json += "\"isWorking\":" + String(isWorking ? "true" : "false");
    json += "}";

    // Topic: esp32/MAC_ADDRESS/status
    String topic = "esp32/" + mac + "/status";
    mqttSend(topic, json);
  }
}