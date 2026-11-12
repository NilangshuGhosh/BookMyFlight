package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AirportCreateRequest(
    @NotBlank(message = "Airport code is required")
    @Pattern(regexp = "^[A-Za-z0-9]{2,10}$", message = "Airport code must be 2 to 10 alphanumeric characters")
    String airportCode,

    @NotBlank(message = "City name is required")
    @Size(max = 100, message = "City name must be 100 characters or fewer")
    String cityName,

    @NotBlank(message = "Airport name is required")
    @Size(max = 255, message = "Airport name must be 255 characters or fewer")
    String airportName
) {}
