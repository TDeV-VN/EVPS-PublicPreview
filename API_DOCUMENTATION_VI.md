# Tài liệu API EVPS

## WebSocket (Socket.io)

Hệ thống sử dụng Socket.io để truyền tải dữ liệu thời gian thực từ Server tới Client (Frontend).

### Kết nối

- **URL:** `http://<server_host>:<server_port>` (Ví dụ: `http://localhost:3000`)
- **Path:** `/socket.io/` (Mặc định)
- **Transports:** `polling`, `websocket`

### Sự kiện (Events)

#### `vehicle-status-update`

- **Chiều:** Server -> Client
- **Mô tả:** Được gửi mỗi khi Server nhận được bản tin MQTT `status` từ bất kỳ thiết bị Transmitter nào.
- **Dữ liệu (Payload):**
  ```json
  {
    "mac": "00:1B:44:11:3A:B7",
    "lat": 10.762622,
    "lng": 106.660172,
    "isWorking": false
  }
  ```

---

## Cấu trúc Phản hồi

### Phản hồi thành công

```json
{
  "success": true,
  "message": "string",
  "data": {},
  "error": null,
  "timestamp": "string"
}
```

### Phản hồi thất bại

```json
{
  "success": false,
  "message": "string",
  "data": null,
  "error": {
    "statusCode": "number",
    "stack": "string (chỉ có trong môi trường dev)"
  },
  "timestamp": "string"
}
```

---

## Căn cứ (Base)

### `GET /health`

- **Phương thức:** `GET`
- **Endpoint:** `/health`
- **Mô tả:** Kiểm tra tình trạng của API.
- **Phản hồi:**
  - `200 OK`: API đang hoạt động.
    ```json
    {
      "success": true,
      "message": "EVPS APIs V1 is healthy",
      "data": {
        "apiVersion": "v1",
        "status": "OK"
      },
      "error": null,
      "timestamp": "28/10/2025 10:19:28"
    }
    ```

### `GET /error-simulation`

- **Phương thức:** `GET`
- **Endpoint:** `/error-simulation`
- **Mô tả:** Mô phỏng một lỗi API.
- **Phản hồi:**
  - `202 ACCEPTED`: Lỗi mô phỏng.
    ```json
    {
      "success": false,
      "message": "This is a simulated error",
      "data": null,
      "error": {
        "statusCode": 202
      },
      "timestamp": "28/10/2025 10:23:49"
    }
    ```

---

## Quản lý người dùng (User Management)

### `POST /admin/users/register`

- **Phương thức:** `POST`
- **Endpoint:** `/admin/users/register`
- **Mô tả:** Đăng ký một người dùng mới.
- **Quyền hạn:** Quản trị viên (Admin).
- **Dữ liệu yêu cầu:**
  ```json
  {
    "fullName": "string",
    "email": "string (email)",
    "role": "string (user hoặc admin)"
  }
  ```
- **Phản hồi:**
  - `200 OK`: Đăng ký thành công. Trả về thông tin người dùng mới và token trong trường `data`.
    ```json
    {
      "success": true,
      "message": "Login API success!",
      "data": {
        "_id": "6728b22183243a291455f43c",
        "email": "example@example.com",
        "role": "user",
        "fullName": "Example User",
        "accessToken": "string",
        "refreshToken": "string",
        "accessTokenExpiresIn": "string",
        "refreshTokenExpiresIn": "string"
      },
      "error": null,
      "timestamp": "28/10/2025 10:35:12"
    }
    ```
  - `400 BAD REQUEST`: Dữ liệu không hợp lệ.
  - `409 CONFLICT`: Email đã tồn tại.

### `GET /admin/users`

- **Phương thức:** `GET`
- **Endpoint:** `/admin/users`
- **Mô tả:** Lấy danh sách tất cả người dùng.
- **Quyền hạn:** Quản trị viên (Admin).
- **Phản hồi:**
  - `200 OK`: Trả về một mảng các đối tượng người dùng trong trường `data`.
    ```json
    {
      "success": true,
      "message": "Get all users success!",
      "data": [
        {
          "_id": "6728b22183243a291455f43c",
          "email": "example@example.com",
          "role": "user",
          "fullName": "Example User"
        }
      ],
      "error": null,
      "timestamp": "28/10/2025 10:40:12"
    }
    ```

### `GET /admin/users/:id`

- **Phương thức:** `GET`
- **Endpoint:** `/admin/users/:id`
- **Mô tả:** Lấy thông tin của một người dùng theo ID.
- **Quyền hạn:** Quản trị viên (Admin).
- **Phản hồi:**
  - `200 OK`: Trả về đối tượng người dùng trong trường `data`.
    ```json
    {
      "success": true,
      "message": "Get user by ID success!",
      "data": {
        "_id": "6728b22183243a291455f43c",
        "email": "example@example.com",
        "role": "user",
        "fullName": "Example User"
      },
      "error": null,
      "timestamp": "28/10/2025 10:41:12"
    }
    ```
  - `404 NOT FOUND`: Không tìm thấy người dùng.

### `PUT /admin/users/:id`

- **Phương thức:** `PUT`
- **Endpoint:** `/admin/users/:id`
- **Mô tả:** Cập nhật thông tin của một người dùng theo ID.
- **Quyền hạn:** Quản trị viên (Admin).
- **Dữ liệu yêu cầu:**
  ```json
  {
    "fullName": "string"
  }
  ```
