create unique index if not exists 
uq_airports_name_lower ON
airports (LOWER(airport_name));