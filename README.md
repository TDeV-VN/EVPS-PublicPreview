# Hệ thống Tín hiệu Giao thông Ưu tiên (EVPS - Emergency Vehicle Preemption System)

## GIỚI THIỆU CHUNG

Trong bối cảnh đô thị hóa nhanh chóng tại Việt Nam, tình trạng ùn tắc giao thông ngày càng nghiêm trọng đã gây cản trở lớn cho hoạt động của các phương tiện ưu tiên (xe cứu thương, xe cứu hỏa, xe cảnh sát). Hệ thống đèn tín hiệu hiện tại đa phần hoạt động theo chu kỳ cố định, thiếu khả năng nhận diện các tình huống khẩn cấp, dẫn đến việc chậm trễ trong công tác cứu hộ, cứu nạn, đe dọa trực tiếp đến tính mạng con người và tài sản.

**Hệ thống tín hiệu giao thông ưu tiên (EVPS)** là một giải pháp IoT toàn diện được thiết kế để giải quyết vấn đề trên. Hệ thống tự động nhận diện và cấp quyền ưu tiên (chuyển đèn xanh) cho các phương tiện khẩn cấp hợp pháp khi tiến gần đến nút giao, giúp rút ngắn thời gian tiếp cận hiện trường và giảm nguy cơ va chạm giao thông.

## KIẾN TRÚC & CÔNG NGHỆ CỐT LÕI

Dự án được xây dựng hướng tới mô hình đô thị thông minh (Smart City), kết hợp chặt chẽ giữa thiết bị phần cứng (IoT) và nền tảng quản lý phần mềm (Web Server):

- **Bộ phát tín hiệu (Transmitter):** Lắp đặt trên xe ưu tiên, sử dụng vi điều khiển ESP32 và module định vị GPS (NEO-M8N). Vị trí tọa độ của xe được liên tục thu thập, mã hóa bảo mật bằng thuật toán **AES-128**, và phát sóng qua giao thức **ESP-NOW** với độ trễ siêu thấp.
- **Bộ thu tín hiệu (Receiver):** Tích hợp tại tủ điều khiển đèn giao thông. Nhận tín hiệu ESP-NOW, giải mã và tính toán khoảng cách thực tế giữa xe và nút giao bằng **công thức Haversine**. Tự động can thiệp chuyển đổi đèn giao thông khi xe tiến vào vùng kích hoạt và trả lại trạng thái chu kỳ tự động ngay khi xe đã đi qua.
- **Hệ thống Backend (Node.js/Express/MongoDB):** Máy chủ trung tâm giúp xác thực quyền ưu tiên của thiết bị, cung cấp API quản lý, giao tiếp thông qua giao thức MQTT và điều phối các tác vụ bất đồng bộ với BullMQ và Redis.
- **Frontend Dashboard (React/Vite):** Nền tảng quản lý tập trung trên Web, cho phép giám sát viên theo dõi vị trí xe ưu tiên theo thời gian thực (Real-time qua Socket.IO) trên bản đồ số, quản lý cấu hình nút giao và phê duyệt đăng ký phương tiện mới.

## TÍNH NĂNG NỔI BẬT

- **Cơ chế hoạt động linh hoạt (Online/Offline):** Đảm bảo tính an toàn cao nhất (Fail-safe). Khi mất mạng Internet, hệ thống tại nút giao vẫn tự động nhận diện và nhường đường cho các xe đã được mã hóa hợp lệ thông qua giao tiếp cục bộ ESP-NOW.
- **Xác thực phương tiện hợp pháp:** Ngăn chặn các hành vi giả mạo tín hiệu (tấn công Replay/Spoofing). Chỉ những thiết bị được đăng ký và phê duyệt mới có quyền tác động đến đèn giao thông.
- **Cập nhật Firmware qua mạng (FOTA):** Hệ thống có quy trình tự động đồng bộ và cập nhật Firmware cho hàng loạt thiết bị IoT (Transmitter/Receiver) trực tiếp từ xa thông qua Server và Github Releases.
- **Quản lý phiên làm việc thông minh (Timeout Management):** Tự động dọn dẹp phiên ưu tiên và khôi phục đèn giao thông về bình thường nếu xe ưu tiên đi chệch hướng, mất sóng hoặc đã tắt nhiệm vụ nhằm tránh kẹt xe ảo cho các hướng khác.

## VIDEO DEMO

[![Xem Video Demo](https://img.youtube.com/vi/JZtJl83NARA/0.jpg)](https://www.youtube.com/watch?v=JZtJl83NARA)

*Click vào ảnh để xem video demo hoạt động của hệ thống.*

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
