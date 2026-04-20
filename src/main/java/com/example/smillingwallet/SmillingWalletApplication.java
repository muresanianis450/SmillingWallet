package com.example.smillingwallet;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;


@SpringBootApplication(scanBasePackages = {"com.example.smillingwallet","backend"})
public class SmillingWalletApplication {
    public static void main(String[] args) {
        SpringApplication.run(SmillingWalletApplication.class, args);
    }

}
