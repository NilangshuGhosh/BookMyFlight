package com.example.demo.event;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Domain event published when a flight booking has been successfully confirmed.
 * Holds all display attributes needed by notification listeners so they never
 * need to re-query the database or access closed Hibernate sessions.
 */
public record BookingConfirmedEvent(
    Long bookingId,
    String pnr,
    Long userId,
    String userEmail,
    String flightNumber,
    String airline,
    String sourceAirport,
    String destinationAirport,
    LocalDateTime departureTime,
    Integer seatsBooked,
    BigDecimal totalPrice,
    LocalDateTime bookedAt
) {}
