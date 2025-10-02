package com.prakrutiresorts.booking_backend.controller;

import com.prakrutiresorts.booking_backend.model.Booking;
import com.prakrutiresorts.booking_backend.service.BookingService;
import com.prakrutiresorts.booking_backend.service.BookingService.RoomAvailabilityDTO; // Import the DTO from the Service class
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController // Designates this class as a RESTful API handler
@RequestMapping("/api/bookings") // Sets the base URL for all methods: /api/bookings/...
public class BookingController {

    @Autowired // Inject the BookingService to access business logic
    private BookingService bookingService;
    
    // DTO for incoming JSON from the initial availability check form
    public record AvailabilityRequest(LocalDate arrivalDate, LocalDate departureDate, int numberOfGuests) {}
    
    // DTO for incoming JSON from the final booking form (pre-payment)
    public record FinalBookingRequest(
        Long roomId, LocalDate arrivalDate, LocalDate departureDate, 
        int numberOfGuests, String name, String email, double price
    ) {}

    // --- 1.1. Availability Check Endpoint ---
    /**
     * Handles POST /api/bookings/check-availability
     * Your scripts.js should call this when the user clicks 'Check Availability'.
     */
    @PostMapping("/check-availability")
    public ResponseEntity<Map<String, Object>> checkAvailability(@RequestBody AvailabilityRequest request) {
        
        List<RoomAvailabilityDTO> availableRooms = bookingService.checkAvailability(
            request.arrivalDate(), 
            request.departureDate(), 
            request.numberOfGuests());

        if (availableRooms.isEmpty()) {
            // Send back a "FULL" status to tell the JS to display the appropriate message
            return ResponseEntity.ok(Map.of(
                "status", "FULL", 
                "message", "The resort is fully booked for your dates."
            ));
        } else {
            // Send back "AVAILABLE" status and the list of available rooms
            return ResponseEntity.ok(Map.of(
                "status", "AVAILABLE", 
                "rooms", availableRooms 
            ));
        }
    }
    
    // --- 1.2. Reservation Endpoint (Pre-Payment) ---
    /**
     * Handles POST /api/bookings/reserve
     * Your scripts.js should call this when the user submits their name/email.
     */
    @PostMapping("/reserve")
    public ResponseEntity<Map<String, Object>> reserveBooking(@RequestBody FinalBookingRequest request) {
        
        // 1. Create a PENDING booking record in the MySQL database
        Booking pendingBooking = bookingService.createPendingBooking(
            request.roomId(), 
            request.arrivalDate(), 
            request.departureDate(), 
            request.numberOfGuests(), 
            request.name(), 
            request.email(), 
            request.price()
        );

        // 2. Return data needed for the front-end to contact the payment gateway (Razorpay, etc.)
        return ResponseEntity.ok(Map.of(
            "bookingId", pendingBooking.getId(),
            "amount", pendingBooking.getTotalPrice() // Amount should be in the smallest unit (e.g., paise)
        ));
    }
}