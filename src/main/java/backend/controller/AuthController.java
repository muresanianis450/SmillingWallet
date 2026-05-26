package backend.controller;

import backend.dto.*;
import backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    // ── Simple in-memory rate limiter for /2fa/verify ─────────────────────────
    // Key: IP address, Value: [attemptCount, windowStartMs]
    private final ConcurrentHashMap<String, long[]> mfaRateMap = new ConcurrentHashMap<>();
    private static final int    MFA_MAX_ATTEMPTS  = 5;
    private static final long   MFA_WINDOW_MS     = 60_000;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(
            @Valid @RequestBody RegisterRequestDTO dto) {
        return ResponseEntity.ok(authService.register(dto));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(
            @Valid @RequestBody LoginRequestDTO dto) {
        return ResponseEntity.ok(authService.login(dto));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponseDTO> refresh(
            @RequestBody RefreshRequestDTO dto) {
        return ResponseEntity.ok(authService.refresh(dto));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody RefreshRequestDTO dto) {
        authService.logout(dto);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(
            @RequestBody ForgotPasswordRequestDTO dto) {
        authService.forgotPassword(dto);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(
            @RequestBody ResetPasswordRequestDTO dto) {
        authService.resetPassword(dto);
        return ResponseEntity.noContent().build();
    }

    /** Public — frontend calls this to check if an invite token is still valid. */
    @GetMapping("/invite/verify")
    public ResponseEntity<Void> verifyInvite(@RequestParam String token) {
        authService.verifyInviteToken(token);
        return ResponseEntity.ok().build();
    }

    /** Public — dentist sets their first password to activate the account. */
    @PostMapping("/activate")
    public ResponseEntity<Void> activateAccount(
            @RequestBody ResetPasswordRequestDTO dto) {
        authService.activateAccount(dto);
        return ResponseEntity.noContent().build();
    }

    // ── Profile ───────────────────────────────────────────────────────────────

    @GetMapping("/user/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponseDTO> getUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(authService.findById(userId));
    }

    @PutMapping("/user/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponseDTO> updateProfile(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateProfileRequestDTO dto) {
        return ResponseEntity.ok(authService.updateProfile(userId, dto));
    }

    @DeleteMapping("/user/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteAccount(@PathVariable UUID userId) {
        authService.deleteAccount(userId);
        return ResponseEntity.noContent().build();
    }

    // ── 2FA endpoints ─────────────────────────────────────────────────────────

    @PostMapping("/2fa/setup")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MfaSetupResponseDTO> setup2fa() {
        UUID userId = currentUserId();
        return ResponseEntity.ok(authService.setup2fa(userId));
    }

    @PostMapping("/2fa/confirm")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> confirm2fa(@RequestBody Confirm2faRequestDTO dto) {
        UUID userId = currentUserId();
        authService.confirm2fa(userId, dto.getCode());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/2fa/disable")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> disable2fa(@RequestBody Disable2faRequestDTO dto) {
        UUID userId = currentUserId();
        authService.disable2fa(userId, dto.getCode());
        return ResponseEntity.ok().build();
    }

    /** Public endpoint — called after password step when MFA is required. */
    @PostMapping("/2fa/verify")
    public ResponseEntity<?> verifyMfa(
            @RequestBody MfaVerifyRequestDTO dto,
            @RequestHeader(value = "X-Forwarded-For", required = false) String forwardedFor,
            jakarta.servlet.http.HttpServletRequest request) {

        String ip = forwardedFor != null ? forwardedFor.split(",")[0].trim()
                : request.getRemoteAddr();

        if (!checkRateLimit(ip)) {
            return ResponseEntity.status(429)
                    .body(Map.of("message", "Too many attempts. Please wait a minute."));
        }

        return ResponseEntity.ok(authService.verifyMfaLogin(dto.getTempToken(), dto.getCode()));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private UUID currentUserId() {
        return UUID.fromString(
                SecurityContextHolder.getContext().getAuthentication().getName()
        );
    }

    private boolean checkRateLimit(String ip) {
        long now = System.currentTimeMillis();
        mfaRateMap.compute(ip, (k, v) -> {
            if (v == null) return new long[]{1, now};
            if (now - v[1] > MFA_WINDOW_MS) return new long[]{1, now};
            v[0]++;
            return v;
        });
        long[] entry = mfaRateMap.get(ip);
        return entry[0] <= MFA_MAX_ATTEMPTS;
    }
}
