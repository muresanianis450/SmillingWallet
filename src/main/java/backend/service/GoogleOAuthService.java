package backend.service;

import backend.config.GoogleOAuthProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Server-side half of the Google "authorization code" flow.
 * The browser obtains a one-time auth code via @react-oauth/google; we exchange it
 * for an access token (server-to-server, using the client secret) and then read the
 * verified user profile from Google's userinfo endpoint.
 */
@Service
@Slf4j
public class GoogleOAuthService {

    private static final String TOKEN_URL    = "https://oauth2.googleapis.com/token";
    private static final String USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

    private final GoogleOAuthProperties props;
    private final RestClient restClient = RestClient.create();

    public GoogleOAuthService(GoogleOAuthProperties props) {
        this.props = props;
    }

    /** Verified Google profile fields we care about. */
    public record GoogleProfile(String sub, String email, boolean emailVerified, String name, String picture) {}

    public GoogleProfile exchangeCodeForProfile(String code) {
        if (props.getClientId() == null || props.getClientId().isBlank()
                || props.getClientSecret() == null || props.getClientSecret().isBlank()) {
            throw new IllegalStateException("Google OAuth is not configured (missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)");
        }

        // 1. Exchange the auth code for tokens.
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("code", code);
        form.add("client_id", props.getClientId());
        form.add("client_secret", props.getClientSecret());
        form.add("redirect_uri", props.getRedirectUri());
        form.add("grant_type", "authorization_code");

        Map<String, Object> tokenResponse;
        try {
            tokenResponse = restClient.post()
                    .uri(TOKEN_URL)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(new org.springframework.core.ParameterizedTypeReference<>() {});
        } catch (Exception e) {
            log.warn("Google token exchange failed: {}", e.getMessage());
            throw new IllegalArgumentException("Google sign-in failed — could not verify the authorization code");
        }

        String accessToken = tokenResponse == null ? null : (String) tokenResponse.get("access_token");
        if (accessToken == null) {
            throw new IllegalArgumentException("Google sign-in failed — no access token returned");
        }

        // 2. Fetch the verified profile.
        Map<String, Object> info;
        try {
            info = restClient.get()
                    .uri(USERINFO_URL)
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(new org.springframework.core.ParameterizedTypeReference<>() {});
        } catch (Exception e) {
            log.warn("Google userinfo fetch failed: {}", e.getMessage());
            throw new IllegalArgumentException("Google sign-in failed — could not read your profile");
        }

        if (info == null || info.get("email") == null || info.get("sub") == null) {
            throw new IllegalArgumentException("Google sign-in failed — profile is missing an email");
        }

        boolean emailVerified = Boolean.TRUE.equals(info.get("email_verified"))
                || "true".equals(String.valueOf(info.get("email_verified")));

        return new GoogleProfile(
                String.valueOf(info.get("sub")),
                String.valueOf(info.get("email")),
                emailVerified,
                info.get("name") != null ? String.valueOf(info.get("name")) : null,
                info.get("picture") != null ? String.valueOf(info.get("picture")) : null
        );
    }
}
