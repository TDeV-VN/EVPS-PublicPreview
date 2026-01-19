#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

#define FIRMWARE_VERSION "0.0.0.sample"

// Số lượng mẫu lịch sử khoảng cách dùng để xác định xu hướng di chuyển (window size)
#define HISTORY_WINDOW_SIZE 0
// Ngưỡng tỉ lệ số lần đo giảm hoặc bằng liên tiếp trong lịch sử để coi là đang tiến gần
#define APPROACH_RATIO_THRESHOLD 0

// Khóa mã hóa AES-128 (16 bytes) - Phải giống nhau giữa Transmitter và Receiver
static const uint8_t ENCRYPTION_KEY[16] = {};

// Tên Wifi phát ra khi vào chế độ cấu hình
#define WIFI_CONFIG_AP_NAME ""
// Mật khẩu Wifi cấu hình
#define WIFI_CONFIG_AP_PASSWORD ""
// Thời gian chờ trng cổng cấu hình (giây)
#define WIFI_CONFIG_PORTAL_TIMEOUT 0
// Thời gian nhấn giữ nút để vào chế độ cấu hình Wifi (ms)
#define WIFI_HOLD_TIME_MS 0

// Thời gian thử lại yêu cầu xác thực (ms)
#define AUTH_RETRY_INTERVAL_MS 0

// Thời gian đèn xanh bật ở chế độ tự động (ms)
const unsigned long GREEN_TIME = 0;
// Thời gian đèn vàng bật ở chế độ tự động (ms)
const unsigned long YELLOW_TIME = 0;

// Ngưỡng khoảng cách để bắt đầu theo dõi xe ưu tiên (mét)
const double DISTANCE_THRESHOLD_TRACKING = 0;
// Khoảng cách xe đi qua giao lộ để ngắt ưu tiên (m)
const double DISTANCE_THRESHOLD_EXIT_INTERSECTION = 0;

// Thời gian hết hạn phiên làm việc nếu không nhận được dữ liệu (ms)
const unsigned long SESSION_TIMEOUT_MS = 0;

// Kích thước tối đa hàng đợi GPS
#define MAX_GPS_QUEUE_SIZE 0

// Khoảng cách thời gian gửi tọa độ GPS mới qua MQTT (ms)
const unsigned long MQTT_GPS_INTERVAL_MS = 0;

#define MQTT_SERVER "" 
#define MQTT_PORT 0
#define MQTT_USER ""
#define MQTT_PASS ""

// Comment nếu không sử dụng TLS
#define MQTT_USE_TLS

#endif
