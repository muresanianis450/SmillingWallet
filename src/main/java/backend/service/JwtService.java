package backend.service;


import backend.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;


@Service
public class JwtService {

    private final JwtProperties props;
    private final SecretKey signingKey;

    public JwtService(JwtProperties jwtProperties) {
        this.props = jwtProperties;
        this.signingKey = Keys.hmacShaKeyFor(
                props.getSecret().getBytes(StandardCharsets.UTF_8)
        );
    }

    public String generateAccessToken(String userId, String email, String role) {
        return Jwts.builder()
                .subject(userId)
                .claim("email", email)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + props.getAccessTokenExpiryMs()))
                .signWith(signingKey)
                .compact();
    }

    /**
     * Opaque random string, stored in DB, never parsed client-side
     */
    public String generateRefreshToken() {
        return UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");
    }

    /** Returns claims if valid, throws JWTException if expired or tempered*/
    public Claims validateAccessToken(String accessToken){
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(accessToken)
                .getPayload();
    }

    public long getRefreshTokenExpiryMs(){
        return props.getRefreshTokenExpiryMs();
    }
}
