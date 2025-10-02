package com.prakrutiresorts.booking_backend.model; // Correct Package

import jakarta.persistence.*;
import lombok.Data; 

@Entity // Must start with a capital letter
@Data   
public class Room { // Class name must be capitalized

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;        
    private int capacity;       
    private int totalQuantity;  
    private double pricePerNight;
}