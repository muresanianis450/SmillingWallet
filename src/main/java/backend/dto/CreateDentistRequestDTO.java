package backend.dto;

import backend.enums.DentalSpecialty;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CreateDentistRequestDTO {

    @NotBlank(message = "Clinic name is required")
    @Size(min = 2, max = 100, message = "Clinic name must be between 2 and 100 characters")
    private String clinicName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Phone is required")
    @Pattern(regexp = "^[+]?[0-9\\s\\-()]{7,20}$", message = "Phone number is invalid")
    private String phone;

    @NotBlank(message = "City is required")
    private String city;

    private String address;

    @NotNull(message = "Specialty is required")
    private DentalSpecialty specialty;
}
