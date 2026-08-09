package com.example.demo.service;

import com.example.demo.dto.BookingRequest;
import com.example.demo.dto.BookingResponse;

import java.util.List;

public interface BookingService {
    BookingResponse createBooking(BookingRequest request, Long userId);
    BookingResponse getBookingByPnr(String pnr);
    List<BookingResponse> getUserBookings(Long userId);
}