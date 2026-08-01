package backend.model;

import backend.enums.AuthProvider;
import backend.enums.DentalSpecialty;
import backend.enums.Role;
import backend.util.SpecialtyListConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "username", nullable = false, length = 100)
    private String username;

    /** Null for social-login accounts (Google/Apple) that never set a local password. */
    @Column(name = "password")
    private String password;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "rating")
    private Double rating;

    /**
     * The treatments this clinic offers. Empty for patients.
     */
    @Convert(converter = SpecialtyListConverter.class)
    @Column(name = "specialties", length = 500)
    private List<DentalSpecialty> specialties = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ── Profile extras ────────────────────────────────────────────────────────

    @Column(name = "profile_picture", length = 255)
    private String profilePicture;

    @Column(name = "email_reminders_enabled", nullable = false)
    private boolean emailRemindersEnabled = true;

    // ── TOTP / 2FA ────────────────────────────────────────────────────────────

    /** AES-256-GCM encrypted TOTP secret (base64-encoded iv+ciphertext). */
    @Column(name = "totp_secret", length = 256)
    private String totpSecret;

    @Column(name = "totp_enabled", nullable = false)
    private boolean totpEnabled = false;

    /** JSON array of BCrypt-hashed backup codes. */
    @Column(name = "backup_codes", columnDefinition = "TEXT")
    private String backupCodes;

    // ── Email 2FA ─────────────────────────────────────────────────────────────

    @Column(name = "email2fa_enabled", nullable = false)
    private boolean email2faEnabled = false;

    @Column(name = "email2fa_address", length = 255)
    private String email2faAddress;

    /** FALSE for dentist accounts created by admin invite — until they set their password. */
    @Column(name = "account_active", nullable = false)
    private boolean accountActive = true;

    // ── Social login ──────────────────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider", nullable = false, length = 20)
    private AuthProvider authProvider = AuthProvider.LOCAL;

    /** The provider's stable user id (e.g. Google's `sub`). Null for LOCAL accounts. */
    @Column(name = "provider_id", length = 255)
    private String providerId;

    public User(String email, String username, String password, String phone, Role role) {
        this.email = email;
        this.username = username;
        this.password = password;
        this.phone = phone;
        this.role = role;
        this.createdAt = LocalDateTime.now();
        this.emailRemindersEnabled = true;
    }
}
