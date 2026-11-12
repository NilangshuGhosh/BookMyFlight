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

@Service
public class FlightServiceImpl implements FlightService {

    private final FlightRepository flightRepository;

    public FlightServiceImpl(FlightRepository flightRepository) {
        this.flightRepository = flightRepository;
    }

    @Override
    public Page<FlightResponse> searchDirectFlights(FlightSearchRequest request, Pageable pageable) {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        String source = request.source().trim().toUpperCase();
        String destination = request.destination().trim().toUpperCase();

        if (request.date() == null) {
            return flightRepository
                    .findBySourceAirportCodeAndDestinationAirportCodeAndDepartureTimeAfter(
                            source, destination, now, pageable)
                    .map(this::mapToResponse);
        }

        // Freeze past dates: never return departed/past flights from upcoming flight search
        if (request.date().isBefore(today)) {
            return Page.empty(pageable);
        }

        // If searching for today, only return flights departing from `now` until end of today.
        // If searching for a future date, return strictly that day's flights [00:00, next day 00:00).
        LocalDateTime start = request.date().isEqual(today) ? now : request.date().atStartOfDay();
        LocalDateTime nextDayStart = request.date().plusDays(1).atStartOfDay();

        return flightRepository
                .findUpcomingDirectFlightsInRange(source, destination, start, nextDayStart, pageable)
                .map(this::mapToResponse);
    }

    @Override
    public Page<FlightResponse> getAllUpcomingFlights(Pageable pageable) {
        return flightRepository
                .findByDepartureTimeAfterOrderByDepartureTimeAsc(LocalDateTime.now(), pageable)
                .map(this::mapToResponse);
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

    @Override
    public Page<FlightResponse> getAdminFlights(String query, String status, boolean includeDeparted, Pageable pageable) {
        String sanitizedQuery = query != null ? query.trim() : "";
        Long queryId = null;
        if (sanitizedQuery.matches("^\\d+$")) {
            try {
                queryId = Long.parseLong(sanitizedQuery);
            } catch (NumberFormatException ignored) {
                queryId = null;
            }
        }
        String normalizedStatus = (status != null && !status.isBlank()) ? status.trim().toUpperCase() : "ALL";
        return flightRepository
                .searchAdminFlights(sanitizedQuery, queryId, normalizedStatus, includeDeparted, LocalDateTime.now(), pageable)
                .map(this::mapToResponse);
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
                flight.getStatus(),
                flight.getDelayMinutes() != null ? flight.getDelayMinutes() : 0,
                flight.getTotalSeats() != null ? flight.getTotalSeats() : 180,
                flight.getAvailableSeats() != null ? flight.getAvailableSeats() : 180
        );
    }
}