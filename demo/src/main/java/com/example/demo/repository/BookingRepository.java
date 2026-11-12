package com.example.demo.repository;

import com.example.demo.dto.AdminBookingResponse;
import com.example.demo.entity.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    // Find a booking by its unique PNR
    Optional<Booking> findByPnr(String pnr);

    // Find all bookings belonging to a specific user
    List<Booking> findByUserId(Long userId);

    // Paginated, searchable admin query across bookings, flights, and passengers
    @Query("""
            SELECT new com.example.demo.dto.AdminBookingResponse(
                b.id,
                b.pnr,
                b.userId,
                COALESCE(u.fullName, 'N/A'),
                COALESCE(u.email, 'N/A'),
                b.flightId,
                COALESCE(f.flightNumber, 'N/A'),
                COALESCE(f.airline, 'N/A'),
                COALESCE(f.sourceAirportCode, 'N/A'),
                COALESCE(f.destinationAirportCode, 'N/A'),
                f.departureTime,
                COALESCE(f.status, 'N/A'),
                b.seatsBooked,
                b.totalPrice,
                b.status,
                b.createdAt
            )
            FROM Booking b
            LEFT JOIN Flight f ON f.id = b.flightId
            LEFT JOIN User u ON u.id = b.userId
            WHERE (:status = 'ALL' OR UPPER(b.status) = UPPER(:status))
              AND (
                  :query = ''
                  OR (:queryId IS NOT NULL AND b.id = :queryId)
                  OR LOWER(b.pnr) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR LOWER(COALESCE(u.email, '')) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR LOWER(COALESCE(u.fullName, '')) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR LOWER(COALESCE(f.flightNumber, '')) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR LOWER(COALESCE(f.airline, '')) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR LOWER(COALESCE(f.sourceAirportCode, '')) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR LOWER(COALESCE(f.destinationAirportCode, '')) LIKE LOWER(CONCAT('%', :query, '%'))
              )
            """)
    Page<AdminBookingResponse> searchAdminBookings(
            @Param("query") String query,
            @Param("queryId") Long queryId,
            @Param("status") String status,
            Pageable pageable
    );
}