- **Phản hồi:**
  - `200 OK`: Cập nhật thành công. Trả về đối tượng người dùng đã được cập nhật trong trường `data`.
    ```json
    {
      "success": true,
      "message": "Update user by ID success!",
      "data": {
        "_id": "6728b22183243a291455f43c",
        "email": "example@example.com",
        "role": "user",
        "fullName": "New Name"
      },
      "error": null,
      "timestamp": "28/10/2025 10:42:12"
    }
    ```
  - `400 BAD REQUEST`: Dữ liệu không hợp lệ.
  - `404 NOT FOUND`: Không tìm thấy người dùng.

### `PUT /admin/users/:id/status`

- **Phương thức:** `PUT`
- **Endpoint:** `/admin/users/:id/status`
- **Mô tả:** Cập nhật trạng thái của một người dùng theo ID.
- **Quyền hạn:** Quản trị viên (Admin).
- **Dữ liệu yêu cầu:**
  ```json
  {
    "status": "string (active, inactive, hoặc locked)"
  }
  ```
- **Phản hồi:**
  - `200 OK`: Cập nhật thành công. Trả về đối tượng người dùng đã được cập nhật trong trường `data`.
    ```json
    {
      "success": true,
      "message": "Update user status by ID success!",
      "data": {
        "_id": "6728b22183243a291455f43c",
        "email": "example@example.com",
        "role": "user",
        "fullName": "Example User",
        "status": "inactive"
      },
      "error": null,
      "timestamp": "28/10/2025 10:43:12"
    }
    ```
  - `400 BAD REQUEST`: Dữ liệu không hợp lệ.
  - `403 FORBIDDEN`: Không thể thay đổi trạng thái của quản trị viên.
  - `404 NOT FOUND`: Không tìm thấy người dùng.

### `DELETE /admin/users/:id`

- **Phương thức:** `DELETE`
- **Endpoint:** `/admin/users/:id`
- **Mô tả:** Xóa một người dùng theo ID.
- **Quyền hạn:** Quản trị viên (Admin).
- **Phản hồi:**
  - `200 OK`: Xóa thành công. Trường `data` sẽ là `{}`.
    ```json
    {
      "success": true,
      "message": "Delete user by ID success!",
      "data": {},
      "error": null,
      "timestamp": "28/10/2025 10:44:12"
    }
    ```
  - `403 FORBIDDEN`: Không thể xóa quản trị viên.
  - `404 NOT FOUND`: Không tìm thấy người dùng.

---

## Xác thực (Authentication)

### `POST /users/login`

- **Phương thức:** `POST`
- **Endpoint:** `/users/login`
- **Mô tả:** Đăng nhập.
- **Dữ liệu yêu cầu:**
  ```json
  {
    "email": "string (email)",
    "password": "string"
  }
  ```
- **Phản hồi:**
  - `200 OK`: Đăng nhập thành công. Trả về thông tin người dùng và token trong trường `data`. Đặt `accessToken` và `refreshToken` trong httpOnly cookie.
    ```json
    {
      "success": true,
      "message": "Login API success!",
      "data": {
        "_id": "6728b22183243a291455f43c",
        "email": "example@example.com",
        "role": "user",
        "fullName": "Example User",
        "accessToken": "string",
        "refreshToken": "string",
        "accessTokenExpiresIn": "string",
        "refreshTokenExpiresIn": "string"
      },
      "error": null,
      "timestamp": "28/10/2025 10:45:12"
    }
    ```
  - `401 UNAUTHORIZED`: Thông tin đăng nhập không hợp lệ.

### `DELETE /users/logout`

- **Phương thức:** `DELETE`
- **Endpoint:** `/users/logout`
- **Mô tả:** Đăng xuất. Xóa httpOnly cookie.
- **Phản hồi:**
  - `200 OK`: Đăng xuất thành công. Trường `data` sẽ là `{}`.
    ```json
    {
      "success": true,
      "message": "Cookies cleared successfully! Please delete token in client storage to logout completely!",
      "data": {},
      "error": null,
      "timestamp": "28/10/2025 10:46:12"
    }
    ```

### `PUT /users/refresh_token`

- **Phương thức:** `PUT`
- **Endpoint:** `/users/refresh_token`
- **Mô tả:** Cấp lại một `accessToken` mới bằng cách sử dụng `refreshToken`.
- **Dữ liệu yêu cầu:**
  - `refreshToken` có thể được gửi trong body hoặc cookie.
  ```json
  {
    "refreshToken": "string"
  }
  ```
- **Phản hồi:**
  - `200 OK`: Cấp lại token thành công. Trả về `accessToken` mới trong trường `data`. Đặt `accessToken` mới trong httpOnly cookie.
    ```json
    {
      "success": true,
      "message": "Refresh token success!",
      "data": {
        "accessToken": "string",
        "accessTokenExpiresIn": "string"
      },
      "error": null,
      "timestamp": "28/10/2025 10:47:12"
    }
    ```
  - `401 UNAUTHORIZED`: `refreshToken` không hợp lệ hoặc đã hết hạn.

---

## Người dùng hiện tại (Current User)

### `GET /users/me`

- **Phương thức:** `GET`
- **Endpoint:** `/users/me`
- **Mô tả:** Lấy thông tin của người dùng hiện tại.
- **Quyền hạn:** Đã xác thực (Authenticated).
- **Phản hồi:**
  - `200 OK`: Trả về đối tượng người dùng trong trường `data`.
    ```json
    {
      "success": true,
      "message": "Get current user info success!",
      "data": {
        "_id": "6728b22183243a291455f43c",
        "email": "example@example.com",
        "role": "user",
        "fullName": "Example User"
      },
      "error": null,
      "timestamp": "28/10/2025 10:48:12"
    }
    ```

