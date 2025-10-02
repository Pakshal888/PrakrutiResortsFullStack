package com.prakrutiresorts.booking_backend.repository; // <-- FIXED: Lowercase 'r'

import com.prakrutiresorts.booking_backend.model.Room; 
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> { 
    
}