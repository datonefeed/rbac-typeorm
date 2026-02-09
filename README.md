# RBAC Express API

Hệ thống RBAC hoàn chỉnh với Express.js, PostgreSQL, và JWT authentication.

## Cài đặt

```bash
# Install dependencies
npm install

# Cấu hình database trong file .env
# Tạo database: createdb rbac_db

# Chạy migrations
psql -U postgres -d rbac_db -f src/migrations/init.sql

# Chạy seeders
psql -U postgres -d rbac_db -f src/seeders/rbac.sql
```

## Chạy ứng dụng

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Tài khoản mặc định

- **Username**: admin
- **Password**: admin123

## API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Admin (Requires IT_ADMIN or SUPER_ADMIN)
- `GET /api/admin/users` - Danh sách users
- `POST /api/admin/users/:userId/roles` - Gán roles cho user
- `GET /api/admin/roles` - Danh sách roles
- `GET /api/admin/permissions` - Danh sách permissions
- `POST /api/admin/roles/:roleId/permissions` - Map permissions cho role

### Projects
- `GET /api/projects` - Xem danh sách projects (requires PRJ_VIEW)
- `POST /api/projects` - Tạo project mới (requires PRJ_CREATE)
- `PUT /api/projects/:id` - Cập nhật project (requires PRJ_UPDATE)
- `DELETE /api/projects/:id` - Xóa project (requires PROD_MANAGER or SUPER_ADMIN role)

## Testing với curl

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "admin", "password": "admin123"}'

# Get user info (với token từ login)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# List users
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Cấu trúc thư mục

```
rbac-api/
├── src/
│   ├── config/          # Database config
│   ├── constants/       # Roles & Permissions definitions
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth & Permission checks
│   ├── routes/          # API routes
│   ├── migrations/      # Database schema
│   ├── seeders/         # Initial data
│   ├── utils/           # Helper functions
│   └── server.js        # Main app
├── .env                 # Environment variables
└── package.json
```

## Roles & Permissions

### Roles
- **DIRECTOR**: Ban lãnh đạo (read-only)
- **PROD_MANAGER**: Quản lý sản xuất
- **SHOP_OPERATOR**: Công nhân xưởng
- **IT_ADMIN**: Quản trị ứng dụng
- **SUPER_ADMIN**: Quản trị hệ thống (full access)

### Permission Categories
- Dashboard (DASHBOARD_*)
- Reports (REPORT_*)
- Projects (PRJ_*)
- Stages (STAGE_*)
- Planning (PLAN_*)
- Admin (ADMIN_*)