### `PUT /users/me`

- **Phương thức:** `PUT`
- **Endpoint:** `/users/me`
- **Mô tả:** Cập nhật thông tin của người dùng hiện tại.
- **Quyền hạn:** Đã xác thực (Authenticated).
- **Dữ liệu yêu cầu:**
  ```json
  {
    "fullName": "string"
  }
  ```
- **Phản hồi:**
  - `200 OK`: Cập nhật thành công. Trả về đối tượng người dùng đã được cập nhật trong trường `data`.
    ```json
    {
      "success": true,
      "message": "Update current user success!",
      "data": {
        "_id": "6728b22183243a291455f43c",
        "email": "example@example.com",
        "role": "user",
        "fullName": "New Name"
      },
      "error": null,
      "timestamp": "28/10/2025 10:49:12"
    }
    ```
  - `400 BAD REQUEST`: Dữ liệu không hợp lệ.

### `PUT /users/change-password`

- **Phương thức:** `PUT`
- **Endpoint:** `/users/change-password`
- **Mô tả:** Thay đổi mật khẩu của người dùng hiện tại.
- **Quyền hạn:** Đã xác thực (Authenticated).
- **Dữ liệu yêu cầu:**
  ```json
  {
    "currentPassword": "string",
    "newPassword": "string"
  }
  ```
- **Phản hồi:**
  - `200 OK`: Thay đổi mật khẩu thành công. Trường `data` sẽ chứa `_id` của người dùng.
    ```json
    {
      "success": true,
      "message": "Change password success!",
      "data": {
        "_id": "6728b22183243a291455f43c"
      },
      "error": null,
      "timestamp": "28/10/2025 10:50:12"
    }
    ```
  - `400 BAD REQUEST`: Dữ liệu không hợp lệ.
  - `401 UNAUTHORIZED`: Mật khẩu hiện tại không đúng.

### `POST /users/password-recovery`

- **Phương thức:** `POST`
- **Endpoint:** `/users/password-recovery`
- **Mô tả:** Yêu cầu lấy lại mật khẩu. Một email chứa liên kết đặt lại mật khẩu sẽ được gửi đến email của người dùng.
- **Dữ liệu yêu cầu:**
  ```json
  {
    "email": "string (email)"
  }
  ```
- **Phản hồi:**
  - `200 OK`: Gửi email thành công. Trường `data` sẽ là `null`.
    ```json
    {
      "success": true,
      "message": "Password recovery email sent successfully!",
      "data": null,
      "error": null,
      "timestamp": "28/10/2025 10:51:12"
    }
    ```
  - `404 NOT FOUND`: Không tìm thấy người dùng.

### `PUT /users/reset-password`

- **Phương thức:** `PUT`
- **Endpoint:** `/users/reset-password`
- **Mô tả:** Đặt lại mật khẩu bằng cách sử dụng token được gửi trong email.
- **Dữ liệu yêu cầu:**
  ```json
  {
    "token": "string",
    "newPassword": "string"
  }
  ```
- **Phản hồi:**
  - `200 OK`: Đặt lại mật khẩu thành công. Trường `data` sẽ chứa `_id` của người dùng.
    ```json
    {
        "success": true,
        "message": "Reset password success!",
        "data": {
            "_id": "6728b22183243a291455f43c"
        },
        "error": null,
        "timestamp": "28/1Tài liệu API EVPS
    ```

## Cấu trúc Phản hồi

### Phản hồi thành công

```json
{
  "success": true,
  "message": "string",
  "data": {},
  "error": null,
  "timestamp": "string"
}
```

### Phản hồi thất bại

```json
{
  "success": false,
  "message": "string",
  "data": null,
  "error": {
    "statusCode": "number",
    "stack": "string (chỉ có trong môi trường dev)"
  },
  "timestamp": "string"
}
```

---

## Căn cứ (Base)

### `GET /health`

- **Phương thức:** `GET`
- **Endpoint:** `/health`
- **Mô tả:** Kiểm tra tình trạng của API.
- **Phản hồi:**
  - `200 OK`: API đang hoạt động.
    ```json
    {
      "success": true,
      "message": "EVPS APIs V1 is healthy",
      "data": {
        "apiVersion": "v1",
        "status": "OK"
      },
      "error": null,
      "timestamp": "28/10/2025 10:19:28"
    }
    ```

### `GET /error-simulation`

- **Phương thức:** `GET`
- **Endpoint:** `/error-simulation`
- **Mô tả:** Mô phỏng một lỗi API.
- **Phản hồi:**
  - `202 ACCEPTED`: Lỗi mô phỏng.
    ```json
    {
      "success": false,
      "message": "This is a simulated error",
      "data": null,
      "error": {
        "statusCode": 202
      },
      "timestamp": "28/10/2025 10:23:49"
    }
    ```

---

## Quản lý người dùng (User Management)

### `POST /admin/users/register`

- **Phương thức:** `POST`
- **Endpoint:** `/admin/users/register`
- **Mô tả:** Đăng ký một người dùng mới.
- **Quyền hạn:** Quản trị viên (Admin).
- **Dữ liệu yêu cầu:**
  ```json
  {
    "fullName": "string",
    "email": "string (email)",
    "role": "string (user hoặc admin)"
  }
  ```
