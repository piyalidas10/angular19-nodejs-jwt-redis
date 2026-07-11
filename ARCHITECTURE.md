# Proeject Architecture

For your Angular 19 + Node.js + Redis JWT Authentication & Authorization Application, here's a production-grade architecture that reflects the implementation we've been working on (Angular 19, Express, JWT, Redis, HttpOnly Cookies, RBAC, Refresh Token Rotation).

```
                                    Angular 19 + Node.js + Redis
                            JWT Authentication & Authorization Architecture

┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                   Angular 19 Frontend                                   │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  Login Component                                                                         │
│  Route Guards (AuthGuard, RoleGuard)                                                     │
│  HttpInterceptor                                                                         │
│  Signals / Signal Store                                                                  │
│  RBAC Service                                                                            │
│                                                                                          │
│         │                                                                                │
│         │ POST /api/auth/login                                                           │
│         ▼                                                                                │
└──────────────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            Node.js + Express Authentication API                          │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  Helmet                                                                                  │
│  CORS                                                                                    │
│  Rate Limiter                                                                            │
│  Cookie Parser                                                                           │
│  JWT Middleware                                                                          │
│  RBAC Middleware                                                                         │
│                                                                                          │
│  Authentication Flow                                                                     │
│                                                                                          │
│  1. Validate Username / Password                                                         │
│  2. Generate Access Token (JWT)                                                          │
│  3. Generate Refresh Token (JWT)                                                         │
│  4. Generate JTI (UUID)                                                                  │
│  5. Hash Refresh Token (SHA-256)                                                         │
│  6. Store metadata in Redis                                                              │
│  7. Return Access Token + HttpOnly Refresh Cookie                                        │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Redis Client (ioredis)
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                          Redis                                           │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│ Refresh Token Metadata (HASH)                                                            │
│                                                                                          │
│ Key: rt:<jti>                                                                            │
│                                                                                          │
│ ┌─────────────────────────────┐                                                          │
│ │ userId      = usr-001       │                                                          │
│ │ tokenHash   = SHA256(...)   │                                                          │
│ │ expiresAt   = 1752071234    │                                                          │
│ └─────────────────────────────┘                                                          │
│                                                                                          │
│ TTL = 7 Days                                                                             │
│                                                                                          │
│──────────────────────────────────────────────────────────────────────────────────────────│
│                                                                                          │
│ User → Refresh Token Mapping                                                             │
│                                                                                          │
│ Key: rt:user:usr-001                                                                     │
│                                                                                          │
│ Value                                                                                    │
│                                                                                          │
│ 2892cc10-5903-472d-829e-bf86b5810f41                                                     │
│                                                                                          │
│ (or a Set if supporting multiple devices)                                                │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘

=============================================================================================
                                   LOGIN FLOW
=============================================================================================

Angular Login
      │
      ▼
POST /api/auth/login
      │
      ▼
Validate Credentials
      │
      ▼
Generate Access Token (30 sec)
      │
Generate Refresh Token (7 days)
      │
Generate JTI
      │
Hash Refresh Token
      │
Store Hash in Redis
      │
Return:
    • Access Token
    • HttpOnly Refresh Cookie

=============================================================================================
                             AUTHENTICATED API REQUEST
=============================================================================================

Angular
     │
Authorization: Bearer <Access Token>
     │
     ▼
Backend JWT Middleware
     │
Verify Signature
     │
Extract Roles & Permissions
     │
RBAC Middleware
     │
Controller
     │
Response

=============================================================================================
                             ACCESS TOKEN EXPIRED
=============================================================================================

Angular HttpInterceptor
        │
401 Unauthorized
        │
        ▼
POST /api/auth/refresh
(HttpOnly Cookie sent automatically)
        │
        ▼
Verify Refresh JWT
        │
Extract JTI
        │
Lookup Redis
        │
Hash Incoming Refresh Token
        │
Compare with tokenHash
        │
Generate NEW Refresh Token
        │
Store NEW Redis Record
        │
Delete OLD Redis Key
        │
Update rt:user:usr-001
        │
Return New Access Token
        │
Angular Retries Original Request

=============================================================================================
                                   LOGOUT
=============================================================================================

Angular
      │
POST /api/auth/logout
      │
      ▼
Backend
      │
Delete rt:<jti>
Delete rt:user:<userId>
Clear HttpOnly Cookie
      │
      ▼
User Logged Out

=============================================================================================
                             REDIS DATA STRUCTURES
=============================================================================================

Hash
────
rt:<jti>

Fields
• userId
• tokenHash
• expiresAt

Purpose
• Refresh token metadata

--------------------------------------------

String (current implementation)

rt:user:<userId>

Value

<current-jti>

Purpose

Current active refresh token

--------------------------------------------

Future Enhancement

Set

rt:user:<userId>

Members

jti-1
jti-2
jti-3

Purpose

Multiple concurrent device sessions

=============================================================================================
                               SECURITY FEATURES
=============================================================================================

✅ Angular 19 Signals
✅ Standalone Components
✅ HttpInterceptor
✅ HttpOnly Refresh Cookie
✅ Secure Cookie (Production)
✅ SameSite=Lax
✅ JWT Access Token
✅ Refresh Token Rotation
✅ SHA-256 Refresh Token Hashing
✅ Redis TTL
✅ Redis Revocation
✅ Role-Based Access Control (RBAC)
✅ Permission-Based Authorization
✅ Helmet Security Headers
✅ CORS Protection
✅ Rate Limiting
✅ Automatic Token Refresh
✅ Session Revocation
✅ Cross-Tab Logout (BroadcastChannel)
```

