package com.example.demo.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AdminBookingResponse(
    Long id,
    String pnr,
    Long userId,
    String passengerName,
    String passengerEmail,
    Long flightId,
    String flightNumber,
    String airline,
    String sourceAirport,
    String destinationAirport,
    LocalDateTime departureTime,
    String flightStatus,
    BigDecimal totalPrice,
    String status,
    LocalDateTime createdAt
) {}