- **Phản hồi:**
  - `200 OK`: Đăng ký thành công. Trả về thông tin người dùng mới và token trong trường `data`.
    ```json
    {
      "success": true,
      "message": "Login API success!",
      "data": {
        "_id": "6728b22183243a291455f43c",
        "email": "example@example.com",
        "role": "user",
        "fullName": "Example User",
        "accessToken": "string",
        "refreshToken": "string",
        "accessTokenExpiresIn": "string",
        "refreshTokenExpiresIn": "string"
      },
      "error": null,
      "timestamp": "28/10/2025 10:35:12"
    }
    ```
  - `400 BAD REQUEST`: Dữ liệu không hợp lệ.
  - `409 CONFLICT`: Email đã tồn tại.

### `GET /admin/users`

- **Phương thức:** `GET`
- **Endpoint:** `/admin/users`
- **Mô tả:** Lấy danh sách tất cả người dùng.
- **Quyền hạn:** Quản trị viên (Admin).
- **Phản hồi:**
  - `200 OK`: Trả về một mảng các đối tượng người dùng trong trường `data`.
    ```json
    {
      "success": true,
      "message": "Get all users success!",
      "data": [
        {
          "_id": "6728b22183243a291455f43c",
          "email": "example@example.com",
          "role": "user",
          "fullName": "Example User"
        }
      ],
      "error": null,
      "timestamp": "28/10/2025 10:40:12"
    }
    ```

### `GET /admin/users/:id`

- **Phương thức:** `GET`
- **Endpoint:** `/admin/users/:id`
- **Mô tả:** Lấy thông tin của một người dùng theo ID.
- **Quyền hạn:** Quản trị viên (Admin).
- **Phản hồi:**
  - `200 OK`: Trả về đối tượng người dùng trong trường `data`.
    ```json
    {
      "success": true,
      "message": "Get user by ID success!",
      "data": {
        "_id": "6728b22183243a291455f43c",
        "email": "example@example.com",
        "role": "user",
        "fullName": "Example User"
      },
      "error": null,
      "timestamp": "28/10/2025 10:41:12"
    }
    ```
  - `404 NOT FOUND`: Không tìm thấy người dùng.

### `PUT /admin/users/:id`

- **Phương thức:** `PUT`
- **Endpoint:** `/admin/users/:id`
- **Mô tả:** Cập nhật thông tin của một người dùng theo ID.
- **Quyền hạn:** Quản trị viên (Admin).
- **Dữ liệu yêu cầu:**
  ```json
  {
    "fullName": "string"
  }
  ```
- **Phản hồi:**
  - `200 OK`: Cập nhật thành công. Trả về đối tượng người dùng đã được cập nhật trong trường `data`.
    ```json
    {
      "success": true,
      "message": "Update user by ID success!",
      "data": {
        "_id": "6728b22183243a291455f43c",
        "email": "example@example.com",
        "role": "user",
        "fullName": "New Name"
      },
      "error": null,
      "timestamp": "28/10/2025 10:42:12"
    }
    ```
  - `400 BAD REQUEST`: Dữ liệu không hợp lệ.
  - `404 NOT FOUND`: Không tìm thấy người dùng.

### `PUT /admin/users/:id/status`

- **Phương thức:** `PUT`
- **Endpoint:** `/admin/users/:id/status`
- **Mô tả:** Cập nhật trạng thái của một người dùng theo ID.
- **Quyền hạn:** Quản trị viên (Admin).
- **Dữ liệu yêu cầu:**
  ```json
  {
    "status": "string (active, inactive, hoặc locked)"
  }
  ```
- **Phản hồi:**
  - `200 OK`: Cập nhật thành công. Trả về đối tượng người dùng đã được cập nhật trong trường `data`.
    ```json
    {
      "success": true,
      "message": "Update user status by ID success!",
      "data": {
        "_id": "6728b22183243a291455f43c",
        "email": "example@example.com",
        "role": "user",
        "fullName": "Example User",
        "status": "inactive"
      },
      "error": null,
      "timestamp": "28/10/2025 10:43:12"
    }
    ```
  - `400 BAD REQUEST`: Dữ liệu không hợp lệ.
  - `403 FORBIDDEN`: Không thể thay đổi trạng thái của quản trị viên.
  - `404 NOT FOUND`: Không tìm thấy người dùng.

### `DELETE /admin/users/:id`

- **Phương thức:** `DELETE`
- **Endpoint:** `/admin/users/:id`
- **Mô tả:** Xóa một người dùng theo ID.
- **Quyền hạn:** Quản trị viên (Admin).
- **Phản hồi:**
  - `200 OK`: Xóa thành công. Trường `data` sẽ là `{}`.
    ```json
    {
      "success": true,
      "message": "Delete user by ID success!",
      "data": {},
      "error": null,
      "timestamp": "28/10/2025 10:44:12"
    }
    ```
  - `403 FORBIDDEN`: Không thể xóa quản trị viên.
  - `404 NOT FOUND`: Không tìm thấy người dùng.

---

## Xác thực (Authentication)

### `POST /users/login`

- **Phương thức:** `POST`
- **Endpoint:** `/users/login`
- **Mô tả:** Đăng nhập.
- **Dữ liệu yêu cầu:**
  ```json
  {
    "email": "string (email)",
    "password": "string"
  }
  ```
