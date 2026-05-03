-- V2__procedures_and_triggers.sql
-- Stored procedures and triggers for Smiling Wallet

-- ============================================================
-- STORED PROCEDURE: get_clinic_stats(dentist_id)
-- Replaces DashboardService.getClinicStats() stream logic
-- Returns: total_offers, accepted, pending, rejected,
--          acceptance_rate_percent, total_revenue
-- ============================================================
CREATE OR REPLACE PROCEDURE get_clinic_stats(
    IN  p_dentist_id            UUID,
    OUT p_total_offers          BIGINT,
    OUT p_accepted_offers       BIGINT,
    OUT p_pending_offers        BIGINT,
    OUT p_rejected_offers       BIGINT,
    OUT p_acceptance_rate       NUMERIC(5,2),
    OUT p_total_revenue         NUMERIC(12,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
SELECT
    COUNT(*)                                                                 AS total_offers,
    COUNT(*) FILTER (WHERE status = 'ACCEPTED')                             AS accepted_offers,
    COUNT(*) FILTER (WHERE status = 'PENDING')                              AS pending_offers,
    COUNT(*) FILTER (WHERE status = 'REJECTED')                             AS rejected_offers,
    CASE
        WHEN COUNT(*) = 0 THEN 0.00
        ELSE ROUND(
                COUNT(*) FILTER (WHERE status = 'ACCEPTED')::NUMERIC
                / COUNT(*)::NUMERIC * 100, 2)
        END                                                                      AS acceptance_rate,
    COALESCE(SUM(price) FILTER (WHERE status = 'ACCEPTED'), 0.00)           AS total_revenue
INTO
    p_total_offers,
    p_accepted_offers,
    p_pending_offers,
    p_rejected_offers,
    p_acceptance_rate,
    p_total_revenue
FROM offers
WHERE dentist_public_id = p_dentist_id;
END;
$$;


-- ============================================================
-- STORED PROCEDURE: get_patient_history(patient_id)
-- Returns two result sets via temp tables:
--   1. dental_requests for this patient (newest first)
--   2. appointments for this patient   (newest first)
-- Callers read from temp tables: _ph_requests, _ph_appointments
-- ============================================================
CREATE OR REPLACE PROCEDURE get_patient_history(
    IN p_patient_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- requests summary
DROP TABLE IF EXISTS _ph_requests;
CREATE TEMP TABLE _ph_requests AS
SELECT
    id,
    patient_public_id,
    description,
    preferred_city,
    budget_max,
    created_at,
    updated_at,
    status,
    specialty
FROM dental_requests
WHERE patient_public_id = p_patient_id
ORDER BY created_at DESC;

-- appointments summary
DROP TABLE IF EXISTS _ph_appointments;
CREATE TEMP TABLE _ph_appointments AS
SELECT
    a.id,
    a.offer_id,
    a.patient_public_id,
    a.dentist_public_id,
    a.scheduled_at,
    a.confirmed_price,
    a.created_at,
    a.status
FROM appointments a
WHERE a.patient_public_id = p_patient_id
ORDER BY a.created_at DESC;
END;
$$;


-- ============================================================
-- TRIGGER 1: after_offer_accepted
-- When an offer's status changes to ACCEPTED:
--   → Set all other PENDING offers on the same request to REJECTED
-- Replaces the forEach loop in OfferService.acceptOffer()
-- ============================================================
CREATE OR REPLACE FUNCTION fn_reject_other_offers()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only fire when status transitions TO 'ACCEPTED'
    IF NEW.status = 'ACCEPTED' AND OLD.status <> 'ACCEPTED' THEN
UPDATE offers
SET
    status     = 'REJECTED',
    updated_at = NOW()
WHERE
    request_id = NEW.request_id
  AND id     <> NEW.id
  AND status = 'PENDING';
END IF;

RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_after_offer_accepted
AFTER UPDATE OF status ON offers
    FOR EACH ROW
    EXECUTE FUNCTION fn_reject_other_offers();


-- ============================================================
-- TRIGGER 2: after_appointment_created
-- When a new appointment row is inserted:
--   → Set the linked dental_request status to 'OFFER_ACCEPTED'
-- Replaces requestRepository.save(request) in OfferService.acceptOffer()
-- ============================================================
CREATE OR REPLACE FUNCTION fn_close_request_on_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
UPDATE dental_requests
SET
    status     = 'OFFER_ACCEPTED',
    updated_at = NOW()
WHERE id = (
    SELECT request_id
    FROM offers
    WHERE id = NEW.offer_id
);

RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_after_appointment_created
AFTER INSERT ON appointments
FOR EACH ROW
EXECUTE FUNCTION fn_close_request_on_appointment();