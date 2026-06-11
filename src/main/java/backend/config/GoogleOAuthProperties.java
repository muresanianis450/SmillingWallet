package backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Google OAuth 2.0 web-client credentials.
 * Set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET env vars (see application.yml).
 * Created in Google Cloud Console → APIs & Services → Credentials → OAuth client (Web).
 */
@ConfigurationProperties(prefix = "google.oauth")
@Component
@lombok.Getter
@lombok.Setter
public class GoogleOAuthProperties {
    private String clientId;
    private String clientSecret;
    /** Must match the redirect_uri the frontend uses. For @react-oauth/google popup auth-code flow this is "postmessage". */
    private String redirectUri = "postmessage";
}
