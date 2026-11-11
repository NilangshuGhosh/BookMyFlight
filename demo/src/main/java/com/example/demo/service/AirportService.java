package com.example.demo.service;

import com.example.demo.dto.AirportCreateRequest;
import com.example.demo.entity.Airport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AirportService {
    Page<Airport> getAirportsForAdmin(String query, Pageable pageable);
    Airport createAirport(AirportCreateRequest request);
}
