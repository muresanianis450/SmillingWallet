package backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponseDTO {
    private boolean requiresMfa;
    private String token;
    private String refreshToken;
    private UserResponseDTO user;
    private String tempToken;

    public static LoginResponseDTO full(String token, String refreshToken, UserResponseDTO user) {
        return new LoginResponseDTO(false, token, refreshToken, user, null);
    }

    public static LoginResponseDTO mfa(String tempToken) {
        return new LoginResponseDTO(true, null, null, null, tempToken);
    }
}
