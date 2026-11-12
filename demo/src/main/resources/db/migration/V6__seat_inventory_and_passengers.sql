-- Add seat inventory columns to flights
ALTER TABLE flights ADD COLUMN IF NOT EXISTS total_seats INTEGER NOT NULL DEFAULT 180;
ALTER TABLE flights ADD COLUMN IF NOT EXISTS available_seats INTEGER NOT NULL DEFAULT 180;

-- Add seats_booked and updated_at to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS seats_booked INTEGER NOT NULL DEFAULT 1;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Backfill available_seats on existing flights based on already-confirmed bookings
UPDATE flights f
SET available_seats = GREATEST(
    0,
    f.total_seats - COALESCE((
        SELECT SUM(b.seats_booked)
        FROM bookings b
        WHERE b.flight_id = f.id AND UPPER(b.status) = 'CONFIRMED'
    ), 0)
);

-- Enforce seat inventory invariants at the database level
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_flights_total_seats') THEN
        ALTER TABLE flights ADD CONSTRAINT chk_flights_total_seats CHECK (total_seats > 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_flights_available_seats') THEN
        ALTER TABLE flights ADD CONSTRAINT chk_flights_available_seats CHECK (available_seats >= 0 AND available_seats <= total_seats);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_bookings_seats_booked') THEN
        ALTER TABLE bookings ADD CONSTRAINT chk_bookings_seats_booked CHECK (seats_booked > 0);
    END IF;
END $$;

-- Future-proof passenger details table for multi-passenger PNR breakdown
CREATE TABLE IF NOT EXISTS booking_passengers (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(20),
    seat_number VARCHAR(10)
);
