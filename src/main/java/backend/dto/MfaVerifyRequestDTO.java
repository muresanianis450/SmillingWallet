package backend.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class MfaVerifyRequestDTO {
    private String tempToken;
    private String code;
}
