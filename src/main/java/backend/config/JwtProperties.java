package backend.config;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;


@ConfigurationProperties(prefix = "jwt")
@Component
@EnableConfigurationProperties(JwtProperties.class)
@lombok.Getter
@lombok.Setter
public class JwtProperties {
    private String secret;
    private long accessTokenExpiryMs;
    private long refreshTokenExpiryMs;
    private long inactivityTimeoutMs;
}

