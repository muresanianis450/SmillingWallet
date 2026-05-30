package backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

@Configuration
@EnableAsync
public class AsyncConfig {
    // Enables @Async on any Spring bean method.
    // Email sending uses this so HTTP responses never block on SMTP.
}
