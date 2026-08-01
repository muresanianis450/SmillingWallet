package backend.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthResponseDTO {

    private String token; //access token
    private String refreshToken;
    private UserResponseDTO user;
}
