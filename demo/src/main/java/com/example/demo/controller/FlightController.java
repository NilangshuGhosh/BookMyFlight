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
import org.springframework.data.domain.Sort;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/flights")
public class FlightController {

    private final FlightService flightService;

    public FlightController(FlightService flightService) {
        this.flightService = flightService;
    }

    /**
     * Search upcoming direct flights by source, destination, optional future/today date,
     * pagination, and sorting.
     * Example: GET /api/flights/search?source=CCU&destination=DEL&date=2026-11-15&page=0&size=5&sortBy=price_asc
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchFlights(
            @RequestParam String source,
            @RequestParam String destination,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "price_asc") String sortBy) {

        if (date != null && date.isBefore(LocalDate.now())) {
            return ResponseEntity.badRequest()
                    .body("Cannot search upcoming flights for a past date. Please use /api/flights/departed.");
        }

        Sort sort = switch (sortBy) {
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "basePrice");
            case "time_asc" -> Sort.by(Sort.Direction.ASC, "departureTime");
            default -> Sort.by(Sort.Direction.ASC, "basePrice");
        };

        Pageable pageable = PageRequest.of(page, size, sort);
        FlightSearchRequest searchRequest = new FlightSearchRequest(source, destination, date);
        Page<FlightResponse> flights = flightService.searchDirectFlights(searchRequest, pageable);
        return ResponseEntity.ok(flights);
    }

    /**
     * Get upcoming, non-departed flights with pagination.
     * Example: GET /api/flights/upcoming?page=0&size=10
     */
    @GetMapping("/upcoming")
    public ResponseEntity<Page<FlightResponse>> getUpcomingFlights(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<FlightResponse> flights = flightService.getAllUpcomingFlights(pageable);
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