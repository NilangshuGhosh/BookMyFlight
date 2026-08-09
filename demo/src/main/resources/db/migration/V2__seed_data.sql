-- Insert Major Airports
INSERT INTO airports (airport_code, city_name, airport_name) VALUES
('CCU', 'Kolkata', 'Netaji Subhas Chandra Bose International Airport'),
('DEL', 'Delhi', 'Indira Gandhi International Airport'),
('BLR', 'Bengaluru', 'Kempegowda International Airport'),
('BOM', 'Mumbai', 'Chhatrapati Shivaji Maharaj International Airport')
ON CONFLICT (airport_code) DO NOTHING;

-- Insert Flights (Dates set in the future to pass the "after current time" check)
INSERT INTO flights (flight_number, airline, source_airport, destination_airport, departure_time, arrival_time, base_price, status) VALUES
-- Direct: Kolkata to Delhi
('6E-101', 'IndiGo', 'CCU', 'DEL', '2026-08-20 08:00:00', '2026-08-20 10:30:00', 6500.00, 'SCHEDULED'),

-- Leg 1: Kolkata to Bengaluru
('6E-205', 'IndiGo', 'CCU', 'BLR', '2026-08-20 09:00:00', '2026-08-20 11:30:00', 5000.00, 'SCHEDULED'),

-- Leg 2: Bengaluru to Delhi (Leaves after Leg 1 arrives)
('6E-310', 'IndiGo', 'BLR', 'DEL', '2026-08-20 14:00:00', '2026-08-20 16:45:00', 5500.00, 'SCHEDULED')
;