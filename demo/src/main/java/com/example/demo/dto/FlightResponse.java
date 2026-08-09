package com.example.demo.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record FlightResponse(
    Long id,
    String flightNumber,
    String airline,
    String sourceAirportCode,
    String destinationAirportCode,
    LocalDateTime departureTime,
    LocalDateTime arrivalTime,
    BigDecimal basePrice,
    String status
) {}