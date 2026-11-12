package com.example.demo.controller;

import com.example.demo.dto.AdminBookingResponse;
import com.example.demo.service.BookingService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/bookings")
public class AdminBookingController {

    private final BookingService bookingService;

    public AdminBookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    /**
     * Paginated, searchable, and sortable list of all bookings for administrators.
     * Example: GET /api/admin/bookings?query=X7B9&status=ALL&sortBy=created_desc&page=0&size=10
     */
    @GetMapping
    public ResponseEntity<Page<AdminBookingResponse>> getAdminBookings(
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(defaultValue = "created_desc") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Sort sort = switch (sortBy) {
            case "created_asc" -> Sort.by(Sort.Direction.ASC, "createdAt");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "totalPrice");
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "totalPrice");
            case "pnr_asc" -> Sort.by(Sort.Direction.ASC, "pnr");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };

        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(bookingService.getAdminBookings(query, status, pageable));
    }
}
