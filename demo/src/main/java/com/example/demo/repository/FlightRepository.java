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

    // Admin search across flight ID, number, airline, airport codes, and city/airport names
    @Query("""
            SELECT f FROM Flight f
            LEFT JOIN Airport src ON src.airportCode = f.sourceAirportCode
            LEFT JOIN Airport dst ON dst.airportCode = f.destinationAirportCode
            WHERE (:includeDeparted = true OR f.departureTime > :now)
              AND (:status = 'ALL' OR UPPER(f.status) = UPPER(:status))
              AND (
                  :query = ''
                  OR (:queryId IS NOT NULL AND f.id = :queryId)
                  OR LOWER(f.flightNumber) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR LOWER(f.airline) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR LOWER(f.sourceAirportCode) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR LOWER(f.destinationAirportCode) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR LOWER(src.cityName) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR LOWER(dst.cityName) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR LOWER(src.airportName) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR LOWER(dst.airportName) LIKE LOWER(CONCAT('%', :query, '%'))
              )
            """)
    Page<Flight> searchAdminFlights(
            @Param("query") String query,
            @Param("queryId") Long queryId,
            @Param("status") String status,
            @Param("includeDeparted") boolean includeDeparted,
            @Param("now") LocalDateTime now,
            Pageable pageable
    );
}