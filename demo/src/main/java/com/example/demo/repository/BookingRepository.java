package com.example.demo.repository;

import com.example.demo.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    
    // Find a booking by its unique PNR
    Optional<Booking> findByPnr(String pnr);
    
    // Find all bookings belonging to a specific user
    List<Booking> findByUserId(Long userId);
}