SmillingWallet - Full Project Structure
========================================

📦 SmillingWallet (Root)
│
├── 📄 pom.xml                          [Maven configuration]
├── 📄 mvnw / mvnw.cmd                  [Maven wrapper]
├── 📄 README.md
├── 📄 HELP.md
│
├── 📁 .mvn/                            [Maven configuration]
├── 📁 .git/                            [Git repository]
├── 📁 .idea/                           [IntelliJ IDEA configuration]
│
├── 📁 Documents/                       [Project documentation]
│   ├── Architecture-Overview.png
│   ├── Class-Diagram.png
│   ├── SmilingWallet_Assignment3_3NF.pdf
│   └── client-server_setup.md
│
├── 📁 context/                         [Context information]
│   └── context_file.md
│
├── 📁 migration/                       [Database migrations]
│
├── 📁 target/                          [Build output]
│   ├── SmilingWallet-0.0.1-SNAPSHOT.jar
│   ├── classes/
│   ├── generated-sources/
│   ├── generated-test-sources/
│   ├── maven-archiver/
│   ├── maven-status/
│   └── test-classes/
│
└── 📁 src/
│
├── 📁 frontend/                    [React/TypeScript Frontend - Vite]
│   │
│   ├── 📄 package.json
│   ├── 📄 tsconfig.json
│   ├── 📄 tsconfig.node.json
│   ├── 📄 vite.config.ts
│   ├── 📄 playwright.config.ts
│   ├── 📄 index.html
│   ├── 📄 README.md
│   │
│   ├── 📁 assets/                  [Static assets]
│   │   ├── SmilingWallet_Logo.png
│   │   ├── DentistIcon.png
│   │   ├── default-avatar.png
│   │   ├── Teeth_About_Page.png
│   │   ├── graphIcon.png
│   │   ├── handshakeIcon.png
│   │   ├── CosmeticDentistry.png
│   │   ├── Dental Implant.png
│   │   ├── DentistIcon.png
│   │   ├── EmergencyCare.png
│   │   ├── General Dentistry.png
│   │   ├── Orthodontics.png
│   │   ├── PediatricDentistry.png
│   │   ├── pfp1.png
│   │   ├── pfp2.png
│   │   └── pfp3.png
│   │
│   ├── 📁 e2e/                    [End-to-end tests (Playwright)]
│   │   ├── dashboard.spec.ts
│   │   ├── delete.spec.ts
│   │   └── requests.spec.ts
│   │
│   ├── 📁 playwright-report/      [Test reports]
│   │   └── data/
│   │
│   ├── 📁 test-results/
│   │   └── dashboard-user-can-delete-an-offer-firefox/
│   │
│   └── 📁 src/                    [Source code]
│       │
│       ├── 📄 main.tsx            [React entry point]
│       ├── 📄 App.tsx             [Root component]
│       ├── 📄 vite-env.d.ts       [Vite type definitions]
│       │
│       ├── 📁 components/         [React components]
│       │   │
│       │   ├── 📁 layout/         [Layout components]
│       │   │   ├── Nav.tsx
│       │   │   └── Nav.module.css
│       │   │
│       │   ├── 📁 shared/         [Shared/reusable components]
│       │   │   ├── BlobBackground.tsx
│       │   │   ├── BlobBackground.module.css
│       │   │   ├── Button.tsx
│       │   │   ├── Button.module.css
│       │   │   ├── EmptyState.tsx
│       │   │   ├── EmptyState.module.css
│       │   │   ├── FormField.tsx
│       │   │   ├── FormField.module.css
│       │   │   ├── Icons.tsx
│       │   │   ├── Input.tsx
│       │   │   ├── Input.module.css
│       │   │   ├── Modal.tsx
│       │   │   ├── Modal.module.css
│       │   │   ├── Pagination.tsx
│       │   │   ├── Pagination.module.css
│       │   │   ├── StatusBadge.tsx
│       │   │   ├── StatusBadge.module.css
│       │   │   ├── Toast.tsx
│       │   │   └── Toast.module.css
│       │   │
│       │   └── 📁 pages/          [Page components]
│       │       ├── About/
│       │       ├── Appointments/
│       │       ├── Dashboard/
│       │       ├── Home/
│       │       ├── Login/
│       │       ├── MyOffers/
│       │       ├── Register/
│       │       ├── ReviewRequests/
│       │       └── SendRequest/
│       │
│       ├── 📁 data/               [Data & constants]
│       │   └── constants.ts
│       │
│       ├── 📁 hooks/              [Custom React hooks]
│       │   ├── useNetworkStatus.ts
│       │   ├── useOffers.ts
│       │   ├── usePagination.ts
│       │   ├── useToast.ts
│       │   ├── useTracking.ts
│       │   └── useWebSocket.ts
│       │
│       ├── 📁 services/           [API services]
│       │   ├── api.ts             [HTTP client / API calls]
│       │   └── OfferService.ts
│       │
│       ├── 📁 styles/             [Global styles]
│       │   ├── global.css
│       │   └── variables.css
│       │
│       ├── 📁 tracking/           [Analytics/tracking]
│       │   ├── cookies.ts
│       │   ├── storage.ts
│       │   └── tracker.ts
│       │
│       ├── 📁 types/              [TypeScript type definitions]
│       │   └── types.ts
│       │
│       ├── 📁 utils/              [Utility functions]
│       │   ├── formatters.ts
│       │   └── validation.ts
│       │
│       └── 📁 tests/              [Unit tests]
│           ├── components.test.tsx
│           ├── formatters.test.ts
│           ├── setup.ts
│           └── [other test files]
│
├── 📁 main/                       [Main backend source code]
│   │
│   ├── 📁 java/
│   │   └── 📁 backend/            [Java backend package]
│   │       │
│   │       ├── 📁 config/         [Configuration classes]
│   │       │   ├── CorsConfig.java
│   │       │   ├── JacksonConfig.java
│   │       │   └── http-client.env.json
│   │       │
│   │       ├── 📁 controller/     [REST Controllers]
│   │       │   ├── AuthController.java
│   │       │   ├── DashboardController.java
│   │       │   ├── GeneratorController.java
│   │       │   ├── OfferController.java
│   │       │   ├── RequestController.java
│   │       │   └── GlobalExceptionHandler.java
│   │       │
│   │       ├── 📁 service/        [Business logic services]
│   │       │   ├── AuthService.java
│   │       │   ├── DashboardService.java
│   │       │   ├── FakeDataService.java
│   │       │   ├── NotificationService.java
│   │       │   ├── OfferService.java
│   │       │   ├── RequestService.java
│   │       │   └── 📁 tests/
│   │       │
│   │       ├── 📁 repository/     [Data access layer - JPA Repositories]
│   │       │   ├── AppointmentRepository.java
│   │       │   ├── NotificationRepository.java
│   │       │   ├── OfferRepository.java
│   │       │   ├── RequestRepository.java
│   │       │   └── UserRepository.java
│   │       │
│   │       ├── 📁 model/          [Entity models / JPA entities]
│   │       │   ├── User.java
│   │       │   ├── Offer.java
│   │       │   ├── DentalRequest.java
│   │       │   ├── Appointment.java
│   │       │   └── Notification.java
│   │       │
│   │       ├── 📁 dto/            [Data Transfer Objects]
│   │       │   ├── AnalyticsReponseDTO.java
│   │       │   ├── AppointmentRequestDTO.java
│   │       │   ├── AppointmentResponseDTO.java
│   │       │   ├── AuthResponseDTO.java
│   │       │   ├── DentalRequestDTO.java
│   │       │   ├── DentalRequestResponseDTO.java
│   │       │   ├── ErrorResponseDTO.java
│   │       │   ├── LoginRequestDTO.java
│   │       │   ├── OfferRequestDTO.java
│   │       │   ├── OfferResponseDTO.java
│   │       │   ├── PagedResponseDTO.java
│   │       │   ├── RegisterRequestDTO.java
│   │       │   ├── UpdateProfileRequestDTO.java
│   │       │   └── UserResponseDTO.java
│   │       │
│   │       ├── 📁 enums/          [Enumerations]
│   │       │   ├── AppointmentStatus.java
│   │       │   ├── DentalSpecialty.java
│   │       │   ├── NotificationType.java
│   │       │   ├── OfferStatus.java
│   │       │   ├── RequestStatus.java
│   │       │   └── Role.java
│   │       │
│   │       ├── 📁 exception/      [Custom exceptions]
│   │       │   ├── ConflictException.java
│   │       │   └── ResourceNotFoundException.java
│   │       │
│   │       └── 📁 WebSocketConfig/ [WebSocket configuration]
│   │
│   └── 📁 resources/              [Configuration & resources]
│       ├── 📄 application.yml      [Spring Boot main config]
│       ├── 📁 db/                 [Database files]
│       ├── 📁 static/             [Static web files]
│       └── 📁 templates/          [HTML templates]
│
└── 📁 test/                       [Test source code]
│
├── 📁 java/
│   └── 📁 backend/
│       └── 📁 repository/
│
└── 📁 resources/
└── 📄 application-test.yml [Spring Boot test config]
