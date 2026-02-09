# Auth Module Architecture (Production-Ready)

## Overview
Auth module đã được refactor theo chuẩn production với:
- ✅ **NO cookies** - Pure token-based authentication
- ✅ **NO raw SQL** - 100% TypeORM QueryBuilder/Repository
- ✅ **Active records only** - Filter at DB level
- ✅ **Clean separation** - Service → Controller → DTO
- ✅ **Opaque tokens** - Non-JWT token strategy

---

## Architecture Layers

### 1. **Service Layer** (`src/services/auth_service.ts`)
**Responsibility**: Data fetching with business logic

#### `loadUserAuthData(identifier: string)`
- Find active user by username OR email
- Load active relationships using TypeORM QueryBuilder:
  - `user_roles` (isActive=true) → `roles` (isActive=true)
  - `role_permissions` (isActive=true) → `permissions` (isActive=true)
  - `user_companies` (isActive=true) → `companies` (isActive=true)
- Return structured data: `{ user, roles, permissions, companies }`

**Why QueryBuilder instead of relations?**
- Filter at DB level (efficient)
- No N+1 queries
- Precise control over JOINs and WHERE conditions
- Still using TypeORM APIs (no raw SQL)

#### `findUserById(userId: number)`
- Simple repository query for `/me` endpoint

---

### 2. **Controller Layer** (`src/controllers/auth_controller.ts`)
**Responsibility**: HTTP handling and orchestration

#### `POST /api/auth/login`
```typescript
// Flow:
1. Validate input (identifier + password)
2. loadUserAuthData(identifier)
3. Verify bcrypt password
4. buildAbilities(roles, permissions, companies)
5. createAccessToken(userId, metadata)
6. toLoginResponseDTO(...)
```

**Response format:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "...",
    "tokenType": "Bearer",
    "expiresAt": "2026-02-07T...",
    "user": {
      "id": 1,
      "userName": "admin",
      "fullName": "Administrator",
      "email": "admin@example.com",
      "isActive": true,
      "roles": [
        { "id": 1, "name": "DIRECTOR", "description": "..." }
      ],
      "permissions": [
        { "id": 1, "name": "PRJ_VIEW", "description": "..." }
      ],
      "companies": [
        { "id": 1, "code": "COMP001", "name": "Company A" }
      ]
    },
    "abilities": [
      "DIRECTOR",
      "company:1",
      "permission:PRJ_VIEW"
    ]
  }
}
```

#### `POST /api/auth/logout`
```typescript
// Flow:
1. extractBearerToken(req)
2. revokeToken(token) // Idempotent
3. Return success message
```

#### `GET /api/auth/me`
```typescript
// Flow:
1. Get userId from req.user (populated by authMiddleware)
2. findUserById(userId)
3. Return user + abilities from token
```

---

### 3. **Utils Layer**

#### `src/utils/ability_builder.ts`
- `buildAbilities(roles, permissions, companies)`: Create unique + sorted abilities array
  - Format: `['DIRECTOR', 'company:1', 'permission:PRJ_VIEW']`
  - Using Set for uniqueness
  - Array.sort() for stable output

#### `src/utils/request_helpers.ts`
- `extractBearerToken(req)`: Parse Authorization header
- `getClientIp(req)`: Get client IP
- `getUserAgent(req)`: Get user agent

#### `src/utils/token_utils.ts` (existing)
- `createAccessToken(userId, metadata)`: Create opaque token
- `revokeToken(token)`: Revoke token from DB

---

### 4. **DTO Layer** (`src/dto/auth_dto.ts`)
**Responsibility**: Response transformation

- `toLoginResponseDTO(...)`: Transform to login response format
- `toMeResponseDTO(...)`: Transform to /me response format

---

## Key Design Decisions

### ✅ TypeORM QueryBuilder (NO raw SQL)
```typescript
// ❌ BAD: Raw SQL
await AppDataSource.query(`
  SELECT * FROM users WHERE ...
`)

// ✅ GOOD: QueryBuilder
await AppDataSource
  .createQueryBuilder()
  .select(['role.id', 'role.roleName'])
  .from('user_roles', 'ur')
  .innerJoin('roles', 'role', 'role.id = ur.roleId')
  .where('ur.userId = :userId', { userId })
  .andWhere('ur.isActive = true')
  .getRawMany()
```

### ✅ Active Records Only (DB-level filter)
```typescript
// Filter at DB level (efficient)
.andWhere('ur.isActive = true')
.andWhere('role.isActive = true')

// Instead of loading all then filtering in memory
```

### ✅ Separation of Concerns
```
Request → Controller → Service → Repository → DB
         ↓
       Utils (helpers)
         ↓
       DTOs (transform)
         ↓
       Response
```

### ✅ Abilities Format
```typescript
[
  'DIRECTOR',           // Role names
  'company:1',          // Company IDs with prefix
  'permission:PRJ_VIEW' // Permission names with prefix
]
```
- Flat array for easy check: `abilities.includes('DIRECTOR')`
- Unique + sorted for consistency

---

## Security Considerations

### 1. Password Handling
- ✅ bcrypt for hashing
- ✅ Never log passwords
- ✅ Generic error message on login failure

### 2. Token Management
- ✅ Opaque tokens (not JWT)
- ✅ Store in database with metadata
- ✅ Revoke capability
- ✅ Expiration handling

### 3. Input Validation
- ✅ Check required fields
- ✅ 400 for missing input
- ✅ 401 for invalid credentials

---

## Testing Endpoints

### Login
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "identifier": "admin",
  "password": "admin123"
}
```

### Logout
```bash
POST http://localhost:3000/api/auth/logout
Authorization: Bearer <token>
```

### Me
```bash
GET http://localhost:3000/api/auth/me
Authorization: Bearer <token>
```

---

## Files Structure
```
src/
├── controllers/
│   └── auth_controller.ts       # HTTP handlers
├── services/
│   └── auth_service.ts          # Data loading logic
├── utils/
│   ├── ability_builder.ts       # Abilities construction
│   ├── request_helpers.ts       # Request parsing
│   └── token_utils.ts           # Token operations
├── dto/
│   └── auth_dto.ts              # Response transformation
└── middleware/
    └── auth.ts                  # Token verification
```

---

## Future Improvements
- [ ] Add refresh token mechanism
- [ ] Rate limiting for login attempts
- [ ] Account lockout after failed attempts
- [ ] Audit logging for auth events
- [ ] Multi-factor authentication (MFA)
- [ ] Session management dashboard
