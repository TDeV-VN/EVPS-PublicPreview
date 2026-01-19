#ifndef CONFIG_H
#define CONFIG_H

#define FIRMWARE_VERSION "0.0.0.sample"

#include <Arduino.h>

// =========================
// MÃ HÓA (ENCRYPTION)
// =========================
// Khóa mã hóa AES-128 (16 bytes) - Phải giống nhau giữa Transmitter và Receiver
static const uint8_t ENCRYPTION_KEY[16] = {};

// =========================
// CẤU HÌNH WIFI & MẠNG (TRANSMITTER)
// =========================
// Tên Wifi phát ra khi vào chế độ cấu hình
#define WIFI_CONFIG_AP_NAME ""
// Mật khẩu Wifi cấu hình
#define WIFI_CONFIG_AP_PASSWORD ""
// Thời gian chờ trong cổng cấu hình (giây)
#define WIFI_CONFIG_PORTAL_TIMEOUT 0
// Thời gian chờ kết nối Wifi (giây) -> chỉ cho autoConnect
#define WIFI_CONNECT_TIMEOUT_SEC 0
// Thời gian thử kết nối lại Wifi khi mất kết nối (ms)
#define WIFI_RECONNECT_INTERVAL_MS 0

// =========================
// CẤU HÌNH ESP-NOW & GPS
// =========================
// ĐỊA CHỈ MAC QUẢNG BÁ (FF:FF:FF:FF:FF:FF)
static const uint8_t broadcastAddress[] = {};

// Tốc độ Baud cho Module GPS
#define GPS_BAUD_RATE 0

// Thời gian chống rung cho nút nhấn (milliseconds)
static const unsigned long debounceDelay = 0;
// Thời gian nhấn giữ cả 2 nút để vào chế độ config (ms)
#define BUTTON_BOTH_HOLD_TIME_MS 0
// Thời gian nhấn giữ nút nguồn để tắt máy (ms)
#define POWER_OFF_DELAY_MS 0

// Thời gian giả lập cập nhật vị trí fake path (ms)
#define FAKE_PATH_UPDATE_INTERVAL_MS 0

// Biến thời gian gửi ESP-NOW (ms)
static const unsigned long sendInterval = 0; 

// Kênh bắt đầu và kết thúc để hopping (quét kênh)
#define ESP_NOW_CHANNEL_START 0
#define ESP_NOW_CHANNEL_END 0
// Thời gian delay giữa các lần gửi burst (ms)
#define ESP_NOW_BURST_DELAY_1_MS 0
#define ESP_NOW_BURST_DELAY_2_MS 0

// Thời gian in log GPS (milliseconds)
static const unsigned long gpsPrintIntervalTask = 0; // Khi đang làm nhiệm vụ
static const unsigned long gpsPrintIntervalIdle = 0; // Khi nghỉ

// =========================
// MQTT CONFIG
// =========================
// Chu kỳ gửi trạng thái qua MQTT (ms)
#define MQTT_SEND_INTERVAL_MS 0

#define MQTT_SERVER "" 
#define MQTT_PORT 0
#define MQTT_USER ""
#define MQTT_PASS ""

// Comment dòng bên dưới nếu không sử dụng TLS
#define MQTT_USE_TLS

#endif
