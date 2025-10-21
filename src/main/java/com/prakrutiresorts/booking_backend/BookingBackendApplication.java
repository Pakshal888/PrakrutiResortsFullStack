package com.prakrutiresorts.booking_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.filter.CorsFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.core.Ordered;

import java.util.List;

@SpringBootApplication
public class BookingBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookingBackendApplication.class, args);
    }

    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // ✅ Allow credentials such as cookies or authorization headers
        config.setAllowCredentials(true);

        // ✅ Use explicit allowed origins (replace URL with your frontend’s Railway domain)
        config.setAllowedOrigins(List.of(
                "https://prakrutiresorts-frontend.up.railway.app", // your deployed frontend
                "http://localhost:5173", // local dev (Vite default)
                "http://localhost:5500"  // optional if using Live Server
        ));

        // ✅ Allow all headers and methods
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");

        // ✅ Apply to all routes
        source.registerCorsConfiguration("/**", config);

        FilterRegistrationBean<CorsFilter> bean = new FilterRegistrationBean<>(new CorsFilter(source));
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return bean;
    }
}
