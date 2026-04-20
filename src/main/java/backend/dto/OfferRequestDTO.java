package backend.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
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

    @Min(value = 0, message = "Estimated wait days must be 0 or more")
    @Max(value = 365, message = "Estimated wait days cannot exceed 365")
    private int estimatedWaitDays;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;

    private boolean includesXray;
    private boolean includesAnesthesia;
}
