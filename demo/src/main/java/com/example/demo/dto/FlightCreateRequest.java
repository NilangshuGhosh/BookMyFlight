package com.example.demo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record FlightCreateRequest(
    @NotBlank(message = "Airline is required")
    String airline,

    @NotBlank(message = "Flight number is required")
    String flightNumber,

    @NotBlank(message = "Source airport code is required")
    String sourceAirportCode,

    @NotBlank(message = "Destination airport code is required")
    String destinationAirportCode,

    @NotNull(message = "Departure time is required")
    LocalDateTime departureTime,

    @NotNull(message = "Arrival time is required")
    LocalDateTime arrivalTime,

    @NotNull(message = "Base price is required")
    @DecimalMin(value = "0.01", message = "Base price must be greater than zero")
    BigDecimal basePrice
) {}
