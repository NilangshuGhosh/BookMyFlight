package com.example.demo.repository;

import com.example.demo.entity.Airport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AirportRepository extends JpaRepository<Airport, String> {

    boolean existsByAirportCodeIgnoreCase(String airportCode);

    boolean existsByAirportNameIgnoreCase(String airportName);

    @Query("""
            SELECT a FROM Airport a
            WHERE :query = ''
               OR LOWER(a.airportCode) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(a.cityName) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(a.airportName) LIKE LOWER(CONCAT('%', :query, '%'))
            """)
    Page<Airport> searchAirports(@Param("query") String query, Pageable pageable);
}
