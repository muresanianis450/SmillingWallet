# Smiling Wallet — Client-Server Setup Guide

## Overview

| Layer | Technology | Where |
|---|---|---|
| Database | PostgreSQL 16 + Redis 7 (Docker) | Ubuntu VM |
| Backend | Spring Boot (Java 21) | Ubuntu VM |
| Frontend | React + TypeScript + Vite | Windows |

---

## 1. Start the VM

Open VirtualBox and start the **smilingwallet-VirtualBox** VM.  
Make sure the network adapter is set to **Bridged Adapter**.

---

## 2. Get the VM IP

In the VM terminal:

```bash
ip addr show
```

Look for the `inet` line under your network interface (e.g. `enp0s3`).  
Example: `172.20.10.6`

> If the IP changed since last time, update `BASE_URL` in your React frontend:
> `src/api.ts` → `const BASE_URL = "http://<NEW_IP>:8080/api"`

---

## 3. Start Docker Containers (PostgreSQL + Redis)

```bash
cd ~/SmillingWallet
docker compose up -d
```

Verify they are running:

```bash
docker ps
```

You should see `postgres:16` and `redis:7` both with status `Up`.

---

## 4. Pull Latest Code (if you pushed from Windows/IntelliJ)

```bash
cd ~/SmillingWallet
git pull origin main
```

---

## 5. Start the Spring Boot Backend

```bash
cd ~/SmillingWallet
mvn spring-boot:run
```

Wait for this line before continuing:

```
Started SmilingWalletApplication in X seconds
```

Backend is now running at: `http://<VM_IP>:8080`

---

## 6. Start the React Frontend (Windows)

Open a terminal in your frontend project folder and run:

```bash
npm run dev
```

Frontend is now running at: `http://localhost:5173`

---

## 7. Verify the Connection

Open `http://localhost:5173` in your browser, then open DevTools (`F12`) → Console and run:

### Test Register
```js
fetch("http://172.20.10.6:8080/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "test@test.com",
    password: "test123",
    username: "testuser",
    phone: "0712345678",
    role: "PATIENT"
  })
}).then(r => r.json()).then(console.log).catch(console.error)
```

**Expected response:**
```json
{
  "token": "token_<uuid>",
  "user": { "id": "...", "email": "test@test.com", ... }
}
```

### Test Login
```js
fetch("http://172.20.10.6:8080/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "test@test.com",
    password: "test123"
  })
}).then(r => r.json()).then(console.log).catch(console.error)
```

---

## 8. API Endpoints Reference

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/user/{userId}` | Get user by ID |
| PUT | `/api/auth/user/{userId}` | Update profile |
| DELETE | `/api/auth/user/{userId}` | Delete account |
| POST | `/api/offers` | Send offer |
| GET | `/api/offers/{offerId}` | Get offer by ID |
| GET | `/api/offers/request/{requestId}` | Get offers for request |
| GET | `/api/offers/dentist/{dentistId}` | Get offers by dentist |
| PATCH | `/api/offers/{offerId}/accepted` | Accept offer |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| White screen + `global is not defined` | Add `define: { global: 'globalThis' }` to `vite.config.ts` |
| `404` on `/api/auth/register` | `AuthController.java` is missing or backend not restarted |
| `400 Bad Request` | Check the error JSON — a required field is missing |
| `ERR_CONNECTION_REFUSED` | Backend not running, or VM IP changed |
| `CORS error` | Check `CorsConfig.java` — must use `allowedOriginPatterns("*")` |
| Docker containers not running | Run `docker compose up -d` in `~/SmillingWallet` before `mvn spring-boot:run` |

---

## SSH from Windows (easier than VM clipboard)

Instead of typing in the VM terminal, SSH in from Windows PowerShell:

```powershell
ssh smilingwallet@172.20.10.6
```

This lets you paste normally with `Ctrl+V`.