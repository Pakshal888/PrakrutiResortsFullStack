package com.prakrutiresorts.booking_backend.model; // Correct Package

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
public class Booking { 

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long roomId;             
    private LocalDate arrivalDate;   
    private LocalDate departureDate; 
    private int numberOfGuests;
    private double totalPrice;

    private String guestName;
    private String guestEmail;
    private String paymentReference; 
    private String paymentStatus;    
}