# EVPS Dashboard (React)

Frontend cho hệ thống EVPS. Sử dụng React 18 + Vite.

## Chức năng hiện tại

- Đăng nhập bằng API `/v1/users/login`.
- Đăng ký (Admin) bằng API `/v1/admin/users/register`.
- Lưu trữ access/refresh token ở `localStorage` (cookie httpOnly vẫn do BE đặt) và tự động refresh access token khi hết hạn.
- Hiển thị thông tin người dùng hiện tại.
- Logout.

## Cấu trúc thư mục chính

```
dashboard/
  src/
    components/      # UI components (LoginForm, ...)
    state/           # React Context (AuthContext)
    utils/           # apiClient (fetch wrapper + refresh token)
  index.html         # Root HTML
  vite.config.js     # Vite config + proxy
  Dockerfile.dashboard.dev  # Dev Dockerfile (root project: Dockerfile.dashboard.dev)
  Dockerfile.dashboard.prod # Prod Dockerfile (root project: Dockerfile.dashboard.prod)
```

## Environment Variables

File `.env` (xem `.env.example`):

```
VITE_API_BASE_URL=http://api:3000
```

Nếu không khai báo, Vite dev server sẽ proxy `/api` -> `http://localhost:3000/v1` (xem `vite.config.js`).

## Chạy Development (ngoài Docker)

Tại thư mục `source/dashboard`:

```powershell
npm install
npm run dev
```

Sau đó truy cập: http://localhost:5173

## Docker Development

Trong thư mục `source/` chạy toàn bộ stack:

```powershell
docker compose -f docker-compose.dev.yml up --build
```

Dashboard: http://localhost:5173

## Docker Production Build

```powershell
docker compose up --build -d
```

Dashboard: http://localhost:4000

## Ghi chú CORS

Nếu cần thêm domain, chỉnh `WHITELIST_DOMAINS` trong `server/src/utils/constants.js`.

## TODO (Gợi ý mở rộng)

- Routing (React Router) + bảo vệ route.
- Trang quản lý người dùng (Admin) gọi các API `/v1/admin/users`.
- UI reset password.
- Dark mode.
