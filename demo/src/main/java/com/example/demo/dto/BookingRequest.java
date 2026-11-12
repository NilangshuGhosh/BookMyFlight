package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record BookingRequest(
    @NotNull(message = "Flight ID is required")
    @Positive(message = "Flight ID must be positive")
    Long flightId
) {}
