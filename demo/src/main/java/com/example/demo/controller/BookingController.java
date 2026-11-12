package com.example.demo.controller;

import com.example.demo.dto.BookingRequest;
import com.example.demo.dto.BookingResponse;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final UserRepository userRepository;

    public BookingController(BookingService bookingService, UserRepository userRepository) {
        this.bookingService = bookingService;
        this.userRepository = userRepository;
    }

    /**
     * Create a new flight booking securely.
     * The Principal object is automatically populated by our JwtAuthenticationFilter.
     */
    @PostMapping("/create")
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody BookingRequest request,
            Principal principal) {
        
        // Extract the user securely from the JWT token
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));

        BookingResponse response = bookingService.createBooking(request, user.getId());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Fetch all bookings for the currently logged-in user.
     */
    @GetMapping("/my-bookings")
    public ResponseEntity<List<BookingResponse>> getMyBookings(Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));

        List<BookingResponse> responses = bookingService.getUserBookings(user.getId());
        return ResponseEntity.ok(responses);
    }

    /**
     * Fetch booking details using a PNR code.
     */
    @GetMapping("/pnr/{pnr}")
    public ResponseEntity<BookingResponse> getBookingByPnr(@PathVariable String pnr,Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));
        boolean isAdmin="ADMIN".equals(user.getRole());
        BookingResponse response = bookingService.getBookingByPnr(pnr,user.getId(),isAdmin);
       
        return ResponseEntity.ok(response);
    }
}

// package com.example.demo.controller;

// import com.example.demo.dto.BookingRequest;
// import com.example.demo.dto.BookingResponse;
// import com.example.demo.service.BookingService;
// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;

// import java.util.List;

// @RestController
// @RequestMapping("/api/bookings")
// @CrossOrigin(origins = "*")
// public class BookingController {

//     private final BookingService bookingService;

//     public BookingController(BookingService bookingService) {
//         this.bookingService = bookingService;
//     }

//     /**
//      * Create a new flight booking.
//      * Example: POST /api/bookings/create?userId=1
//      * Body: { "flightId": 1 }
//      */
//     @PostMapping("/create")
//     public ResponseEntity<BookingResponse> createBooking(
//             @RequestBody BookingRequest request,
//             @RequestParam Long userId) {

//         BookingResponse response = bookingService.createBooking(request, userId);
//         return new ResponseEntity<>(response, HttpStatus.CREATED);
//     }

//     /**
//      * Fetch booking details using a PNR code.
//      * Example: GET /api/bookings/pnr/X7B9WQ
//      */
//     @GetMapping("/pnr/{pnr}")
//     public ResponseEntity<BookingResponse> getBookingByPnr(@PathVariable String pnr) {
//         BookingResponse response = bookingService.getBookingByPnr(pnr);
//         return ResponseEntity.ok(response);
//     }

//     /**
//      * Fetch all bookings for a specific user.
//      * Example: GET /api/bookings/user/1
//      */
//     @GetMapping("/user/{userId}")
//     public ResponseEntity<List<BookingResponse>> getUserBookings(@PathVariable Long userId) {
//         List<BookingResponse> responses = bookingService.getUserBookings(userId);
//         return ResponseEntity.ok(responses);
//     }
// }