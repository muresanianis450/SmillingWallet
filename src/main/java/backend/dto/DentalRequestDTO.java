package backend.dto;

import backend.enums.DentalSpecialty;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class DentalRequestDTO {

    @NotNull(message = "Patient ID is required")
    private UUID patientPublicId;

    @NotNull(message = "Specialty is required")
    private DentalSpecialty specialty;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 1000, message = "Description must be between 10 and 1000 characters")
    private String description;

    @NotBlank(message = "Preferred city is required")
    @Size(min = 2, max = 100, message = "City must be between 2 and 100 characters")
    private String preferredCity;

    @DecimalMin(value = "0.0", inclusive = false, message = "Budget must be greater than 0")
    private Double budgetMax; // optional
}
