package backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class GoogleAuthRequestDTO {

    /** One-time authorization code from Google (auth-code flow). */
    @NotBlank(message = "Authorization code is required")
    private String code;
}