- **Phản hồi:**
  - `200 OK`: Đăng nhập thành công. Trả về thông tin người dùng và token trong trường `data`. Đặt `accessToken` và `refreshToken` trong httpOnly cookie.
    ```json
    {
      "success": true,
      "message": "Login API success!",
      "data": {
        "_id": "6728b22183243a291455f43c",
        "email": "example@example.com",
        "role": "user",
        "fullName": "Example User",
        "accessToken": "string",
        "refreshToken": "string",
        "accessTokenExpiresIn": "string",
        "refreshTokenExpiresIn": "string"
      },
      "error": null,
      "timestamp": "28/10/2025 10:45:12"
    }
    ```
  - `401 UNAUTHORIZED`: Thông tin đăng nhập không hợp lệ.

### `DELETE /users/logout`

- **Phương thức:** `DELETE`
- **Endpoint:** `/users/logout`
- **Mô tả:** Đăng xuất. Xóa httpOnly cookie.
- **Phản hồi:**
  - `200 OK`: Đăng xuất thành công. Trường `data` sẽ là `{}`.
    ```json
    {
      "success": true,
      "message": "Cookies cleared successfully! Please delete token in client storage to logout completely!",
      "data": {},
      "error": null,
      "timestamp": "28/10/2025 10:46:12"
    }
    ```

### `PUT /users/refresh_token`

- **Phương thức:** `PUT`
- **Endpoint:** `/users/refresh_token`
- **Mô tả:** Cấp lại một `accessToken` mới bằng cách sử dụng `refreshToken`.
- **Dữ liệu yêu cầu:**
  - `refreshToken` có thể được gửi trong body hoặc cookie.
  ```json
  {
    "refreshToken": "string"
  }
  ```
- **Phản hồi:**
  - `200 OK`: Cấp lại token thành công. Trả về `accessToken` mới trong trường `data`. Đặt `accessToken` mới trong httpOnly cookie.
    ```json
    {
      "success": true,
      "message": "Refresh token success!",
      "data": {
        "accessToken": "string",
        "accessTokenExpiresIn": "string"
      },
      "error": null,
      "timestamp": "28/10/2025 10:47:12"
    }
    ```
  - `401 UNAUTHORIZED`: `refreshToken` không hợp lệ hoặc đã hết hạn.

---

## Người dùng hiện tại (Current User)

### `GET /users/me`

- **Phương thức:** `GET`
- **Endpoint:** `/users/me`
- **Mô tả:** Lấy thông tin của người dùng hiện tại.
- **Quyền hạn:** Đã xác thực (Authenticated).
- **Phản hồi:**
  - `200 OK`: Trả về đối tượng người dùng trong trường `data`.
    ```json
    {
      "success": true,
      "message": "Get current user info success!",
      "data": {
        "_id": "6728b22183243a291455f43c",
        "email": "example@example.com",
        "role": "user",
        "fullName": "Example User"
      },
      "error": null,
      "timestamp": "28/10/2025 10:48:12"
    }
    ```

### `PUT /users/me`

- **Phương thức:** `PUT`
- **Endpoint:** `/users/me`
- **Mô tả:** Cập nhật thông tin của người dùng hiện tại.
- **Quyền hạn:** Đã xác thực (Authenticated).
- **Dữ liệu yêu cầu:**
  ```json
  {
    "fullName": "string"
  }
  ```
- **Phản hồi:**
  - `200 OK`: Cập nhật thành công. Trả về đối tượng người dùng đã được cập nhật trong trường `data`.
    ```json
    {
      "success": true,
      "message": "Update current user success!",
      "data": {
        "_id": "6728b22183243a291455f43c",
        "email": "example@example.com",
        "role": "user",
        "fullName": "New Name"
      },
      "error": null,
      "timestamp": "28/10/2025 10:49:12"
    }
    ```
  - `400 BAD REQUEST`: Dữ liệu không hợp lệ.

### `PUT /users/change-password`

- **Phương thức:** `PUT`
- **Endpoint:** `/users/change-password`
- **Mô tả:** Thay đổi mật khẩu của người dùng hiện tại.
- **Quyền hạn:** Đã xác thực (Authenticated).
- **Dữ liệu yêu cầu:**
  ```json
  {
    "currentPassword": "string",
    "newPassword": "string"
  }
  ```
- **Phản hồi:**
  - `200 OK`: Thay đổi mật khẩu thành công. Trường `data` sẽ chứa `_id` của người dùng.
    ```json
    {
      "success": true,
      "message": "Change password success!",
      "data": {
        "_id": "6728b22183243a291455f43c"
      },
      "error": null,
      "timestamp": "28/10/2025 10:50:12"
    }
    ```
  - `400 BAD REQUEST`: Dữ liệu không hợp lệ.
  - `401 UNAUTHORIZED`: Mật khẩu hiện tại không đúng.

### `POST /users/password-recovery`

- **Phương thức:** `POST`
- **Endpoint:** `/users/password-recovery`
- **Mô tả:** Yêu cầu lấy lại mật khẩu. Một email chứa liên kết đặt lại mật khẩu sẽ được gửi đến email của người dùng.
- **Dữ liệu yêu cầu:**
  ```json
  {
    "email": "string (email)"
  }
  ```
- **Phản hồi:**
  - `200 OK`: Gửi email thành công. Trường `data` sẽ là `null`.
    ```json
    {
      "success": true,
      "message": "Password recovery email sent successfully!",
      "data": null,
      "error": null,
      "timestamp": "28/10/2025 10:51:12"
    }
    ```
  - `404 NOT FOUND`: Không tìm thấy người dùng.

### `PUT /users/reset-password`

