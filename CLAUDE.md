# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

SmillingWallet is a two-sided dental marketplace. **Patients** submit treatment requests; **Dentists** browse them and send price offers. When a patient accepts an offer, an appointment is created. Both sides can chat in real-time via WebSocket once an appointment exists. There is also an **Admin** role with access to all views.

## Running the app

Two terminals required. PostgreSQL (port 5432, db `smilingwallet`) and Redis (port 6379) must be running first.

**Backend** (from project root):
```bash
./mvnw spring-boot:run
# runs on https://localhost:8080 (SSL enabled with keystore in repo)
```

**Frontend** (from `src/frontend/`):
```bash
npm run dev
# runs on http://localhost:5173, proxied to backend via Vite
```

**Backend tests** (unit tests, Mockito, no DB required):
```bash
./mvnw test
# run a single test class:
./mvnw test -Dtest=AuthServiceTest
./mvnw test -Dtest=RequestServiceTest
```

**Frontend tests/lint:**
```bash
cd src/frontend
npm run test       # Vitest unit tests
npm run lint       # ESLint
npm run build      # tsc + Vite build (catches type errors)
```

## Architecture

### Backend — Spring Boot 4 / Java

**Package layout:** `src/main/java/backend/`
- `config/` — `SecurityConfig`, `JwtAuthenticationFilter`, `JwtProperties`, `JacksonConfig`
- `controller/` — one controller per domain + `GlobalExceptionHandler`
- `service/` — business logic; `service/tests/` holds unit tests (Mockito, not integration tests)
- `dto/` — request/response DTOs with Bean Validation annotations
- `model/` — JPA entities
- `repository/` — Spring Data JPA interfaces
- `enums/` — `Role`, `DentalSpecialty`, `OfferStatus`, `RequestStatus`, `AppointmentStatus`, `NotificationType`
- `exception/` — `ResourceNotFoundException` (404), `ConflictException` (409), `UnprocessableEntityException` (422)
- `util/` — `ProfileCompletion.calculate(User)` returns `ProfileCompletionResult(pct, missingFields)`

**Auth flow:** JWT access token (15 min) + opaque refresh token (7 days, stored in DB). The JWT carries `userId` as subject and `role` as a claim. `JwtAuthenticationFilter` skips only the five public `/api/auth/*` endpoints; all other paths including `/api/auth/user/**` go through token validation.

**Security roles:** Spring Security authority strings are `ROLE_PATIENT`, `ROLE_DENTIST`, `ROLE_ADMIN`. The JWT stores bare role strings (`PATIENT` etc.); the filter prepends `ROLE_`.

**Database:** PostgreSQL with Flyway migrations in `src/main/resources/db/migration/`. Schema: `users`, `dental_requests`, `offers`, `appointments`, `notifications`, `refresh_tokens`, `password_reset_tokens`. `ddl-auto: validate` — Hibernate never modifies the schema; all changes go through Flyway scripts.

**WebSocket (chat):** STOMP over SockJS. Endpoint: `/ws-smiling-wallet`. Messages published to `/app/chat.send`, broadcast on `/topic/chat/{appointmentId}`. Only works after an appointment exists (offer accepted).

**Fake data generator:** `POST /api/admin/generator/start` / `stop` — seeds random data via `FakeDataService` (admin only).

**Profile completion:** `ProfileCompletion.calculate(User)` computes a 0–100 score — Patient: username + phone + city (33% each); Dentist: those three + specialty (25% each). Result is always included in `UserResponseDTO`. Guards: `RequestService.create()` throws 422 if patient city is blank; `OfferService.sendOffer()` throws 422 if dentist specialty is null.

### Frontend — React 18 / TypeScript / Vite

**Routing:** Custom page-based, no React Router. `App.tsx` holds a `page: PageName` state and renders the matching page component. `PageName` is a union type in `src/frontend/src/types/types.ts`. The `canSee` map in `App.tsx` enforces role-based access; violating pages bounce to `home`.

**Auth state:** `AuthUser` (id, username, role, token, refreshToken, profileCompletionPct, missingFields) is stored in `localStorage` under the key `user`. `api.ts` reads it on every request to inject the `Authorization` header. Silent refresh on 401 via interceptor in `api.ts`. Inactivity timeout: 30 minutes.

**API layer:** Single Axios instance in `src/frontend/src/services/api.ts` with `baseURL: "/api"`. Vite proxies `/api` → `https://localhost:8080`. `OfferService.ts` adds offline-sync on top (queues to `localStorage` when offline).

**Key pages:**
- `DashboardPage` — Dentist view: offer table + real-time chat per appointment
- `ReviewRequestsPage` — Dentist marketplace: browse open requests, send offers
- `SendRequestPage` — Patient: submit a treatment request
- `MyOffersPage` — Patient: view offers received on their requests
- `ProfilePage` — All users: view/edit profile, animated progress bar, missing-field highlights
- `ProfileBanner` (shared component) — Dismissible banner shown globally when `profileCompletionPct < 100`; 24h suppress via localStorage key `profileBannerDismissedAt`

**Mock data vs real API:** `ReviewRequestsPage` and `DashboardPage` still use `INITIAL_OFFERS` / `INITIAL_REQUESTS` from `src/frontend/src/data/constants.ts` for their local display state. The `OfferService.ts` calls the real API when saving. New pages should use `api.ts` directly.

**CSS:** CSS Modules (`.module.css`) per component. Design tokens are CSS custom properties (`--purple`, `--surface`, `--radius`, `--shadow`, etc.) defined globally.

## Key conventions

- DTOs live in `backend/dto/`. Request DTOs carry Bean Validation annotations; response DTOs have a static `from(Entity)` factory.
- `UserResponseDTO.from(User)` always calls `ProfileCompletion.calculate()` — never construct it without that.
- `AuthResponseDTO` wraps `(token, refreshToken, UserResponseDTO)` — login and register both return this shape, so the frontend always gets fresh completion data on auth.
- Frontend `localStorage` key `user` holds the full `AuthUser` object including completion fields. After a profile save, call `handleProfileUpdate(pct, missingFields)` in `App.tsx` to keep it fresh.
- Service-layer unit tests use Mockito (`@ExtendWith(MockitoExtension.class)`), located in `src/main/java/backend/service/tests/` (unusual location — not under `src/test/`).
