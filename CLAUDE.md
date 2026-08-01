# CLAUDE.md

Guidance for Claude Code when working in this repository.

---

## What this app is

SmillingWallet is a two-sided dental marketplace. **Patients** submit treatment requests; **Dentists** browse them and
send price offers. When a patient accepts an offer, an appointment is created. There is also an **Admin** role with
access to all views.

The scheduling model is **day-interval based, not time-of-day** (exact times are arranged privately by phone). A patient
request carries up to **3 preferred cities** and one shared availability window (`availableFrom`/`availableTo`). An
offer carries a **procedure length in days** plus **1–2 date-range variations** (each a contiguous block of
`procedureDays` days inside the patient's window); the patient picks one variation to confirm the appointment, stored as
a `startDate`/`endDate` interval.

---

## Running the app

Two terminals required. PostgreSQL (port 5432, db `smilingwallet`) and Redis (port 6379) must be running first.

**Backend** (from project root):
```bash
./mvnw spring-boot:run
# https://localhost:8080 — SSL enabled with keystore in repo
```

**Frontend** (from `src/frontend/`):
```bash
npm run dev
# http://localhost:5173 — proxied to backend via Vite
```

**Backend tests** (Mockito, no DB required):
```bash
./mvnw test
./mvnw test -Dtest=AuthServiceTest
```

**Frontend tests/lint:**
```bash
cd src/frontend
npm run test     # Vitest
npm run lint     # ESLint
npm run lint:fix # ESLint with --fix
npm run build    # tsc + Vite (catches type errors)
```

**Java formatting** (import hygiene + whitespace, not a full reformatter):

```bash
./mvnw spotless:check   # what CI runs
./mvnw spotless:apply   # fix violations
```

---

## CI

`.github/workflows/ci.yml` runs on every PR and on pushes to `main`, in two jobs:

- **Backend** — `spotless:check`, then `./mvnw test` on JDK 21. Tests use in-memory H2 with Flyway disabled and Redis
  auto-config excluded (`src/test/resources/application-test.yml`), so **no services or secrets are required**. Every
  env placeholder in `application.yml` has a default, so a missing `.env` is fine.
- **Frontend** — `npm ci`, `npm run lint`, `npm run build` (tsc + vite), `npm run test` on Node 22.

Steps use `if: ${{ !cancelled() }}` so one failure still reports the rest.

Gotchas that CI depends on and that are easy to undo:

- `mvnw` must stay mode `100755` in git, or `./mvnw` fails on Linux runners.
- `@vitejs/plugin-react` must stay on v6+; v4 peer-requires vite ≤7 and breaks `npm ci` against vite 8.
- `.gitattributes` forces `eol=lf`, so a Windows checkout matches what Spotless sees in CI.
- ESLint: errors fail the build; `no-explicit-any` and `react-hooks/exhaustive-deps` are warnings on purpose (81
  pre-existing).

---

## Backend — Spring Boot 4 / Java 21

### Package layout (`src/main/java/backend/`)

| Package       | Contents                                                                                                       |
|---------------|----------------------------------------------------------------------------------------------------------------|
| `config/`     | `SecurityConfig`, `JwtAuthenticationFilter`, `JwtProperties`, `TotpProperties`, `AsyncConfig`, `JacksonConfig` |
| `controller/` | One controller per domain + `GlobalExceptionHandler`                                                           |
| `service/`    | Business logic; `service/tests/` holds Mockito unit tests                                                      |
| `dto/`        | Request DTOs (Bean Validation) + response DTOs (`from(Entity)` factory)                                        |
| `model/`      | JPA entities                                                                                                   |
| `repository/` | Spring Data JPA interfaces                                                                                     |
| `enums/`      | `Role`, `DentalSpecialty`, `OfferStatus`, `RequestStatus`, `AppointmentStatus`, `NotificationType`             |
| `exception/`  | `ResourceNotFoundException` (404), `ConflictException` (409), `UnprocessableEntityException` (422)             |
| `util/`       | `ProfileCompletion.calculate(User)` → `ProfileCompletionResult(pct, missingFields)`                            |

### Auth flow

JWT access token (15 min) + opaque refresh token (7 days, stored in DB). The JWT carries `userId` as subject and `role`
as a claim. `JwtAuthenticationFilter` validates all paths except the public `/api/auth/*` endpoints. Spring Security
authority strings are `ROLE_PATIENT`, `ROLE_DENTIST`, `ROLE_ADMIN`; the filter prepends `ROLE_` to the bare role stored
in the JWT.

### Two-Factor Authentication

Two independent methods, either or both can be enabled per user.

- **TOTP (Authenticator App):** secret stored AES-256-GCM encrypted (`totp_secret`), backup codes BCrypt-hashed. Setup:
  `/auth/2fa/setup` → `/auth/2fa/confirm`. Disable: `/auth/2fa/disable`. Login verify: `POST /auth/2fa/verify` (public).
- **Email 2FA:** 6-digit OTP stored in an in-memory TTL cache (10 min), sent via `EmailService.sendEmail2faCode()`.
  Setup: `/auth/email2fa/send` → `/auth/email2fa/enable`. Login verify: `POST /auth/email2fa/verify-login` (public).
- **Login flow:** email 2FA takes priority over TOTP. `LoginResponseDTO` returns
  `{ requiresMfa, mfaType: "email"|"totp", tempToken }`.
- **`UserResponseDTO`:** `twoFactorEnabled = totpEnabled || email2faEnabled`. Also exposes `email2faEnabled` and
  `email2faAddress` separately.
- TTL caches live in `AuthService` as `TtlCache` instances — no Redis dependency.

### Database

PostgreSQL with Flyway migrations in `src/main/resources/db/migration/`. Tables: `users`, `dental_requests`, `offers`,
`appointments`, `notifications`, `refresh_tokens`, `password_reset_tokens`. `ddl-auto: validate` — Hibernate never
modifies the schema.

### Clinic invitations (admin panel)

Clinics are invite-only. The admin supplies **nothing but an email address** — the clinic fills in its own name, phone,
city, address and specialty when it signs up.

- **`ClinicInvitation`** (`clinic_invitations`) — one row per email address, so re-inviting refreshes the token instead
  of creating duplicates. Status is `PENDING` / `ACCEPTED` / `REVOKED`; tokens expire after **30 days**. An invitation
  is *not* a user row — the `User` is only created on acceptance.
- **Expiry** — `requireUsableInvite` rejects an expired token immediately, so a link dies on its expiry date regardless
  of stored status. A daily `@Scheduled` sweep (`revokeExpiredInvitations`, 03:15) then flips expired `PENDING` rows to
  `REVOKED` so the admin list tells the truth.
- **`listInvitations()` omits `ACCEPTED`** — once a clinic signs up it belongs in the registered-clinics list, not the
  invitations list. The admin page opens on **Registered Clinics**, with **Invitations Sent** as the second tab.
- **Admin endpoints** (`/api/admin/clinics`, ADMIN-only): `POST /invitations` (single email),
  `POST /invitations/import` (multipart spreadsheet), `GET /invitations`, `POST /invitations/{id}/resend`,
  `DELETE /invitations/{id}` (revoke), `GET /invitations/import/template` (generated .xlsx), `GET /` (registered
  clinics).
- **Bulk import** — `ClinicSheetParser` reads `.xlsx` / `.xls` (Apache POI) and `.csv`. Format is a single `email`
  column; the header is optional and located by name, otherwise column A is used. Every row is reported back in
  `BulkInviteResultDTO` as invited or skipped-with-reason.
- **Public endpoints** (`/api/invites`, permitAll): `GET /{token}` returns only the invited email;
  `POST /{token}/accept` creates the DENTIST user and returns `AuthResponseDTO` so the clinic is logged straight in.
- **Landing page** — `JoinClinicPage` at `/join?token=…`: an introduction to what the app does (how it works, why
  clinics join) followed by the signup form. Email is locked to the invited address; specialties are chosen with the
  shared `SpecialtyPicker`.
- **Legacy:** `AuthService.verifyInviteToken` / `activateAccount` and `ActivateAccountPage` (`/activate?token=…`) are
  the *old* flow, kept only so invite links already sent keep working. Do not build on them.

### Request → Offer → Appointment flow

- **`DentalRequest`** — `preferredCities` is a `List<String>` (max 3) stored comma-joined via `CityListConverter`. The
  dentist marketplace city filter matches if *any* preferred city equals the filter value.
- **`Offer`** — `procedureDays` + `variant1Start`/`variant1End` (required) and `variant2Start`/`variant2End` (optional).
  `OfferService` validates each variation spans exactly `procedureDays` days and falls inside the request's window (422
  otherwise). Exposed to the frontend as `OfferResponseDTO.variations` (list of `{startDate, endDate}`).
