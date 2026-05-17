package com.example.smillingwallet;

import backend.config.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = {"com.example.smillingwallet", "backend"})
@EnableJpaRepositories(basePackages = "backend.repository")
@EnableConfigurationProperties(JwtProperties.class)
@EntityScan(basePackages = "backend.model")
public class SmilingWalletApplication {
    public static void main(String[] args) {
        SpringApplication.run(SmilingWalletApplication.class, args);
    }
}