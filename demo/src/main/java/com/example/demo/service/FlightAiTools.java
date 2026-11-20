package com.example.demo.service;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Service;

import com.example.demo.dto.BookingResponse;
import com.example.demo.dto.FlightResponse;
import com.example.demo.dto.FlightSearchRequest;
import com.example.demo.entity.Flight;
import com.example.demo.entity.User;
import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.UserRepository;

@Service 
public class FlightAiTools {
    private final FlightService flightService;
    private final BookingService bookingService;
    private final UserRepository userRepository;
    FlightAiTools(FlightService flightService,BookingService bookingService,UserRepository userRepository){
        this.flightService=flightService;
        this.bookingService=bookingService;
        this.userRepository=userRepository;
    }
    private User getUser(){
        Authentication authentication=SecurityContextHolder.getContext().getAuthentication();
        if(authentication==null||!authentication.isAuthenticated()||"anonymousUser".equals(authentication.getPrincipal())){
            return null;
        }
        
        return userRepository.findByEmail(authentication.getName()).orElse(null);
    }
    @Tool (description="Search Upcoming available flights by source and destination code and given date(default currentDate and Next)")
    List<FlightResponse>searchUpcomingFlightsByCode(
        @ToolParam (description="3-letter IATA Source Airport Code, e.g., CCU for Kolkata, DEL for Delhi, BLR for Bangalore, BOM for Mumbai")String srcCode,
        @ToolParam (description="3-letter IATA Destination Airport Code")String dstCode,
        @ToolParam (description = "Date of Flight",required = false)LocalDate dateOfFlight
    )    {

        return flightService.searchDirectFlights(new FlightSearchRequest(srcCode, dstCode, dateOfFlight),  PageRequest.of(0, 5)).getContent();
    }
    @Tool(description = "Look up booking details, flight status, and passenger information using a 6-character PNR code (e.g. ABC123)")
    BookingResponse searchBookingByPnr(
        @ToolParam (description = "a 6-charcter alphanumeric pnr code",required = true) String pnr
    ){
        //System.out.println(bookingService.getBookingByPnr(pnr, null, true));
        User user=getUser();
        // System.out.println("Here goes the user :"+user);
        // System.out.println("---------\n **********\n");
        if(user==null){
            return bookingService.getBookingByPnr(pnr, null, false);
        }
        boolean isAdmin="ADMIN".equalsIgnoreCase(user.getRole());
        return bookingService.getBookingByPnr(pnr, user.getId(), isAdmin);
    }

}
