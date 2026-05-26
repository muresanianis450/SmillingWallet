-- Dentist accounts created via admin invite start as inactive
-- (account_active = FALSE) until the clinic sets their password.
-- All existing accounts default to TRUE so nothing breaks.
ALTER TABLE users ADD COLUMN account_active BOOLEAN NOT NULL DEFAULT TRUE;
