# RUNBOOK

Tài liệu này chứa hướng dẫn cho các tác vụ vận hành phổ biến.

## Mục lục

1.  [Các đường dẫn truy cập hệ thống](#các-đường-dẫn-truy-cập-hệ-thống)
2.  [Dịch vụ MQTT](#dịch-vụ-mqtt)
    - [Tạo người dùng mới](#tạo-người-dùng-mqtt-mới)
    - [Giao thức & Tính năng](#giao-thức--tính-năng)
3.  [Các lệnh npm](#các-lệnh-npm)
    - [Môi trường development](#môi-trường-development)
    - [Môi trường production](#môi-trường-production)

---

## Các đường dẫn truy cập hệ thống

- **Gọi đến các api service:** http://localhost:5000/v1/

- **Quan sát log của tất cả các container:** http://localhost:8888

- **Trực quan hóa các job trong queue:** http://localhost:5000/admin/queues

---

## Cấu hình IP cho tính năng OTA (Quan trọng)

Để tính năng cập nhật Firmware (OTA) hoạt động, thiết bị ESP32 cần kết nối trực tiếp đến API Server để tải file. Do đó, bạn cần cấu hình địa chỉ IP LAN (hoặc Domain) thay vì `localhost`.

1. **Kiểm tra IP máy tính:** Mở terminal gõ `ipconfig` (Windows) hoặc `ifconfig` (Linux/Mac) để lấy IPv4 (VD: `192.168.1.5`).
2. **Cập nhật file .env:** Mở file `source/server/secrets/.env` và sửa:
   ```ini
   APP_HOST=192.168.1.5   # Thay bằng IP thực tế của bạn
   APP_PUBLIC_PORT=5000   # Port API (mặc định là 5000)
   ```
3. **Khởi động lại API:** Chạy lệnh `npm run docker:dev:restart`.

---

## Dịch vụ MQTT

### Tạo người dùng MQTT mới

Hướng dẫn này giải thích cách thêm người dùng mới vào Mosquitto MQTT broker đang chạy dưới dạng Docker container.
Sau khi hoàn thành, người dùng mới sẽ có thể xác thực và kết nối với MQTT broker.

**Yêu cầu tiên quyết:**

- Đã cài đặt và đang chạy Docker và Docker Compose.
- Bạn đã mở terminal hoặc command prompt tại thư mục `.\source`, nơi chứa các tệp `docker-compose.yml`.

**Các bước thực hiện:**

1.  **Thêm thông tin đăng nhập người dùng**

    Thực thi lệnh sau để thêm người dùng và mật khẩu mới vào tệp mật khẩu của Mosquitto.

    **Quan trọng:** Thay thế `new_username` và `new_password` bằng thông tin đăng nhập thực tế bạn muốn tạo.

    ```bash
    docker-compose exec mosquitto mosquitto_passwd -b /mosquitto/config/password.txt new_username new_password
    ```

2.  **Khởi động lại dịch vụ MQTT**

    Để người dùng mới được nhận dạng, Mosquitto broker phải được khởi động lại. Thao tác này sẽ tải lại tệp mật khẩu.

    **Với môi trường development**

    ```bash
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml restart mosquitto
    ```

    **Với môi trường production**

    ```bash
    docker-compose -f docker-compose.yml restart mosquitto
    ```

### Các Topic MQTT

Hệ thống sử dụng MQTT để giao tiếp giữa các thiết bị (Transmitter, Receiver) và Server.

| Topic                                     | Chiều              | Mô tả                                               | Payload mẫu                                                |
| :---------------------------------------- | :----------------- | :-------------------------------------------------- | :--------------------------------------------------------- |
| `esp32/+/status`                          | Device -> Server   | Thiết bị gửi trạng thái định kỳ (vị trí, pin, v.v.) | `{"mac": "...", "lat": 10.1, "lng": 105.2, "battery": 98}` |
| `server/check-auth`                       | Receiver -> Server | Receiver yêu cầu Server xác thực một Transmitter    | `{"transmitterMac": "...", "receiverMac": "..."}`          |
| `esp32/<ReceiverMAC>/check-auth-response` | Server -> Receiver | Server trả về kết quả xác thực cho Receiver         | `{"transmitterMac": "...", "isApproved": true}`            |
| `server/request-config`                   | Receiver -> Server | Receiver yêu cầu lấy cấu hình tọa độ trụ đèn        | `{"receiverMac": "..."}`                                   |
| `esp32/<ReceiverMAC>/config-response`     | Server -> Receiver | Server trả về danh sách tọa độ trụ đèn              | `{"pillars": [{"lat":..., "lng":..., "groupId":...}]}`     |
| `server/request-update`                   | Device -> Server   | Thiết bị yêu cầu cập nhật Firmware                  | `{"mac": "...", "type": "receiver"}`                       |
| `esp32/<MAC>/update/response`             | Server -> Device   | Server trả về link tải file kèm token (nếu hợp lệ)  | `{"allowed": true, "token": "...", "url": "..."}`          |

## CÁC LỆNH NPM

Dưới đây là mô tả chi tiết các lệnh `npm` được định nghĩa trong `./source/package.json`.

### Môi trường Development

- `npm run docker:dev`

  > Khởi chạy toàn bộ các service cho môi trường development. Lệnh này sẽ build lại image nếu có thay đổi trong mã nguồn hoặc `Dockerfile` (`--build`).

- `npm run docker:dev:down`

  > Dừng và xóa các container/network của môi trường development. Dữ liệu trong volume (ví dụ: database) sẽ **được giữ lại**.

- `npm run docker:dev:clean`

  > Dọn dẹp triệt để môi trường development, bao gồm cả việc **xóa các volume** chứa dữ liệu (`-v`). Dùng khi muốn reset hoàn toàn database.

- `npm run docker:dev:restart`
  > Khởi động lại tất cả các service của môi trường development mà không cần dừng toàn bộ hệ thống.

---

## QUY TRÌNH PHÁT HÀNH BẢN CẬP NHẬT FIRMWARE

Hệ thống hỗ trợ cập nhật firmware từ xa (OTA) cho các thiết bị Receiver và Transmitter. Quy trình phát hành một phiên bản mới như sau:

### 1. Cập nhật mã nguồn

- Đảm bảo mã nguồn hoạt động chính xác và đã được kiểm thử.
- Nên tăng số version trong file `src/define.h` hoặc `src/main.cpp` của thiết bị để dễ theo dõi (ví dụ: `#define VERSION "1.0.1"`).

### 2. Tạo Tag và đẩy lên GitHub

Hệ thống sử dụng GitHub Actions để tự động build và tạo Release. Bạn chỉ cần tạo Tag theo đúng quy tắc đặt tên.

**Quy tắc đặt tên Tag:**

- Cho Receiver: `v*-receiver` (Ví dụ: `v1.0.1-receiver`, `v2.0-receiver`)
- Cho Transmitter: `v*-transmitter` (Ví dụ: `v1.0.5-transmitter`)

**Lệnh Git:**

```bash
# Ví dụ phát hành bản cập nhật cho Receiver
git tag v1.0.1-receiver
git push origin v1.0.1-receiver

# Ví dụ phát hành bản cập nhật cho Transmitter
git tag v1.0.2-transmitter
git push origin v1.0.2-transmitter
```

### 3. Đồng bộ Firmware về Server

Sau khi GitHub Actions chạy xong và tạo Release trên GitHub:

1. Truy cập Dashboard quản lý EVPS (Admin).
2. Vào mục **"Quản lý phiên bản phần mềm"**.
3. Nhấn **"Tải firmware của Receiver"** hoặc **"Tải firmware của Transmitter"**.
4. Server sẽ tải file `.bin` mới nhất về và sẵn sàng phục vụ cho các thiết bị cập nhật.

### 4. Thiết bị cập nhật

- Khi thiết bị khởi động hoặc đến chu kỳ kiểm tra, nó sẽ gửi yêu cầu cập nhật lên Server.
- Nếu có phiên bản đã đồng bộ trên Server, thiết bị sẽ tải về và cài đặt tự động.

## HƯỚNG DẪN SỬ DỤNG THIẾT BỊ TRANSMITTER (BỘ PHÁT TRÊN XE)

### Các nút chức năng

Thiết bị Transmitter được trang bị 2 nút nhấn: **Nút Nhiệm vụ (Task Button)** và **Nút Nguồn (Power Button)**.

| Thao tác                    | Nút nhấn     | Thời gian giữ | Chức năng (Hành động khi **NHẢ** nút)                                                  | Tín hiệu LED phản hồi                                             |
| :-------------------------- | :----------- | :------------ | :------------------------------------------------------------------------------------- | :---------------------------------------------------------------- |
| **Bật/Tắt Nhiệm vụ**        | Task         | < 3 giây      | Chuyển đổi trạng thái giữa **Làm nhiệm vụ** (Gửi tín hiệu) và **Nghỉ** (Ngừng gửi).    | LED Task sáng/tắt tương ứng.                                      |
| **Chuyển chế độ GPS**       | Task         | 3 - 10 giây   | Chuyển đổi tuần tự chế độ định vị: `Real GPS` -> `Fake Path 1` -> `Fake Path 2` -> ... | LED Task nháy chậm khi đang giữ (sau 3s). Nháy 3 lần sau khi nhả. |
| **Cập nhật Phần mềm (OTA)** | Task         | > 10 giây     | Kích hoạt kiểm tra và tải bản cập nhật phần mềm mới từ Server.                         | LED Task **nháy rất nhanh** khi giữ được 10s.                     |
| **Bật nguồn**               | Power        | Nhấn 1 lần    | Bật thiết bị (nếu đang tắt).                                                           | LED Power sáng.                                                   |
| **Tắt nguồn**               | Power        | > 3 giây      | Tắt thiết bị (lưu ý: chỉ tắt được khi KHÔNG đang làm nhiệm vụ).                        | LED Power nháy 5 lần rồi tắt hẳn.                                 |
| **Cấu hình WiFi**           | Task + Power | > 5 giây      | Kích hoạt chế độ WiFi Config Portal (192.168.4.1) để cài đặt WiFi mới.                 | Cả 3 đèn LED đều sáng.                                            |

### Ý nghĩa đèn báo (LED)

- **LED Power (Đỏ):** Báo nguồn. Luôn sáng khi thiết bị hoạt động.
- **LED Task (Vàng/Xanh):** Báo trạng thái làm nhiệm vụ. Sáng khi đang phát tín hiệu ưu tiên.
- **LED Internet (Xanh dương):** Báo trạng thái kết nối WiFi. Sáng khi đã kết nối thành công với Router.

---

### Môi trường Production

- `npm run docker:prod`

  > Khởi chạy toàn bộ các service cho môi trường production ở chế độ nền (`-d`).

- `npm run docker:prod:down`

  > Dừng và xóa các container/network của môi trường production.

- `npm run docker:prod:clean`

  > Dọn dẹp triệt để môi trường production, bao gồm cả việc **xóa các volume** chứa dữ liệu (`-v`). Dùng khi muốn reset hoàn toàn database.

- `npm run docker:dev:restart`
  > Khởi động lại tất cả các service của môi trường production mà không cần dừng toàn bộ hệ thống.
