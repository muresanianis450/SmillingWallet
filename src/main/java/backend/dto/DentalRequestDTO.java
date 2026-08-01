package backend.dto;

import backend.enums.DentalSpecialty;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;
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

    @NotEmpty(message = "Select at least one city")
    @Size(min = 1, max = 3, message = "Select between 1 and 3 cities")
    private List<@NotBlank @Size(max = 100) String> preferredCities;

    @DecimalMin(value = "0.0", inclusive = false, message = "Budget must be greater than 0")
    private Double budgetMax; // optional

    @NotNull(message = "Available from date is required")
    private LocalDate availableFrom;

    @NotNull(message = "Available until date is required")
    private LocalDate availableTo;
}
