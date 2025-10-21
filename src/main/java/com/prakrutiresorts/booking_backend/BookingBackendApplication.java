package com.prakrutiresorts.booking_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.filter.CorsFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.core.Ordered;

@SpringBootApplication
public class BookingBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookingBackendApplication.class, args);
    }

    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // 1. Allow credentials (cookies, auth headers)
        config.setAllowCredentials(true);
        
        // 2. Explicitly allow your deployed frontend domain
        config.addAllowedOrigin("https://prakrutiresortsfullstack-production.up.railway.app");
        
        // 3. Keep the pattern for broader coverage (optional, but robust)
        config.addAllowedOriginPattern("*"); 
        
        // 4. Allow all headers and methods
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");

        source.registerCorsConfiguration("/**", config);
        FilterRegistrationBean<CorsFilter> bean = new FilterRegistrationBean<>(new CorsFilter(source));
        
        // Ensure this filter runs first
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return bean;
    }
}