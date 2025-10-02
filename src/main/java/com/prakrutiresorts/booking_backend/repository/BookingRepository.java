package com.prakrutiresorts.booking_backend.repository; // <-- FIXED: Lowercase 'r'

import com.prakrutiresorts.booking_backend.model.Booking; 
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> { 

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.roomId = :roomId " +
           "AND b.paymentStatus = 'PAID' " + 
           "AND b.arrivalDate < :departureDate AND b.departureDate > :arrivalDate")
    Long countOverlappingPaidBookings(Long roomId, LocalDate arrivalDate, LocalDate departureDate);
    
    List<Booking> findByIdAndPaymentStatus(Long id, String paymentStatus);
}