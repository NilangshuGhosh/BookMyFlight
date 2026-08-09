package com.example.demo.service;

import com.example.demo.dto.FlightResponse;
import com.example.demo.dto.FlightSearchRequest;
import com.example.demo.entity.Flight;
import com.example.demo.repository.FlightRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FlightServiceImpl implements FlightService {

    private final FlightRepository flightRepository;

    public FlightServiceImpl(FlightRepository flightRepository) {
        this.flightRepository = flightRepository;
    }

    @Override
    public List<FlightResponse> searchDirectFlights(FlightSearchRequest request) {
        LocalDateTime now = LocalDateTime.now();
        List<Flight> flights = flightRepository
                .findBySourceAirportCodeAndDestinationAirportCodeAndDepartureTimeAfter(
                        request.source().toUpperCase(),
                        request.destination().toUpperCase(),
                        now
                );

        return flights.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<FlightResponse> getAllUpcomingFlights() {
        return flightRepository.findAll().stream()
                .filter(f -> f.getDepartureTime().isAfter(LocalDateTime.now()))
                .map(this::mapToResponse)
                .toList();
    }

    private FlightResponse mapToResponse(Flight flight) {
        return new FlightResponse(
                flight.getId(),
                flight.getFlightNumber(),
                flight.getAirline(),
                flight.getSourceAirportCode(),
                flight.getDestinationAirportCode(),
                flight.getDepartureTime(),
                flight.getArrivalTime(),
                flight.getBasePrice(),
                flight.getStatus()
        );
    }
}