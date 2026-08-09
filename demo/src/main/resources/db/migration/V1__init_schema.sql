CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'USER'
);

CREATE TABLE IF NOT EXISTS airports (
    airport_code VARCHAR(10) PRIMARY KEY,
    city_name VARCHAR(100) NOT NULL,
    airport_name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS flights (
    id BIGSERIAL PRIMARY KEY,
    flight_number VARCHAR(50) NOT NULL,
    airline VARCHAR(100) NOT NULL,
    source_airport VARCHAR(10) REFERENCES airports(airport_code),
    destination_airport VARCHAR(10) REFERENCES airports(airport_code),
    departure_time TIMESTAMP NOT NULL,
    arrival_time TIMESTAMP NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'SCHEDULED'
);

CREATE TABLE IF NOT EXISTS bookings (
    id BIGSERIAL PRIMARY KEY,
    pnr VARCHAR(10) UNIQUE NOT NULL,
    user_id BIGINT REFERENCES users(id),
    flight_id BIGINT REFERENCES flights(id),
    total_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'CONFIRMED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);