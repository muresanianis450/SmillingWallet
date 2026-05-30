package backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class SelectSlotRequestDTO {

    @NotNull(message = "Selected slot is required")
    private LocalDateTime selectedSlot;
}
