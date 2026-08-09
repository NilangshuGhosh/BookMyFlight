package com.example.demo.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record FlightCreateRequest(
    String airline,
    String flightNumber,
    String sourceAirportCode,
    String destinationAirportCode,
    LocalDateTime departureTime,
    LocalDateTime arrivalTime,
    BigDecimal basePrice
) {}