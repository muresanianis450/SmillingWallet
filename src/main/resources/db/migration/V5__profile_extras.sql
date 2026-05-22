-- V5__profile_extras.sql

ALTER TABLE users ADD COLUMN profile_picture TEXT;
ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN email_reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE;
