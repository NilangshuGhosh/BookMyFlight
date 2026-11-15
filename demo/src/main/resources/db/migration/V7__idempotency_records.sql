-- ==============================================================================
-- Flyway Migration V7: Idempotency Records for Booking Deduplication
-- ==============================================================================
-- Stores unique client idempotency keys scoped per user to guarantee that
-- duplicate network requests, accidental double-clicks, or automated retries
-- never create duplicate bookings or decrement flight seat inventory twice.

CREATE TABLE idempotency_records (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    idempotency_key VARCHAR(128) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    endpoint VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'IN_PROGRESS', 'COMPLETED'
    response_status_code INT,
    response_body TEXT,
    booking_id BIGINT REFERENCES bookings(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT uq_user_idempotency_key UNIQUE (user_id, idempotency_key)
);

-- Index for instant lookup by user and idempotency key
CREATE INDEX idx_idempotency_lookup ON idempotency_records (user_id, idempotency_key);

-- Index for the daily scheduled cleanup of expired keys
CREATE INDEX idx_idempotency_expires_at ON idempotency_records (expires_at);
