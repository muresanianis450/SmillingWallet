# Smiling Wallet — Assignment 3 (Data Persistency) — Context for Next Chat

## App Overview
Full-stack dental marketplace. Patients submit anonymous treatment requests, clinics send price offers in real time, patients accept the best offer which creates an appointment.
**Tech stack:** Spring Boot 4.0.4, PostgreSQL 18.3, Redis, React + TypeScript, Docker, Java 25.

---

## Assignment Requirements (Bronze)
- Relational DB with all domain entities, full CRUD, basic statistics and filters (stored procedures and triggers allowed)
- DB must be at least 3NF
- DB must be migrated from domain objects using Flyway (NOT written manually)
- All DB implementation must be tested
- Client must run from a different machine than the server

---

## What's Done

### Step 1 — JPA Entities ✅
All 5 models fully annotated:
- `User` → `@Entity @Table(name="users")`
- `DentalRequest` → `@Entity @Table(name="dental_requests")`
- `Offer` → `@Entity @Table(name="offers")`
- `Appointment` → `@Entity @Table(name="appointments")`
- `Notification` → `@Entity @Table(name="notifications")`

All use:
- `@Id @GeneratedValue(strategy = GenerationType.UUID)`
- `@Enumerated(EnumType.STRING)` on all enums
- `@Column` constraints (nullable, unique, length, precision/scale, columnDefinition="TEXT")

### Step 2 — Spring Data JPA Repositories ✅
All 5 in-memory ConcurrentHashMap repositories replaced with JPA interfaces in `backend.repository`:
- `UserRepository` — findByEmail, findByUsername, existsByEmail, findByRole
- `RequestRepository` — findByPatientPublicId, findByStatus
- `OfferRepository` — findByRequestId, findByDentistPublicId, findByStatus
- `AppointmentRepository` — findByOfferId, findByPatientPublicId, findByDentistPublicId, findByStatus
- `NotificationRepository` — findByRecipientId, findByRecipientIdAndRead, findByType

All extend `JpaRepository<Entity, UUID>` with correct generic type parameters.

### Step 3 — Configuration ✅
**`src/main/resources/application.yml`:**
```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/smilingwallet
    username: postgres
    password: postgres
    driver-class-name: org.postgresql.Driver

  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
    show-sql: true
    properties:
      hibernate:
        format_sql: true
        default_schema: public

  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: false
    validate-on-migrate: true

  data:
    redis:
      host: localhost
      port: 6379
      timeout: 2000ms

logging:
  level:
    org.flywaydb: DEBUG
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql: TRACE
```

**`src/test/resources/application-test.yml`:**
```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;MODE=PostgreSQL
    username: sa
    password:
    driver-class-name: org.h2.Driver

  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: true
    properties:
      hibernate:
        dialect: org.hibernate.dialect.H2Dialect
        format_sql: true

  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: false

logging:
  level:
    org.flywaydb: DEBUG
    org.hibernate.SQL: DEBUG
```

**`backend/config/JacksonConfig.java`** (Spring Boot 4 / Jackson 3 compatible):
```java
@Configuration
public class JacksonConfig {
    @Bean
    public ObjectMapper objectMapper() {
        return JsonMapper.builder()
                .addModule(new JavaTimeModule())
                .build();
    }
}
```

**`SmillingWalletApplication.java`:**
```java
@SpringBootApplication
@EnableJpaRepositories(basePackages = "backend.repository")
@EntityScan(basePackages = "backend.model")
public class SmillingWalletApplication {
    public static void main(String[] args) {
        SpringApplication.run(SmillingWalletApplication.class, args);
    }
}
```

**pom.xml key dependencies:**
- spring-boot-starter-parent 4.0.4
- spring-boot-starter-data-jpa
- postgresql (runtime)
- flyway-core
- h2 (test scope)
- jackson-datatype-jsr310
- spring-boot-starter-websocket
- springdoc-openapi-starter-webmvc-ui 2.8.8

**Current app state:** Starts successfully, connects to PostgreSQL, but fails at schema validation:
```
Schema validation: missing table [appointments]
```
This is expected — Flyway migration V1 has not been written yet.

---

## Project Structure
```
src/
├── main/
│   ├── java/
│   │   ├── backend/
│   │   │   ├── controller/
│   │   │   ├── config/        ← JacksonConfig.java here
│   │   │   ├── dto/
│   │   │   ├── enums/
│   │   │   ├── exception/
│   │   │   ├── model/         ← 5 JPA entities
│   │   │   ├── repository/    ← 5 JPA repository interfaces
│   │   │   └── service/
│   │   └── com/example/smillingwallet/
│   │       └── SmillingWalletApplication.java
│   └── resources/
│       ├── db/migration/      ← EMPTY — V1 goes here
│       └── application.yml
└── test/
    └── resources/
        └── application-test.yml
```

---

## 3NF Status
Schema is already in 3NF — all PKs are single UUIDs, no partial dependencies, no transitive dependencies. User.specialty/city/address are nullable dentist-only fields — valid single-table design, not a 3NF violation.

---

## What Needs to Be Done Next (in order)

### Step 4 — Flyway V1 Migration ← START HERE
- Create `src/main/resources/db/migration/V1__init_schema.sql`
- Write CREATE TABLE for all 5 tables matching the JPA entities exactly
- Tables: users, dental_requests, offers, appointments, notifications
- All foreign keys, constraints, indexes
- **To do this: share all 5 entity classes** so the SQL matches exactly

### Step 5 — Stored Procedures & Triggers (V2 migration)
- Stored procedure: clinic stats (total offers, accepted, pending, rejected, revenue) — replaces DashboardService stream logic
- Stored procedure: patient history summary
- Trigger: when offer ACCEPTED → set all other PENDING offers on same request to REJECTED
- Trigger: when appointment created → update dental_request status to OFFER_ACCEPTED
- File: `V2__procedures_and_triggers.sql`

### Step 6 — Update Services to Use Stored Procedures
- Update DashboardService to call stored procedures instead of in-memory stream computations
- Simplify OfferService.acceptOffer() — trigger handles rejecting other offers

### Step 7 — Tests (all DB implementation must be tested)
- Repository-layer integration tests using H2 + @DataJpaTest
- Test all CRUD for each repository
- Test all custom query methods
- Test filters (by status, specialty, city)
- Annotate test classes with @DataJpaTest + @ActiveProfiles("test")
- Exclude Redis autoconfiguration using @ImportAutoConfiguration(exclude=...) on test classes

---

## Important Notes
- Spring Boot 4.0.4 uses Jackson 3 — `SerializationFeature.WRITE_DATES_AS_TIMESTAMPS` does not exist, use `JsonMapper.builder()` instead
- Hibernate 7 auto-detects PostgreSQL dialect — do not set it explicitly in yml
- Redis autoconfigure exclusion in test yml causes errors in Boot 4 — handle via @ImportAutoConfiguration on test classes instead
- `application-test.yml` must be in `src/test/resources/` not `src/main/resources/`
- H2 url must include `MODE=PostgreSQL` so Flyway SQL works in both environments