-- ==============================================================================
-- Flyway Migration V8: Performance & Partial B-Tree Indexes
-- ==============================================================================
-- Eliminates sequential table scans across flight discovery, departed flight
-- lookups, user booking history, and relational foreign-key joins.

-- 1. Partial composite index for public direct flight search between two airports.
-- Excludes CANCELLED flights to keep index size compact in memory.
CREATE INDEX IF NOT EXISTS idx_flights_route_departure
ON flights (source_airport, destination_airport, departure_time)
WHERE UPPER(status) <> 'CANCELLED';

-- 2. Index for chronological flight sorting (upcoming flights and departed flights).
-- Eliminates in-memory sort operations on GET /api/flights/departed and /upcoming.
CREATE INDEX IF NOT EXISTS idx_flights_departure_time
ON flights (departure_time DESC);

-- 3. Composite index for user dashboard bookings history.
-- Speeds up GET /api/bookings/my-bookings by user, sorted by most recent first.
CREATE INDEX IF NOT EXISTS idx_bookings_user_created
ON bookings (user_id, created_at DESC);

-- 4. Foreign key index on flight_id in bookings.
-- PostgreSQL does not automatically index foreign keys; this optimizes joins
-- in admin queries and seat backfill calculations.
CREATE INDEX IF NOT EXISTS idx_bookings_flight_id
ON bookings (flight_id);

-- 5. Foreign key index on booking_id in booking_passengers.
-- Optimizes multi-passenger lookups and cascade deletes per booking.
CREATE INDEX IF NOT EXISTS idx_booking_passengers_booking_id
ON booking_passengers (booking_id);