- **Accepting:** `POST /offers/{id}/select-slot` with `{selectedStartDate, selectedEndDate}` — must match one of the
  offer's variations.
- **Reschedule:** patient requests reschedule → dentist `repropose-slots` (same shape as original offer).
- **`Appointment`** — stores chosen `startDate`/`endDate`. `AppointmentReminderService` runs daily at 09:00 and emails
  patients whose `startDate` is tomorrow.

### WebSocket (real-time statistics)

Endpoint: `/ws-smiling-wallet`. Server pushes updates to `/topic/statistics` when data changes (new offers, request
updates, etc.). Used to keep the dentist dashboard live without polling.

### Other services

- **`EmailService`** (`@Async`) — password reset + appointment reminders via Spring Mail / SMTP.
- **`TotpService` + `TotpEncryptionService`** — TOTP secret generation, validation, AES encryption.
- **`FakeDataService`** — admin-only random seed data. `POST /api/admin/generator/start|stop`.
- **`ProfileCompletion.compute(User)`** — 0–100 score. Patient: username + phone + city (33% each). Dentist: those
  three + at least one specialty (25% each). Always included in `UserResponseDTO`. `OfferService.sendOffer()` throws 422
  if the dentist's specialty list is empty.

---

## Frontend — React 18 / TypeScript / Vite

