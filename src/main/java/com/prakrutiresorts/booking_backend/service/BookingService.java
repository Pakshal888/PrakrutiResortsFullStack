package com.prakrutiresorts.booking_backend.service;

import com.prakrutiresorts.booking_backend.model.Room;
import com.prakrutiresorts.booking_backend.repository.BookingRepository;
import com.prakrutiresorts.booking_backend.repository.RoomRepository;
import com.prakrutiresorts.booking_backend.model.Booking;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList; // FIX: This import was missing
import java.util.List;      // FIX: This import was missing

@Service
public class BookingService {

    @Autowired 
    private BookingRepository bookingRepository;
    @Autowired
    private RoomRepository roomRepository;
    
    // DTO: Used to structure the clean availability response sent to the front-end
    public record RoomAvailabilityDTO(Long roomId, String name, int availableCount, double price) {}

    /**
     * Core logic: Checks capacity, queries confirmed bookings, and determines available inventory.
     * FIX: Ensuring the full method signature is correct.
     */
    public List<RoomAvailabilityDTO> checkAvailability(LocalDate arrivalDate, LocalDate departureDate, int guests) {
        
        List<Room> allRooms = roomRepository.findAll();
        List<RoomAvailabilityDTO> availableRooms = new ArrayList<>();

        for (Room room : allRooms) {
            // 1. Check capacity filter
            if (room.getCapacity() >= guests) {
                
                // 2. Count existing confirmed (PAID) bookings that overlap
                // FIX: You were missing the room ID as the first parameter here.
                Long bookedCount = bookingRepository.countOverlappingPaidBookings(
                    room.getId(),           // FIX: Pass the Room ID
                    arrivalDate,            // Pass the Arrival Date
                    departureDate);         // Pass the Departure Date

                // 3. Calculate actual availability
                long availableCount = room.getTotalQuantity() - bookedCount;

                if (availableCount > 0) {
                    availableRooms.add(new RoomAvailabilityDTO(
                        room.getId(),
                        room.getName(), 
                        (int) availableCount, 
                        room.getPricePerNight()
                    ));
                }
            }
        }
        return availableRooms;
    }
    
    /**
     * Creates a new booking in the database with a PENDING payment status.
     */
    public Booking createPendingBooking(Long roomId, LocalDate arrival, LocalDate departure, int guests, String name, String email, double price) {
        Booking booking = new Booking();
        booking.setRoomId(roomId);
        booking.setArrivalDate(arrival);
        booking.setDepartureDate(departure);
        booking.setNumberOfGuests(guests);
        booking.setGuestName(name);
        booking.setGuestEmail(email);
        booking.setTotalPrice(price);
        booking.setPaymentStatus("PENDING"); 
        
        return bookingRepository.save(booking);
    }
}