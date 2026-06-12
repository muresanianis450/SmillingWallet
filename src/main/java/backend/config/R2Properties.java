package backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Cloudflare R2 settings (S3-compatible). Values come from env vars via the
 * {@code r2.*} block in application.yml. See .env / .env.example for the keys.
 */
@ConfigurationProperties(prefix = "r2")
@Component
@lombok.Getter
@lombok.Setter
public class R2Properties {
    /** Cloudflare account id (the subdomain in the endpoint). */
    private String accountId;
    /** R2 API token access key id. */
    private String accessKeyId;
    /** R2 API token secret access key. */
    private String secretAccessKey;
    /** Bucket name, e.g. smilingwallet-ct-scans. */
    private String bucket;
    /** S3 endpoint, e.g. https://<accountId>.r2.cloudflarestorage.com */
    private String endpoint;
    /** How long generated presigned download URLs stay valid. */
    private long presignExpiryMinutes = 15;

    /** True only when the core credentials are present — lets us fail fast / skip cleanly. */
    public boolean isConfigured() {
        return accessKeyId != null && !accessKeyId.isBlank()
                && secretAccessKey != null && !secretAccessKey.isBlank()
                && bucket != null && !bucket.isBlank()
                && endpoint != null && !endpoint.isBlank();
    }
}
