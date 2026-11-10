package com.example.demo.repository;

import com.example.demo.entity.Flight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;

@Repository
public interface FlightRepository extends JpaRepository<Flight, Long> {
    
    // Finds upcoming direct flights between two cities with pagination & dynamic sorting
    Page<Flight> findBySourceAirportCodeAndDestinationAirportCodeAndDepartureTimeAfter(
            String sourceAirportCode, 
            String destinationAirportCode, 
            LocalDateTime currentTime,
            Pageable pageable
    );

    // Finds upcoming direct flights between two cities within a specific day/time range [start, end)
    @Query("""
            SELECT f FROM Flight f
            WHERE f.sourceAirportCode = :source
              AND f.destinationAirportCode = :destination
              AND f.departureTime >= :start
              AND f.departureTime < :end
            """)
    Page<Flight> findUpcomingDirectFlightsInRange(
            @Param("source") String sourceAirportCode,
            @Param("destination") String destinationAirportCode,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            Pageable pageable
    );

    // Finds all upcoming flights (departure time after current time) with pagination
    Page<Flight> findByDepartureTimeAfterOrderByDepartureTimeAsc(LocalDateTime currentTime, Pageable pageable);

    // Finds all departed flights (departure time before current time) with pagination
    Page<Flight> findByDepartureTimeBeforeOrderByDepartureTimeDesc(LocalDateTime currentTime, Pageable pageable);

    // Finds departed flights within a specific date range with pagination
    Page<Flight> findByDepartureTimeBetweenOrderByDepartureTimeDesc(LocalDateTime start, LocalDateTime end, Pageable pageable);
}