package com.example.demo.service;

import com.example.demo.dto.AirportCreateRequest;
import com.example.demo.entity.Airport;
import com.example.demo.repository.AirportRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class AirportServiceImpl implements AirportService {

    private final AirportRepository airportRepository;

    public AirportServiceImpl(AirportRepository airportRepository) {
        this.airportRepository = airportRepository;
    }

    @Override
    public Page<Airport> getAirportsForAdmin(String query, Pageable pageable) {
        String sanitizedQuery = query != null ? query.trim() : "";
        return airportRepository.searchAirports(sanitizedQuery, pageable);
    }

    @Override
    public Airport createAirport(AirportCreateRequest request) {
        if (request == null
                || request.airportCode() == null || request.airportCode().isBlank()
                || request.cityName() == null || request.cityName().isBlank()
                || request.airportName() == null || request.airportName().isBlank()) {
            throw new IllegalArgumentException("Airport code, city name, and airport name are all required.");
        }

        String code = request.airportCode().trim().toUpperCase();
        String city = request.cityName().trim();
        String name = request.airportName().trim();

        if (!code.matches("^[A-Z0-9]{2,10}$")) {
            throw new IllegalArgumentException("Airport code must be 2 to 10 alphanumeric characters (e.g., HYD).");
        }
        if (city.length() > 100) {
            throw new IllegalArgumentException("City name must be 100 characters or fewer.");
        }
        if (name.length() > 255) {
            throw new IllegalArgumentException("Airport name must be 255 characters or fewer.");
        }

        if (airportRepository.existsByAirportCodeIgnoreCase(code)) {
            throw new IllegalStateException("An airport with code '" + code + "' already exists.");
        }
        if (airportRepository.existsByAirportNameIgnoreCase(name)) {
            throw new IllegalStateException("An airport with name '" + name + "' already exists.");
        }

        Airport newAirport = new Airport(code, city, name);
        return airportRepository.save(newAirport);
    }
}
