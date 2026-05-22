package backend.service.tests;

import backend.dto.*;
import backend.enums.DentalSpecialty;
import backend.enums.Role;
import backend.exception.ResourceNotFoundException;
import backend.model.RefreshToken;
import backend.model.User;
import backend.repository.PasswordResetTokenRepository;
import backend.repository.RefreshTokenRepository;
import backend.repository.UserRepository;
import backend.service.AuthService;
import backend.service.EmailService;
import backend.service.JwtService;
import backend.service.TotpEncryptionService;
import backend.service.TotpService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    // ── Mocks ────────────────────────────────────────────────────────────────
    @Mock private UserRepository                userRepository;
    @Mock private RefreshTokenRepository        refreshTokenRepository;
    @Mock private PasswordResetTokenRepository  passwordResetTokenRepository;
    @Mock private JwtService                    jwtService;
    @Mock private EmailService                  emailService;
    @Mock private StringRedisTemplate           redisTemplate;
    @Mock private TotpService                   totpService;
    @Mock private TotpEncryptionService         totpEncryptionService;

    // Real BCrypt with cost 4 — fast enough for unit tests
    private PasswordEncoder passwordEncoder;
    private AuthService     authService;

    private RegisterRequestDTO registerDto;
    private User               user;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder(4);
        authService = new AuthService(
                userRepository,
                refreshTokenRepository,
                passwordResetTokenRepository,
                jwtService,
                passwordEncoder,
                emailService,
                redisTemplate,
                totpService,
                totpEncryptionService,
                new ObjectMapper()
        );

        // Standard PATIENT registration DTO
        registerDto = new RegisterRequestDTO();
        registerDto.setEmail("test@test.com");
        registerDto.setUsername("testuser");
        registerDto.setPassword("Pass1!xyz");   // meets 8-char + digit + special
        registerDto.setPhone("0700000000");
        registerDto.setRole(Role.PATIENT);

        // User whose password is already BCrypt-encoded (mirrors what DB would hold)
        user = new User(
                "test@test.com", "testuser",
                passwordEncoder.encode("Pass1!xyz"),
                "0700000000", Role.PATIENT
        );
    }

    // ── REGISTER ─────────────────────────────────────────────────────────────

    @Test
    void register_shouldThrow_whenEmailTaken() {
        when(userRepository.existsByEmail(registerDto.getEmail())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerDto))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Email is already taken");
    }

    @Test
    void register_shouldThrow_whenDentistMissingCity() {
        registerDto.setRole(Role.DENTIST);
        registerDto.setSpecialty(DentalSpecialty.ORTHODONTICS);
        when(userRepository.existsByEmail(any())).thenReturn(false);

        assertThatThrownBy(() -> authService.register(registerDto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("City is required");
    }

    @Test
    void register_shouldThrow_whenDentistMissingSpecialty() {
        registerDto.setRole(Role.DENTIST);
        registerDto.setCity("Cluj");
        when(userRepository.existsByEmail(any())).thenReturn(false);

        assertThatThrownBy(() -> authService.register(registerDto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Specialty is required");
    }

    @Test
    void register_shouldSucceed_andReturnRealJwt() {
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(userRepository.save(any())).thenReturn(user);
        when(jwtService.generateAccessToken(any(), any(), any())).thenReturn("jwt.access.token");
        when(jwtService.generateRefreshToken()).thenReturn("opaque-refresh-token");
        when(jwtService.getRefreshTokenExpiryMs()).thenReturn(604800000L);
        when(refreshTokenRepository.save(any())).thenReturn(new RefreshToken());

        AuthResponseDTO result = authService.register(registerDto);

        assertThat(result).isNotNull();
        assertThat(result.getToken()).isEqualTo("jwt.access.token");   // real JWT, not "token_xxx"
        assertThat(result.getRefreshToken()).isEqualTo("opaque-refresh-token");
        assertThat(result.getToken()).doesNotStartWith("token_");       // old stub is gone
    }

    // ── LOGIN ─────────────────────────────────────────────────────────────────

    @Test
    void login_shouldThrow_whenEmailNotFound() {
        LoginRequestDTO dto = new LoginRequestDTO();
        dto.setEmail("none@test.com");
        dto.setPassword("somepass");
        when(userRepository.findByEmail(dto.getEmail())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(dto))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void login_shouldThrow_whenPasswordWrong() {
        LoginRequestDTO dto = new LoginRequestDTO();
        dto.setEmail("test@test.com");
        dto.setPassword("wrongpassword!");
        when(userRepository.findByEmail(dto.getEmail())).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid password");
    }

    @Test
    void login_shouldSucceed_whenCredentialsCorrect() {
        LoginRequestDTO dto = new LoginRequestDTO();
        dto.setEmail("test@test.com");
        dto.setPassword("Pass1!xyz");   // matches the BCrypt hash in user
        when(userRepository.findByEmail(dto.getEmail())).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken(any(), any(), any())).thenReturn("jwt.access.token");
        when(jwtService.generateRefreshToken()).thenReturn("opaque-refresh-token");
        when(jwtService.getRefreshTokenExpiryMs()).thenReturn(604800000L);
        when(refreshTokenRepository.save(any())).thenReturn(new RefreshToken());

        LoginResponseDTO result = authService.login(dto);

        assertThat(result.isRequiresMfa()).isFalse();
        assertThat(result.getToken()).isEqualTo("jwt.access.token");
        assertThat(result.getRefreshToken()).isNotNull();
    }

    // ── REFRESH ───────────────────────────────────────────────────────────────

    @Test
    void refresh_shouldThrow_whenTokenNotFound() {
        RefreshRequestDTO dto = new RefreshRequestDTO();
        dto.setRefreshToken("bad-token");
        when(refreshTokenRepository.findByTokenAndRevokedFalse("bad-token"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.refresh(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid or expired refresh token");
    }

    @Test
    void refresh_shouldThrow_whenTokenExpired() {
        RefreshToken expired = new RefreshToken();
        expired.setUser(user);
        expired.setToken("expired-token");
        expired.setIssuedAt(Instant.now().minusSeconds(9000));
        expired.setExpiresAt(Instant.now().minusSeconds(1)); // already expired

        RefreshRequestDTO dto = new RefreshRequestDTO();
        dto.setRefreshToken("expired-token");
        when(refreshTokenRepository.findByTokenAndRevokedFalse("expired-token"))
                .thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> authService.refresh(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Refresh token expired");
    }

    @Test
    void refresh_shouldRotateToken_whenValid() {
        RefreshToken active = new RefreshToken();
        active.setUser(user);
        active.setToken("valid-token");
        active.setIssuedAt(Instant.now().minusSeconds(60));
        active.setExpiresAt(Instant.now().plusSeconds(604800));

        RefreshRequestDTO dto = new RefreshRequestDTO();
        dto.setRefreshToken("valid-token");
        when(refreshTokenRepository.findByTokenAndRevokedFalse("valid-token"))
                .thenReturn(Optional.of(active));
        when(jwtService.generateAccessToken(any(), any(), any())).thenReturn("new.access.token");
        when(jwtService.generateRefreshToken()).thenReturn("new-refresh-token");
        when(jwtService.getRefreshTokenExpiryMs()).thenReturn(604800000L);
        when(refreshTokenRepository.save(any())).thenReturn(new RefreshToken());

        AuthResponseDTO result = authService.refresh(dto);

        assertThat(active.isRevoked()).isTrue();               // old token revoked
        assertThat(result.getToken()).isEqualTo("new.access.token");
        assertThat(result.getRefreshToken()).isEqualTo("new-refresh-token");
    }

    // ── LOGOUT ────────────────────────────────────────────────────────────────

    @Test
    void logout_shouldRevokeToken_whenFound() {
        RefreshToken active = new RefreshToken();
        active.setRevoked(false);
        RefreshRequestDTO dto = new RefreshRequestDTO();
        dto.setRefreshToken("some-token");
        when(refreshTokenRepository.findByTokenAndRevokedFalse("some-token"))
                .thenReturn(Optional.of(active));

        authService.logout(dto);

        assertThat(active.isRevoked()).isTrue();
    }

    @Test
    void logout_shouldNotThrow_whenTokenAlreadyInvalid() {
        RefreshRequestDTO dto = new RefreshRequestDTO();
        dto.setRefreshToken("unknown-token");
        when(refreshTokenRepository.findByTokenAndRevokedFalse("unknown-token"))
                .thenReturn(Optional.empty());

        assertThatNoException().isThrownBy(() -> authService.logout(dto));
    }

    // ── PROFILE ───────────────────────────────────────────────────────────────

    @Test
    void loadByUsername_shouldThrow_whenNotFound() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.loadByUsername("ghost"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void loadByUsername_shouldReturnDTO_whenFound() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));

        assertThat(authService.loadByUsername("testuser")).isNotNull();
    }

    @Test
    void updateProfile_shouldThrow_whenUserNotFound() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.updateProfile(id, new UpdateProfileRequestDTO()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateProfile_shouldUpdate_whenValid() {
        UUID id = UUID.randomUUID();
        UpdateProfileRequestDTO dto = new UpdateProfileRequestDTO();
        dto.setUsername("newname");
        dto.setPhone("0700000001");
        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenReturn(user);

        assertThat(authService.updateProfile(id, dto)).isNotNull();
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    @Test
    void deleteAccount_shouldThrow_whenNotFound() {
        UUID id = UUID.randomUUID();
        when(userRepository.existsById(id)).thenReturn(false);

        assertThatThrownBy(() -> authService.deleteAccount(id))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteAccount_shouldDelete_whenFound() {
        UUID id = UUID.randomUUID();
        when(userRepository.existsById(id)).thenReturn(true);

        assertThatNoException().isThrownBy(() -> authService.deleteAccount(id));
        verify(userRepository).deleteById(id);
    }

    // ── FIND ALL / FIND BY ID ─────────────────────────────────────────────────

    @Test
    void findAll_shouldReturnPagedResults() {
        when(userRepository.findAll()).thenReturn(List.of(user));

        assertThat(authService.findAll(0, 10).getContent()).hasSize(1);
    }

    @Test
    void findById_shouldThrow_whenNotFound() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.findById(id))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void findById_shouldReturnDTO_whenFound() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.of(user));

        assertThat(authService.findById(id)).isNotNull();
    }
}