- **Phương thức:** `PUT`
- **Endpoint:** `/users/reset-password`
- **Mô tả:** Đặt lại mật khẩu bằng cách sử dụng token được gửi trong email.
- **Dữ liệu yêu cầu:**
  ```json
  {
    "token": "string",
    "newPassword": "string"
  }
  ```
- **Phản hồi:**
  - `200 OK`: Đặt lại mật khẩu thành công. Trường `data` sẽ chứa `_id` của người dùng.
    ```json
    {
      "success": true,
      "message": "Reset password success!",
      "data": {
        "_id": "6728b22183243a291455f43c"
      },
      "error": null,
      "timestamp": "28/10/2025 10:52:12"
    }
    ```
  - `400 BAD REQUEST`: Token không hợp lệ hoặc đã hết hạn.

### `DELETE /users/me`

- **Phương thức:** `DELETE`
- **Endpoint:** `/users/me`
- **Mô tả:** Xóa tài khoản của người dùng hiện tại.
- **Quyền hạn:** Đã xác thực (Authenticated).
- **Phản hồi:**

  - `200 OK`: Xóa thành công. Trường `data` sẽ là `null`.
    `json
{
    "success": true,
    "message": "Delete current user success!",
    "data": null,
    "error": null,
    "timestamp": "28/10/2025 10:53:12"
}
`
    0:52:12"
    }
    ```

                                    ```

  - `400 BAD REQUEST`: Token không hợp lệ hoặc đã hết hạn.

### `DELETE /users/me`

- **Phương thức:** `DELETE`
- **Endpoint:** `/users/me`
- **Mô tả:** Xóa tài khoản của người dùng hiện tại.
- **Quyền hạn:** Đã xác thực (Authenticated).
- **Phản hồi:**
  - `200 OK`: Xóa thành công. Trường `data` sẽ là `null`.
    ```json
    {
      "success": true,
      "message": "Delete current user success!",
      "data": null,
      "error": null,
      "timestamp": "28/10/2025 10:53:12"
    }
    ```

---

## Đăng ký xe (Vehicle Registration)

### `POST /vehicle-registrations`

- **Phương thức:** `POST`
- **Endpoint:** `/vehicle-registrations`
- **Mô tả:** Tạo mới một đăng ký xe.
- **Dữ liệu yêu cầu:**
  ```json
  {
    "ownerName": "string (required, min 2, max 50)",
    "cccd": "string (required, 12 digits)",
    "email": "string (required, email)",
    "phoneNumber": "string (required, 10-11 digits)",
    "vehicleType": "string (required)",
    "licensePlate": "string (required)",
    "macAddress": "string (required, MAC format)"
  }
  ```
- **Phản hồi:**
  - `201 CREATED`: Tạo thành công.
    ```json
    {
      "success": true,
      "message": "Create vehicle registration success!",
      "data": {
        "_id": "6728b22183243a291455f43d",
        "ownerName": "Nguyen Van A",
        "cccd": "012345678901",
        "email": "a@example.com",
        "phoneNumber": "0901234567",
        "vehicleType": "Car",
        "licensePlate": "30A-123.45",
        "macAddress": "00:1B:44:11:3A:B7",
        "isApproved": false,
        "requestedAt": "2025-10-28T10:55:12.000Z"
      },
      "error": null,
      "timestamp": "28/10/2025 10:55:12"
    }
    ```
  - `400 BAD REQUEST`: Dữ liệu không hợp lệ.

### `GET /vehicle-registrations`

- **Phương thức:** `GET`
- **Endpoint:** `/vehicle-registrations`
- **Mô tả:** Lấy danh sách đăng ký xe. Hỗ trợ tìm kiếm và lọc.
- **Quyền hạn:** Đã xác thực (Authenticated).
- **Tham số truy vấn (Query Params):**
  - `keyword`: Từ khóa tìm kiếm (Tên chủ xe, Biển số, SĐT, Email).
  - `isApproved`: Lọc theo trạng thái phê duyệt (`true` hoặc `false`).
- **Phản hồi:**
  - `200 OK`: Trả về danh sách đăng ký xe.
    ```json
    {
      "success": true,
      "message": "Get all vehicle registrations success!",
      "data": [
        {
          "_id": "6728b22183243a291455f43d",
          "ownerName": "Nguyen Van A",
          "licensePlate": "30A-123.45",
          "isApproved": false
        }
      ],
      "error": null,
      "timestamp": "28/10/2025 10:56:12"
    }
    ```

### `PUT /vehicle-registrations/:id`

- **Phương thức:** `PUT`
- **Endpoint:** `/vehicle-registrations/:id`
- **Mô tả:** Cập nhật thông tin đăng ký xe.
- **Quyền hạn:** Đã xác thực (Authenticated).
- **Dữ liệu yêu cầu:** (Các trường là tùy chọn)
  ```json
  {
    "ownerName": "string",
    "cccd": "string",
    "email": "string",
    "phoneNumber": "string",
    "vehicleType": "string",
    "licensePlate": "string",
    "macAddress": "string",
    "isApproved": "boolean"
  }
  ```
- **Phản hồi:**
  - `200 OK`: Cập nhật thành công.
    ```json
    {
      "success": true,
      "message": "Update vehicle registration success!",
      "data": {
        "_id": "6728b22183243a291455f43d",
        "ownerName": "Nguyen Van B",
        ...
      },
      "error": null,
      "timestamp": "28/10/2025 10:57:12"
    }
    ```

### `DELETE /vehicle-registrations/:id`

