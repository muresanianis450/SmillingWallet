package backend.service;

import backend.dto.*;
import backend.enums.AuthProvider;
import backend.enums.DentalSpecialty;
import backend.enums.Role;
import backend.exception.ConflictException;
import backend.exception.ResourceNotFoundException;
import backend.model.PasswordResetToken;
import backend.model.RefreshToken;
import backend.model.User;
import backend.repository.PasswordResetTokenRepository;
import backend.repository.RefreshTokenRepository;
import backend.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

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
    private final StringRedisTemplate redisTemplate;
    private final TotpService totpService;
    private final TotpEncryptionService totpEncryptionService;
    private final ObjectMapper objectMapper;

    private static final String MFA_PENDING_PREFIX = "mfa:pending:";
    private static final String MFA_TEMP_PREFIX    = "mfa:temp:";

    // In-memory TTL caches — avoids Redis dependency for 2FA state
    private static class TtlCache {
        private final ConcurrentHashMap<String, String> data   = new ConcurrentHashMap<>();
        private final ConcurrentHashMap<String, Long>   expiry = new ConcurrentHashMap<>();

        void set(String key, String value, long ttlMs) {
            data.put(key, value);
            expiry.put(key, System.currentTimeMillis() + ttlMs);
        }

        String get(String key) {
            Long exp = expiry.get(key);
            if (exp == null || System.currentTimeMillis() > exp) {
                data.remove(key);
                expiry.remove(key);
                return null;
            }
            return data.get(key);
        }

        void delete(String key) {
            data.remove(key);
            expiry.remove(key);
        }
    }

    private final TtlCache mfaPendingCache = new TtlCache();
    private final TtlCache mfaTempCache    = new TtlCache();

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       JwtService jwtService,
                       PasswordEncoder passwordEncoder,
                       EmailService emailService,
                       StringRedisTemplate redisTemplate,
                       TotpService totpService,
                       TotpEncryptionService totpEncryptionService,
                       ObjectMapper objectMapper) {
        this.userRepository               = userRepository;
        this.refreshTokenRepository       = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.jwtService                   = jwtService;
        this.passwordEncoder              = passwordEncoder;
        this.emailService                 = emailService;
        this.redisTemplate                = redisTemplate;
        this.totpService                  = totpService;
        this.totpEncryptionService        = totpEncryptionService;
        this.objectMapper                 = objectMapper;
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

    public LoginResponseDTO login(LoginRequestDTO dto) {
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() ->
                        new ResourceNotFoundException("No account found for: " + dto.getEmail()));

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid password");
        }

        if (!user.isAccountActive()) {
            throw new IllegalArgumentException("Account not yet activated. Please check your invitation email.");
        }

        return issueLoginResponse(user);
    }

    /**
     * Final step of any successful first-factor authentication (password or Google):
     * returns an MFA challenge if the account has email-2FA or TOTP enabled, otherwise
     * a full token pair. Shared so social login honors the same 2FA settings as password login.
     */
    private LoginResponseDTO issueLoginResponse(User user) {
        if (user.isEmail2faEnabled()) {
            String code = String.format("%06d", new java.util.Random().nextInt(1_000_000));
            String tempToken = UUID.randomUUID().toString().replace("-", "")
                    + UUID.randomUUID().toString().replace("-", "");
            mfaTempCache.set("email2fa:login:" + tempToken, user.getId() + ":" + code, 10 * 60 * 1000L);
            emailService.sendEmail2faCode(user.getEmail2faAddress(), user.getUsername(), code);
            return LoginResponseDTO.mfa(tempToken, "email");
        }

        if (user.isTotpEnabled()) {
            String tempToken = UUID.randomUUID().toString().replace("-", "")
                    + UUID.randomUUID().toString().replace("-", "");
            mfaTempCache.set(MFA_TEMP_PREFIX + tempToken, user.getId().toString(), 5 * 60 * 1000L);
            return LoginResponseDTO.mfa(tempToken, "totp");
        }

        AuthResponseDTO auth = issueTokenPair(user);
        return LoginResponseDTO.full(auth.getToken(), auth.getRefreshToken(), auth.getUser());
    }

    // ── GOOGLE LOGIN ──────────────────────────────────────────────────────────

    /**
     * Logs in (or creates, on first sign-in) a user from a Google-verified profile.
     * New social users become PATIENTs (dentists are invite-only). The profile is
     * fetched outside this transaction by the controller. 2FA is still honored via
     * {@link #issueLoginResponse(User)} — a linked account with 2FA gets challenged.
     */
    public LoginResponseDTO loginWithGoogle(GoogleOAuthService.GoogleProfile profile) {
        if (!profile.emailVerified()) {
            throw new IllegalArgumentException("Your Google email is not verified");
        }

        User user = userRepository.findByEmail(profile.email()).orElse(null);

        if (user == null) {
            user = new User();
            user.setEmail(profile.email());
            user.setUsername(deriveUsername(profile));
            user.setPassword(null);                 // no local password for social accounts
            user.setRole(Role.PATIENT);             // dentists are invite-only
            user.setCreatedAt(java.time.LocalDateTime.now());
            user.setEmailRemindersEnabled(true);
            user.setAccountActive(true);
            user.setAuthProvider(AuthProvider.GOOGLE);
            user.setProviderId(profile.sub());
            user.setProfilePicture(safePicture(profile.picture()));
            userRepository.save(user);
            log.info("Created new Google account for {}", profile.email());
        } else if (user.getProviderId() == null) {
            // Existing local account with the same (Google-verified) email — link it.
            user.setAuthProvider(AuthProvider.GOOGLE);
            user.setProviderId(profile.sub());
            if (user.getProfilePicture() == null) {
                user.setProfilePicture(safePicture(profile.picture()));
            }
            userRepository.save(user);
            log.info("Linked existing account {} to Google", profile.email());
        }

        if (!user.isAccountActive()) {
            throw new IllegalArgumentException("Account not yet activated.");
        }

        return issueLoginResponse(user);
    }

    /** profile_picture is VARCHAR(255); drop over-length avatar URLs rather than failing the insert. */
    private String safePicture(String picture) {
        return (picture != null && picture.length() <= 255) ? picture : null;
    }

    /** Builds a 3–50 char username from the Google display name, falling back to the email prefix. */
    private String deriveUsername(GoogleOAuthService.GoogleProfile profile) {
        String base = profile.name() != null && !profile.name().isBlank()
                ? profile.name().trim()
                : profile.email().split("@")[0];
        if (base.length() < 3)  base = (base + "___").substring(0, 3);
        if (base.length() > 50) base = base.substring(0, 50);
        return base;
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
        userRepository.findByEmail(dto.getEmail()).ifPresent(user -> {
            passwordResetTokenRepository.deleteAllByUserId(user.getId());

            PasswordResetToken prt = new PasswordResetToken();
            prt.setUser(user);
            prt.setToken(UUID.randomUUID().toString());
            prt.setCreatedAt(Instant.now());
            prt.setExpiresAt(Instant.now().plusSeconds(86400));
            passwordResetTokenRepository.save(prt);
            try {
                emailService.sendPasswordReset(user.getEmail(), user.getUsername(), prt.getToken());
            } catch (Exception e) {
                log.warn("Failed to send password reset email to {}: {}", user.getEmail(), e.getMessage());
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

        refreshTokenRepository.deleteAllByUserId(user.getId());
    }

    // ── 2FA SETUP ─────────────────────────────────────────────────────────────

    public MfaSetupResponseDTO setup2fa(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (user.isTotpEnabled()) {
            throw new IllegalStateException("2FA is already enabled");
        }

        String secret = totpService.generateSecret();
        String qrCodeUri = totpService.generateQrCodeUri(secret, user.getEmail());
        String[] backupCodes = totpService.generateBackupCodes();
        String hashedCodesJson = totpService.hashBackupCodes(backupCodes);

        try {
            Map<String, String> pending = Map.of("secret", secret, "backupCodesJson", hashedCodesJson);
            mfaPendingCache.set(MFA_PENDING_PREFIX + userId, objectMapper.writeValueAsString(pending), 10 * 60 * 1000L);
        } catch (Exception e) {
            throw new RuntimeException("Failed to store pending 2FA setup", e);
        }

        return new MfaSetupResponseDTO(secret, qrCodeUri, Arrays.asList(backupCodes));
    }

    // ── 2FA CONFIRM ───────────────────────────────────────────────────────────

    public void confirm2fa(UUID userId, String code) {
        String pendingJson = mfaPendingCache.get(MFA_PENDING_PREFIX + userId);
        if (pendingJson == null) {
            throw new IllegalStateException("No pending 2FA setup found or it has expired");
        }

        Map<String, String> pending;
        try {
            pending = objectMapper.readValue(pendingJson, new TypeReference<>() {});
        } catch (Exception e) {
            throw new RuntimeException("Failed to read pending 2FA data", e);
        }

        String secret = pending.get("secret");
        if (!totpService.verifyCode(secret, code)) {
            throw new IllegalArgumentException("Invalid 2FA code — please try again");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        user.setTotpSecret(totpEncryptionService.encrypt(secret));
        user.setTotpEnabled(true);
        user.setBackupCodes(pending.get("backupCodesJson"));
        userRepository.save(user);

        mfaPendingCache.delete(MFA_PENDING_PREFIX + userId);
        log.info("2FA enabled for user {}", userId);
    }

    // ── 2FA DISABLE ───────────────────────────────────────────────────────────

    public void disable2fa(UUID userId, String code) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (!user.isTotpEnabled()) {
            throw new IllegalStateException("2FA is not enabled");
        }

        boolean valid = false;
        String secret = totpEncryptionService.decrypt(user.getTotpSecret());

        if (code != null && code.matches("\\d{6}")) {
            valid = totpService.verifyCode(secret, code);
        } else if (code != null && user.getBackupCodes() != null) {
            String updatedCodes = totpService.checkAndConsumeBackupCode(code, user.getBackupCodes());
            if (updatedCodes != null) {
                valid = true;
                user.setBackupCodes(updatedCodes);
            }
        }

        if (!valid) {
            throw new IllegalArgumentException("Invalid code");
        }

        user.setTotpSecret(null);
        user.setTotpEnabled(false);
        user.setBackupCodes(null);
        userRepository.save(user);
        log.info("2FA disabled for user {}", userId);
    }

    // ── MFA LOGIN VERIFY ──────────────────────────────────────────────────────

    public LoginResponseDTO verifyMfaLogin(String tempToken, String code) {
        String userIdStr = mfaTempCache.get(MFA_TEMP_PREFIX + tempToken);
        if (userIdStr == null) {
            throw new IllegalArgumentException("Invalid or expired session — please log in again");
        }

        User user = userRepository.findById(UUID.fromString(userIdStr))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean valid = false;

        if (code != null && code.matches("\\d{6}")) {
            String secret = totpEncryptionService.decrypt(user.getTotpSecret());
            valid = totpService.verifyCode(secret, code);
        } else if (code != null && user.getBackupCodes() != null) {
            String updatedCodes = totpService.checkAndConsumeBackupCode(code, user.getBackupCodes());
            if (updatedCodes != null) {
                valid = true;
                user.setBackupCodes(updatedCodes);
                userRepository.save(user);
                log.info("Backup code used during login for user {} at {}", userIdStr, Instant.now());
            }
        }

        if (!valid) {
            throw new IllegalArgumentException("Invalid 2FA code");
        }

        mfaTempCache.delete(MFA_TEMP_PREFIX + tempToken);
        AuthResponseDTO auth = issueTokenPair(user);
        return LoginResponseDTO.full(auth.getToken(), auth.getRefreshToken(), auth.getUser());
    }

    // ── EMAIL 2FA ─────────────────────────────────────────────────────────────

    private static final String EMAIL2FA_PENDING_PREFIX = "email2fa:pending:";

    public void sendEmail2faSetupCode(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        String code = String.format("%06d", new java.util.Random().nextInt(1_000_000));
        mfaPendingCache.set(EMAIL2FA_PENDING_PREFIX + userId, code, 10 * 60 * 1000L);
        String target = user.isEmail2faEnabled() && user.getEmail2faAddress() != null
                ? user.getEmail2faAddress()
                : user.getEmail();
        emailService.sendEmail2faCode(target, user.getUsername(), code);
    }

    public void enableEmail2fa(UUID userId, String email, String code) {
        String stored = mfaPendingCache.get(EMAIL2FA_PENDING_PREFIX + userId);
        if (stored == null || !stored.equals(code)) {
            throw new IllegalArgumentException("Invalid or expired code");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        user.setEmail2faEnabled(true);
        user.setEmail2faAddress(email);
        userRepository.save(user);
        mfaPendingCache.delete(EMAIL2FA_PENDING_PREFIX + userId);
        log.info("Email 2FA enabled for user {}", userId);
    }

    public void disableEmail2fa(UUID userId, String code) {
        String stored = mfaPendingCache.get(EMAIL2FA_PENDING_PREFIX + userId);
        if (stored == null || !stored.equals(code)) {
            throw new IllegalArgumentException("Invalid or expired code");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        user.setEmail2faEnabled(false);
        user.setEmail2faAddress(null);
        userRepository.save(user);
        mfaPendingCache.delete(EMAIL2FA_PENDING_PREFIX + userId);
        log.info("Email 2FA disabled for user {}", userId);
    }

    public LoginResponseDTO verifyEmail2faLogin(String tempToken, String code) {
        String cached = mfaTempCache.get("email2fa:login:" + tempToken);
        if (cached == null) {
            throw new IllegalArgumentException("Invalid or expired session — please log in again");
        }
        String[] parts = cached.split(":", 2);
        if (parts.length != 2 || !parts[1].equals(code)) {
            throw new IllegalArgumentException("Invalid 2FA code");
        }
        User user = userRepository.findById(UUID.fromString(parts[0]))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        mfaTempCache.delete("email2fa:login:" + tempToken);
        AuthResponseDTO auth = issueTokenPair(user);
        return LoginResponseDTO.full(auth.getToken(), auth.getRefreshToken(), auth.getUser());
    }

    // ── DENTIST INVITE ────────────────────────────────────────────────────────

    public UserResponseDTO createDentistInvite(CreateDentistRequestDTO dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new ConflictException("An account with this email already exists");
        }

        User user = new User(
                dto.getEmail(),
                dto.getClinicName(),
                passwordEncoder.encode(UUID.randomUUID().toString()),  // locked random password
                dto.getPhone(),
                Role.DENTIST
        );
        user.setCity(dto.getCity());
        user.setAddress(dto.getAddress());
        user.setSpecialty(dto.getSpecialty());
        user.setAccountActive(false);   // activated only when they set their password
        userRepository.save(user);

        PasswordResetToken prt = new PasswordResetToken();
        prt.setUser(user);
        prt.setToken(UUID.randomUUID().toString());
        prt.setCreatedAt(Instant.now());
        prt.setExpiresAt(Instant.now().plusSeconds(72 * 3600)); // 72 hours
        passwordResetTokenRepository.save(prt);

        emailService.sendDentistInvite(user.getEmail(), user.getUsername(), prt.getToken());

        return UserResponseDTO.from(user);
    }

    public void verifyInviteToken(String token) {
        PasswordResetToken prt = passwordResetTokenRepository
                .findByTokenAndUsedFalse(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or already used invitation link"));

        if (prt.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("This invitation link has expired");
        }
    }

    public void activateAccount(ResetPasswordRequestDTO dto) {
        PasswordResetToken prt = passwordResetTokenRepository
                .findByTokenAndUsedFalse(dto.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or already used invitation link"));

        if (prt.getExpiresAt().isBefore(Instant.now())) {
            prt.setUsed(true);
            throw new IllegalArgumentException("This invitation link has expired");
        }

        User user = prt.getUser();
        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        user.setAccountActive(true);
        prt.setUsed(true);

        refreshTokenRepository.deleteAllByUserId(user.getId());
    }

    public List<UserResponseDTO> findAllByRole(Role role) {
        return userRepository.findByRole(role).stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(UserResponseDTO::from)
                .toList();
    }

    // ── PROFILE ───────────────────────────────────────────────────────────────

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
        user.setCity(dto.getCity());
        user.setAddress(dto.getAddress());

        if (dto.getProfilePicture() != null) {
            user.setProfilePicture(dto.getProfilePicture());
        }
        if (dto.getEmailRemindersEnabled() != null) {
            user.setEmailRemindersEnabled(dto.getEmailRemindersEnabled());
        }

        if (user.getRole() == Role.DENTIST) {
            if (dto.getRating() != null) user.setRating(dto.getRating());
            if (dto.getSpecialty() != null) user.setSpecialty(dto.getSpecialty());
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

    // ── PRIVATE ───────────────────────────────────────────────────────────────

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
