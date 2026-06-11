-- V12__backfill_day_interval_columns.sql
-- Rows created before V11 have NULL in the new day-interval columns. Offer.procedureDays
-- is a primitive int (Hibernate fails to load NULLs) and appointment start/end are
-- non-null in the entity, so backfill legacy rows and enforce NOT NULL going forward.

UPDATE offers
SET procedure_days = COALESCE(procedure_days, 1),
    variant1_start = COALESCE(variant1_start, created_at::date),
    variant1_end   = COALESCE(variant1_end,   created_at::date)
WHERE procedure_days IS NULL OR variant1_start IS NULL OR variant1_end IS NULL;

UPDATE appointments
SET start_date = COALESCE(start_date, created_at::date),
    end_date   = COALESCE(end_date,   created_at::date)
WHERE start_date IS NULL OR end_date IS NULL;

ALTER TABLE offers       ALTER COLUMN procedure_days SET NOT NULL;
ALTER TABLE appointments ALTER COLUMN start_date     SET NOT NULL;
ALTER TABLE appointments ALTER COLUMN end_date       SET NOT NULL;
