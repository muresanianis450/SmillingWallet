-- V9__slot_scheduling.sql
-- Adds availability date range to dental_requests and proposed time slots to offers.

ALTER TABLE dental_requests
    ADD COLUMN available_from DATE,
    ADD COLUMN available_to   DATE;

ALTER TABLE offers
    ADD COLUMN proposed_slot_1 TIMESTAMP,
    ADD COLUMN proposed_slot_2 TIMESTAMP,
    ADD COLUMN proposed_slot_3 TIMESTAMP;