### Routing

Custom page-based, no React Router. `App.tsx` holds `page: PageName` state. `PageName` union is in
`src/frontend/src/types/types.ts`. The `canSee` map enforces role-based access; violations bounce to `home`.

### Auth state

`AuthUser` (id, username, role, token, refreshToken, profileCompletionPct, missingFields) stored in `localStorage` under
key `user`. `api.ts` injects the `Authorization` header on every request. Silent refresh on 401. Inactivity timeout: 30
minutes.

### API layer

Single Axios instance in `src/frontend/src/services/api.ts` with `baseURL: "/api"`. Vite proxies `/api` →
`https://localhost:8080`. `OfferService.ts` adds offline-sync (queues to `localStorage` when offline, replays on
reconnect).

### Key pages

| Page                 | Role    | Notes                                                                                                                      |
|----------------------|---------|----------------------------------------------------------------------------------------------------------------------------|
| `DashboardPage`      | Dentist | Offer table + live statistics via WebSocket; reschedule via "Propose New Dates" modal                                      |
| `ReviewRequestsPage` | Dentist | Browse open requests, send offers. `SendOfferModal`: price + procedure days + 1–2 start dates (end derived)                |
| `SendRequestPage`    | Patient | Submit request; up to 3 city chips + availability window                                                                   |
| `MyOffersPage`       | Patient | View offers; "Choose Treatment Dates" lists 1–2 date-range variations                                                      |
| `ProfilePage`        | All     | Animated progress bar, missing-field highlights, independent TOTP + Email 2FA toggles, email reminder toggle               |
| `ProfileBanner`      | All     | Dismissible global banner when `profileCompletionPct < 100`; suppressed 24h via `profileBannerDismissedAt` in localStorage |

### Notes

- `ReviewRequestsPage` and `DashboardPage` still use `INITIAL_OFFERS` / `INITIAL_REQUESTS` from
  `src/frontend/src/data/constants.ts` for local display state. New pages should use `api.ts` directly.
- CSS Modules (`.module.css`) per component. Design tokens are CSS custom properties (`--purple`, `--surface`,
  `--radius`, `--shadow`, etc.) defined globally.
- After a profile save, call `handleProfileUpdate(pct, missingFields)` in `App.tsx` to keep `localStorage` fresh.

---

### Specialties

A **clinic offers many** specialties; a **patient request asks for one**.

- `User.specialties` is a `List<DentalSpecialty>` stored comma-joined via `SpecialtyListConverter` (same flat-column
  trick as `CityListConverter`), in `users.specialties VARCHAR(500)`.
- `DentalRequest.specialty` stays a single enum — do not pluralise it.
- Frontend: `DENTAL_SPECIALTIES` / `SPECIALTY_LABELS` / `formatSpecialties()` live in `data/constants.ts`; the shared
  `SpecialtyPicker` renders the multi-select chips.

## Key conventions

- Response DTOs have a static `from(Entity)` factory. `UserResponseDTO.from(User)` always calls
  `ProfileCompletion.calculate()` — never construct it without that.
- `AuthResponseDTO` wraps `(token, refreshToken, UserResponseDTO)` — login and register both return this shape.
- Service-layer unit tests use Mockito (`@ExtendWith(MockitoExtension.class)`). Older ones sit in
  `src/main/java/backend/service/tests/` — **surefire never executes those**; they only compile, and
  `./mvnw test -Dtest=AuthServiceTest` fails with "No tests matching pattern". Put new tests under `src/test/java/` so
  they actually run.

---

## Documentation requirements

When asked to document the project, generate:

- **`SETUP.md`** — prerequisites (Java 21, Node 18+, PostgreSQL, Redis), cloning, environment variables /
  `application.properties`, running locally, running tests. Include an **IntelliJ IDEA** startup section: open the
  project, configure Maven SDK to Java 21, create a Spring Boot run configuration, open the frontend terminal inside the
  IDE. (IDE mapping for reference: IntelliJ for Java/Spring Boot; PhpStorm for PHP; Visual Studio for ASP.NET.)
- **`HOW_IT_WORKS.md`** — plain-English walkthrough: what the app does, the patient→request→offer→appointment flow,
  day-interval scheduling, real-time statistics, 2FA, profile completion, role system. No code, no jargon.

---

## Comment style

Add a comment when the **WHY** is non-obvious: hidden constraints, subtle invariants, workarounds, or behaviour that
would surprise a reader. One line max. Do not comment trivial getters, setters, or self-explanatory CRUD.
