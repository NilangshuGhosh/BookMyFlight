package com.example.demo.controller;

import com.example.demo.dto.FlightCreateRequest;
import com.example.demo.entity.Flight;
import com.example.demo.repository.FlightRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/flights")
@CrossOrigin(origins = "*")
public class AdminFlightController {

    private final FlightRepository flightRepository;

    public AdminFlightController(FlightRepository flightRepository) {
        this.flightRepository = flightRepository;
    }

    /**
     * Create a brand new flight in the system.
     */
    @PostMapping("/create")
    public ResponseEntity<?> createFlight(@RequestBody FlightCreateRequest request) {
        
        // Basic validation
        if (request.departureTime().isAfter(request.arrivalTime())) {
            return ResponseEntity.badRequest().body("Departure time must be before arrival time.");
        }

        Flight newFlight = new Flight();
        newFlight.setAirline(request.airline());
        newFlight.setFlightNumber(request.flightNumber().toUpperCase());
        newFlight.setSourceAirportCode(request.sourceAirportCode().toUpperCase());
        newFlight.setDestinationAirportCode(request.destinationAirportCode().toUpperCase());
        newFlight.setDepartureTime(request.departureTime());
        newFlight.setArrivalTime(request.arrivalTime());
        newFlight.setBasePrice(request.basePrice());
        newFlight.setStatus("SCHEDULED"); // Default status

        flightRepository.save(newFlight);

        return new ResponseEntity<>("Flight created successfully", HttpStatus.CREATED);
    }

    /**
     * Update the status of an existing flight.
     */
    @PutMapping("/{flightId}/status")
    public ResponseEntity<String> updateFlightStatus(
            @PathVariable Long flightId, 
            @RequestParam String newStatus) {

        Flight flight = flightRepository.findById(flightId)
                .orElseThrow(() -> new IllegalArgumentException("Flight not found"));

        if (flight.getDepartureTime().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Cannot modify a departed flight.");
        }

        flight.setStatus(newStatus.toUpperCase());
        flightRepository.save(flight);

        return ResponseEntity.ok("Flight status updated to: " + newStatus);
    }
}