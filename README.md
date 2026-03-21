# 🦷 Smiling Wallet

Smiling Wallet is a full-stack dental marketplace web app that anonymously connects patients with dental clinics. Patients submit treatment requests (e.g. implants, orthodontics, cleaning) without revealing their identity — clinics compete by sending price offers in real time. Patients then compare, filter, and accept the best match, unlocking contact details only after confirmation.

---

## 💻 Tech Stack

![Spring](https://img.shields.io/badge/spring-%236DB33F.svg?style=for-the-badge&logo=spring&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

---

## ✨ Key Features

- 🔒 **Anonymous marketplace** — patients and clinics interact via UUID-based identities; real names and contacts are revealed only after an offer is accepted
- ⚡ **Real-time notifications** — dentists are instantly notified of new requests; patients receive live offer updates via Spring WebSocket (STOMP) + Redis pub/sub
- 🦷 **Multi-specialty requests** — supports general dentistry, implants, orthodontics, cosmetic dentistry, pediatric dentistry, and more
- 📊 **Offer analytics dashboard** — patients see price distributions, savings analysis, best-value rankings, and clinic efficiency scores
- 🏥 **Clinic dashboard** — dentists manage incoming requests, send offers, track accepted/pending status, and view patient summaries
- 🔐 **JWT authentication** — role-based access control for `PATIENT` and `DENTIST` roles with secure token-based sessions
- 📁 **File uploads** — patients can attach X-rays and dental documents to their requests via Cloudinary (signed URLs)
- 🔍 **Offer filtering** — filter and sort offers by price, clinic rating, wait time, and included extras

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────┐
│         React + TypeScript          │  ← Vite · Tailwind · shadcn/ui
│         (Frontend — Vercel)         │  ← Axios · @stomp/stompjs · SockJS
└────────────┬────────────────────────┘
             │ REST + WebSocket (STOMP)
┌────────────▼────────────────────────┐
│         Spring Boot 3               │  ← spring-web · spring-security
│         (Backend — Docker)          │  ← spring-websocket · spring-data-jpa
└────┬──────────┬──────────┬──────────┘
     │          │          │
┌────▼───┐ ┌───▼───┐ ┌────▼──────┐
│Postgres│ │ Redis │ │Cloudinary │
│  (DB)  │ │(Cache │ │  (Files)  │
│        │ │+PubSub│ │           │
└────────┘ └───────┘ └───────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- [Docker & Docker Compose](https://docs.docker.com/get-docker/)
- [Node.js 18+](https://nodejs.org/) (for frontend)
- [Java 21](https://adoptium.net/) (for local backend dev without Docker)

### Run with Docker Compose

```bash
# Clone the repo
git clone https://github.com/your-username/smiling-wallet.git
cd smiling-wallet

# Start everything (Spring Boot + PostgreSQL + Redis)
docker compose up --build
```

The API will be available at `http://localhost:8080`.

### Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 📁 Project Structure

```
smiling-wallet/
├── backend/
│   ├── src/main/java/com/smilingwallet/
│   │   ├── config/          # Security, WebSocket, CORS
│   │   ├── controller/      # REST endpoints
│   │   ├── model/           # JPA entities (User, DentalRequest, Offer)
│   │   ├── repository/      # Spring Data JPA interfaces
│   │   └── service/         # Business logic + notifications
│   └── src/main/resources/
│       ├── application.yml
│       └── db/migration/    # Flyway SQL migrations
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Home, MyOffers, SendRequest, About
│   │   ├── hooks/           # useWebSocket, useAuth, useOffers
│   │   └── api/             # Axios client + API calls
│   └── vite.config.ts
├── docker-compose.yml
├── Dockerfile
└── README.md
```

---

## 🔑 Environment Variables

| Variable | Description | Default |
|---|---|---|
| `SPRING_DATASOURCE_URL` | PostgreSQL connection URL | `jdbc:postgresql://localhost:5432/smiling_wallet` |
| `SPRING_DATA_REDIS_HOST` | Redis host | `localhost` |
| `APP_JWT_SECRET` | JWT signing secret (change in prod!) | — |
| `APP_CORS_ALLOWED_ORIGINS` | Frontend origin for CORS | `http://localhost:5173` |
| `CLOUDINARY_URL` | Cloudinary API URL for file uploads | — |

---

## 🗺️ Roadmap

- [x] Anonymous request/offer flow
- [x] Real-time WebSocket notifications
- [x] Offer analytics & price benchmarking
- [x] Role-based JWT authentication
- [ ] In-app secure messaging (patient ↔ clinic)
- [ ] Automatic clinic matching by specialty & proximity
- [ ] Mobile app (React Native)
- [ ] Email/push notification support

---

[![](https://visitcount.itsvg.in/api?id=muresanianis450&icon=0&color=0)](https://visitcount.itsvg.in)

<!-- Proudly created with GPRM ( https://gprm.itsvg.in ) -->
