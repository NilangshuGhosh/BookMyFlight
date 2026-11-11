package com.example.demo.service;

import com.example.demo.dto.FlightResponse;
import com.example.demo.dto.FlightSearchRequest;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface FlightService {
    Page<FlightResponse> searchDirectFlights(FlightSearchRequest request, Pageable pageable);
    Page<FlightResponse> getAllUpcomingFlights(Pageable pageable);
    Page<FlightResponse> getDepartedFlights(LocalDate date, Pageable pageable);
    Page<FlightResponse> getAdminFlights(String query, String status, boolean includeDeparted, Pageable pageable);
}