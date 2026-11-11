package com.example.demo.dto;

public record AirportCreateRequest(
    String airportCode,
    String cityName,
    String airportName
) {}
