package backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;

@Service
@Slf4j
public class TotpService {

    private static final int BACKUP_CODE_COUNT = 8;
    private static final String CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final DefaultSecretGenerator secretGenerator = new DefaultSecretGenerator(32);
    private final ZxingPngQrGenerator qrGenerator = new ZxingPngQrGenerator();

    public TotpService(PasswordEncoder passwordEncoder, ObjectMapper objectMapper) {
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
    }

    public String generateSecret() {
        return secretGenerator.generate();
    }

    public String generateQrCodeUri(String secret, String email) {
        try {
            QrData qrData = new QrData.Builder()
                    .label(email)
                    .secret(secret)
                    .issuer("SmilingWallet")
                    .algorithm(HashingAlgorithm.SHA1)
                    .digits(6)
                    .period(30)
                    .build();
            byte[] imageData = qrGenerator.generate(qrData);
            return "data:" + qrGenerator.getImageMimeType() + ";base64,"
                    + Base64.getEncoder().encodeToString(imageData);
        } catch (QrGenerationException e) {
            throw new RuntimeException("QR code generation failed", e);
        }
    }

    public boolean verifyCode(String secret, String code) {
        try {
            DefaultCodeGenerator generator = new DefaultCodeGenerator(HashingAlgorithm.SHA1);
            long currentPeriod = System.currentTimeMillis() / 1000L / 30L;
            // Check current period and ±1 to tolerate clock skew
            for (long delta = -1; delta <= 1; delta++) {
                if (generator.generate(secret, currentPeriod + delta).equals(code)) {
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            log.warn("TOTP verification error: {}", e.getMessage());
            return false;
        }
    }

    public String[] generateBackupCodes() {
        SecureRandom random = new SecureRandom();
        String[] codes = new String[BACKUP_CODE_COUNT];
        for (int i = 0; i < BACKUP_CODE_COUNT; i++) {
            StringBuilder sb = new StringBuilder(9);
            for (int j = 0; j < 4; j++) sb.append(CHARS.charAt(random.nextInt(CHARS.length())));
            sb.append('-');
            for (int j = 0; j < 4; j++) sb.append(CHARS.charAt(random.nextInt(CHARS.length())));
            codes[i] = sb.toString();
        }
        return codes;
    }

    public String hashBackupCodes(String[] codes) {
        try {
            String[] hashes = new String[codes.length];
            for (int i = 0; i < codes.length; i++) {
                hashes[i] = passwordEncoder.encode(codes[i].toUpperCase());
            }
            return objectMapper.writeValueAsString(hashes);
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash backup codes", e);
        }
    }

    /**
     * Checks the input against stored hashes. Returns updated JSON (with matched code removed)
     * on success, or null if no match.
     */
    public String checkAndConsumeBackupCode(String inputCode, String hashedCodesJson) {
        try {
            List<String> hashes = objectMapper.readValue(hashedCodesJson, new TypeReference<>() {});
            String normalized = inputCode.toUpperCase().replaceAll("[^A-Z0-9-]", "");
            for (int i = 0; i < hashes.size(); i++) {
                if (passwordEncoder.matches(normalized, hashes.get(i))) {
                    hashes.remove(i);
                    return objectMapper.writeValueAsString(hashes);
                }
            }
        } catch (Exception e) {
            log.warn("Backup code check failed: {}", e.getMessage());
        }
        return null;
    }
}
