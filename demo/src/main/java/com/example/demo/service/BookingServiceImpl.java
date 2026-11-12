package com.example.demo.service;

import com.example.demo.dto.AdminBookingResponse;
import com.example.demo.dto.BookingRequest;
import com.example.demo.dto.BookingResponse;
import com.example.demo.entity.Booking;
import com.example.demo.entity.Flight;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.FlightRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final FlightRepository flightRepository;
    private static final String PNR_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    public BookingServiceImpl(BookingRepository bookingRepository, FlightRepository flightRepository) {
        this.bookingRepository = bookingRepository;
        this.flightRepository = flightRepository;
    }

    @Override
    @Transactional
    public BookingResponse createBooking(BookingRequest request, Long userId) {
        if (request == null || request.flightId() == null) {
            throw new IllegalArgumentException("Flight ID is required.");
        }

        Flight flight = flightRepository.findById(request.flightId())
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with ID: " + request.flightId()));

        // Hard business constraint: Do not allow booking past/departed or cancelled flights
        if (flight.getDepartureTime().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Cannot book a flight that has already departed.");
        }
        if ("CANCELLED".equalsIgnoreCase(flight.getStatus())) {
            throw new IllegalStateException("Cannot book a cancelled flight.");
        }

        String uniquePnr = generatePnr();

        Booking booking = new Booking();
        booking.setPnr(uniquePnr);
        booking.setUserId(userId);
        booking.setFlightId(flight.getId());
        booking.setTotalPrice(flight.getBasePrice());
        booking.setStatus("CONFIRMED");

        Booking savedBooking = bookingRepository.save(booking);

        return mapToResponse(savedBooking, flight);
    }

    @Override
    public BookingResponse getBookingByPnr(String pnr, Long userId, boolean isAdmin) {
        if (pnr == null || pnr.isBlank()) {
            throw new IllegalArgumentException("PNR is required.");
        }

        String normalizedPnr = pnr.trim().toUpperCase();
        Booking booking = bookingRepository.findByPnr(normalizedPnr)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found for PNR: " + normalizedPnr));

        if (!isAdmin && (userId == null || !Objects.equals(booking.getUserId(), userId))) {
            throw new ResourceNotFoundException("Booking not found for PNR: " + normalizedPnr);
        }

        Flight flight = booking.getFlightId() != null
                ? flightRepository.findById(booking.getFlightId()).orElse(null)
                : null;

        return mapToResponse(booking, flight);
    }

    @Override
    public List<BookingResponse> getUserBookings(Long userId) {
        List<Booking> bookings = bookingRepository.findByUserId(userId);
        List<Long> flightIds = bookings.stream()
                .map(Booking::getFlightId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Map<Long, Flight> flightsById = flightRepository.findAllById(flightIds).stream()
                .collect(Collectors.toMap(Flight::getId, Function.identity()));

        return bookings.stream()
                .map(booking -> mapToResponse(booking, flightsById.get(booking.getFlightId())))
                .toList();
    }

    @Override
    public Page<AdminBookingResponse> getAdminBookings(String query, String status, Pageable pageable) {
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
        return bookingRepository.searchAdminBookings(sanitizedQuery, queryId, normalizedStatus, pageable);
    }

    private String generatePnr() {
        StringBuilder pnr = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            pnr.append(PNR_CHARACTERS.charAt(RANDOM.nextInt(PNR_CHARACTERS.length())));
        }
        return pnr.toString();
    }

    private BookingResponse mapToResponse(Booking booking, Flight flight) {
        return new BookingResponse(
                booking.getId(),
                booking.getPnr(),
                booking.getFlightId(),
                flight != null ? flight.getFlightNumber() : "N/A",
                flight != null ? flight.getAirline() : "N/A",
                flight != null ? flight.getSourceAirportCode() : "N/A",
                flight != null ? flight.getDestinationAirportCode() : "N/A",
                booking.getTotalPrice(),
                booking.getStatus(),
                booking.getCreatedAt()
        );
    }
}
