-- V14__request_files.sql
-- Patient-uploaded attachments for a dental request (CT scans / X-rays).
-- The blob lives in Cloudflare R2; this table holds only metadata + the object key.

CREATE TABLE request_files (
    id           UUID         NOT NULL DEFAULT gen_random_uuid(),
    request_id   UUID         NOT NULL,
    uploader_id  UUID         NOT NULL,
    file_name    VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    size_bytes   BIGINT       NOT NULL,
    object_key   VARCHAR(512) NOT NULL,
    created_at   TIMESTAMP    NOT NULL,

    CONSTRAINT pk_request_files PRIMARY KEY (id),
    CONSTRAINT fk_request_files_request FOREIGN KEY (request_id)
        REFERENCES dental_requests(id) ON DELETE CASCADE,
    CONSTRAINT uq_request_files_object_key UNIQUE (object_key)
);

CREATE INDEX idx_request_files_request ON request_files(request_id);
