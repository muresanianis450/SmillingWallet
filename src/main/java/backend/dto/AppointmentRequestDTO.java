package backend.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class AppointmentRequestDTO {
    @NotNull(message = "Offer ID is required")
    private UUID offerId;

    @NotNull(message = "Scheduled date/time is required")
    @Future(message = "Appointment must be scheduled in the future")
    private LocalDateTime scheduledAt;
}
