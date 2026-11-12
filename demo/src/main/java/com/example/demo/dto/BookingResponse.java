package com.example.demo.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BookingResponse(
    Long id,
    String pnr,
    Long flightId,
    String flightNumber,
    String airline,
    String sourceAirport,
    String destinationAirport,
    Integer seatsBooked,
    BigDecimal totalPrice,
    String status,
    LocalDateTime createdAt
) {}
