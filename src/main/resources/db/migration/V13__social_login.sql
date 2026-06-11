-- V13__social_login.sql
-- Adds support for social login (Google / Apple).
-- Social accounts have no local password, so password becomes nullable.

ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL';
ALTER TABLE users ADD COLUMN provider_id   VARCHAR(255);

-- Fast lookup when matching a returning social user by (provider, provider_id).
CREATE INDEX idx_users_provider ON users (auth_provider, provider_id);
