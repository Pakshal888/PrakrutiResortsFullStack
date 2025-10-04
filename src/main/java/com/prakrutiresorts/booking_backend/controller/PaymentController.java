package com.prakrutiresorts.booking_backend.controller;

import com.prakrutiresorts.booking_backend.service.BookingService;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.ui.Model;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/api/payment")
public class PaymentController {

    private final BookingService bookingService;

    // Load Razorpay keys from application.properties
    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    public PaymentController(BookingService bookingService) {
        this.bookingService = bookingService;
        // NOTE: Keeping this dependency injected even if not fully used in the provided methods
        // to avoid the 'The value of the field PaymentController.bookingService is not used' warning.
    }

    /**
     * Endpoint called by frontend (scripts.js) to create a Razorpay Order.
     */
    @PostMapping("/create-order")
    @ResponseBody
    public ResponseEntity<?> createRazorpayOrder(@RequestBody Map<String, Object> payload) {
        try {
            String bookingId = (String) payload.get("bookingId");
            // Amount comes as Double from frontend, cast it.
            // Note: If you use a different JSON parsing library, this might need a change like ((Number) payload.get("amount")).doubleValue()
            double amountInRupees = (Double) payload.get("amount");
            
            // Amount must be in the smallest currency unit (Paise)
            long amountInPaise = Math.round(amountInRupees * 100);

            RazorpayClient razorpay = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise); 
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", bookingId); // Use booking ID as receipt

            Order order = razorpay.orders.create(orderRequest);
            
            Map<String, String> response = new HashMap<>();
            response.put("orderId", order.get("id"));
            response.put("bookingId", bookingId);
            response.put("amount", String.valueOf(amountInRupees)); // Send back in Rupees
            response.put("razorpayKeyId", razorpayKeyId); // Send Key ID to the frontend

            return ResponseEntity.ok(response);

        } catch (RazorpayException e) {
            System.err.println("Razorpay Error: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Failed to create Razorpay order: " + e.getMessage()));
        } catch (Exception e) {
            System.err.println("General Error: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error."));
        }
    }

    /**
     * Endpoint where Razorpay redirects after a successful payment for verification.
     */
    @GetMapping("/success")
    public String handlePaymentSuccess(@RequestParam String razorpay_order_id, 
                                     @RequestParam String razorpay_payment_id, 
                                     @RequestParam String razorpay_signature,
                                     Model model) {
        
        try {
            // --- Verification and Status Update Logic ---
            // In a real application, you MUST verify the signature here using the razorpayKeySecret.
            // For this demo, we assume success.
            
            // Note: Since the booking ID (receipt) is not passed back directly by Razorpay's 
            // success redirect, we need a way to link the order ID back to our booking.
            // We use a placeholder here.
            
            // Example: bookingService.updateBookingStatus(bookingIdFromDatabase, "CONFIRMED"); 
            
            // Display details on the success page
            model.addAttribute("orderId", razorpay_order_id);
            model.addAttribute("paymentId", razorpay_payment_id);
            model.addAttribute("signature", razorpay_signature);
            // Assuming the booking ID is the receipt used when creating the order
            model.addAttribute("bookingId", "RPT-" + razorpay_order_id.substring(4)); 

            // IMPORTANT: Returning the requested template name
            return "payment_success"; 

        } catch (Exception e) {
            System.err.println("Payment Success Verification Error: " + e.getMessage());
            model.addAttribute("error", "Payment verification failed: " + e.getMessage());
            // You should create a payment_failed.html if you want a custom error page
            return "error_page"; 
        }
    }
}