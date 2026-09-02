package com.example.demo.service;

import com.example.demo.dto.FlightResponse;
import com.example.demo.dto.FlightSearchRequest;
import com.example.demo.entity.Flight;
import com.example.demo.repository.FlightRepository;
import org.springframework.stereotype.Service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
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

    @Override
    public Page<FlightResponse> getDepartedFlights(LocalDate date, Pageable pageable) {
        LocalDateTime now = LocalDateTime.now();
        Page<Flight> flights;
        
        if (date == null) {
            flights = flightRepository.findByDepartureTimeBeforeOrderByDepartureTimeDesc(now, pageable);
        } else {
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = date.plusDays(1).atStartOfDay().minusNanos(1);
            
            // If the requested date is today, we only want flights that have ALREADY departed today
            LocalDateTime end = endOfDay.isBefore(now) ? endOfDay : now;
            
            flights = flightRepository.findByDepartureTimeBetweenOrderByDepartureTimeDesc(startOfDay, end, pageable);
        }
        
        return flights.map(this::mapToResponse);
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