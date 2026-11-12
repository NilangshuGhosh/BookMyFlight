package com.example.demo.controller;

import com.example.demo.dto.FlightCreateRequest;
import com.example.demo.dto.FlightResponse;
import com.example.demo.entity.Flight;
import com.example.demo.repository.AirportRepository;
import com.example.demo.repository.FlightRepository;
import com.example.demo.service.FlightService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/flights")
public class AdminFlightController {

    private final FlightRepository flightRepository;
    private final AirportRepository airportRepository;
    private final FlightService flightService;

    public AdminFlightController(FlightRepository flightRepository,
                                 AirportRepository airportRepository,
                                 FlightService flightService) {
        this.flightRepository = flightRepository;
        this.airportRepository = airportRepository;
        this.flightService = flightService;
    }

    /**
     * Paginated, searchable, and sortable flight inventory endpoint for AdminDashboard.
     * Example: GET /api/admin/flights?query=CCU&status=ALL&includeDeparted=false&sortBy=departure_asc&page=0&size=10
     */
    @GetMapping
    public ResponseEntity<Page<FlightResponse>> getAdminFlights(
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(defaultValue = "false") boolean includeDeparted,
            @RequestParam(defaultValue = "departure_asc") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Sort sort = switch (sortBy) {
            case "departure_desc" -> Sort.by(Sort.Direction.DESC, "departureTime");
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "basePrice");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "basePrice");
            case "id_desc" -> Sort.by(Sort.Direction.DESC, "id");
            default -> Sort.by(Sort.Direction.ASC, "departureTime");
        };

        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(flightService.getAdminFlights(query, status, includeDeparted, pageable));
    }

    /**
     * Create a brand new flight in the system with airport & schedule validation.
     */
    @PostMapping("/create")
    public ResponseEntity<?> createFlight(@Valid @RequestBody FlightCreateRequest request) {
        if (request.airline() == null || request.airline().isBlank()
                || request.flightNumber() == null || request.flightNumber().isBlank()
                || request.sourceAirportCode() == null || request.sourceAirportCode().isBlank()
                || request.destinationAirportCode() == null || request.destinationAirportCode().isBlank()
                || request.departureTime() == null || request.arrivalTime() == null
                || request.basePrice() == null) {
            return ResponseEntity.badRequest().body("All flight fields are required.");
        }

        String source = request.sourceAirportCode().trim().toUpperCase();
        String destination = request.destinationAirportCode().trim().toUpperCase();

        if (source.equals(destination)) {
            return ResponseEntity.badRequest().body("Source and destination airports must be different.");
        }
        if (!airportRepository.existsById(source)) {
            return ResponseEntity.badRequest().body("Invalid source airport code: " + source);
        }
        if (!airportRepository.existsById(destination)) {
            return ResponseEntity.badRequest().body("Invalid destination airport code: " + destination);
        }
        if (request.basePrice().compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body("Base price must be greater than zero.");
        }
        if (request.departureTime().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Departure time must be in the future.");
        }
        if (!request.departureTime().isBefore(request.arrivalTime())) {
            return ResponseEntity.badRequest().body("Departure time must be before arrival time.");
        }

        Flight newFlight = new Flight();
        newFlight.setAirline(request.airline().trim());
        newFlight.setFlightNumber(request.flightNumber().trim().toUpperCase());
        newFlight.setSourceAirportCode(source);
        newFlight.setDestinationAirportCode(destination);
        newFlight.setDepartureTime(request.departureTime());
        newFlight.setArrivalTime(request.arrivalTime());
        newFlight.setBasePrice(request.basePrice());
        newFlight.setStatus("SCHEDULED");
        newFlight.setDelayMinutes(0);
        newFlight.setTotalSeats(request.totalSeats());
        newFlight.setAvailableSeats(request.totalSeats());

        flightRepository.save(newFlight);

        return new ResponseEntity<>("Flight created successfully", HttpStatus.CREATED);
    }

    /**
     * Update the status of an existing upcoming flight.
     * Supports:
     * - DELAYED (requires delayMinutes > 0)
     * - SCHEDULED (reverts a wrongly delayed flight back to normal and clears delayMinutes)
     * - CANCELLED (terminal state; cannot be reverted once cancelled)
     */
    @PutMapping("/{flightId}/status")
    public ResponseEntity<String> updateFlightStatus(
            @PathVariable Long flightId,
            @RequestParam String newStatus,
            @RequestParam(required = false) Integer delayMinutes) {

        Flight flight = flightRepository.findById(flightId).orElse(null);
        if (flight == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Flight not found.");
        }

        if (flight.getDepartureTime().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Cannot modify a departed flight.");
        }

        if ("CANCELLED".equalsIgnoreCase(flight.getStatus())) {
            return ResponseEntity.badRequest().body("Cancelled flights cannot be modified or reverted.");
        }

        String targetStatus = newStatus != null ? newStatus.trim().toUpperCase() : "";

        switch (targetStatus) {
            case "DELAYED" -> {
                if (delayMinutes == null || delayMinutes <= 0) {
                    return ResponseEntity.badRequest().body("Please specify delay duration in minutes (greater than 0).");
                }
                flight.setStatus("DELAYED");
                flight.setDelayMinutes(delayMinutes);
            }
            case "SCHEDULED" -> {
                flight.setStatus("SCHEDULED");
                flight.setDelayMinutes(0);
            }
            case "CANCELLED" -> {
                flight.setStatus("CANCELLED");
                flight.setDelayMinutes(0);
            }
            default -> {
                return ResponseEntity.badRequest().body("Unsupported flight status: " + newStatus);
            }
        }

        flightRepository.save(flight);

        if ("DELAYED".equals(targetStatus)) {
            return ResponseEntity.ok("Flight delayed by " + delayMinutes + " minutes.");
        }
        return ResponseEntity.ok("Flight status updated to: " + targetStatus);
    }
}