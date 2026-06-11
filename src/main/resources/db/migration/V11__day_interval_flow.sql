-- V11__day_interval_flow.sql
-- Reshapes the request/offer/appointment flow to be day-interval based:
--   * Patients pick up to 3 cities (one shared availability window).
--   * Offers carry a procedure length (days) + 1-2 date-range variations,
--     instead of an estimated-wait number and three exact datetime slots.
--   * Appointments store a start/end date instead of a single timestamp.

-- ── dental_requests: single city → up to 3 cities (comma-joined) ──
ALTER TABLE dental_requests ADD COLUMN preferred_cities VARCHAR(400);
UPDATE dental_requests SET preferred_cities = preferred_city WHERE preferred_city IS NOT NULL;
DROP INDEX IF EXISTS idx_dental_requests_city;
ALTER TABLE dental_requests DROP COLUMN preferred_city;

-- ── offers: drop wait-days + datetime slots; add procedure length + variations ──
-- New columns are nullable so the migration survives any pre-existing rows;
-- required-ness for new offers is enforced at the DTO layer.
ALTER TABLE offers
    DROP COLUMN estimated_wait_days,
    DROP COLUMN proposed_slot_1,
    DROP COLUMN proposed_slot_2,
    DROP COLUMN proposed_slot_3,
    ADD COLUMN procedure_days INTEGER,
    ADD COLUMN variant1_start DATE,
    ADD COLUMN variant1_end   DATE,
    ADD COLUMN variant2_start DATE,
    ADD COLUMN variant2_end   DATE;

-- ── appointments: single timestamp → date interval ──
ALTER TABLE appointments
    DROP COLUMN scheduled_at,
    ADD COLUMN start_date DATE,
    ADD COLUMN end_date   DATE;

-- ── recreate get_patient_history to reflect the new columns ──
CREATE OR REPLACE PROCEDURE get_patient_history(
    IN p_patient_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
DROP TABLE IF EXISTS _ph_requests;
CREATE TEMP TABLE _ph_requests AS
SELECT
    id,
    patient_public_id,
    description,
    preferred_cities,
    budget_max,
    created_at,
    updated_at,
    status,
    specialty
FROM dental_requests
WHERE patient_public_id = p_patient_id
ORDER BY created_at DESC;

DROP TABLE IF EXISTS _ph_appointments;
CREATE TEMP TABLE _ph_appointments AS
SELECT
    a.id,
    a.offer_id,
    a.patient_public_id,
    a.dentist_public_id,
    a.start_date,
    a.end_date,
    a.confirmed_price,
    a.created_at,
    a.status
FROM appointments a
WHERE a.patient_public_id = p_patient_id
ORDER BY a.created_at DESC;
END;
$$;
