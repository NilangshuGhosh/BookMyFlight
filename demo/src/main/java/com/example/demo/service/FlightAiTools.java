package com.example.demo.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Service;

import com.example.demo.dto.FlightResponse;
import com.example.demo.dto.FlightSearchRequest;
import com.example.demo.entity.Flight;

@Service 
public class FlightAiTools {
    private final FlightService flightService;
    FlightAiTools(FlightService flightService){
        this.flightService=flightService;
    }
    @Tool (description="Search Upcoming available flights by source and destination code and given date(default currentDate and Next)")
    List<FlightResponse>searchUpcomingFlightsByCode(
        @ToolParam (description="3-letter IATA Source Airport Code, e.g., CCU for Kolkata, DEL for Delhi, BLR for Bangalore, BOM for Mumbai")String srcCode,
        @ToolParam (description="3-letter IATA Destination Airport Code")String dstCode,
        @ToolParam (description = "Date of Flight",required = false)LocalDate dateOfFlight
    )    {

        return flightService.searchDirectFlights(new FlightSearchRequest(srcCode, dstCode, dateOfFlight),  PageRequest.of(0, 5)).getContent();
    }
}
