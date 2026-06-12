package com.example.smillingwallet;

import backend.config.JwtProperties;
import io.github.cdimascio.dotenv.Dotenv;
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
        // Load .env (project root) into system properties so ${R2_*}, ${BREVO_API_KEY},
        // etc. resolve under `./mvnw spring-boot:run`. Real OS env vars and -D flags
        // always win — we only fill in what isn't already set. No-op when .env is absent
        // (e.g. Docker, where Compose injects the vars directly).
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        dotenv.entries().forEach(entry -> {
            if (System.getProperty(entry.getKey()) == null && System.getenv(entry.getKey()) == null) {
                System.setProperty(entry.getKey(), entry.getValue());
            }
        });

        SpringApplication.run(SmilingWalletApplication.class, args);
    }
}