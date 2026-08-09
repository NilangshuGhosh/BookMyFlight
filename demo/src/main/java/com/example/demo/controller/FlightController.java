package com.example.demo.controller;

import com.example.demo.dto.FlightResponse;
import com.example.demo.dto.FlightSearchRequest;
import com.example.demo.service.FlightService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}