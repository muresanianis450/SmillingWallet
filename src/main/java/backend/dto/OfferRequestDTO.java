package backend.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor

public class OfferRequestDTO {

    @NotNull(message = "Request ID is required")
    private UUID requestId;

    @NotNull(message = "Dentist ID is required")
    private UUID dentistPublicId;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    @Digits(integer = 8, fraction = 2, message = "Price format is invalid")
    private BigDecimal price;

    @Min(value = 1, message = "Procedure must take at least 1 day")
    @Max(value = 365, message = "Procedure days cannot exceed 365")
    private int procedureDays;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;

    private boolean includesXray;
    private boolean includesAnesthesia;

    // Variation A (required): a date range that must span exactly `procedureDays` days
    // and fall within the patient's availability window.
    @NotNull(message = "Option A start date is required")
    private LocalDate variant1Start;

    @NotNull(message = "Option A end date is required")
    private LocalDate variant1End;

    // Variation B (optional)
    private LocalDate variant2Start;
    private LocalDate variant2End;
}