- **Phương thức:** `DELETE`
- **Endpoint:** `/vehicle-registrations/:id`
- **Mô tả:** Xóa đăng ký xe.
- **Quyền hạn:** Đã xác thực (Authenticated).
- **Phản hồi:**
  - `200 OK`: Xóa thành công.
    ```json
    {
      "success": true,
      "message": "Deleted successfully",
      "data": {
        "message": "Deleted successfully"
      },
      "error": null,
      "timestamp": "28/10/2025 10:58:12"
    }
    ```

### `PATCH /vehicle-registrations/:id/approve`

- **Phương thức:** `PATCH`
- **Endpoint:** `/vehicle-registrations/:id/approve`
- **Mô tả:** Phê duyệt đăng ký xe.
- **Quyền hạn:** Đã xác thực (Authenticated).
- **Phản hồi:**
  - `200 OK`: Phê duyệt thành công.
    ```json
    {
      "success": true,
      "message": "Approve vehicle registration success!",
      "data": {
        "_id": "6728b22183243a291455f43d",
        "isApproved": true,
        "approvedBy": "6728b22183243a291455f43c",
        "approvedAt": "2025-10-28T11:00:12.000Z"
      },
      "error": null,
      "timestamp": "28/10/2025 11:00:12"
    }
    ```

### `GET /vehicle-registrations/check-auth/:macAddress`

- **Phương thức:** `GET`
- **Endpoint:** `/vehicle-registrations/check-auth/:macAddress`
- **Mô tả:** Kiểm tra trạng thái phê duyệt của thiết bị dựa trên địa chỉ MAC.
- **Phản hồi:**
  - `200 OK`: Trả về trạng thái phê duyệt.
    ```json
    {
      "success": true,
      "message": "Check device status success!",
      "data": {
        "isApproved": true
      },
      "error": null,
      "timestamp": "28/10/2025 11:01:12"
    }
    ```

## Quản lý Nút giao thông (Intersections)

### `POST /intersections`

- **Phương thức:** `POST`
- **Endpoint:** `/intersections`
- **Mô tả:** Tạo mới một nút giao thông.
- **Quyền hạn:** Đã xác thực (Authenticated).
- **Body:**
  ```json
  {
    "name": "Ngã tư Nguyễn Văn Linh - Nguyễn Hữu Thọ",
    "mac": "ba:ab:ab:11:22:33",
    "pillars": [
      {
        "lat": 10.740241,
        "lng": 106.701021,
        "groupId": "A",
        "espGroupPin": "1",
        "description": "Trụ Đông Nam"
      },
      {
        "lat": 10.740446,
        "lng": 106.700876,
        "groupId": "A",
        "espGroupPin": "2",
        "description": "Trụ Tây Bắc"
      },
      {
        "lat": 10.740292,
        "lng": 106.70085,
        "groupId": "B",
        "espGroupPin": "1",
        "description": "Trụ Tây Nam"
      },
      {
        "lat": 10.740438,
        "lng": 106.701033,
        "groupId": "B",
        "espGroupPin": "2",
        "description": "Trụ Đông Bắc"
      }
    ]
  }
  ```
- **Phản hồi:**
  - `201 Created`: Tạo thành công.
    ```json
    {
      "success": true,
      "message": "Create intersection success!",
      "data": {
        "_id": "6728b22183243a291455f43e",
        "name": "Ngã tư Nguyễn Văn Linh - Nguyễn Hữu Thọ",
        "mac": "ba:ab:ab:11:22:33",
        "pillars": [ ... ],
        "createdAt": "2025-10-28T11:05:12.000Z",
        "updatedAt": "2025-10-28T11:05:12.000Z"
      },
      "error": null,
      "timestamp": "28/10/2025 11:05:12"
    }
    ```

### `GET /intersections`

- **Phương thức:** `GET`
- **Endpoint:** `/intersections`
- **Mô tả:** Lấy danh sách các nút giao thông.
- **Quyền hạn:** Đã xác thực (Authenticated).
- **Phản hồi:**
  - `200 OK`: Lấy danh sách thành công.
    ```json
    {
      "success": true,
      "message": "Get intersections success!",
      "data": [
        {
          "_id": "6728b22183243a291455f43e",
          "name": "Ngã tư Nguyễn Văn Linh - Nguyễn Hữu Thọ",
          "mac": "ba:ab:ab:11:22:33",
          "pillars": [ ... ]
        }
      ],
      "error": null,
      "timestamp": "28/10/2025 11:06:12"
    }
    ```

### `GET /intersections/:intersectionId`

- **Phương thức:** `GET`
- **Endpoint:** `/intersections/:intersectionId`
- **Mô tả:** Lấy thông tin chi tiết một nút giao thông.
- **Quyền hạn:** Đã xác thực (Authenticated).
- **Phản hồi:**
  - `200 OK`: Lấy thông tin thành công.
    ```json
    {
      "success": true,
      "message": "Get intersection success!",
      "data": {
        "_id": "6728b22183243a291455f43e",
        "name": "Ngã tư Nguyễn Văn Linh - Nguyễn Hữu Thọ",
        "mac": "ba:ab:ab:11:22:33",
        "pillars": [ ... ]
      },
      "error": null,
      "timestamp": "28/10/2025 11:07:12"
    }
    ```

### `PATCH /intersections/:intersectionId`

- **Phương thức:** `PATCH`
- **Endpoint:** `/intersections/:intersectionId`
- **Mô tả:** Cập nhật thông tin nút giao thông.
- **Quyền hạn:** Đã xác thực (Authenticated).
- **Body:** (Các trường cần cập nhật)
  ```json
  {
    "name": "Ngã tư NVL - NHT (Updated)"
  }
  ```
