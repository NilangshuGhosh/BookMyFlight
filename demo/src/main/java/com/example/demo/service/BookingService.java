package com.example.demo.service;

import com.example.demo.dto.AdminBookingResponse;
import com.example.demo.dto.BookingRequest;
import com.example.demo.dto.BookingResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface BookingService {
    BookingResponse createBooking(BookingRequest request, Long userId);
    BookingResponse getBookingByPnr(String pnr, Long userId, boolean isAdmin);
    List<BookingResponse> getUserBookings(Long userId);
    Page<AdminBookingResponse> getAdminBookings(String query, String status, Pageable pageable);
    BookingResponse cancelBooking(Long bookingId, Long userId, boolean isAdmin);
}
