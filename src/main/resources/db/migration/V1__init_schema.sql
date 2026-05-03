-- V1__init_schema.sql

-- ============================================================
-- TABLE: users
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


CREATE TABLE users (
    id          UUID            NOT NULL DEFAULT gen_random_uuid(),
    email       VARCHAR(255)    NOT NULL,
    username    VARCHAR(100)    NOT NULL,
    password    VARCHAR(255)    NOT NULL,
    phone       VARCHAR(20),
    city        VARCHAR(100),
    address     VARCHAR(255),
    rating      DOUBLE PRECISION,
    specialty   VARCHAR(50),
    role        VARCHAR(20)     NOT NULL,
    created_at  TIMESTAMP       NOT NULL,

    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email)
);

-- ============================================================
-- TABLE: dental_requests
-- ============================================================
CREATE TABLE dental_requests (
    id                UUID            NOT NULL DEFAULT gen_random_uuid(),
    patient_public_id UUID            NOT NULL,
    description       TEXT,
    preferred_city    VARCHAR(100),
    budget_max        DOUBLE PRECISION,
    created_at        TIMESTAMP       NOT NULL,
    updated_at        TIMESTAMP,
    status            VARCHAR(50)     NOT NULL,
    specialty         VARCHAR(50)     NOT NULL,

    CONSTRAINT pk_dental_requests PRIMARY KEY (id)
);

-- ============================================================
-- TABLE: offers
-- ============================================================
CREATE TABLE offers (
    id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
    request_id          UUID            NOT NULL,
    dentist_public_id   UUID            NOT NULL,
    price               NUMERIC(10,2)   NOT NULL,
    estimated_wait_days INTEGER         NOT NULL,
    notes               TEXT,
    includes_xray       BOOLEAN         NOT NULL,
    includes_anesthesia BOOLEAN         NOT NULL,
    created_at          TIMESTAMP       NOT NULL,
    updated_at          TIMESTAMP,
    status              VARCHAR(30)     NOT NULL,

    CONSTRAINT pk_offers PRIMARY KEY (id),
    CONSTRAINT fk_offers_request FOREIGN KEY (request_id)
        REFERENCES dental_requests(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: appointments
-- ============================================================
CREATE TABLE appointments (
    id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
    offer_id            UUID            NOT NULL,
    patient_public_id   UUID            NOT NULL,
    dentist_public_id   UUID            NOT NULL,
    scheduled_at        TIMESTAMP       NOT NULL,
    confirmed_price     NUMERIC(10,2)   NOT NULL,
    created_at          TIMESTAMP       NOT NULL,
    status              VARCHAR(30)     NOT NULL,

    CONSTRAINT pk_appointments PRIMARY KEY (id),
    CONSTRAINT fk_appointments_offer FOREIGN KEY (offer_id)
        REFERENCES offers(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE notifications (
    id           UUID        NOT NULL DEFAULT gen_random_uuid(),
    recipient_id UUID        NOT NULL,
    payload      TEXT,
    is_read      BOOLEAN     NOT NULL,
    created_at   TIMESTAMP   NOT NULL,
    type         VARCHAR(50) NOT NULL,

    CONSTRAINT pk_notifications PRIMARY KEY (id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_dental_requests_patient   ON dental_requests(patient_public_id);
CREATE INDEX idx_dental_requests_status    ON dental_requests(status);
CREATE INDEX idx_dental_requests_specialty ON dental_requests(specialty);
CREATE INDEX idx_dental_requests_city      ON dental_requests(preferred_city);

CREATE INDEX idx_offers_request_id        ON offers(request_id);
CREATE INDEX idx_offers_dentist_public_id ON offers(dentist_public_id);
CREATE INDEX idx_offers_status            ON offers(status);

CREATE INDEX idx_appointments_offer_id          ON appointments(offer_id);
CREATE INDEX idx_appointments_patient_public_id ON appointments(patient_public_id);
CREATE INDEX idx_appointments_dentist_public_id ON appointments(dentist_public_id);
CREATE INDEX idx_appointments_status            ON appointments(status);

CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_type         ON notifications(type);