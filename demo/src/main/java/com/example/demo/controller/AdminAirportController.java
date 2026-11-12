package com.example.demo.controller;

import com.example.demo.dto.AirportCreateRequest;
import com.example.demo.entity.Airport;
import com.example.demo.service.AirportService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/airports")
public class AdminAirportController {

    private final AirportService airportService;

    public AdminAirportController(AirportService airportService) {
        this.airportService = airportService;
    }

    /**
     * Paginated & searchable list of airports for Admin Airport Management.
     * Example: GET /api/admin/airports?query=del&page=0&size=8&sortBy=city_asc
     */
    @GetMapping
    public ResponseEntity<Page<Airport>> getAirports(
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size,
            @RequestParam(defaultValue = "city_asc") String sortBy) {

        Sort sort = switch (sortBy) {
            case "name_asc" -> Sort.by(Sort.Direction.ASC, "airportName");
            case "code_asc" -> Sort.by(Sort.Direction.ASC, "airportCode");
            default -> Sort.by(Sort.Direction.ASC, "cityName");
        };

        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(airportService.getAirportsForAdmin(query, pageable));
    }

    /**
     * Create a new airport entry after verifying uniqueness of both code and name.
     * Example: POST /api/admin/airports/create
     */
    @PostMapping("/create")
    public ResponseEntity<?> createAirport(@Valid @RequestBody AirportCreateRequest request) {
        try {
            Airport saved = airportService.createAirport(request);
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }
}
