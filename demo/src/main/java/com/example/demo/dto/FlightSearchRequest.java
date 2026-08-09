package com.example.demo.dto;

import java.time.LocalDate;

public record FlightSearchRequest(
    String source,
    String destination,
    LocalDate date
) {}