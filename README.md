# 🚀 NestJS MongoDB Boilerplate

This is a **NestJS API Boilerplate** that provides a scalable and modular architecture with **MongoDB (Mongoose), JWT authentication, Swagger documentation, Docker support**, and **auto-loading modules**.

It’s designed to help developers **kickstart a new NestJS project** with best practices built-in.

---

## ⚡ Features

✅ **MongoDB with Mongoose** – Auto-loads schemas from `schemas/`  
✅ **Authentication** – Supports **JWT-based authentication**  
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
JWT_EXPIRES_IN=8h            # optional
CORS_ORIGIN=*                # optional, restrict in production


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

- `POST /api/authentication/login` returns a JWT. Send it as `Authorization: Bearer <token>`.
- `POST /api/authentication/logout` revokes the token used for the request.
- `JwtStrategy` rejects revoked tokens and attaches the user's current `role` to `request.user`.
- Protect a route by role with `@AuthRoles(UserRole.Admin)` (it applies `JwtAuthGuard` + `RolesGuard`).
- `POST /api/users/register` is public; other user/customer routes require a token.
