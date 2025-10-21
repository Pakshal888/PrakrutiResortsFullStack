package com.prakrutiresorts.booking_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.filter.CorsFilter; // 👈 NEW IMPORT
import org.springframework.boot.web.servlet.FilterRegistrationBean; // 👈 NEW IMPORT
import org.springframework.web.cors.UrlBasedCorsConfigurationSource; // 👈 NEW IMPORT
import org.springframework.web.cors.CorsConfiguration; // 👈 NEW IMPORT
import org.springframework.core.Ordered; // 👈 NEW IMPORT


@SpringBootApplication
public class BookingBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookingBackendApplication.class, args);
    }
    
    // 👇 NEW: Define a simple CORS bean to apply the configuration
    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        // Allow all origins, methods, and headers (for testing)
        config.setAllowCredentials(true);
        config.addAllowedOrigin("*");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        
        // Apply this configuration to all paths
        source.registerCorsConfiguration("/**", config); 
        
        FilterRegistrationBean<CorsFilter> bean = new FilterRegistrationBean<>(new CorsFilter(source));
        
        // Ensure this filter runs before any other security/MVC components
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return bean;
    }
}