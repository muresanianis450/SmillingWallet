# 🦷 Smiling Wallet

> **A medical-tourism dental marketplace** — patients submit procedure requests anonymously, dentists in the target city compete with price offers, and real contact details are only revealed after a confirmed booking.

![Java](https://img.shields.io/badge/java-%23ED8B00.svg?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring](https://img.shields.io/badge/spring-%236DB33F.svg?style=for-the-badge&logo=spring&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

[![View Prototype](https://img.shields.io/badge/Figma-View_Prototype-blue?logo=figma)](https://www.figma.com/design/B2MNp68y6sKgQSwsArxlus/Smiling-Wallet?node-id=97-1215&t=302ufsRLVs2xKkvX-1)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [User Flows](#2-user-flows)
   - [Patient Flow](#patient-flow)
   - [Doctor Flow](#doctor-flow)
3. [Feature List](#3-feature-list)
4. [Tech Stack](#4-tech-stack)
5. [Architecture](#5-architecture)
6. [Database Schema](#6-database-schema)
7. [API Reference](#7-api-reference)
8. [Getting Started](#8-getting-started)
9. [Environment Variables](#9-environment-variables)
10. [Payment Model](#10-payment-model)
11. [Roadmap](#11-roadmap)
12. [GitHub Tickets (TODO)](#12-github-tickets-todo)
13. [Suggested Improvements](#13-suggested-improvements)

---

## 1. Project Overview

**Smiling Wallet** is a dental-tourism platform that connects patients traveling abroad for dental treatment with local clinics. The core value proposition is price transparency and anonymity: a patient describes their procedure needs and target city without revealing personal details, dentists in that city compete by submitting price offers, and only after the patient accepts an offer and pays a small connection fee are both parties' real contact details exchanged.

### Why it exists

Dental tourism is a $10B+ global market driven by large price differentials between countries. Patients often struggle to get reliable upfront pricing and trustworthy clinic reviews. Smiling Wallet solves this by:

- Letting patients compare real, committed offers before paying anything significant.
- Keeping patients anonymous until they choose, preventing spam and pressure tactics.
- Charging clinics nothing to participate — revenue comes from small patient-side fees, aligning platform incentives with patient choice.

### MVP Scope

The MVP is **dental procedures only**. The architecture supports expansion to other medical specialties in the future via the `DentalSpecialty` enum and specialty-based filtering.

---

## 2. User Flows

### Patient Flow

```
Register / Login
       │
       ▼
 Pay $1 Processing Fee  ──────────────────────────────────────────────────┐
       │                                                                   │
       ▼                                                                   │
Submit Procedure Request                                                   │
  • Procedure type / specialty                                             │
  • Description of work needed                                            │
  • Preferred city                                                         │
  • Budget (optional)                                                      │
  • Preferred dates (optional)                                             │
       │                                                                   │
       ▼                                                                   │
  Request broadcast to all dentists in the specified city                 │
       │                                                                   │
       ▼                                                                   │
View Incoming Offers (anonymous dentists)                                 │
  • Offered price                                                          │
  • Estimated wait days                                                    │
  • Included extras (X-ray, anaesthesia, etc.)                            │
  • Doctor's note / additional charges                                    │
  • Clinic rating                                                          │
       │                                                                   │
       ├──[Request alternative time/day]──▶ Doctor reviews & approves ───┤
       │                                                                   │
       ▼                                                                   │
 Accept Offer                                                             │
       │                                                                   │
       ▼                                                                   │
 Pay Connection Fee (1% of accepted offer price)                         │
       │                                                                   │
       ▼                                                                   │
 Redirected to "My Appointments"                                          │
  • Doctor's real name, clinic address, phone revealed                    │
  • In-app secure chat with doctor                                        │
  • View appointment details                                              │
  • Sync to Google Calendar                                               │
       │                                                                   │
       ▼                                                                   │
 Post-Appointment: Rate & Review Doctor  ◄────────────────────────────────┘
```

### Doctor Flow

```
Register / Login (DENTIST role)
       │
       ▼
Review Patient Requests (anonymous patients)
  • Specialty filter
  • City filter
  • Budget range
       │
       ▼
Submit Offer on a Request
  • Price quote
  • Estimated wait days
  • Optional note (extra charges, inclusions)
  • Proposed appointment date/time
       │
       ▼
Offers Dashboard
  • All submitted offers with live status (PENDING / ACCEPTED / DECLINED)
  • Real-time status updates via WebSocket
       │
       ├──[Patient requests alternative time]──▶ Review & approve/decline
       │
       ▼
Offer Accepted
  • Patient contact details revealed
  • Appointment added to in-app calendar
  • One-click: sync to Google Calendar
       │
       ▼
In-app Chat with Patient
       │
       ▼
Appointment Completed ──▶ Receive public review/rating
```

---

## 3. Feature List

### Authentication & Security

| Feature | Status |
|---|---|
| Email/password registration & login | ✅ Done |
| JWT access + refresh token flow | ✅ Done |
| 30-minute inactivity auto-logout | ✅ Done |
| Silent token refresh via Axios interceptor | ✅ Done |
| Password reset via email link | ✅ Done |
| Role-based access control (PATIENT / DENTIST / ADMIN) | ✅ Done |
| Google OAuth 2.0 login | ⬜ TODO |
| Two-factor authentication (2FA) via TOTP | ⬜ TODO |
| BCrypt password hashing | ✅ Done |
| RSA-signed JWTs (RS256) | ✅ Done |
| SSL/TLS (HTTPS) | ✅ Done |

### Patient Features

| Feature | Status |
|---|---|
| Submit dental procedure request | ✅ Done |
| Attach X-ray / dental documents (Cloudinary) | ✅ Done |
| View incoming offers (anonymous dentists) | ✅ Done |
| Filter & sort offers (price, rating, wait time) | ✅ Done |
| Request alternative appointment time/day | ⬜ TODO |
| Accept offer and pay connection fee | ⬜ TODO (payment) |
| View "My Appointments" with revealed doctor info | ✅ Done (partial) |
| In-app secure chat with doctor post-booking | ✅ Done |
| Sync appointment to Google Calendar | ⬜ TODO |
| Rate & review doctor after appointment | ⬜ TODO |
| Profile management (name, phone, city, address) | ✅ Done |

### Doctor Features

| Feature | Status |
|---|---|
| View patient requests (anonymous) with filters | ✅ Done |
| Submit price offer on a request | ✅ Done |
| Offer management dashboard (status tracking) | ✅ Done |
| Review & approve patient reschedule requests | ⬜ TODO |
| View accepted appointments calendar | ✅ Done (partial) |
| Sync appointments to Google Calendar | ⬜ TODO |
| In-app chat with patient after booking | ✅ Done |
| View own ratings & reviews | ⬜ TODO |
| Profile management (specialty, city, rating) | ✅ Done |

### Platform Features

| Feature | Status |
|---|---|
| Real-time notifications via WebSocket (STOMP) | ✅ Done |
| Redis pub/sub for cross-instance WebSocket | ✅ Done |
| Anonymous marketplace (UUID-based IDs until acceptance) | ✅ Done |
| Offer analytics & price benchmarking for patients | ✅ Done |
| Flyway database migrations | ✅ Done |
| Swagger / OpenAPI documentation | ✅ Done |
| Docker Compose deployment | ✅ Done |
| Fake data seeder (dev/testing) | ✅ Done |
| $1 processing fee on request creation | ⬜ TODO (payment) |
| Admin panel (user management, disputes, analytics) | ⬜ TODO |
| SMS / email appointment reminders | ⬜ TODO |
| Mobile app (React Native) | ⬜ Future |

---

## 4. Tech Stack

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Java | 21 | Language |
| Spring Boot | 4.0.4 | Application framework |
| Spring Security | bundled | Auth, CORS, method security |
| Spring Data JPA | bundled | ORM / DB access |
| Spring WebSocket | bundled | Real-time STOMP messaging |
| PostgreSQL | 15 | Primary database |
| Redis | 7 | Chat message store + WebSocket pub/sub |
| Flyway | bundled | Database schema migrations |
| JJWT | 0.12.6 | JWT generation & validation (RS256) |
| Springdoc OpenAPI | 2.8.8 | Swagger UI & API docs |
| Spring Mail | bundled | Transactional emails (Gmail SMTP) |
| Lombok | latest | Boilerplate reduction |

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 18.2.0 | UI framework |
| TypeScript | 5.0 | Type safety |
| Vite | 8.0.9 | Build tool & dev server |
| Tailwind CSS | latest | Utility-first styling |
| Axios | 1.15.1 | HTTP client with interceptors |
| @stomp/stompjs | 7.3.0 | WebSocket/STOMP client |
| sockjs-client | 1.6.1 | WebSocket transport fallback |
| Vitest | 4.1.4 | Unit & component tests |
| Playwright | latest | End-to-end tests |

### Infrastructure

| Technology | Purpose |
|---|---|
| Docker & Docker Compose | Containerised local dev & deployment |
| Cloudinary | Patient file uploads (X-rays, documents) |
| Gmail SMTP | Transactional email |

---

## 5. Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                     React + TypeScript (SPA)                      │
│                  Vite · Tailwind CSS · Axios                      │
│               @stomp/stompjs · SockJS · Vitest                   │
│                      (Deployed: Vercel)                           │
└───────────┬──────────────────────────────────────────────────────┘
            │  HTTPS REST + WSS (STOMP)
┌───────────▼──────────────────────────────────────────────────────┐
│                   Spring Boot 4 (Java 21)                        │
│                                                                   │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐              │
│  │ Controllers│  │  Services   │  │   Security   │              │
│  │ /api/auth  │  │ AuthService │  │ JwtFilter    │              │
│  │ /api/req.. │  │ OfferService│  │ SecurityCfg  │              │
│  │ /api/offer │  │ ChatService │  │ @PreAuthorize│              │
│  │ /api/chat  │  │ NotifService│  └──────────────┘              │
│  │ /api/dash. │  │ EmailService│                                  │
│  └────────────┘  └─────────────┘                                 │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │              WebSocket Broker (STOMP)                   │     │
│  │   /ws-smiling-wallet  ·  /topic/...  ·  /app/...       │     │
│  └─────────────────────────────────────────────────────────┘     │
│                         (Deployed: Docker)                        │
└───────┬───────────────────────┬──────────────────┬───────────────┘
        │                       │                  │
┌───────▼──────┐   ┌────────────▼──────┐  ┌───────▼────────┐
│  PostgreSQL  │   │      Redis        │  │   Cloudinary   │
│              │   │  Chat messages    │  │  File uploads  │
│  Core data   │   │  WS pub/sub       │  │  (X-rays etc.) │
│  Flyway mig. │   │                   │  │                │
└──────────────┘   └───────────────────┘  └────────────────┘
```

### Key Architectural Decisions

| Decision | Rationale |
|---|---|
| UUID-based public IDs | Patients and doctors never see each other's real IDs until offer acceptance — prevents data leaking |
| JWT RS256 (asymmetric) | Public key can be shared with external services without exposing the signing key |
| Redis for chat | Chat history doesn't need ACID guarantees; Redis gives sub-millisecond reads |
| Flyway migrations | Schema changes are versioned and reproducible across all environments |
| STOMP over raw WebSocket | STOMP adds message routing, acknowledgement, and subscription semantics on top of raw WS |
| Axios interceptors for refresh | Silent refresh keeps users logged in without any UX interruption on token expiry |

---

## 6. Database Schema

```sql
users
├── id            UUID  PK
├── email         VARCHAR(255)  UNIQUE
├── username      VARCHAR(100)
├── password      VARCHAR  (BCrypt hash)
├── phone         VARCHAR(20)
├── city          VARCHAR(100)
├── address       VARCHAR(255)
├── rating        DOUBLE          -- dentists only, avg from reviews
├── specialty     VARCHAR(50)     -- DentalSpecialty enum, dentists only
├── role          VARCHAR(20)     -- PATIENT | DENTIST | ADMIN
└── created_at    TIMESTAMP

dental_requests
├── id                UUID  PK
├── patient_public_id UUID  FK → users.id
├── description       TEXT
├── preferred_city    VARCHAR(100)
├── budget_max        DECIMAL
├── specialty         VARCHAR(50)   -- DentalSpecialty enum
├── status            VARCHAR(20)   -- OPEN | CLOSED
├── created_at        TIMESTAMP
└── updated_at        TIMESTAMP

offers
├── id                    UUID  PK
├── request_id            UUID  FK → dental_requests.id
├── dentist_public_id     UUID  FK → users.id
├── price                 DECIMAL
├── estimated_wait_days   INT
├── notes                 TEXT
├── includes_xray         BOOLEAN
├── includes_anesthesia   BOOLEAN
├── status                VARCHAR(20)   -- PENDING | ACCEPTED | DECLINED
├── created_at            TIMESTAMP
└── updated_at            TIMESTAMP

appointments
├── id                UUID  PK
├── offer_id          UUID  FK → offers.id
├── patient_public_id UUID  FK → users.id
├── dentist_public_id UUID  FK → users.id
├── scheduled_at      TIMESTAMP
├── confirmed_price   DECIMAL
├── status            VARCHAR(20)   -- PENDING | CONFIRMED | CANCELLED | COMPLETED
└── created_at        TIMESTAMP

notifications
├── id            UUID  PK
├── recipient_id  UUID  FK → users.id
├── payload       JSONB
├── is_read       BOOLEAN
├── type          VARCHAR(50)   -- NotificationType enum
└── created_at    TIMESTAMP

refresh_tokens
├── id          UUID  PK
├── user_id     UUID  FK → users.id
├── token       TEXT  UNIQUE
└── expires_at  TIMESTAMP

password_reset_tokens
├── id          UUID  PK
├── user_id     UUID  FK → users.id
├── token       TEXT  UNIQUE
└── expires_at  TIMESTAMP
```

**Planned additions (via new Flyway migrations):**

```sql
-- V5: Reviews
reviews
├── id              UUID  PK
├── appointment_id  UUID  FK → appointments.id
├── patient_id      UUID  FK → users.id
├── dentist_id      UUID  FK → users.id
├── rating          INT   CHECK (1..5)
├── comment         TEXT
└── created_at      TIMESTAMP

-- V6: Reschedule requests
reschedule_requests
├── id              UUID  PK
├── offer_id        UUID  FK → offers.id
├── proposed_at     TIMESTAMP
├── patient_note    TEXT
├── status          VARCHAR(20)   -- PENDING | APPROVED | DECLINED
└── created_at      TIMESTAMP
```

---

## 7. API Reference

Full interactive docs available at `https://localhost:8080/swagger-ui.html` when the backend is running.

### Authentication — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Register patient or dentist |
| POST | `/login` | — | Login, returns access + refresh tokens |
| POST | `/refresh` | — | Exchange refresh token for new access token |
| POST | `/logout` | Bearer | Invalidate session |
| POST | `/forgot-password` | — | Send password-reset email |
| POST | `/reset-password` | — | Reset password with token |
| GET | `/user/{userId}` | Bearer | Get user profile |
| PUT | `/user/{userId}` | Bearer | Update profile |
| DELETE | `/user/{userId}` | Bearer | Delete account |

### Requests — `/api/requests`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | PATIENT | Create a dental request |
| GET | `/` | DENTIST | Browse all open requests (paginated, filterable) |
| GET | `/patient/{patientId}` | PATIENT | My requests |
| GET | `/{id}` | Bearer | Request detail |
| PUT | `/{id}` | PATIENT | Update request |
| PATCH | `/{id}/close` | PATIENT | Close request |
| DELETE | `/{id}` | PATIENT | Delete request |

### Offers — `/api/offers`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | DENTIST | Submit offer on a request |
| GET | `/{offerId}` | Bearer | Offer detail |
| GET | `/request/{requestId}` | PATIENT | All offers for a request (paginated) |
| GET | `/dentist/{dentistId}` | DENTIST | My sent offers (paginated) |
| PATCH | `/{offerId}/accepted` | PATIENT | Accept offer → creates appointment |

### Chat — `/api/chat` + WebSocket

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/chat/{appointmentId}/history` | Bearer | Load chat history (REST) |
| WS SEND | `/app/chat.send` | WS Session | Send a message |
| WS SUB | `/topic/chat/{appointmentId}` | WS Session | Receive messages |

### Dashboard — `/api/dashboard`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | DENTIST / ADMIN | Analytics, offer statistics |

### WebSocket Connection

```
wss://localhost:8080/ws-smiling-wallet
  └── SockJS fallback enabled
  └── Authenticate: pass JWT as query param or Authorization header on connect
```

---

## 8. Getting Started

### Prerequisites

- [Docker & Docker Compose](https://docs.docker.com/get-docker/) v24+
- [Node.js](https://nodejs.org/) 18+
- [Java 21](https://adoptium.net/) (only for local backend development without Docker)

### Run with Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-username/smiling-wallet.git
cd smiling-wallet

# Copy and fill in environment variables
cp .env.example .env
# Edit .env with your values (see Environment Variables section)

# Start PostgreSQL + Redis + Spring Boot backend
docker compose up --build

# The API is now available at https://localhost:8080
# Swagger UI: https://localhost:8080/swagger-ui.html
```

### Run the Frontend

```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:5173
```

### Run Tests

```bash
# Backend unit tests
./mvnw test

# Frontend unit tests
cd frontend && npm run test

# Frontend E2E tests (requires dev server running)
cd frontend && npm run test:e2e
```

### Seed Fake Data (Development)

```bash
# POST to the generator endpoint after the server is up
curl -X POST https://localhost:8080/api/generate/fake-data -k
```

---

## 9. Environment Variables

### Backend (`application.yml` / Docker environment)

| Variable | Description | Example |
|---|---|---|
| `SPRING_DATASOURCE_URL` | PostgreSQL JDBC URL | `jdbc:postgresql://db:5432/smiling_wallet` |
| `SPRING_DATASOURCE_USERNAME` | DB username | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | DB password | `secret` |
| `SPRING_DATA_REDIS_HOST` | Redis hostname | `redis` |
| `SPRING_DATA_REDIS_PORT` | Redis port | `6379` |
| `APP_JWT_PRIVATE_KEY` | RSA private key for JWT signing | PEM string |
| `APP_JWT_PUBLIC_KEY` | RSA public key for JWT verification | PEM string |
| `APP_JWT_ACCESS_EXPIRATION` | Access token TTL (ms) | `900000` (15 min) |
| `APP_JWT_REFRESH_EXPIRATION` | Refresh token TTL (ms) | `604800000` (7 days) |
| `SPRING_MAIL_USERNAME` | Gmail address for outgoing mail | `noreply@example.com` |
| `SPRING_MAIL_PASSWORD` | Gmail app password | `xxxx xxxx xxxx xxxx` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your-cloud` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abc123` |
| `APP_CORS_ALLOWED_ORIGINS` | Allowed frontend origins | `http://localhost:5173` |
| `STRIPE_SECRET_KEY` | Stripe secret key *(future)* | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret *(future)* | `whsec_...` |

### Frontend (`.env` in `/frontend`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `https://localhost:8080` |
| `VITE_WS_URL` | WebSocket endpoint | `https://localhost:8080/ws-smiling-wallet` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID *(future)* | `xxx.apps.googleusercontent.com` |

---

## 10. Payment Model

The platform uses a two-step fee model. Payments are **mocked in the current MVP** — Stripe integration is planned for a future milestone.

### Fee 1 — Request Processing Fee: **$1.00**

- Charged to the **patient** when they submit a dental procedure request.
- Purpose: Prevents spam requests; covers platform operational cost.
- Timing: Collected before the request is broadcast to dentists.
- Refund policy (proposed): Refunded if no offers are received within 7 days.

### Fee 2 — Connection Fee: **1% of accepted offer price**

- Charged to the **patient** when they accept a doctor's offer.
- Purpose: Platform revenue; unlocks real contact details for both parties.
- Example: Offer price = $800 → Connection fee = $8.00.
- Timing: Collected before the appointment is confirmed.
- Non-refundable once doctor contact details are revealed.

### Future Payment Implementation (Stripe)

```
Patient submits request
       │
       ▼
Stripe Payment Intent created ($1.00)
       │
       ▼
Patient completes payment in frontend (Stripe Elements)
       │
       ▼
Stripe webhook → backend confirms → request published to dentists

─── [ Offer accepted ] ───

Backend calculates 1% of offer.price
       │
       ▼
Stripe Payment Intent created (dynamic amount)
       │
       ▼
Patient completes payment
       │
       ▼
Stripe webhook → backend confirms → appointment created, details revealed
```

---

## 11. Roadmap

### Milestone 1 — MVP Core *(In Progress)*

- [x] Email/password auth (JWT + refresh)
- [x] Role-based access (PATIENT / DENTIST / ADMIN)
- [x] Anonymous request/offer marketplace
- [x] Real-time WebSocket notifications
- [x] In-app chat (patient ↔ doctor, post-booking)
- [x] Offer analytics dashboard
- [x] File uploads (X-rays, documents)
- [ ] Google OAuth login
- [ ] Patient reschedule request flow (doctor approves)
- [ ] Offer acceptance → appointment creation (full E2E)

### Milestone 2 — Payments

- [ ] Stripe integration — $1 processing fee on request
- [ ] Stripe integration — 1% connection fee on offer acceptance
- [ ] Stripe webhooks for async payment confirmation
- [ ] Payment history page (patient)
- [ ] Refund flow for no-offer requests

### Milestone 3 — Google Integrations

- [ ] Google OAuth 2.0 login (patient + doctor)
- [ ] Google Calendar sync for patients (appointment events)
- [ ] Google Calendar sync for doctors (appointment events)

### Milestone 4 — Profile & Security

- [ ] 2FA via TOTP (Google Authenticator / Authy)
- [ ] Full profile completion (patient: full name, insurance, medical notes)
- [ ] Profile completion prompt/checklist on first login

### Milestone 5 — Reviews & Ratings

- [ ] Post-appointment review form (patient → doctor)
- [ ] Star rating (1–5) + text comment
- [ ] Doctor rating recalculation on each new review
- [ ] Display reviews on anonymous doctor offers (aggregate rating only)

### Milestone 6 — Admin Panel

- [ ] Admin user management (activate / suspend accounts)
- [ ] Platform analytics dashboard (requests, offers, revenue, conversions)
- [ ] Dispute resolution interface
- [ ] Content moderation (flag inappropriate request descriptions)

### Milestone 7 — Notifications & Reminders

- [ ] Email reminders 24h and 1h before appointment (SendGrid / SES)
- [ ] SMS reminders via Twilio
- [ ] Push notifications (PWA / FCM)

### Future — Mobile App

- [ ] React Native mobile app (shared backend)
- [ ] Biometric login (Face ID / fingerprint)
- [ ] Push notifications (APNs + FCM)

---

## 12. GitHub Tickets (TODO)

> Copy each block below as a GitHub Issue. Labels and milestones map to the roadmap above.

---

### Issue #1: Google OAuth 2.0 Login

**Labels:** `auth` `backend` `frontend` `milestone-1`
**Priority:** High

**Description:**
Allow patients and doctors to register and log in using their Google account instead of (or in addition to) email/password. On first Google login, the account role must be selected.

**Acceptance Criteria:**
- [ ] Google OAuth consent screen configured in Google Cloud Console
- [ ] Spring Security OAuth2 client configured (`spring-boot-starter-oauth2-client`)
- [ ] Backend endpoint `GET /api/auth/oauth2/google` initiates OAuth flow
- [ ] On callback, create user if not exists; issue JWT as normal
- [ ] Frontend has "Continue with Google" button on Login and Register pages
- [ ] User role selection modal shown on first-ever Google login
- [ ] Existing email/password accounts can link their Google account in Profile settings

**Technical Notes:**
- Store `google_subject_id` on the `users` table (new Flyway migration)
- Handle the case where a Google email matches an existing email/password account — offer account linking, not duplicate creation

---

### Issue #2: Patient Reschedule Request Flow

**Labels:** `feature` `patient` `doctor` `backend` `frontend` `milestone-1`
**Priority:** High

**Description:**
After receiving an offer, the patient can propose an alternative appointment date/time. The doctor then approves or declines the proposal before the booking is finalized.

**Acceptance Criteria:**
- [ ] Patient can click "Request different time" on any PENDING offer
- [ ] A date/time picker modal lets the patient propose a new slot and add a note
- [ ] POST `/api/reschedule-requests` creates a `reschedule_requests` record (status: PENDING)
- [ ] Doctor is notified via WebSocket and sees the proposal in their Offers Dashboard
- [ ] Doctor can APPROVE or DECLINE the reschedule request
- [ ] On APPROVE: offer `scheduled_at` is updated to the proposed time; patient notified
- [ ] On DECLINE: original time stands; patient notified with a reason (optional)
- [ ] Patient cannot accept the offer until a pending reschedule request is resolved

**Technical Notes:**
- New Flyway migration `V5__reschedule_requests.sql`
- New `RescheduleRequest` entity, repository, service, controller
- Add `scheduled_at` field to `offers` table if not already present

---

### Issue #3: Stripe — $1 Processing Fee on Request Creation

**Labels:** `payments` `backend` `frontend` `milestone-2`
**Priority:** High

**Description:**
Before a patient's dental request is broadcast to doctors, they must pay a $1 processing fee via Stripe.

**Acceptance Criteria:**
- [ ] `stripe-java` SDK added to `pom.xml`
- [ ] `POST /api/payments/request-fee/intent` creates a Stripe PaymentIntent for $1.00
- [ ] Frontend "Send Request" form shows a Stripe Elements payment widget before submission
- [ ] On successful payment, backend confirms via Stripe webhook and publishes the request
- [ ] Request stays in `DRAFT` status until payment confirmed; switches to `OPEN` after
- [ ] Stripe webhook endpoint `POST /api/webhooks/stripe` handles `payment_intent.succeeded`
- [ ] Payment record stored in DB (amount, stripe_payment_id, status, created_at)
- [ ] Refund issued automatically if no offers received within 7 days (scheduled job)

**Technical Notes:**
- New `payments` table via Flyway migration
- Use `idempotency keys` on Stripe API calls to handle retries safely
- Webhook signature verification is mandatory — never trust the payload without verifying `Stripe-Signature` header

---

### Issue #4: Stripe — 1% Connection Fee on Offer Acceptance

**Labels:** `payments` `backend` `frontend` `milestone-2`
**Priority:** High

**Description:**
When a patient accepts an offer, they must pay 1% of the accepted price as a connection fee. Doctor contact details are only revealed after successful payment.

**Acceptance Criteria:**
- [ ] `POST /api/payments/connection-fee/intent` creates a Stripe PaymentIntent for `offer.price * 0.01`
- [ ] Accepting an offer in the UI triggers a payment modal before the appointment is created
- [ ] Appointment is only created (and doctor details revealed) after `payment_intent.succeeded` webhook
- [ ] Connection fee is non-refundable once doctor details are shown
- [ ] Minimum connection fee floor: $0.50 (Stripe minimum charge)
- [ ] Patient sees fee amount clearly in the confirmation modal ("You will be charged $X.XX")

---

### Issue #5: Google Calendar Sync — Patient

**Labels:** `integration` `google-calendar` `patient` `frontend` `backend` `milestone-3`
**Priority:** Medium

**Description:**
After an appointment is confirmed, the patient can add it to their Google Calendar with one click.

**Acceptance Criteria:**
- [ ] "Add to Google Calendar" button on the Appointment detail page
- [ ] Clicking it opens Google OAuth consent for `calendar.events` scope
- [ ] Backend endpoint `POST /api/calendar/patient/{appointmentId}/sync` creates a Google Calendar event
- [ ] Event includes: title ("Dental Appointment — [specialty]"), location (clinic address), start/end time, doctor name and phone in description
- [ ] Success toast shown; button changes to "View in Google Calendar" (deep link)
- [ ] If patient revokes calendar access, gracefully degrade — don't crash

---

### Issue #6: Google Calendar Sync — Doctor

**Labels:** `integration` `google-calendar` `doctor` `frontend` `backend` `milestone-3`
**Priority:** Medium

**Description:**
Accepted appointments are shown in a doctor's in-app calendar. The doctor can sync any appointment to their personal Google Calendar.

**Acceptance Criteria:**
- [ ] In-app calendar view (monthly/weekly) on the Doctor Dashboard showing confirmed appointments
- [ ] "Sync to Google Calendar" button per appointment
- [ ] Backend creates Google Calendar event (patient first name + procedure, start/end, location)
- [ ] Patient's full name is revealed in the calendar event (post-acceptance)
- [ ] Synced events update automatically if the appointment time changes

---

### Issue #7: Two-Factor Authentication (2FA)

**Labels:** `auth` `security` `backend` `frontend` `milestone-4`
**Priority:** Medium

**Description:**
Users can optionally enable TOTP-based 2FA (Google Authenticator, Authy) from their profile settings.

**Acceptance Criteria:**
- [ ] "Security" section in user profile with "Enable 2FA" toggle
- [ ] On enable: backend generates TOTP secret, returns QR code image to frontend
- [ ] User scans QR code and enters 6-digit code to confirm setup
- [ ] 2FA secret stored (encrypted) on the `users` table
- [ ] Login flow: after password check, if 2FA enabled, frontend shows TOTP input modal
- [ ] Backend validates TOTP code with a 30-second window tolerance
- [ ] Backup codes (8 × 8-char alphanumeric) generated on setup, displayed once
- [ ] "Disable 2FA" requires TOTP confirmation before disabling
- [ ] `users` table: add `totp_secret VARCHAR`, `totp_enabled BOOLEAN`, `backup_codes TEXT[]`

**Technical Notes:**
- Library: `com.warrenstrange:googleauth` or `dev.samstevens.totp:totp-spring-boot-starter`
- Encrypt `totp_secret` at rest using AES-256 with an app-level key

---

### Issue #8: Post-Appointment Reviews & Ratings

**Labels:** `feature` `reviews` `patient` `doctor` `backend` `frontend` `milestone-5`
**Priority:** Medium

**Description:**
After an appointment is marked COMPLETED, the patient can leave a 1–5 star rating and optional text review for the doctor. The doctor's aggregate rating is recalculated and displayed on future anonymous offers.

**Acceptance Criteria:**
- [ ] Appointment is marked COMPLETED by the doctor (new PATCH endpoint)
- [ ] 24h after COMPLETED status, patient receives an email prompting a review
- [ ] `POST /api/reviews` creates a review (one per appointment, patient only)
- [ ] Reviews are stored in a `reviews` table (Flyway V5 migration)
- [ ] `GET /api/doctors/{doctorId}/reviews` returns paginated reviews
- [ ] Doctor's `rating` field auto-updated via DB trigger or service on each new review
- [ ] Anonymous offer cards show aggregate star rating (not individual reviews)
- [ ] Accepted appointment page shows full review history for the specific doctor
- [ ] A patient cannot review the same appointment twice

---

### Issue #9: Admin Panel — User Management

**Labels:** `admin` `backend` `frontend` `milestone-6`
**Priority:** Medium

**Description:**
Admins need a UI to manage users, view platform statistics, and handle disputes.

**Acceptance Criteria:**
- [ ] `/admin` route, accessible only to `ADMIN` role
- [ ] User list with search by email / name / role, sortable by date
- [ ] Activate / suspend user accounts (`PUT /api/admin/users/{id}/status`)
- [ ] View any user's profile, requests, and offers
- [ ] Platform stats overview: total users, total requests, total offers, conversion rate, total revenue
- [ ] Dispute queue: flag system where either party can report an issue; admin resolves
- [ ] All admin actions logged with timestamp and admin ID

---

### Issue #10: Email & SMS Appointment Reminders

**Labels:** `notifications` `email` `sms` `backend` `milestone-7`
**Priority:** Medium

**Description:**
Send automated reminders before upcoming appointments.

**Acceptance Criteria:**
- [ ] Scheduled job (Spring `@Scheduled`) runs every 15 minutes
- [ ] Email reminder sent to patient and doctor 24h before appointment
- [ ] SMS reminder via Twilio sent 1h before appointment (opt-in, phone number required)
- [ ] Reminder content: appointment date/time, clinic address, doctor name (patient), patient first name (doctor)
- [ ] Users can opt out of email reminders in Profile > Notification Settings
- [ ] Users can opt out of SMS reminders in Profile > Notification Settings
- [ ] No double-send: track sent reminders in a `reminder_logs` table

---

### Issue #11: Profile Completion Flow

**Labels:** `ux` `patient` `doctor` `frontend` `backend` `milestone-4`
**Priority:** Low

**Description:**
After first login, prompt users to complete their profile. Incomplete profiles should be nudged with a banner and a progress indicator.

**Acceptance Criteria:**
- [ ] `profile_completion_pct` calculated server-side (required fields: phone, city, address + specialty for doctors)
- [ ] Banner shown on Dashboard if completion < 100%
- [ ] Clicking the banner opens the Profile page with unfilled fields highlighted
- [ ] Doctors without a specialty set cannot send offers (validation error)
- [ ] Patients without a city set cannot submit requests (validation error with helpful message)

---

### Issue #12: Offer Detail — Full Cost Breakdown UI

**Labels:** `ux` `frontend` `milestone-1`
**Priority:** Low

**Description:**
The offer cards shown to patients need a clear, scannable cost breakdown so they can make informed decisions.

**Acceptance Criteria:**
- [ ] Offer card shows: base price, included extras (X-ray ✓/✗, anaesthesia ✓/✗), doctor rating, estimated wait days
- [ ] "Connection fee" preview shown: "Accepting this offer will charge you $X.XX"
- [ ] Savings badge when offer is below patient's stated budget
- [ ] "Best value" badge on the statistically cheapest offer
- [ ] Sorting options: lowest price, highest rating, fastest wait, most inclusive

---

### Issue #13: Appointment Status Lifecycle

**Labels:** `backend` `frontend` `milestone-1`
**Priority:** High

**Description:**
The full appointment status lifecycle needs to be implemented end-to-end: PENDING → CONFIRMED → COMPLETED / CANCELLED.

**Acceptance Criteria:**
- [ ] `PATCH /api/appointments/{id}/confirm` — doctor confirms (PENDING → CONFIRMED)
- [ ] `PATCH /api/appointments/{id}/complete` — doctor marks complete (CONFIRMED → COMPLETED)
- [ ] `PATCH /api/appointments/{id}/cancel` — either party can cancel with a reason
- [ ] Status change triggers WebSocket notification to the other party
- [ ] Appointment card in "My Appointments" shows current status with a progress stepper
- [ ] Cancelled appointments show the cancellation reason and party

---

### Issue #14: React Native Mobile App

**Labels:** `mobile` `future`
**Priority:** Low (Future)

**Description:**
Build a React Native mobile app that consumes the same REST + WebSocket backend.

**Acceptance Criteria:**
- [ ] iOS and Android targets
- [ ] Secure token storage using `expo-secure-store`
- [ ] Biometric authentication (Face ID / fingerprint) as 2FA alternative
- [ ] Push notifications via Expo Notifications + FCM/APNs
- [ ] Full patient and doctor flows implemented
- [ ] Google Calendar integration via native calendar APIs

---

## 13. Suggested Improvements

### 1. Rate Limiting & DDoS Protection

Add Spring's rate-limiting or integrate a gateway (Nginx / Traefik) to prevent offer-spam and brute-force login attacks. Even a simple `bucket4j` in-memory limiter per IP would significantly reduce abuse risk for the MVP.

### 2. Appointment Geolocation

Store clinic coordinates (lat/lng) and let patients search by radius ("within 20 km of Bucharest city centre") using PostGIS. This becomes a critical differentiator for patients who are visiting a city and need a clinic within walking distance of their hotel.

### 3. Offer Expiry

Offers should auto-expire (e.g. 72 hours after submission). Stale PENDING offers create a poor UX for both sides. Add an `expires_at` field to `offers` and a scheduled cleanup job that sets expired offers to `DECLINED`.

### 4. Anonymized Chat Before Acceptance

Allow limited, anonymized in-app messaging between a patient and a dentist before offer acceptance. This lets patients ask clarifying questions without revealing identity. Messages should be stripped of any PII (email, phone) using a simple regex filter before storage.

### 5. Price Negotiation Counter-Offer

Rather than a binary accept/decline, allow the patient to propose a counter-price on an offer. This turns the marketplace into a lightweight negotiation and can increase conversion rates.

### 6. Multi-Language Support (i18n)

Medical tourism by definition involves international patients. Add `react-i18next` on the frontend and language-tagged email templates on the backend. Prioritize Romanian, English, and German for the initial dental-tourism corridor.

### 7. Document Security

Currently X-rays are stored on Cloudinary with signed URLs. Consider adding end-to-end encryption for sensitive medical documents — encrypt before upload, decrypt on download with a key derived from the patient's session. This exceeds GDPR requirements and is a strong trust signal.

### 8. Doctor Verification Badge

Add a manual or semi-automated doctor credential verification step. Doctors upload their license number and a scan; an admin approves. Verified doctors get a badge on their offers, increasing patient trust and conversion.

### 9. Waitlist / Demand Signal

If all offers are declined or the request closes without acceptance, let the patient "re-open" the request with a higher budget. Aggregate closed-without-match data to identify underserved specialties or cities.

### 10. Progressive Web App (PWA)

Add a service worker and web app manifest to the React frontend. PWA support gives mobile users an installable, offline-capable app experience without the overhead of a full React Native build. This is a low-effort intermediate step before the full mobile milestone.

---

*Last updated: 2026-05-21*
*Architecture version: MVP 1.0*