This architecture matches the Redis keys you've verified (rt:<jti> hash with userId, tokenHash, expiresAt, and rt:user:usr-001) and the Angular 19 + Node.js authentication flow you're building. It also leaves room to evolve from a single active refresh token per user to multiple concurrent device sessions by changing rt:user:<userId> from a String to a Set.

## Production Architecture Example

```
                    Redis
                       │
 ┌─────────────────────┼─────────────────────┐
 │                     │                     │
 ▼                     ▼                     ▼
Hash               String                Set
rt:<jti>           rt:user:usr-001       roles:usr-001
 │                 │                     │
 ├─ userId         └─ latest jti         ├─ ADMIN
 ├─ tokenHash                            ├─ USER
 └─ expiresAt                            └─ AUDITOR

          ▼
      Sorted Set
active:sessions
 ├─ score = expiry timestamp
 └─ member = jti

          ▼
        Stream
auth-events
 ├─ login
 ├─ refresh
 ├─ logout
 └─ revoke
```

For your Angular 19 + Node.js + JWT + Redis Authentication Playground, using a Hash for refresh token metadata is an excellent choice because it groups related fields efficiently, supports partial updates, and scales well. If you later support multiple simultaneous devices per user, consider changing rt:user:<userId> from a String to a Set, allowing one user to have multiple active refresh token IDs (JTIs).

## Redis Data Types for Your Authentication System

| Requirement                  | Recommended Data Type                                       | Example                       |
| ---------------------------- | ----------------------------------------------------------- | ----------------------------- |
| Refresh Token Metadata       | **Hash**                                                    | `rt:<jti>`                    |
| User → Refresh Token Mapping | **String** (one active token) or **Set** (multiple devices) | `rt:user:usr-001`             |
| Access Token Blacklist       | **String**                                                  | `blacklist:<jti>`             |
| Login Attempts               | **String** (counter)                                        | `INCR login:attempts:usr-001` |
| User Roles                   | **Set**                                                     | `roles:usr-001`               |
| Active Sessions              | **Sorted Set**                                              | `active-sessions`             |
| Login History                | **List**                                                    | `history:usr-001`             |
| Audit Logs                   | **Stream**                                                  | `auth-events`                 |
| OTP                          | **String**                                                  | `otp:usr-001`                 |
