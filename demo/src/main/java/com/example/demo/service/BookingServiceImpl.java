package com.example.demo.service;

import com.example.demo.dto.BookingRequest;
import com.example.demo.dto.BookingResponse;
import com.example.demo.entity.Booking;
import com.example.demo.entity.Flight;
import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.FlightRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

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
        Flight flight = flightRepository.findById(request.flightId())
                .orElseThrow(() -> new IllegalArgumentException("Flight not found with ID: " + request.flightId()));

        // Hard business constraint: Do not allow booking past/departed flights
        if (flight.getDepartureTime().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Cannot book a flight that has already departed.");
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
    public BookingResponse getBookingByPnr(String pnr) {
        Booking booking = bookingRepository.findByPnr(pnr.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Booking not found for PNR: " + pnr));

        Flight flight = flightRepository.findById(booking.getFlightId())
                .orElseThrow(() -> new IllegalArgumentException("Flight details not found"));

        return mapToResponse(booking, flight);
    }

    @Override
    public List<BookingResponse> getUserBookings(Long userId) {
        List<Booking> bookings = bookingRepository.findByUserId(userId);
        return bookings.stream().map(booking -> {
            Flight flight = flightRepository.findById(booking.getFlightId()).orElse(null);
            return mapToResponse(booking, flight);
        }).toList();
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