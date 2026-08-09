package com.example.demo.repository;

import com.example.demo.entity.Flight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
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
}