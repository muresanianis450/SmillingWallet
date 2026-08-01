package backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity   // enables @PreAuthorize on controllers
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    /**
     * Comma-separated list of allowed origins.
     * Dev default covers Vite dev server + LAN testing.
     * In production set CORS_ALLOWED_ORIGINS to the deployed frontend URL(s).
     * Example: https://smilingwallet-frontend.up.railway.app
     */
    @Value("${cors.allowed-origins:http://localhost:5173,https://localhost:5173,http://localhost,https://localhost}")
    private String allowedOriginsRaw;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s ->
                        s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // ── Public ──────────────────────────────────────────────
                        .requestMatchers(HttpMethod.GET,
                                "/api/auth/invite/verify",
                                "/api/invites/*"
                        ).permitAll()
                        // Clinic accepts an admin invitation — no account exists yet
                        .requestMatchers(HttpMethod.POST, "/api/invites/*/accept").permitAll()
                        .requestMatchers(HttpMethod.POST,
                                "/api/auth/register",
                                "/api/auth/login",
                                "/api/auth/google",
                                "/api/auth/refresh",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password",
                                "/api/auth/activate",
                                "/api/auth/2fa/verify",
                                "/api/auth/email2fa/verify-login"
                        ).permitAll()
                        // WebSocket handshake endpoint
                        .requestMatchers("/ws-smiling-wallet/**").permitAll()
                        // Actuator health — used by Railway / Docker health probes
                        .requestMatchers("/actuator/health").permitAll()
                        // Swagger UI (dev convenience)
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/v3/api-docs/**"
                        ).permitAll()

                        // ── Role-specific ────────────────────────────────────────
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/auth/user/**").authenticated()

                        // DENTIST: browse marketplace (GET /api/requests) + clinic dashboard
                        .requestMatchers(HttpMethod.GET, "/api/requests").hasAnyRole("DENTIST", "ADMIN")
                        .requestMatchers("/api/dashboard/clinic/**").hasAnyRole("DENTIST", "ADMIN")

                        // PATIENT: their own appointment history
                        .requestMatchers("/api/dashboard/patient/**").hasAnyRole("PATIENT", "ADMIN")

                        // PATIENT: submit a new request
                        .requestMatchers(HttpMethod.POST, "/api/requests").hasAnyRole("PATIENT", "ADMIN")

                        // All other /api/requests/** — both roles need access (patient edits, dentist views single)
                        .requestMatchers("/api/requests/**").authenticated()

                        // PATIENT routes (legacy path kept for compatibility)
                        .requestMatchers("/api/dental-requests/**").hasAnyRole("PATIENT", "ADMIN")

                        // everything else requires auth
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Parse comma-separated origins from config / env var (CORS_ALLOWED_ORIGINS)
        List<String> origins = Arrays.stream(allowedOriginsRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

}
