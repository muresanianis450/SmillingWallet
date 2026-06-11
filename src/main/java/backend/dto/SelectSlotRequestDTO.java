package backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class SelectSlotRequestDTO {

    @NotNull(message = "Selected start date is required")
    private LocalDate selectedStartDate;

    @NotNull(message = "Selected end date is required")
    private LocalDate selectedEndDate;
}
