package backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

/**
 * Wires the AWS S3 SDK against the Cloudflare R2 endpoint.
 *
 * R2 quirks vs real S3:
 *  - region is ignored by R2 but the SDK requires one → use "auto".
 *  - path-style access is required (R2 doesn't do virtual-host-style buckets).
 */
@Configuration
public class R2Config {

    /** Used when R2 isn't configured (tests / dev without keys) so beans still build.
     *  Any actual call fails fast in FileStorageService before reaching the SDK. */
    private static final String PLACEHOLDER_ENDPOINT = "https://r2-not-configured.invalid";

    private final R2Properties props;

    public R2Config(R2Properties props) {
        this.props = props;
    }

    private StaticCredentialsProvider credentials() {
        String key = blankToDefault(props.getAccessKeyId(), "not-configured");
        String secret = blankToDefault(props.getSecretAccessKey(), "not-configured");
        return StaticCredentialsProvider.create(AwsBasicCredentials.create(key, secret));
    }

    private URI endpointUri() {
        String e = props.getEndpoint();
        return URI.create((e == null || e.isBlank()) ? PLACEHOLDER_ENDPOINT : e);
    }

    private static String blankToDefault(String value, String fallback) {
        return (value == null || value.isBlank()) ? fallback : value;
    }

    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .endpointOverride(endpointUri())
                .region(Region.of("auto"))
                .credentialsProvider(credentials())
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                .build();
    }

    @Bean
    public S3Presigner s3Presigner() {
        return S3Presigner.builder()
                .endpointOverride(endpointUri())
                .region(Region.of("auto"))
                .credentialsProvider(credentials())
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                .build();
    }
}
