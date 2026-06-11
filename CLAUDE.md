# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

SmillingWallet is a two-sided dental marketplace. **Patients** submit treatment requests; **Dentists** browse them and send price offers. When a patient accepts an offer, an appointment is created. Both sides can chat in real-time via WebSocket once an appointment exists. There is also an **Admin** role with access to all views.

The scheduling model is **day-interval based, not time-of-day** (exact times are arranged privately between patient and dentist by phone). A patient request carries up to **3 preferred cities** and one shared availability window (`availableFrom`/`availableTo`). An offer carries a **procedure length in days** plus **1–2 date-range variations** (each a contiguous block of `procedureDays` days inside the patient's window); the patient picks one variation to confirm the appointment, which is stored as a `startDate`/`endDate` interval.

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

**Auth flow:** JWT access token (15 min) + opaque refresh token (7 days, stored in DB). The JWT carries `userId` as subject and `role` as a claim. `JwtAuthenticationFilter` skips only the public `/api/auth/*` endpoints; all other paths including `/api/auth/user/**` go through token validation.

**Security roles:** Spring Security authority strings are `ROLE_PATIENT`, `ROLE_DENTIST`, `ROLE_ADMIN`. The JWT stores bare role strings (`PATIENT` etc.); the filter prepends `ROLE_`.

**Two-Factor Authentication:** Two independent 2FA methods, either or both can be enabled per user.
- **TOTP (Authenticator App):** `totp_enabled`, `totp_secret` (AES-256-GCM encrypted), `backup_codes` (BCrypt-hashed JSON). Setup via `/auth/2fa/setup` → `/auth/2fa/confirm`; disable via `/auth/2fa/disable`. Login verify: `POST /auth/2fa/verify` (public).
- **Email 2FA:** `email2fa_enabled`, `email2fa_address`. A 6-digit OTP is generated, stored in an in-memory TTL cache (10 min), and sent via `EmailService.sendEmail2faCode()`. Setup via `/auth/email2fa/send` → `/auth/email2fa/enable`; disable via `/auth/email2fa/send` → `/auth/email2fa/disable`. Login verify: `POST /auth/email2fa/verify-login` (public).
- **Login flow:** if email 2FA is enabled it takes priority; then TOTP is checked. `LoginResponseDTO` returns `{ requiresMfa: true, mfaType: "email"|"totp", tempToken }`. The frontend reads `mfaType` to route to the correct verify endpoint and show the right description.
- **`UserResponseDTO`:** `twoFactorEnabled = totpEnabled || email2faEnabled` (used for the badge). Also exposes `email2faEnabled` and `email2faAddress` separately.
- TTL caches for MFA state live in `AuthService` as `TtlCache` instances (in-memory, no Redis dependency).

**Database:** PostgreSQL with Flyway migrations in `src/main/resources/db/migration/`. Schema: `users`, `dental_requests`, `offers`, `appointments`, `notifications`, `refresh_tokens`, `password_reset_tokens`. `ddl-auto: validate` — Hibernate never modifies the schema; all changes go through Flyway scripts.

**Request → offer → appointment flow (day-interval model):**
- `DentalRequest` — `preferredCities` is a `List<String>` (max 3) persisted to the single `preferred_cities` column via `util/CityListConverter` (comma-joined; the codebase deliberately avoids JPA associations). `availableFrom`/`availableTo` are the one shared availability window. The dentist marketplace city filter matches if *any* preferred city equals the filter.
- `Offer` — `procedureDays` (int) + two optional date-range variations: `variant1Start`/`variant1End` (required) and `variant2Start`/`variant2End` (optional). `OfferService` validates each variation spans exactly `procedureDays` days and sits inside the request's window (422 otherwise). There is no time-of-day and no `estimatedWaitDays`.
- `Offer` exposes variations to the frontend as `OfferResponseDTO.variations` (a list of `{startDate, endDate}`) plus `procedureDays`.
- Accepting: `POST /offers/{id}/select-slot` with `{selectedStartDate, selectedEndDate}` — must match one of the offer's variations. Reschedule: `request-reschedule` then dentist `repropose-slots` (carries `procedureDays` + the variants again).
- `Appointment` — stores the chosen `startDate`/`endDate` (dates, not a timestamp). The reminder job (`AppointmentReminderService`, daily at 09:00) emails patients whose treatment `startDate` is tomorrow.

**WebSocket (chat):** STOMP over SockJS. Endpoint: `/ws-smiling-wallet`. Messages published to `/app/chat.send`, broadcast on `/topic/chat/{appointmentId}`. Only works after an appointment exists (offer accepted).

**Fake data generator:** `POST /api/admin/generator/start` / `stop` — seeds random data via `FakeDataService` (admin only).

**Profile completion:** `ProfileCompletion.calculate(User)` computes a 0–100 score — Patient: username + phone + city (33% each); Dentist: those three + specialty (25% each). Result is always included in `UserResponseDTO`. Guard: `OfferService.sendOffer()` throws 422 if dentist specialty is null (it also throws 422 if any proposed date variation falls outside the patient's window or doesn't match `procedureDays`).

### Frontend — React 18 / TypeScript / Vite

**Routing:** Custom page-based, no React Router. `App.tsx` holds a `page: PageName` state and renders the matching page component. `PageName` is a union type in `src/frontend/src/types/types.ts`. The `canSee` map in `App.tsx` enforces role-based access; violating pages bounce to `home`.

**Auth state:** `AuthUser` (id, username, role, token, refreshToken, profileCompletionPct, missingFields) is stored in `localStorage` under the key `user`. `api.ts` reads it on every request to inject the `Authorization` header. Silent refresh on 401 via interceptor in `api.ts`. Inactivity timeout: 30 minutes.

**API layer:** Single Axios instance in `src/frontend/src/services/api.ts` with `baseURL: "/api"`. Vite proxies `/api` → `https://localhost:8080`. `OfferService.ts` adds offline-sync on top (queues to `localStorage` when offline).

**Key pages:**
- `DashboardPage` — Dentist view: offer table + real-time chat per appointment; reschedule requests are answered via a "Propose New Dates" modal (procedure length + 1–2 start dates, end derived)
- `ReviewRequestsPage` — Dentist marketplace: browse open requests, send offers. `SendOfferModal` collects price + procedure length (days) + 1–2 start dates; the end date is derived (`start + days − 1`) so the span always matches
- `SendRequestPage` — Patient: submit a treatment request; picks up to 3 cities (chips) + one availability window
- `MyOffersPage` — Patient: view offers received on their requests; "Choose Treatment Dates" lists the offer's 1–2 date-range variations
- `ProfilePage` — All users: view/edit profile, animated progress bar, missing-field highlights. Account settings section has three toggles: **Authenticator App (TOTP)**, **Email Verification Code**, and **Email Reminders**. Each 2FA method has its own enable modal and disable modal; they are independent.
- `ProfileBanner` (shared component) — Dismissible banner shown globally when `profileCompletionPct < 100`; 24h suppress via localStorage key `profileBannerDismissedAt`

**Mock data vs real API:** `ReviewRequestsPage` and `DashboardPage` still use `INITIAL_OFFERS` / `INITIAL_REQUESTS` from `src/frontend/src/data/constants.ts` for their local display state. The `OfferService.ts` calls the real API when saving. New pages should use `api.ts` directly.

**CSS:** CSS Modules (`.module.css`) per component. Design tokens are CSS custom properties (`--purple`, `--surface`, `--radius`, `--shadow`, etc.) defined globally.

## Key conventions

- DTOs live in `backend/dto/`. Request DTOs carry Bean Validation annotations; response DTOs have a static `from(Entity)` factory.
- `UserResponseDTO.from(User)` always calls `ProfileCompletion.calculate()` — never construct it without that.
- `AuthResponseDTO` wraps `(token, refreshToken, UserResponseDTO)` — login and register both return this shape, so the frontend always gets fresh completion data on auth.
- Frontend `localStorage` key `user` holds the full `AuthUser` object including completion fields. After a profile save, call `handleProfileUpdate(pct, missingFields)` in `App.tsx` to keep it fresh.
- Service-layer unit tests use Mockito (`@ExtendWith(MockitoExtension.class)`), located in `src/main/java/backend/service/tests/` (unusual location — not under `src/test/`).
