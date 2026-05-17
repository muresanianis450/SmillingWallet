package backend.service;

import backend.dto.*;
import backend.enums.Role;
import backend.exception.ResourceNotFoundException;
import backend.model.PasswordResetToken;
import backend.model.RefreshToken;
import backend.model.User;
import backend.repository.PasswordResetTokenRepository;
import backend.repository.RefreshTokenRepository;
import backend.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       JwtService jwtService,
                       PasswordEncoder passwordEncoder,
                       EmailService emailService) {
        this.userRepository               = userRepository;
        this.refreshTokenRepository       = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.jwtService                   = jwtService;
        this.passwordEncoder              = passwordEncoder;
        this.emailService                 = emailService;
    }

    // ── REGISTER ──────────────────────────────────────────────────────────────

    public AuthResponseDTO register(RegisterRequestDTO dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email is already taken");
        }
        if (dto.getRole() == Role.DENTIST) {
            if (dto.getCity() == null || dto.getCity().isBlank())
                throw new IllegalArgumentException("City is required for dentists");
            if (dto.getSpecialty() == null)
                throw new IllegalArgumentException("Specialty is required for dentists");
        }

        User user = new User(
                dto.getEmail(),
                dto.getUsername(),
                passwordEncoder.encode(dto.getPassword()),
                dto.getPhone(),
                dto.getRole()
        );
        user.setCity(dto.getCity());
        user.setAddress(dto.getAddress());
        user.setRating(dto.getRating());
        user.setSpecialty(dto.getSpecialty());
        userRepository.save(user);

        return issueTokenPair(user);
    }

    // ── LOGIN ─────────────────────────────────────────────────────────────────

    public AuthResponseDTO login(LoginRequestDTO dto) {
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() ->
                        new ResourceNotFoundException("No account found for: " + dto.getEmail()));

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid password");
        }

        return issueTokenPair(user);
    }

    // ── REFRESH ───────────────────────────────────────────────────────────────

    public AuthResponseDTO refresh(RefreshRequestDTO dto) {
        RefreshToken rt = refreshTokenRepository
                .findByTokenAndRevokedFalse(dto.getRefreshToken())
                .orElseThrow(() ->
                        new IllegalArgumentException("Invalid or expired refresh token"));

        if (rt.getExpiresAt().isBefore(Instant.now())) {
            rt.setRevoked(true);
            throw new IllegalArgumentException("Refresh token expired — please log in again");
        }

        // Rotate: revoke old, issue a fresh pair
        rt.setRevoked(true);
        return issueTokenPair(rt.getUser());
    }

    // ── LOGOUT ────────────────────────────────────────────────────────────────

    public void logout(RefreshRequestDTO dto) {
        refreshTokenRepository
                .findByTokenAndRevokedFalse(dto.getRefreshToken())
                .ifPresent(rt -> rt.setRevoked(true));
    }

    // ── FORGOT PASSWORD ───────────────────────────────────────────────────────

    public void forgotPassword(ForgotPasswordRequestDTO dto) {
        // Always returns 200 — never reveals whether the email exists
        userRepository.findByEmail(dto.getEmail()).ifPresent(user -> {
            passwordResetTokenRepository.deleteAllByUserId(user.getId());

            PasswordResetToken prt = new PasswordResetToken();
            prt.setUser(user);
            prt.setToken(UUID.randomUUID().toString());
            prt.setCreatedAt(Instant.now());
            prt.setExpiresAt(Instant.now().plusSeconds(3600)); // 1 hour
            passwordResetTokenRepository.save(prt);
            try {
                emailService.sendPasswordReset(user.getEmail(), prt.getToken());
            }catch (Exception e) {
                //log it but don't rethrow, never leak email existence
                log.warn("Failed to send password reset email to {} : {}", user.getEmail(), e.getMessage());
            }
        });
    }

    // ── RESET PASSWORD ────────────────────────────────────────────────────────

    public void resetPassword(ResetPasswordRequestDTO dto) {
        PasswordResetToken prt = passwordResetTokenRepository
                .findByTokenAndUsedFalse(dto.getToken())
                .orElseThrow(() ->
                        new IllegalArgumentException("Invalid or expired reset token"));

        if (prt.getExpiresAt().isBefore(Instant.now())) {
            prt.setUsed(true);
            throw new IllegalArgumentException("Reset token expired");
        }

        User user = prt.getUser();
        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        prt.setUsed(true);

        // Revoke all active sessions after a password change
        refreshTokenRepository.deleteAllByUserId(user.getId());
    }

    // ── PROFILE / ADMIN ───────────────────────────────────────────────────────

    public UserResponseDTO loadByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new ResourceNotFoundException("No account found for: " + username));
        return UserResponseDTO.from(user);
    }

    public UserResponseDTO updateProfile(UUID userId, UpdateProfileRequestDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("No account found for id: " + userId));

        user.setUsername(dto.getUsername());
        user.setPhone(dto.getPhone());

        if (user.getRole() == Role.DENTIST) {
            user.setCity(dto.getCity());
            user.setAddress(dto.getAddress());
            user.setRating(dto.getRating());
            user.setSpecialty(dto.getSpecialty());
        }

        userRepository.save(user);
        return UserResponseDTO.from(user);
    }

    public void deleteAccount(UUID userId) {
        if (!userRepository.existsById(userId))
            throw new ResourceNotFoundException("No account found for id: " + userId);
        userRepository.deleteById(userId);
    }

    public PagedResponseDTO<UserResponseDTO> findAll(int page, int size) {
        List<UserResponseDTO> all = userRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(UserResponseDTO::from)
                .toList();
        return new PagedResponseDTO<>(all, page, size);
    }

    public UserResponseDTO findById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("No account found for id: " + userId));
        return UserResponseDTO.from(user);
    }

    // ── PRIVATE HELPER ────────────────────────────────────────────────────────

    private AuthResponseDTO issueTokenPair(User user) {
        String accessToken  = jwtService.generateAccessToken(
                user.getId().toString(),
                user.getEmail(),
                user.getRole().name()
        );
        String refreshToken = jwtService.generateRefreshToken();

        RefreshToken rt = new RefreshToken();
        rt.setUser(user);
        rt.setToken(refreshToken);
        rt.setIssuedAt(Instant.now());
        rt.setExpiresAt(Instant.now().plusMillis(jwtService.getRefreshTokenExpiryMs()));
        refreshTokenRepository.save(rt);

        return new AuthResponseDTO(accessToken, refreshToken, UserResponseDTO.from(user));
    }
}