package com.example.demo;

import com.example.demo.controller.FlightController;
import com.example.demo.dto.FlightResponse;
import com.example.demo.dto.FlightSearchRequest;
import com.example.demo.entity.Flight;
import com.example.demo.repository.FlightRepository;
import com.example.demo.service.FlightService;
import com.example.demo.service.FlightServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class FlightServiceAndControllerTest {

    @Test
    void searchDirectFlights_withoutDate_usesAfterNowAndPagination() {
        FlightRepository repo = mock(FlightRepository.class);
        FlightServiceImpl service = new FlightServiceImpl(repo);

        Flight flight = sampleFlight(1L, "6E-101", LocalDateTime.now().plusDays(2));
        Pageable pageable = PageRequest.of(0, 5);
        when(repo.findBySourceAirportCodeAndDestinationAirportCodeAndDepartureTimeAfter(
                eq("CCU"), eq("DEL"), any(LocalDateTime.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(flight), pageable, 1));

        Page<FlightResponse> result = service.searchDirectFlights(
                new FlightSearchRequest("ccu", "del", null), pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("6E-101", result.getContent().get(0).flightNumber());
        verify(repo, never()).findUpcomingDirectFlightsInRange(any(), any(), any(), any(), any());
    }

    @Test
    void searchDirectFlights_withFutureDate_queriesStrictlyThatDay() {
        FlightRepository repo = mock(FlightRepository.class);
        FlightServiceImpl service = new FlightServiceImpl(repo);

        LocalDate futureDate = LocalDate.now().plusDays(5);
        Flight flight = sampleFlight(2L, "6E-202", futureDate.atTime(10, 0));
        Pageable pageable = PageRequest.of(0, 5);

        when(repo.findUpcomingDirectFlightsInRange(
                eq("CCU"), eq("DEL"),
                eq(futureDate.atStartOfDay()),
                eq(futureDate.plusDays(1).atStartOfDay()),
                eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(flight), pageable, 1));

        Page<FlightResponse> result = service.searchDirectFlights(
                new FlightSearchRequest("CCU", "DEL", futureDate), pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("6E-202", result.getContent().get(0).flightNumber());
    }

    @Test
    void searchDirectFlights_withPastDate_returnsEmptyPage() {
        FlightRepository repo = mock(FlightRepository.class);
        FlightServiceImpl service = new FlightServiceImpl(repo);

        Pageable pageable = PageRequest.of(0, 5);
        Page<FlightResponse> result = service.searchDirectFlights(
                new FlightSearchRequest("CCU", "DEL", LocalDate.now().minusDays(1)), pageable);

        assertTrue(result.isEmpty());
        verifyNoInteractions(repo);
    }

    @Test
    void getAllUpcomingFlights_usesPaginatedRepositoryQuery() {
        FlightRepository repo = mock(FlightRepository.class);
        FlightServiceImpl service = new FlightServiceImpl(repo);

        Flight flight = sampleFlight(3L, "6E-303", LocalDateTime.now().plusHours(6));
        Pageable pageable = PageRequest.of(0, 10);
        when(repo.findByDepartureTimeAfterOrderByDepartureTimeAsc(any(LocalDateTime.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(flight), pageable, 1));

        Page<FlightResponse> result = service.getAllUpcomingFlights(pageable);

        assertEquals(1, result.getTotalElements());
        verify(repo, never()).findAll();
    }

    @Test
    void controllerSearchFlights_rejectsPastDateWithBadRequest() {
        FlightService service = mock(FlightService.class);
        FlightController controller = new FlightController(service);

        ResponseEntity<?> response = controller.searchFlights(
                "CCU", "DEL", LocalDate.now().minusDays(2), 0, 5, "price_asc");

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verifyNoInteractions(service);
    }

    private Flight sampleFlight(Long id, String number, LocalDateTime departure) {
        Flight flight = new Flight();
        flight.setId(id);
        flight.setFlightNumber(number);
        flight.setAirline("IndiGo");
        flight.setSourceAirportCode("CCU");
        flight.setDestinationAirportCode("DEL");
        flight.setDepartureTime(departure);
        flight.setArrivalTime(departure.plusHours(2));
        flight.setBasePrice(new BigDecimal("5000.00"));
        flight.setStatus("SCHEDULED");
        return flight;
    }
}
