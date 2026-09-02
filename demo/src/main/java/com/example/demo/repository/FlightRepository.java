package com.example.demo.repository;

import com.example.demo.entity.Flight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FlightRepository extends JpaRepository<Flight, Long> {
    
    // Finds flights between two cities that have not yet departed
    List<Flight> findBySourceAirportCodeAndDestinationAirportCodeAndDepartureTimeAfter(
            String sourceAirportCode, 
            String destinationAirportCode, 
            LocalDateTime currentTime
    );

    // Finds all departed flights (departure time before current time) with pagination
    Page<Flight> findByDepartureTimeBeforeOrderByDepartureTimeDesc(LocalDateTime currentTime, Pageable pageable);

    // Finds departed flights within a specific date range with pagination
    Page<Flight> findByDepartureTimeBetweenOrderByDepartureTimeDesc(LocalDateTime start, LocalDateTime end, Pageable pageable);
}