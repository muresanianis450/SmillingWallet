package backend.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class ReproposeSlotRequestDTO {

    @Min(value = 1, message = "Procedure must take at least 1 day")
    @Max(value = 365, message = "Procedure days cannot exceed 365")
    private int procedureDays;

    @NotNull(message = "Option A start date is required")
    private LocalDate variant1Start;

    @NotNull(message = "Option A end date is required")
    private LocalDate variant1End;

    private LocalDate variant2Start;
    private LocalDate variant2End;

    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    @Digits(integer = 8, fraction = 2, message = "Price format is invalid")
    private BigDecimal price;
}
