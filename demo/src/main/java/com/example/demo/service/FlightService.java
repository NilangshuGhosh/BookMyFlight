package com.example.demo.service;

import com.example.demo.dto.FlightResponse;
import com.example.demo.dto.FlightSearchRequest;

import java.util.List;

public interface FlightService {
    List<FlightResponse> searchDirectFlights(FlightSearchRequest request);
    List<FlightResponse> getAllUpcomingFlights();
}