- **Phản hồi:**
  - `200 OK`: Cập nhật thành công.
    ```json
    {
      "success": true,
      "message": "Update intersection success!",
      "data": {
        "_id": "6728b22183243a291455f43e",
        "name": "Ngã tư NVL - NHT (Updated)",
        ...
      },
      "error": null,
      "timestamp": "28/10/2025 11:08:12"
    }
    ```

### `DELETE /intersections/:intersectionId`

- **Phương thức:** `DELETE`
- **Endpoint:** `/intersections/:intersectionId`
- **Mô tả:** Xóa nút giao thông.
- **Quyền hạn:** Đã xác thực (Authenticated).
- **Phản hồi:**
  - `200 OK`: Xóa thành công.
    ```json
    {
      "success": true,
      "message": "Intersection deleted successfully",
      "data": {
        "message": "Intersection deleted successfully"
      },
      "error": null,
      "timestamp": "28/10/2025 11:09:12"
    }
    ```

### `GET /intersections/mac/:mac`

- **Phương thức:** `GET`
- **Endpoint:** `/intersections/mac/:mac`
- **Mô tả:** Lấy thông tin chi tiết một nút giao thông dựa trên địa chỉ MAC.
- **Quyền hạn:** Đã xác thực (Authenticated).
- **Phản hồi:**
  - `200 OK`: Lấy thông tin thành công.
    ```json
    {
      "success": true,
      "message": "Get intersection success!",
      "data": {
        "_id": "6728b22183243a291455f43e",
        "name": "Ngã tư Nguyễn Văn Linh - Nguyễn Hữu Thọ",
        "mac": "ba:ab:ab:11:22:33",
        "pillars": [ ... ]
      },
      "error": null,
      "timestamp": "28/10/2025 11:07:12"
    }
    ```

---

## Quản lý Firmware

### `POST /firmware/sync`

- **Phương thức:** `POST`
- **Endpoint:** `/v1/firmware/sync`
- **Mô tả:** Kích hoạt Server tải bản firmware mới nhất từ GitHub Release (Private Repo) về lưu trữ cục bộ.
  > **Lưu ý:** Hệ thống sẽ tìm release mới nhất có tag kết thúc bằng `-receiver` hoặc `-transmitter` tùy thuộc vào tham số `type`. File tải về sẽ được lưu đè lên file cũ với tên cố định (`firmware-receiver.bin` hoặc `firmware-transmitter.bin`) để giữ nguyên URL tải OTA cho thiết bị.
- **Quyền hạn:** Admin (Authenticated & Admin role).
- **Yêu cầu (Headers):**
  - `Authorization`: `Bearer <access_token>`
- **Body (JSON):**
  ```json
  {
    "type": "receiver"
  }
  ```
  _("type" có thể là `receiver` hoặc `transmitter`. Nếu không gửi, mặc định là tìm cả 2 nhưng logic hiện tại ưu tiên gửi từng loại)_
- **Phản hồi:**
  - `200 OK`: Đồng bộ thành công.
    ```json
    {
      "success": true,
      "message": "Sync firmware successfully",
      "data": {
        "version": "v1.0.1-receiver",
        "downloaded": [
          {
            "name": "firmware-receiver.bin",
            "path": "uploads/firmware/firmware-receiver.bin"
          }
        ],
        "releaseNote": "Update fix GPS..."
      },
      "error": null,
      "timestamp": "..."
    }
    ```

### `GET /firmware`

- **Phương thức:** `GET`
- **Endpoint:** `/v1/firmware`
- **Mô tả:** Lấy danh sách các file firmware đang được lưu trữ trên Server.
- **Quyền hạn:** Admin (Authenticated & Admin role).
- **Yêu cầu (Headers):**
  - `Authorization`: `Bearer <access_token>`
- **Phản hồi:**
  - `200 OK`: Lấy danh sách thành công.
    ```json
    {
      "success": true,
      "message": "Success",
      "data": [
        {
          "name": "firmware-receiver.bin",
          "path": "uploads/firmware/firmware-receiver.bin",
          "createdAt": "2026-01-07T10:00:00.000Z"
        },
        {
          "name": "firmware-transmitter.bin",
          "path": "uploads/firmware/firmware-transmitter.bin",
          "createdAt": "2026-01-07T10:05:00.000Z"
        }
      ],
      "error": null,
      "timestamp": "..."
    }
    ```

### `GET /firmware/download`

- **Phương thức:** `GET`
- **Endpoint:** `/v1/firmware/download`
- **Quyền hạn:** Public (Yêu cầu Token)
- **Mô tả:** Tải xuống file firmware nhị phân (.bin) cho thiết bị ESP32. Endpoint này yêu cầu token hợp lệ được cấp phát thông qua quy trình MQTT Handshake.
- **Query Parameters:**
  - `token` (string, required): Token bảo mật dùng một lần (hoặc có thời hạn) nhận được từ bản tin MQTT `update/response`.
  - `type` (string, required): Loại thiết bị (`receiver` hoặc `transmitter`).
- **Phản hồi:**
  - `200 OK`: File Stream (application/octet-stream).
  - `400 Bad Request`: Thiếu tham số hoặc tham số không hợp lệ.
  - `403 Forbidden`: Token không hợp lệ, hết hạn, hoặc loại thiết bị không khớp.
  - `404 Not Found`: Không tìm thấy file firmware trên hệ thống.
