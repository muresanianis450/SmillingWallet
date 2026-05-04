package backend.controller;

import backend.dto.*;
import backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<AuthResponseDTO> register(@Valid @RequestBody RegisterRequestDTO dto) {
        return ResponseEntity.ok(authService.register(dto));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginRequestDTO dto) {
        return ResponseEntity.ok(authService.login(dto));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<UserResponseDTO> getUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(authService.findById(userId));
    }

    @PutMapping("/user/{userId}")
    public ResponseEntity<UserResponseDTO> updateProfile(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateProfileRequestDTO dto) {
        return ResponseEntity.ok(authService.updateProfile(userId, dto));
    }

    @DeleteMapping("/user/{userId}")
    public ResponseEntity<Void> deleteAccount(@PathVariable UUID userId) {
        authService.deleteAccount(userId);
        return ResponseEntity.noContent().build();
    }
}