### ...

---

## BẮT ĐẦU VỚI

- Yêu cầu tải xuống tệp `docker-compose.dev.env` và `docker-compose.prod.env` [tại đây](https://drive.google.com/drive/folders/16P8zo1XQm1JKm2ZfZRlfr5FRiOLMhTwC?usp=sharing) (nếu chưa có) và đặt trong thư mục cùng cấp với tệp `docker-compose.yml`.

---

## KHỞI CHẠY ỨNG DỤNG (./source)

- **Môi trường Development:** `npm run docker:dev`

- **Môi trường Production:** `npm run docker:prod`

---

## Các môi trường

### Môi trường development (dev)

- **Đồng bộ** code trong các container với thư mục trên máy host và hỗ trợ **hot reload** (trừ các thao tác liên quan tới thay đổi dependencies)

### Môi trường production (prod)

- **Không đồng bộ** code trong các container với thư mục trên máy host

- **Không thể truy cập** các service database như mongodb và redis từ bên ngoài docker-network

---

## Tài khoản quản trị mặc định (Admin)

Khi khởi chạy ứng dụng lần đầu, hệ thống sẽ tự động tạo một tài khoản Admin với thông tin sau (có thể thay đổi trong file `docker-compose.*.env`):

**Email:** `admin@evps.com`
**Mật khẩu:** `Admin@123`

---

## HƯỚNG DẪN CÀI ĐẶT RECEIVER & TRANSMITTER

### Yêu cầu

- Dự án sử dụng **PlatformIO** trên VSCode, cần cài extension **PlatformIO IDE**.
- Để mô phỏng, cài extension **Wokwi Simulator** và lấy license nếu cần.
- Yêu cầu tải xuống tệp `config.h` [tại đây](https://drive.google.com/drive/folders/16P8zo1XQm1JKm2ZfZRlfr5FRiOLMhTwC?usp=sharing) (nếu chưa có) và đặt trong thư mục cùng cấp với tệp `config.sample.h`.

### Chạy mô phỏng Wokwi

1. Mở terminal PlatformIO tại thư mục tương ứng (`/receiver` hoặc `/transmitter`).
2. Build dự án:
   - Receiver: `pio run -e wokwi`
   - Transmitter: `pio run -e wokwi`
3. Mở file `diagram.json` và nhấn **Run** để bắt đầu mô phỏng.

### Nạp code cho board thật

- Cài driver CH340: [Tải tại đây](https://www.wemos.cc/en/latest/ch340_driver.html)
- Chạy lệnh nạp code:
  - Receiver (NodeMCU-32S): `pio run -e nodemcu-32s -t upload`
  - Transmitter (ESP32-WROOM-32E): `pio run -e esp32-wroom-32e -t upload`

### Thay đổi sơ đồ linh kiện mô phỏng

- Chỉnh sửa sơ đồ trên [https://wokwi.com](https://wokwi.com), copy nội dung mới vào file `diagram.json` trong VSCode.

---
