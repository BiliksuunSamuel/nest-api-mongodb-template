# 🚀 NestJS MongoDB Boilerplate

This is a **NestJS API Boilerplate** that provides a scalable and modular architecture with **MongoDB (Mongoose), JWT authentication, Swagger documentation, Docker support**, and **auto-loading modules**.

It’s designed to help developers **kickstart a new NestJS project** with best practices built-in.

---

## ⚡ Features

✅ **MongoDB with Mongoose** – Auto-loads schemas from `schemas/`  
✅ **Authentication** – Phone number + SMS one-time code sign-in, one active session per user, JWT  
✅ **Swagger API Documentation** – Auto-generates OpenAPI docs  
✅ **Auto-load Modules** – Dynamically loads controllers, services, repositories, and schemas  
✅ **Environment Variables** – Uses `.env` for configuration  
✅ **Clean Project Structure** – Easy to scale and maintain

---

## ⚡ Requirements

- Nodejs

- Mongodb server, you can setup your local mongodb server by following:
  <a href="https://www.mongodb.com/try/download/community" target="_blank" rel="noopener noreferrer">
  Download MongoDB Community Edition
  </a>

---

## 🌍 Environment Variables (.env.example)

Create a .env file at the root of your project and add your environment variables:

```code
PORT=5858
CONNECTION_STRING=mongodb://localhost:27017/NestjsTemplate
JWT_SECRET=your-secret-key   # required, app refuses to start without it
JWT_EXPIRES_IN=365d          # optional, upper bound; sessions end on sign-out / takeover
CORS_ORIGIN=*                # optional, restrict in production
APP_NAME=App                 # optional, used in the SMS text
DEFAULT_COUNTRY=GH           # optional, for numbers without a country code
SESSION_LIFETIME_DAYS=       # optional, unset = sessions don't expire on their own
TRUST_PROXY=                 # optional, e.g. 1 behind a reverse proxy
REVIEW_PHONES=               # optional, comma-separated review/demo numbers
REVIEW_OTP_CODE=             # optional, their fixed 6 digit code


```

## 🚀 How to Use This Template

### 1️⃣ Create a New Project from This Template

Run the following command:

```sh
npx degit BiliksuunSamuel/nest-api-mongodb-template my-new-app
cd my-new-app
npm install
```


---

## 🐳 Docker

```sh
cp .env.example .env
JWT_SECRET=$(openssl rand -hex 32) docker compose up --build
```

## 🔐 Auth & RBAC

Sign-in is by phone number and a one-time SMS code. Accounts are created on first sign-in.

1. `POST /api/authentication/login` `{ phoneNumber }` – texts a 6 digit code and returns a **temporary token**. It may only call `verify-otp` and `resend-otp`.
2. `POST /api/authentication/verify-otp` `{ verificationCode }` (temporary token) – returns the **session token** and the user. Send it as `Authorization: Bearer <token>`.
3. `POST /api/authentication/resend-otp` (temporary token) – sends a new code.
4. `GET /api/authentication/profile`, `PATCH /api/authentication/setup-profile` `{ name }`, `POST /api/authentication/logout`.

How it works:

- **Sessions** live in the `UserAuthSession` collection, one per user. Verifying a code makes it the account's only active session, so the device signed in before is signed out.
- **`AuthMiddleware`** checks every bearer token against the session. A rejected token gets `401 { reason }`, where `reason` is `SESSION_REPLACED` (another device signed in), `SESSION_ENDED` (signed out) or `SESSION_EXPIRED` (`SESSION_LIFETIME_DAYS` passed).
- **Codes** are stored only as an HMAC hash. They expire after 5 minutes and allow 5 wrong guesses, with a 60s resend cooldown and at most 5 codes per hour (`src/constants/otp.policy.ts`). Each endpoint is also rate limited per IP with `@nestjs/throttler`.
- **Phone numbers** are stored as E.164 digits without the `+` (`0241234567` → `233241234567`, see `src/utils/phone.ts`).
- **SMS**: put your provider in `SmsService.deliver` (`src/services/sms.service.ts`). Until you do, codes are written to the log outside production and dropped in production.
- **Roles**: protect a route with `@AuthRoles(UserRole.Admin)` (it applies `JwtAuthGuard` + `RolesGuard`). The role is read from the database on each request, so a role change applies immediately.
