package com.example.demo.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record BookingRequest(
    @NotNull(message = "Flight ID is required")
    @Positive(message = "Flight ID must be positive")
    Long flightId,

    @Min(value = 1, message = "At least 1 seat must be booked")
    @Max(value = 6, message = "Maximum 6 seats can be booked per PNR")
    Integer seatsBooked
) {}
