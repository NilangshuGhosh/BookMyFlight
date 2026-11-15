package com.example.demo.listener;

import com.example.demo.event.BookingConfirmedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class BookingNotificationListener {

    private static final Logger log = LoggerFactory.getLogger(BookingNotificationListener.class);

    /**
     * Handles booking confirmation outside the database transaction.
     * 
     * Key Architectural Guarantees:
     * 1. TransactionPhase.AFTER_COMMIT: Executes ONLY if the PostgreSQL transaction
     *    successfully commits. If a rollback occurs, this listener is never triggered.
     * 2. @Async: Dispatched on a background worker thread (ThreadPoolTaskExecutor),
     *    ensuring the HTTP request thread and database connection pool (HikariCP)
     *    are released immediately (<5ms).
     */
    @Async("taskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleBookingConfirmed(BookingConfirmedEvent event) {
        log.info("""
            
            ================================================================================
            >>> [ASYNC NOTIFICATION DISPATCHED] (Thread: {})
            >>> Event: BookingConfirmedEvent | Phase: AFTER_COMMIT
            --------------------------------------------------------------------------------
            Recipient:       {}
            PNR:             {}
            Flight:          {} ({})
            Route:           {} -> {}
            Departure Time:  {}
            Seats Booked:    {}
            Total Price:     INR {}
            Booking Status:  CONFIRMED
            Booked At:       {}
            --------------------------------------------------------------------------------
            >>> Ticket notification logged successfully. Ready for Brevo / SMTP plugin.
            ================================================================================
            """,
            Thread.currentThread().getName(),
            event.userEmail(),
            event.pnr(),
            event.flightNumber(),
            event.airline(),
            event.sourceAirport(),
            event.destinationAirport(),
            event.departureTime(),
            event.seatsBooked(),
            event.totalPrice(),
            event.bookedAt()
        );
    }
}
