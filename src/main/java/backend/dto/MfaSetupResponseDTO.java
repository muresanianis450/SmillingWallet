package backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class MfaSetupResponseDTO {
    private String secret;
    private String qrCodeUri;
    private List<String> backupCodes;
}
