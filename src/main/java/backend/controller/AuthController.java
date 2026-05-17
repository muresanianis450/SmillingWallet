package backend.controller;

import backend.dto.*;
import backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(
            @Valid @RequestBody RegisterRequestDTO dto) {
        return ResponseEntity.ok(authService.register(dto));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(
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

    // ── Existing profile endpoints ────────────────────────────────────────────

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
}