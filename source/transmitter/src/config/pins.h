#pragma once
#define PIN_LED_INBUILT 2
#define PIN_BUTTON_TASK 5 // Bật tắt trạng thái làm nhiệm vụ
#define PIN_BUTTON_POWER 32 // Nút nguồn (Soft Power Off)

// LED Status Pins
#define PIN_LED_POWER    25 // Đèn báo nguồn (Luôn sáng)
#define PIN_LED_TASK     27 // Đèn báo đang làm nhiệm vụ (Sáng khi isWorking = true)
#define PIN_LED_INTERNET 26 // Đèn báo kết nối Internet (Sáng khi có WiFi)

// GPS Pins (Using UART2)
// Chân RX của ESP32 (Nối vào chân TX của GPS)
#define PIN_ESP_RX_GPS 19 
// Chân TX của ESP32 (Nối vào chân RX của GPS)
#define PIN_ESP_TX_GPS 18
