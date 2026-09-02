package com.example.demo.controller;

import com.example.demo.dto.FlightResponse;
import com.example.demo.dto.FlightSearchRequest;
import com.example.demo.service.FlightService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/flights")
@CrossOrigin(origins = "*") // Allows React frontend requests during development
public class FlightController {

    private final FlightService flightService;

    public FlightController(FlightService flightService) {
        this.flightService = flightService;
    }

    /**
     * Search direct flights by source, destination, and optional date.
     * Example: GET /api/flights/search?source=CCU&destination=DEL&date=2026-08-20
     */
    @GetMapping("/search")
    public ResponseEntity<List<FlightResponse>> searchFlights(
            @RequestParam String source,
            @RequestParam String destination,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        FlightSearchRequest searchRequest = new FlightSearchRequest(source, destination, date);
        List<FlightResponse> flights = flightService.searchDirectFlights(searchRequest);
        return ResponseEntity.ok(flights);
    }

    /**
     * Get all upcoming, non-departed flights.
     * Example: GET /api/flights/upcoming
     */
    @GetMapping("/upcoming")
    public ResponseEntity<List<FlightResponse>> getUpcomingFlights() {
        List<FlightResponse> flights = flightService.getAllUpcomingFlights();
        return ResponseEntity.ok(flights);
    }

    /**
     * Get departed flights with pagination and optional date filter.
     * Example: GET /api/flights/departed?page=0&size=10&date=2026-08-20
     */
    @GetMapping("/departed")
    public ResponseEntity<Page<FlightResponse>> getDepartedFlights(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<FlightResponse> flights = flightService.getDepartedFlights(date, pageable);
        return ResponseEntity.ok(flights);
    }
}